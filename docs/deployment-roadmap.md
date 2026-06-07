# VisionCommand AI Deployment Roadmap

## Purpose

This document defines the deployment-readiness roadmap for VisionCommand AI after the v0.3.0 release.

The project is currently a strong local full-stack AI application. It supports computer vision, video processing, command parsing, LLM provider integration, LLMOps-style monitoring, command analytics, JSON/CSV exports, and workspace recovery.

The next milestone is to make the project deployment-ready in a safe, structured, and budget-aware way.

---

## Current Local Architecture

### Frontend

- React
- TypeScript
- Vite
- CSS
- Local development server on port `5173`
- Uses `VITE_BACKEND_URL` for backend proxy configuration

Current local frontend behavior:

- `npm run dev` starts the Vite development server
- `npm run build` creates a production build in `frontend/dist`
- Dockerfile currently runs the Vite development server

### Backend

- Python
- FastAPI
- Uvicorn
- YOLO / Ultralytics
- OpenCV
- Pillow
- imageio-ffmpeg
- Local backend server on port `8000`

Current backend behavior:

- Serves API endpoints for image upload, video upload, detection, crop, blur, frame extraction, tracking, command parsing, LLMOps, database logs, and analytics
- Uses local folders under `backend/storage`
- Uses `DATABASE_URL` for PostgreSQL connection
- Uses environment variables for LLM provider configuration

### Database

- PostgreSQL
- Local Docker Compose service
- Current local database credentials are stored inside `docker-compose.yml`
- Used for media metadata, command logs, detection logs, inference logs, parser attempts, parser summaries, and LLMOps data

### Local Storage

Current local storage folders:

- `backend/storage/uploads`
- `backend/storage/outputs`
- `backend/storage/videos`
- `backend/storage/logs`

These folders are ignored by Git and mounted into the backend container during local Docker Compose development.

### Model File

The local YOLO model file is:

- `backend/yolo26n.pt`

Current note:

- `*.pt` files are ignored by Git
- The backend Dockerfile currently copies only `requirements.txt` and `app`
- The deployment plan must decide how the model file is made available in production

---

## Current Docker Compose Setup

Current services:

- `postgres`
- `backend`
- `frontend`

Current local ports:

- PostgreSQL: `5432`
- Backend: `8000`
- Frontend: `5173`

Current local backend environment:

- `PYTHONUNBUFFERED=1`
- `DATABASE_URL=postgresql://vision_user:vision_password@postgres:5432/vision_command`

Current local frontend environment:

- `VITE_BACKEND_URL=http://backend:8000`

Important deployment note:

The current Docker Compose setup is suitable for local development. It should not be treated as the final production deployment setup without changes.

---

## Deployment Problems to Solve

### 1. Backend Hosting

The backend needs a container-friendly hosting environment for FastAPI.

Requirements:

- Run FastAPI/Uvicorn
- Support Python dependencies
- Support OpenCV-related system libraries
- Access PostgreSQL
- Access persistent media/model storage
- Receive environment variables securely
- Support larger request processing for image/video workflows

Candidate options:

- Google Cloud Run
- Railway
- Render
- Fly.io
- A small VPS
- Self-hosted Docker deployment

Recommended first target:

- Google Cloud Run or Render for easier container-based deployment

---

### 2. Frontend Hosting

The frontend needs production static hosting.

Requirements:

- Build with `npm run build`
- Serve `frontend/dist`
- Configure backend API URL for production
- Avoid relying on the Vite development server in production

Candidate options:

- Vercel
- Netlify
- Cloudflare Pages
- Firebase Hosting
- Static hosting through the same cloud provider as backend

Recommended first target:

- Vercel or Netlify for simple frontend deployment

Important note:

The current frontend Dockerfile runs the Vite development server. For production, the frontend should either be deployed through a static frontend platform or use a production Dockerfile that builds and serves static files.

---

### 3. Database Hosting

The project needs a managed PostgreSQL database for production.

Requirements:

- Persistent PostgreSQL database
- Secure credentials
- Network access from backend
- Backup support
- Reasonable free or low-cost tier if possible

Candidate options:

- Google Cloud SQL for PostgreSQL
- Supabase PostgreSQL
- Neon PostgreSQL
- Railway PostgreSQL
- Render PostgreSQL

Recommended first target:

- Managed PostgreSQL instead of running a production database inside the same app container

Important note:

The local credentials in `docker-compose.yml` are only for development and must not be reused in production.

---

### 4. Media and Output Storage

The project currently stores media files locally inside `backend/storage`.

This includes:

