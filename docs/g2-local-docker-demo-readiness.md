# G.2 Local Docker Demo Readiness

This document defines the local Docker demo path for VisionCommand AI during Milestone G.

The goal is to make local Docker the primary reliable demo path for portfolio review, interviews, and local validation without requiring paid cloud infrastructure.

## Current decision

The official current demo path is local/Docker-first.

This means the project should be demoed through Docker Compose before depending on any cloud deployment.

The historical Render deployment remains useful as deployment evidence, but it is not the required active demo path during Milestone G.

## What local Docker runs

The current Docker Compose stack runs:

- PostgreSQL on port `5432`
- FastAPI backend on port `8000`
- Vite frontend development server on port `5173`

The frontend uses `/api/...` requests. During local Docker Compose usage, the Vite proxy forwards those requests to the backend container through the Docker network.

## Local Docker services

Services:

- `postgres`
- `backend`
- `frontend`

Containers:

- `vision-command-postgres`
- `vision-command-backend`
- `vision-command-frontend`

## Storage behavior

The backend stores runtime files under:

```text
/app/storage
```

Docker Compose mounts this to:

```text
./backend/storage
```

Runtime folders:

- `/app/storage/uploads`
- `/app/storage/outputs`
- `/app/storage/videos`
- `/app/storage/logs`
- `/app/storage/models`

The `models` folder is used so the YOLO model can persist in the local bind-mounted storage folder after the first successful download or manual placement.

## Model artifact behavior

The backend Docker image uses this default model path:

```text
MODEL_NAME=/app/storage/models/yolo26n.pt
```

If the model file is already present at that path, the backend uses it.

If the model file is missing and internet access is available, Ultralytics may download the model on the first detection call.

For a more reliable interview/demo setup, place the model file before starting Docker:

```bash
mkdir -p backend/storage/models
cp yolo26n.pt backend/storage/models/yolo26n.pt
```

The model file remains ignored by Git.

Do not commit `.pt` model artifacts.

## Start local Docker demo

From the repository root:

```bash
docker compose down --remove-orphans
docker compose up --build -d
```

Wait for startup:

```bash
sleep 20
docker compose ps
```

The first immediate request can fail if the containers are still starting. Wait until the backend and frontend logs show startup completion.

## Basic smoke checks

Backend health:

```bash
curl -sS http://localhost:8000/health
```

Backend model info:

```bash
curl -sS http://localhost:8000/model/info
```

Frontend root:

```bash
curl -I http://localhost:5173/
```

Frontend proxy health:

```bash
curl -sS http://localhost:5173/api/health
```

Frontend proxy model info:

```bash
curl -sS http://localhost:5173/api/model/info
```

Database stats:

```bash
curl -sS http://localhost:5173/api/db/stats
```

Generated output history:

```bash
curl -sS "http://localhost:5173/api/db/generated-outputs?limit=3"
```

Note:

```text
/api/db/status is not currently a valid endpoint.
Use /api/db/stats for database smoke testing.
```

## Image upload and detection smoke test

Create a small smoke-test image:

```bash
mkdir -p tmp

python - <<'PY'
from pathlib import Path
from PIL import Image, ImageDraw

path = Path("tmp/docker-smoke-image.jpg")
image = Image.new("RGB", (640, 480), (235, 235, 235))
draw = ImageDraw.Draw(image)
draw.rectangle((230, 90, 410, 430), outline=(20, 20, 20), width=8)
draw.ellipse((275, 35, 365, 125), outline=(20, 20, 20), width=8)
draw.text((185, 445), "VisionCommand Docker smoke test", fill=(20, 20, 20))
image.save(path, quality=90)
print(path)
PY
```

Upload through the frontend proxy:

```bash
curl -sS \
  -F "file=@tmp/docker-smoke-image.jpg" \
  http://localhost:5173/api/media/upload \
  > tmp/docker-upload-response.json

cat tmp/docker-upload-response.json
```

Extract the stored filename:

```bash
STORED_FILENAME=$(python - <<'PY'
import json
from pathlib import Path

payload = json.loads(Path("tmp/docker-upload-response.json").read_text())
print(payload["stored_filename"])
PY
)

echo "$STORED_FILENAME"
```

Run detection with the correct HTTP method:

```bash
curl -sS --max-time 300 -X POST \
  "http://localhost:5173/api/vision/detect/${STORED_FILENAME}/annotated?confidence_threshold=0.25" \
  > tmp/docker-detection-response.json

cat tmp/docker-detection-response.json
```

The detection endpoint requires `POST`.

A `GET` request to the same detection route returns `405 Method Not Allowed`.

## Model and storage inspection

Inspect model and storage paths inside the backend container:

```bash
docker compose exec -T backend sh -lc '
echo "MODEL_NAME=$MODEL_NAME"
if [ -f "$MODEL_NAME" ]; then
  ls -lh "$MODEL_NAME"
else
  echo "model file not found at $MODEL_NAME"
fi

find /app/storage -maxdepth 2 -type d | sort
'
```

Expected after a successful first model load:

```text
/app/storage/models/yolo26n.pt
```

## Logs

Backend logs:

```bash
docker compose logs --tail=180 backend
```

Frontend logs:

```bash
docker compose logs --tail=120 frontend
```

PostgreSQL logs:

```bash
docker compose logs --tail=120 postgres
```

## Stop local Docker demo

Stop containers while keeping the local PostgreSQL volume:

```bash
docker compose down --remove-orphans
```

Remove volumes only when you intentionally want to reset local PostgreSQL data:

```bash
docker compose down --remove-orphans --volumes
```

## G.2 validation target

G.2 is considered valid when these pass:

- Docker Compose builds
- all three containers start
- backend health returns 200
- frontend root returns 200
- frontend `/api/health` proxy returns 200
- frontend `/api/model/info` proxy returns 200
- frontend `/api/db/stats` returns 200
- frontend `/api/db/generated-outputs` returns 200
- image upload through frontend proxy returns 200
- detection through frontend proxy returns 200 using POST
- backend logs show no fatal startup errors

## Boundary

G.2 does not create a paid cloud deployment.

G.2 does not revive the old Render database.

G.2 does not claim production completion.

G.2 makes the local Docker demo path clearer and more reliable for portfolio use.
