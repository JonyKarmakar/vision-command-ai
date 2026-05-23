# VisionCommand AI

VisionCommand AI is an end-to-end AI-powered computer vision and media editing application. Users can upload images, run YOLO object detection, view annotated results, crop or blur detected objects, use text or browser-based voice commands, and work with database-backed media, command, detection, and inference history.

The project is being built as a learning-focused production-style AI system. The goal is not only to build a computer vision demo, but also to learn full-stack AI development, Git/GitHub workflow, Docker, CI/CD, PostgreSQL-backed data engineering, and MLOps-style inference monitoring.

---

## Current Features

### Image AI and Editing

- Upload image files from the React frontend
- Store uploaded images through the FastAPI backend
- Extract image metadata such as width and height
- Preview uploaded images in the frontend
- Run YOLO object detection on uploaded images
- Return detected object classes, confidence scores, and bounding boxes
- Generate annotated images with bounding boxes
- Filter detections by confidence threshold
- Filter detections by object class
- Crop individual detected objects
- Crop the best detected object by selected class
- Blur individual detected objects
- Blur the best detected object by class
- Blur all objects of a selected class
- Open and download original, annotated, cropped, and blurred outputs

### Video Foundation

- Upload video files from the frontend
- Store uploaded videos through the FastAPI backend
- Preview uploaded videos in the frontend
- Extract video metadata such as width, height, FPS, frame count, duration, and readability status
- Trim uploaded videos using start and end seconds
- Generate browser-playable trimmed MP4 videos using FFmpeg through `imageio-ffmpeg`
- Preview, open, and download trimmed video outputs
- Extract a single image frame from an uploaded video at a selected timestamp
- Extract multiple frames from uploaded videos using start time, end time, and interval
- Preview, open, and download extracted video frames
- Run YOLO object detection on a single extracted video frame
- Run YOLO object detection on multiple extracted video frames
- Generate annotated frame outputs with bounding boxes
- View a video detection timeline by timestamp
- Preview, open, and download annotated video frame outputs
- Track objects across sampled video frames
- Assign simple track IDs using class name and bounding-box center distance
- View track summaries with observation count, first/last timestamp, and max confidence
- View frame-by-frame tracking timeline in the frontend
- Generate annotated tracking frame outputs with track IDs and class labels
- Preview, open, and download annotated tracking frames

### Commands and Voice Input

- Use a command box for simple text and video commands such as:
  - `detect objects`
  - `crop person`
  - `crop bottle`
  - `blur person`
  - `blur bottle`
  - `blur all persons`
  - `extract frame at 1 second`
  - `extract frames from 0 to 3 seconds`
  - `detect frames from 0 to 3 seconds`
  - `trim video from 0 to 2 seconds`
  - `track video from 0 to 3 seconds`
  - `track person from 0 to 3 seconds`
- Use browser-based voice input for simple image commands
- Execute command actions through the FastAPI backend
- Log command executions locally and in PostgreSQL
- View recent command history in the frontend

### Database and Analytics

- Store uploaded media metadata in PostgreSQL
- Store command execution logs in PostgreSQL
- Store YOLO detection results in PostgreSQL
- Store model inference logs in PostgreSQL
- View database statistics from the frontend
- View uploaded media history from the frontend
- Reuse uploaded images from media history
- View recent detection history from the frontend
- View detection summary analytics from the frontend
- View inference logs and inference summary from the frontend
- View model metadata from the frontend

### DevOps and Workflow

- Run backend, frontend, and PostgreSQL together using Docker Compose
- Automatically check backend tests with GitHub Actions
- Automatically check backend Docker image builds with GitHub Actions
- Automatically check frontend builds with GitHub Actions
- Use feature branches and Pull Requests
- Protect the `main` branch with required CI checks
- Use version tags and GitHub Releases

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- Pillow
- Ultralytics YOLO
- OpenCV
- PyTorch
- imageio-ffmpeg

### Database

- PostgreSQL
- psycopg

### DevOps and Workflow

- Git
- GitHub
- GitHub Actions
- Docker
- Docker Compose

---

## Project Structure