- Uploaded images
- Uploaded videos
- Generated annotated images
- Cropped outputs
- Blurred outputs
- Trimmed videos
- Extracted frames
- Annotated tracking frames
- Local JSONL logs

Deployment problem:

Most container platforms have temporary or non-persistent local file systems. If the backend container restarts, local files may be lost unless persistent storage is configured.

Possible solutions:

- Cloud object storage
- Mounted persistent disk
- Database metadata with object storage paths
- Temporary storage only for demo deployment
- Cleanup policy for old generated files

Recommended production direction:

- Keep metadata in PostgreSQL
- Move actual media/output files to object storage
- Store file URLs or object keys in the database

Candidate storage options:

- Google Cloud Storage
- AWS S3
- Cloudflare R2
- Supabase Storage
- Local persistent volume for simple VPS deployment

Short-term low-risk option:

- Keep local storage for the first demo deployment
- Clearly document that files are not guaranteed to persist
- Add object storage later as a dedicated milestone

---

### 5. Model File Deployment

The local model file is currently:

- `backend/yolo26n.pt`

Issues:

- `*.pt` files are ignored by Git
- The backend Dockerfile does not currently copy the model file
- The production backend needs a reliable way to access the YOLO model

Possible solutions:

1. Copy the model into the Docker image
2. Download the model at container startup
3. Store the model in cloud object storage and download it during startup
4. Use the default Ultralytics model download behavior if acceptable
5. Mount the model file as a volume in self-hosted deployment

Recommended first decision:

- For a simple deployment demo, copy or download a small model during build/startup
- For production-style deployment, store the model in object storage or a model registry

Important note:

A clear model-loading strategy is required before production deployment.

---

### 6. Environment Variables and Secrets

Current backend environment variables:

