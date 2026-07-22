# G.3 Environment and Secrets Cleanup

This document defines the current environment and secrets guidance for VisionCommand AI during Milestone G.

The goal is to make local Docker values, local non-Docker values, backend-only secrets, frontend public variables, historical Render configuration, and future production values clearly separated.

## Current decision

Milestone G should not require paid deployment or new cloud secrets.

The current official demo path is local/Docker-first.

The previous Render deployment remains historical deployment evidence, not the required active demo path.

## Configuration sources

Current configuration sources:

- `backend/.env.example`
- `frontend/.env.example`
- `docker-compose.yml`
- `backend/Dockerfile`
- `render.yaml`
- hosting-provider environment settings for future deployments

Important separation:

- backend secrets stay in backend environment variables
- frontend variables are public and must not contain secrets
- Docker Compose values are local demo values
- old Render values should not be treated as guaranteed active production credentials

## Backend-only variables

These variables belong to the backend only.

| Variable | Secret | Local Docker source | Local non-Docker source | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | yes for real databases | `docker-compose.yml` | optional `backend/.env` | leave empty for safe fallback when no database is needed |
| `OPENAI_API_KEY` | yes | not set by default | optional `backend/.env` | required only when `LLM_PROVIDER=openai` |
| `OPENAI_MODEL` | no | not set by default | optional `backend/.env` | required only when `LLM_PROVIDER=openai` |
| `OLLAMA_BASE_URL` | no | optional | optional `backend/.env` | local or self-hosted Ollama only |
| `OLLAMA_MODEL` | no | optional | optional `backend/.env` | required only when `LLM_PROVIDER=ollama` |
| `LLM_PROVIDER` | no | backend default or Docker env | optional `backend/.env` | supported values are `disabled`, `openai`, and `ollama` |
| `MODEL_NAME` | no | backend Dockerfile | optional `backend/.env` | local Docker default is `/app/storage/models/yolo26n.pt` |
| `STORAGE_ROOT` | no | backend Dockerfile | optional `backend/.env` | local Docker default is `/app/storage` |
| `PORT` | no | backend Dockerfile or platform | optional `backend/.env` | cloud platforms may provide this automatically |
| `PYTHONUNBUFFERED` | no | Dockerfile or Compose | optional `backend/.env` | useful for readable logs |

## Frontend variables

The frontend should not receive backend secrets.

Current frontend variable:

| Variable | Secret | Purpose |
| --- | --- | --- |
| `VITE_BACKEND_URL` | no | Vite development-server proxy target |

Important:

The React app uses relative `/api/...` requests.

`VITE_BACKEND_URL` is used by `frontend/vite.config.ts` to configure the local Vite proxy.

For production static hosting, use hosting rewrite/proxy rules from `/api/*` to the backend instead of putting backend secrets or private URLs into frontend variables.

## Local Docker values

Local Docker Compose is for the portfolio demo and local validation.

Current local Docker behavior:

- PostgreSQL runs in Docker Compose
- backend receives `DATABASE_URL=postgresql://vision_user:vision_password@postgres:5432/vision_command`
- backend stores files under `/app/storage`
- backend storage is mounted to `./backend/storage`
- backend model path defaults to `/app/storage/models/yolo26n.pt`
- frontend Vite proxy targets `http://backend:8000`
- frontend browser still calls relative `/api/...` paths

These values are local demo values.

Do not reuse local Docker Compose credentials in production.

## Local non-Docker values

For local non-Docker backend development, use `backend/.env` only when needed.

Safe default:

```text
DATABASE_URL=
STORAGE_ROOT=storage
MODEL_NAME=yolo26n.pt
LLM_PROVIDER=disabled
```

When `DATABASE_URL` is empty or unset, database-backed features should return safe fallback or `not_configured` behavior instead of crashing.

## Model artifact guidance

Current local Docker model path:

```text
/app/storage/models/yolo26n.pt
```

Recommended local demo preparation:

```bash
mkdir -p backend/storage/models
cp yolo26n.pt backend/storage/models/yolo26n.pt
```

If the file is missing and internet access is available, Ultralytics may download the model during the first detection call.

The downloaded file should persist in `backend/storage/models` through the Docker bind mount.

Do not commit `.pt` model files.

## Render configuration status

`render.yaml` remains useful as optional future deployment configuration and historical deployment documentation.

During Milestone G, Render is not the primary demo path.

Current G decision:

- do not upgrade the old Render database
- do not add paid persistent disk now
- do not add paid object storage now
- do not treat old Render URLs as guaranteed active demos
- keep Render docs as historical and optional future deployment references

If Render is used again later, configure real secrets only through the Render dashboard or secure provider settings.

Do not commit real managed database URLs or API keys.

## Safe examples

Safe to commit:

```text
DATABASE_URL=
LLM_PROVIDER=disabled
OPENAI_API_KEY=
OPENAI_MODEL=
VITE_BACKEND_URL=http://127.0.0.1:8000
```

Safe local Docker example:

```text
DATABASE_URL=postgresql://vision_user:vision_password@postgres:5432/vision_command
```

This is only safe because it is a local Docker Compose demo credential.

Unsafe to commit:

```text
DATABASE_URL=postgresql://real-provider-user:real-password@real-host:5432/real-db
OPENAI_API_KEY=real-api-key
```

## Validation checklist

G.3 is valid when:

- backend example env does not default to a production or managed database URL
- backend example env clearly separates local Docker and local non-Docker values
- frontend example env clearly says frontend variables are public
- frontend example env clarifies `VITE_BACKEND_URL` is for Vite proxy behavior
- Render configuration does not contain committed secrets
- documentation explains that old Render values are historical or optional
- roadmap marks G.3 as implemented

## Boundary

G.3 does not create a cloud deployment.

G.3 does not revive the old Render database.

G.3 does not add paid infrastructure.

G.3 does not change runtime feature behavior.

G.3 only clarifies and cleans environment and secrets handling for local, Docker, optional Render, and future production contexts.