```text
vision-command-ai/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── schemas.py
│   │   ├── routers/
│   │   └── services/
│   ├── tests/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── vite.config.ts
│
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
│
├── docs/
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Backend API Endpoints

### Health Check

```text
GET /health
```

Returns backend health status.

---

### Model Information

```text
GET /model/info
```

Returns model and backend metadata, including model name, task, framework, backend version, and supported actions.

---

## Media Endpoints

### Upload Image

```text
POST /media/upload
```

Uploads an image and returns metadata such as filename, width, height, storage path, and file URL.

---

### View Uploaded Image

```text
GET /media/uploads/{filename}
```

Returns an uploaded image file.

---

### Upload Video

```text
POST /media/upload-video
```

Uploads a video file and returns video metadata such as filename, content type, file size, file URL, and extracted video metadata.

Example response:

```json
{
  "message": "Video uploaded successfully",
  "original_filename": "clip.mp4",
  "stored_filename": "generated_filename.mp4",
  "content_type": "video/mp4",
  "file_size_bytes": 985083,
  "storage_path": "storage/videos/generated_filename.mp4",
  "file_url": "/media/videos/generated_filename.mp4",
  "metadata": {
    "is_readable": true,
    "width": 1280,
    "height": 720,
    "fps": 25.0,
    "frame_count": 100,
    "duration_seconds": 4.0
  }
}
```

---

### View Uploaded Video

```text
GET /media/videos/{filename}
```

Returns an uploaded video file.

---

### View Output Media

```text
GET /media/outputs/{filename}
```

Returns generated output files such as annotated images, cropped images, blurred images, and trimmed videos.

---

## Vision and Editing Endpoints

### Run YOLO Detection

```text
POST /vision/detect/{filename}
```

Runs YOLO detection and returns detected objects as JSON.

---

### Run YOLO Detection with Annotated Output

```text
POST /vision/detect/{filename}/annotated
```

Runs YOLO detection, draws bounding boxes, saves the annotated image, and returns the annotated image URL.

---

### Crop Uploaded Image by Coordinates

```text
POST /vision/crop/{filename}
```

Crops an uploaded image using bounding-box coordinates.

Example request:

```json
{
  "x1": 100,
  "y1": 100,
  "x2": 500,
  "y2": 400
}
```

---

### Crop Best Object by Class

```text
POST /vision/crop-by-class/{filename}
```

Finds the highest-confidence object for a requested class and returns a cropped output image.

Example request:

```json
{
  "class_name": "person",
  "confidence_threshold": 0.3
}
```

---

### Blur Uploaded Image Region

```text
POST /vision/blur/{filename}
```

Applies blur to a selected image region using bounding-box coordinates.

Example request:

```json
{
  "x1": 100,
  "y1": 100,
  "x2": 500,
  "y2": 400
}
```

---

### Blur Best Object by Class

```text
POST /vision/blur-by-class/{filename}
```

Finds the highest-confidence object for a requested class and returns a blurred output image.

Example request:

```json
{
  "class_name": "person",
  "confidence_threshold": 0.3
}
```

---

### Blur All Objects by Class

```text
POST /vision/blur-all-by-class/{filename}
```

Finds all detected objects for a requested class and returns a blurred output image.

Example request:

```json
{
  "class_name": "person",
  "confidence_threshold": 0.3
}
```

---

## Video Editing Endpoints

### Trim Uploaded Video

```text
POST /video/trim/{filename}
```

Trims an uploaded video using start and end seconds.

Example request:

```json
{
  "start_seconds": 0,
  "end_seconds": 2
}
```

The backend returns a trimmed video URL and metadata.

### Extract One Frame from Video

```text
POST /video/extract-frame/{filename}
```

Extracts one image frame from an uploaded video at a selected timestamp.

Example request:

```json
{
  "timestamp_seconds": 1
}
```

The backend returns an extracted frame image URL, timestamp, frame index, FPS, and video duration.

### Extract Multiple Frames from Video

```text
POST /video/extract-frames/{filename}
```

Extracts multiple image frames from an uploaded video using start time, end time, and interval.

Example request:

```json
{
  "start_seconds": 0,
  "end_seconds": 3,
  "interval_seconds": 1
}
```

The backend returns a list of extracted frame URLs, timestamps, and frame indices.

### Run YOLO Detection on One Extracted Frame

```text
POST /video/detect-frame/{frame_filename}/annotated
```

Runs YOLO object detection on an extracted frame and returns an annotated frame output with bounding boxes.

### Run YOLO Detection on Multiple Extracted Frames

```text
POST /video/detect-frames/annotated
```

Runs YOLO object detection on multiple extracted video frames and returns annotated frame outputs.

Example request:

```json
{
  "frame_filenames": [
    "frame_video_0_abc.jpg",
    "frame_video_30_def.jpg"
  ],
  "confidence_threshold": 0.3,
  "class_filter": null
}
```

The backend returns a list of extracted frame URLs, timestamps, and frame indices.


---

### Track Objects in Sampled Video Frames

```text
POST /video/track-sampled/{filename}
```
```json
{
  "start_seconds": 0,
  "end_seconds": 3,
  "interval_seconds": 1,
  "confidence_threshold": 0.3,
  "class_filter": null,
  "max_distance_pixels": 80
}
```

---

## Command Endpoints

### Execute Text Command

```text
POST /commands/execute
```

Executes simple text commands.

Supported examples:

```text
detect objects
crop person
crop bottle
blur person
blur bottle
blur all persons
extract frame at 1 second
extract frames from 0 to 3 seconds
detect frames from 0 to 3 seconds
trim video from 0 to 2 seconds
```

Example request:

```json
{
  "filename": "uploaded_image_or_video_filename",
  "command": "crop person",
  "confidence_threshold": 0.3
}
```

---

### View Local Command Logs

```text
GET /commands/logs
```

Returns recent command execution logs from the local JSONL log file.

Example:

```text
GET /commands/logs?limit=10
```

---

## Database Endpoints

### Database Health

```text
GET /db/health
```

Checks whether the backend can connect to PostgreSQL.

---

### Database Statistics

```text
GET /db/stats
```

Returns database-level statistics such as uploaded media count and command log count.

---

### Uploaded Media History

```text
GET /db/media-files
```

Returns uploaded media metadata stored in PostgreSQL.

---

### PostgreSQL Command Logs

```text
GET /db/command-logs
```

Returns command execution logs stored in PostgreSQL.

---

### Detection History

```text
GET /db/detections
```

Returns stored YOLO detection results from PostgreSQL.

---

### Detection Summary

```text
GET /db/detection-summary
```

Returns class-level detection analytics, including count, average confidence, and max confidence.

---

### Model Inference Logs

```text
GET /db/inference-logs
```

Returns YOLO inference logs, including model name, endpoint, detection count, inference time, and timestamp.

---

### Model Inference Summary

```text
GET /db/inference-summary
```

Returns aggregated inference analytics, including total inference runs, average inference time, max inference time, total detections, and endpoint-level summary.

---

## Run Locally Without Docker

### Start Backend

```bash
cd backend
source vision-env/bin/activate
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