- `DATABASE_URL`
- `LLM_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `PYTHONUNBUFFERED`

Current frontend environment variables:

- `VITE_BACKEND_URL`

Production requirements:

- No secrets committed to Git
- No production credentials inside `docker-compose.yml`
- Backend secrets managed through hosting provider secret/environment settings
- Frontend public variables should not contain private secrets
- OpenAI API key must only exist in backend environment variables

Recommended improvements:

- Add a root `.env.example` or deployment environment guide
- Document local vs production environment variables
- Confirm frontend never exposes backend-only secrets
- Add deployment-specific notes for OpenAI and Ollama modes

---

### 7. OpenAI and Ollama Deployment Considerations

### OpenAI Provider

OpenAI provider is suitable for cloud deployment because the backend can call the external API.

Production requirements:

- `LLM_PROVIDER=openai`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- Secure backend environment variables
- Error handling for missing/invalid API keys
- Budget monitoring

### Ollama Provider

Ollama is better suited for local or self-hosted deployment.

Production challenges:

- Requires a running Ollama server
- Requires local model availability
- May need more CPU/RAM/GPU resources
- Not ideal for simple serverless deployment unless separately hosted

Recommended approach:

- Use OpenAI provider for first cloud deployment
- Keep Ollama as a local development/self-hosted option
- Document Ollama as not required for the first cloud deployment

---

## Recommended Deployment Architecture

### Option A: Budget-Friendly Cloud Demo

Frontend:

- Vercel or Netlify

Backend:

- Cloud Run, Render, Railway, or Fly.io

Database:

- Neon, Supabase, Render PostgreSQL, Railway PostgreSQL, or Cloud SQL

Storage:

- Short-term: local backend storage with limitations
- Later: object storage

LLM:

- OpenAI provider for cloud demo
- Ollama remains local/self-hosted

This option is best for a portfolio demo.

---

### Option B: More Production-Style Cloud Architecture

Frontend:

- Vercel, Netlify, or Cloudflare Pages

Backend:

- Google Cloud Run or similar container platform

Database:

- Managed PostgreSQL

Storage:

- Cloud object storage for uploaded and generated media

Secrets:

- Cloud secret/environment variable manager

LLM:

- OpenAI provider for cloud inference
- Optional separately hosted Ollama service if needed

This option is more scalable and production-aligned.

---

### Option C: Self-Hosted Docker Deployment

Frontend:

- Docker container or static Nginx container

Backend:

- Docker container

Database:

- PostgreSQL container with persistent volume

Storage:

- Mounted persistent volume

LLM:

- Optional local Ollama container/service

This option gives more control but requires more server maintenance.

---

## Recommended v0.4.0 Direction

The recommended v0.4.0 milestone is:

Deployment Readiness and Production Architecture

This milestone should not deploy everything at once. It should prepare the project step by step.

---

## Proposed v0.4.0 Execution Plan

### Step 1: Deployment Roadmap

Status:

- In progress

Deliverable:

- `docs/deployment-roadmap.md`

Goal:

- Document deployment decisions, risks, and roadmap before code changes

---

### Step 2: Environment Configuration Cleanup

Possible branch:

- `chore/deployment-env-cleanup`

Tasks:

- Review backend `.env.example`
- Review frontend `.env.example`
- Add production environment variable notes
- Document required vs optional variables
- Make sure secrets are never exposed to frontend
- Consider adding `docs/environment-variables.md`

---

### Step 3: Production Frontend Build Strategy

Possible branch:

- `chore/frontend-production-build`

Tasks:

- Decide whether frontend will deploy to Vercel/Netlify or Docker
- If using static hosting, document Vite build output
- If using Docker, update Dockerfile to production build and static serving
- Confirm API URL configuration for production
- Run `npm run build`

---

### Step 4: Backend Container Readiness

Possible branch:

- `chore/backend-container-readiness`

Tasks:

- Review backend Dockerfile
- Decide model file loading strategy
- Confirm OpenCV and FFmpeg dependencies
- Confirm startup command
- Confirm storage directory creation
- Add production notes for Uvicorn/Gunicorn if needed

---

### Step 5: Database Deployment Plan

Possible branch:

- `docs/database-deployment-plan`

Tasks:

- Choose managed PostgreSQL provider
- Document connection string handling
- Document migration/init strategy
- Document backup and cost considerations
- Confirm local Docker Compose remains for development

---

### Step 6: Media Storage Plan

Possible branch:

- `docs/media-storage-plan`

Tasks:

- Decide whether first deployment will use temporary local storage or object storage
- Document current storage limitations
- Plan object storage integration
- Define how URLs/paths should be stored in PostgreSQL

---

### Step 7: First Cloud Deployment

Possible branch:

- `deploy/initial-cloud-deployment`

Tasks:

- Deploy frontend
- Deploy backend
- Connect backend to managed PostgreSQL
- Configure environment variables
- Test health endpoint
- Test image upload and detection
- Test command parsing
- Test LLM provider status
- Document deployment steps

---

## Deployment Readiness Checklist

Before first public deployment:

- [ ] Backend can start from a clean container
- [ ] Frontend production build works
- [ ] Database URL is configured securely
- [ ] OpenAI API key is stored only in backend environment
- [ ] Media storage limitation is documented
- [ ] YOLO model loading is solved
- [ ] Health endpoint works in production
- [ ] CORS/API routing works between frontend and backend
- [ ] Upload and output paths work in deployment
- [ ] LLM provider status works
- [ ] Parser mode selection works
- [ ] LLMOps dashboard works
- [ ] Deployment notes are documented
- [ ] Local Docker Compose still works after deployment changes

---

## Immediate Risks

### Risk 1: Model file is not included in backend image

The backend currently has a local model file, but `*.pt` is ignored by Git and the backend Dockerfile does not copy it.

Decision needed:

- Copy model into image
- Download model at startup
- Store model in cloud storage
- Use Ultralytics automatic model loading

### Risk 2: Local storage is not persistent in cloud containers

The app currently stores uploaded and generated files inside `backend/storage`.

Decision needed:

- Accept temporary storage for demo
- Add object storage before deployment
- Use a persistent volume if provider supports it

### Risk 3: Frontend Dockerfile is development-oriented

The frontend Dockerfile currently runs the Vite dev server.

Decision needed:

- Deploy frontend as static build
- Or create production Dockerfile for static serving

### Risk 4: Ollama is not simple for serverless deployment

Ollama requires a running local/self-hosted model server.

Decision needed:

- Keep Ollama for local development
- Use OpenAI provider for first cloud deployment

### Risk 5: Production secrets must be separated from local config

The current Docker Compose file uses local development credentials.

Decision needed:

- Keep local credentials only for development
- Use hosting provider environment variables for production

---

## Recommended First Deployment Target

For the first public demo, recommended setup:

- Frontend: Vercel or Netlify
- Backend: Cloud Run, Render, Railway, or Fly.io
- Database: Managed PostgreSQL
- Storage: Start with documented temporary local storage or add object storage before public demo
- LLM: OpenAI provider for cloud deployment
- Ollama: Local/self-hosted option only

This keeps the deployment realistic while avoiding too much infrastructure complexity at once.

---

## Notes for Future Releases

Possible release direction:

### v0.4.0

Deployment readiness and production architecture

### v0.5.0

Cloud deployment, persistent storage, and public demo

### v0.6.0

Authentication, user workspaces, and saved sessions

### v0.7.0

Advanced MLOps/LLMOps monitoring and experiment tracking