FastAPI docs:

```text
http://127.0.0.1:8000/docs
```

---

### Start Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## Run Full Stack with Docker Compose

From the project root:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:5173
```

To stop:

```bash
CTRL + C
docker compose down --remove-orphans
```

---

## Testing

### Backend Tests

```bash
cd backend
python -m pytest
```

### Frontend Build

```bash
cd frontend
npm run build
```

---

## CI/CD

The project uses GitHub Actions.

### Backend CI

The backend workflow checks:

- Backend dependencies install correctly
- Backend tests pass
- Backend Docker image builds successfully

### Frontend CI

The frontend workflow checks:

- Frontend dependencies install correctly
- React frontend builds successfully

The `main` branch is protected with required pull requests and required status checks.

---

## Current Status

Completed:

### Backend

- Backend foundation
- Health endpoint
- Model information endpoint
- Image upload API
- Image metadata extraction
- Uploaded image access endpoint
- YOLO object detection endpoint
- Annotated YOLO output endpoint
- Object crop endpoint
- Object blur endpoint
- Crop-by-class endpoint
- Blur-by-class endpoint
- Blur-all-by-class endpoint
- Command execution endpoint
- Command logging endpoint
- Command history endpoint
- Video upload foundation
- Video metadata extraction
- Video trim endpoint
- Video frame extraction endpoint
- Multi-frame extraction endpoint
- YOLO detection on extracted video frames
- YOLO detection on multiple extracted video frames
- Video command support for frame extraction, multi-frame extraction, frame detection, and trimming
- Backend sampled video tracking endpoint
- Frontend sampled video tracking flow
- Backend annotated tracking frame outputs
- Frontend annotated tracking frame display
- Video tracking command support
- Tracking command presets

### Frontend

- React frontend foundation
- Frontend image upload flow
- Frontend YOLO detection flow
- Frontend object crop flow
- Frontend object blur flow
- Frontend command box
- Browser-based voice command input
- Frontend command history
- Frontend media history
- Frontend database dashboard
- Frontend detection history
- Frontend detection summary
- Frontend inference logs
- Frontend inference summary
- Frontend model information panel
- Frontend video upload flow
- Frontend video metadata display
- Frontend video trim flow
- Frontend video frame extraction flow
- Frontend multi-frame extraction flow
- Frontend YOLO detection on extracted video frames
- Frontend YOLO detection on multiple extracted video frames
- Frontend video detection timeline

### Database and MLOps-style Logging

- PostgreSQL media metadata storage
- PostgreSQL command log storage
- PostgreSQL detection result storage
- PostgreSQL inference log storage
- Database statistics endpoint
- Detection summary endpoint
- Inference summary endpoint

### DevOps and Workflow

- Backend Dockerfile
- Frontend Dockerfile
- Full-stack Docker Compose setup
- Backend CI
- Frontend CI
- Protected main branch
- GitHub release `v0.1.0`
- Pull Request workflow

---

## Recent Refactoring

Recent backend cleanup moved several responsibilities out of `main.py` and into service/router modules:

- Basic health/model routes moved to routers
- Request schemas moved to a schemas module
- Command parser moved to a service module
- Database URL helper moved to database service
- Command log database helpers moved to database service
- Media database helpers moved to database service
- Detection database helpers moved to database service
- Inference database helpers moved to database service
- Database stats helper moved to database service

This keeps `main.py` smaller and makes the backend easier to maintain.

---

## Next Planned Features

Planned future improvements:

- Improve video tracking with stronger tracking algorithms such as ByteTrack or DeepSORT
- Add full-video tracking summaries across longer videos
- Add object-specific video editing based on tracked objects
- Add full-video detection timeline across automatically sampled frames
- Add advanced FFmpeg-based video editing workflows
- Add backend-side command parser improvements
- Add support for commands such as `crop the highest confidence person`
- Add support for commands such as `blur all persons from 0 to 3 seconds`
- Add LLM-based command parsing
- Add proper backend speech-to-text integration
- Add MLflow for experiment tracking
- Add DVC for data/model versioning
- Add deployment workflow
---

## Learning Goals

This project is designed to teach:

- Computer vision application development
- YOLO model serving
- FastAPI backend development
- React frontend development
- Git and GitHub workflow
- Pull Requests
- Protected branch workflow
- Automated testing
- CI/CD with GitHub Actions
- Docker and Docker Compose
- PostgreSQL-backed data engineering
- Full-stack AI system design
- MLOps-style inference logging and analytics
- LLMOps foundations through command logging and command history
---

## Environment Configuration

Example environment files are included for local setup:

- backend/.env.example
- frontend/.env.example

These files show which environment variables are needed without exposing real secrets.

### Backend variables

Required or useful backend environment variables:

- DATABASE_URL
- LLM_PROVIDER
- PYTHONUNBUFFERED

DATABASE_URL is used by the FastAPI backend to connect to PostgreSQL.

For Docker Compose, the backend uses the PostgreSQL service name:

DATABASE_URL=postgresql://vision_user:vision_password@postgres:5432/vision_command

LLM_PROVIDER controls the future real LLM provider configuration.

The current supported value is:

disabled

The real_llm parser mode already exists as a future integration path, but real external LLM parsing is not enabled until a provider is configured.

PYTHONUNBUFFERED=1 helps Python logs appear immediately in Docker.

### Frontend variables

Required or useful frontend environment variables:

- VITE_BACKEND_URL

VITE_BACKEND_URL points the Vite frontend/proxy setup to the backend API.

For local non-Docker development:

VITE_BACKEND_URL=http://127.0.0.1:8000

For Docker Compose, the frontend uses the backend service name internally:

VITE_BACKEND_URL=http://backend:8000


---

## Real LLM Provider Setup

VisionCommand AI has a provider-based LLM parser architecture.

Current parser modes:

- rule_based
- llm_mock
- real_llm

Current LLM providers:

- disabled
- openai

By default, the backend uses:

LLM_PROVIDER=disabled

In this mode, `real_llm` exists as a parser mode, but real external LLM parsing is not active.

### OpenAI provider configuration

To test the OpenAI provider locally, configure these environment variables in your backend environment:

LLM_PROVIDER=openai
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4.1-mini

The API key should only be stored locally or in a private `.env` file.

Never commit real API keys to Git.

### Local `.env` usage

You can create a local file:

backend/.env

based on:

backend/.env.example

The `.env` file should remain local and should not be committed.

### Testing real LLM parsing

After setting the environment variables, start the backend:

cd backend
source vision-env/bin/activate
uvicorn app.main:app --reload

Then open:

http://127.0.0.1:8000/docs

Test:

POST /commands/parse

Example request:

{
  "command": "crop person",
  "parser_mode": "real_llm"
}

Expected behavior:

- If OpenAI is configured correctly, the backend calls the OpenAI provider.
- The response should contain a validated structured command.
- If the provider is missing configuration, the backend returns a clear error.

### Why this architecture exists

The command parser layer is provider-agnostic.

The frontend and backend parser flow should not depend directly on one provider. Provider selection happens through:

LLM_PROVIDER

This allows future providers such as local models, Gemini, Anthropic, or internal models to be added behind the same interface.


---

## Runtime Modes

VisionCommand AI can be run in two different ways during development.

### Mode A: Full Docker mode

In this mode, Docker runs everything:

- PostgreSQL
- Backend
- Frontend

Start the full stack with:

```bash
docker compose up --build
```

The backend runs inside Docker and connects to PostgreSQL using the Docker service name:

```text
DATABASE_URL=postgresql://vision_user:vision_password@postgres:5432/vision_command
```

Use this mode when you want to test the full containerized application.

Useful URLs:

```text
Frontend: http://localhost:5173
Backend API docs: http://127.0.0.1:8000/docs
PostgreSQL: localhost:5432
```

Stop the full stack with:

```bash
docker compose down --remove-orphans
```

### Mode B: Local development mode

In this mode, only PostgreSQL runs in Docker. The backend and frontend run directly on your machine.

Terminal 1: start PostgreSQL only

```bash
docker compose up -d postgres
```

Terminal 2: start backend locally

```bash
cd backend
source vision-env/bin/activate
export DATABASE_URL="postgresql://vision_user:vision_password@localhost:5432/vision_command"
uvicorn app.main:app --reload
```

Terminal 3: start frontend locally

```bash
cd frontend
npm run dev
```

Use this mode when actively developing backend or frontend code because changes are easier to test without rebuilding Docker images.

Useful URLs:

```text
Frontend: http://localhost:5173
Backend API docs: http://127.0.0.1:8000/docs
```

### Important DATABASE_URL difference

The database host depends on where the backend is running:

```text
Docker backend  -> postgres:5432
Local backend   -> localhost:5432
```

If the backend is running inside Docker, use:

```text
postgresql://vision_user:vision_password@postgres:5432/vision_command
```

If the backend is running locally on your machine, use:

```text
postgresql://vision_user:vision_password@localhost:5432/vision_command
```

### Quick database check

After starting the backend, verify database connectivity with:

```bash
curl -s http://127.0.0.1:8000/db/health | python -m json.tool
```

Expected result:

```json
{
  "status": "healthy",
  "database": "postgresql",
  "result": 1
}
```

### Parser database logs check

After running a parser command, check PostgreSQL parser logs with:

```bash
curl -s http://127.0.0.1:8000/db/parser-attempt-logs | python -m json.tool
```

Check the parser summary with:

```bash
curl -s http://127.0.0.1:8000/db/parser-attempt-summary | python -m json.tool
```

### Common issue

If the frontend shows:

```text
Status: not_configured
```

for PostgreSQL parser logs, it usually means the backend is running locally without `DATABASE_URL`.

Restart the local backend with:

```bash
export DATABASE_URL="postgresql://vision_user:vision_password@localhost:5432/vision_command"
uvicorn app.main:app --reload
```

---

## LLMOps Monitoring

VisionCommand AI includes an LLMOps-style monitoring layer for command parsing.

The goal is to make parser behavior observable across:

- rule-based parsing
- mock LLM parsing
- future real LLM parsing
- local/offline provider paths
- failed parser attempts
- latency and reliability trends

### Provider status

The backend exposes the current LLM provider configuration through:

    GET /llm/provider/status

This returns information such as:

- provider name
- provider model
- whether the provider is supported
- whether the provider is configured
- whether real LLM parsing is available
- supported parser modes
- supported LLM providers

Example providers:

    disabled
    openai
    ollama

By default, the project uses:

    LLM_PROVIDER=disabled

This keeps the project free to run without requiring paid API usage.

### Parser attempt logs

Parser attempts are logged locally and, when PostgreSQL is configured, also stored in the database.

Database-backed parser logs are available through:

    GET /db/parser-attempt-logs

Optional filters:

    GET /db/parser-attempt-logs?parser_mode=rule_based
    GET /db/parser-attempt-logs?success=true
    GET /db/parser-attempt-logs?parser_mode=real_llm&success=false
    GET /db/parser-attempt-logs?limit=10

Each parser attempt log can include:

- timestamp
- command
- parser mode
- parser type
- parser version
- success status
- latency
- parsed command
- error message

### Parser attempt summary

Parser summary statistics are available through:

    GET /db/parser-attempt-summary

Optional filters:

    GET /db/parser-attempt-summary?parser_mode=rule_based
    GET /db/parser-attempt-summary?success=false
    GET /db/parser-attempt-summary?parser_mode=real_llm&success=false

The summary includes:

- total attempts
- successful attempts
- failed attempts
- success rate
- average latency
- breakdown by parser mode
- breakdown by parser type
- breakdown by parser error

The error breakdown helps identify common parser failure reasons.

### Combined LLMOps dashboard endpoint

The backend also exposes a consolidated dashboard endpoint:

    GET /llmops/dashboard

Optional filters:

    GET /llmops/dashboard?limit=10
    GET /llmops/dashboard?parser_mode=rule_based
    GET /llmops/dashboard?success=true
    GET /llmops/dashboard?parser_mode=real_llm&success=false&limit=5

This endpoint combines:

- LLM provider status
- parser attempt summary
- recent parser attempt logs

### Frontend LLMOps dashboard

The frontend includes an LLMOps dashboard section with controls for:

- loading provider status
- loading database parser logs
- loading parser summary
- loading the combined LLMOps dashboard
- filtering by parser mode
- filtering by success or failure
- selecting recent log limit
- resetting parser filters

The frontend also displays:

- active parser filters
- parser success rate
- average latency
- parser mode breakdown
- parser type breakdown
- parser error breakdown
- recent parser attempts

### Running with PostgreSQL logs

For local development with database-backed parser logs, use three terminals.

Terminal 1:

    docker compose up -d postgres

Terminal 2:

    cd backend
    source vision-env/bin/activate
    export DATABASE_URL="postgresql://vision_user:vision_password@localhost:5432/vision_command"
    uvicorn app.main:app --reload

Terminal 3:

    cd frontend
    npm run dev

Then open:

    http://localhost:5173

Use the frontend LLMOps controls to inspect parser logs, summary, and provider status.
