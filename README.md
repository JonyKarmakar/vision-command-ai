# VisionCommand AI

VisionCommand AI is a full-stack AI media assistant for image and video analysis, image editing, uploaded-video workflows, command-driven execution, workflow history, and grounded analysis memory.

The project is built as a professional applied AI engineering portfolio project. It combines practical Computer Vision, LLM-assisted command intelligence, RAG-style analysis memory, FastAPI backend engineering, React and TypeScript frontend development, PostgreSQL persistence, Docker-based demo readiness, and CI/CD validation.

## Current Demo Status

The current primary demo path is local Docker.

This is intentional. The project was previously deployed on Render as a controlled public cloud demo, but the current Milestone G strategy is budget-aware and does not depend on paid cloud infrastructure or the old free-tier Render database.

Current demo priority:

1. Run the full stack locally with Docker Compose.
2. Use historical Render deployment documentation as proof that the project was deployed before.
3. Treat old Render URLs as historical evidence unless they are manually verified again.
4. Keep deployment claims honest and avoid presenting stale cloud services as active production.

Main local app URL after Docker startup:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:8000/health
```

## What the Project Demonstrates

VisionCommand AI demonstrates the ability to build an applied AI product, not only a model notebook.

It shows:

- Computer Vision workflows for image and uploaded-video analysis
- Object detection with YOLO
- Image editing actions such as crop, blur, blur by class, and zoom by class
- Uploaded-video processing with trim, frame extraction, sampled detection, keyframes, activity summaries, privacy review, and tracking readiness outputs
- Command-driven AI workflows with parsing, planning, preparation, safety hints, and manual confirmation gates
- Local LLM and external-provider aware assistant flows
- Structured image chat and video chat with grounding notes and guardrails
- Analysis memory chat over generated outputs using retrieval-style grounding and source cards
- PostgreSQL-backed logs, generated output history, lineage, analytics, and reporting
- User Mode for clean product demos and Developer Mode for engineering observability
- Docker, CI/CD, tests, and production-readiness documentation

## Core Capabilities

### Image Workflows

- Upload and preview images
- Run object detection
- View annotated detection outputs
- Filter detections by confidence and class
- Crop detected objects
- Blur detected objects
- Blur all objects of a selected class
- Zoom into detected objects
- Run detection again on generated outputs
- Reuse generated outputs as active image sources
- Review generated output history, grouping, analytics, and lineage

### Video Workflows

- Upload and preview videos
- Read video metadata such as duration, FPS, frame count, width, and height
- Trim uploaded videos
- Extract a frame from a timestamp
- Extract multiple frames from a time range
- Run detection on extracted frames
- Run sampled detection across video
- Review key moments and object presence over time
- Generate activity and scene summaries from implemented video outputs
- Review video privacy notes and tracking readiness outputs
- Navigate completed video actions through Video command history

### Command and Assistant Workflows

- Run image and video commands from text input
- Use browser-based voice input for supported commands
- Parse and plan commands before execution
- Show prepared execution details
- Use command skill metadata, examples, readiness labels, and safety hints
- Confirm prepared commands manually before execution
- Preserve command and parser metadata in Developer Mode

### LLM and RAG-style Workflows

- Support rule-based, mock LLM, local LLM, and external-provider aware command paths
- Provide structured image chat and video chat
- Show grounding notes and limitations for assistant answers
- Use generated output history as analysis memory
- Retrieve relevant prior analysis outputs for grounded answers
- Display retrieved source cards for analysis memory answers
- Apply safety boundaries for identity, emotion, and capture-location questions

## Product Modes

### User Mode

User Mode provides a cleaner product-facing experience.

It focuses on:

- Simple upload and preview flows
- Clear object detection and editing results
- Generated output history
- Video command history
- View result navigation
- Minimal technical/debug wording

### Developer Mode

Developer Mode keeps the engineering depth visible.

It shows:

- Stored filenames and content types
- JSON payloads
- Parser and planner metadata
- Command execution metadata
- LLMOps and observability panels
- Database summaries and logs
- Analysis memory details
- Generated output analytics and lineage

## Local Docker Quickstart

Docker Compose runs the complete local stack:

- PostgreSQL
- FastAPI backend
- React/Vite frontend

Start from the repository root:

```bash
docker compose down --remove-orphans
docker compose up --build -d
```

Wait for startup:

```bash
sleep 20
docker compose ps
```

Open the app:

```text
http://localhost:5173
```

Stop the stack while keeping the local PostgreSQL volume:

```bash
docker compose down --remove-orphans
```

Remove the database volume only when you intentionally want a full reset:

```bash
docker compose down --remove-orphans --volumes
```

## Docker Smoke Checks

Backend health:

```bash
curl -sS http://localhost:8000/health
```

Frontend proxy health:

```bash
curl -sS http://localhost:5173/api/health
```

Model info through the frontend proxy:

```bash
curl -sS http://localhost:5173/api/model/info
```

Database stats through the frontend proxy:

```bash
curl -sS http://localhost:5173/api/db/stats
```

Generated output history through the frontend proxy:

```bash
curl -sS "http://localhost:5173/api/db/generated-outputs?limit=3"
```

The detection endpoint requires `POST`.

## Model Artifact Note

The local Docker backend uses this model path:

```text
/app/storage/models/yolo26n.pt
```

For the most reliable local demo, place the model before starting Docker:

```bash
mkdir -p backend/storage/models
cp yolo26n.pt backend/storage/models/yolo26n.pt
```

If the file is missing and internet access is available, Ultralytics may download it during the first detection call.

Model files are ignored by Git and should not be committed.

## Local Non-Docker Setup

### Backend

From the repository root:

```bash
cd backend
python -m venv vision-env
source vision-env/bin/activate
pip install -r requirements.txt
```

Run the backend without PostgreSQL:

```bash
env -u DATABASE_URL uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

### Frontend

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

The frontend uses relative `/api/...` calls. In local development, Vite proxy settings forward those requests to the backend.

## Environment Variables

Environment examples are documented in:

```text
backend/.env.example
frontend/.env.example
docs/environment-variables.md
docs/g3-environment-and-secrets-cleanup.md
```

Important rules:

- Backend secrets stay backend-only.
- Frontend variables are public to the browser.
- `DATABASE_URL` must not be exposed to the frontend.
- `OPENAI_API_KEY` must not be exposed to the frontend.
- Docker Compose credentials are local demo values only.
- Old Render values should not be treated as active production credentials.

## Testing and Validation

### Backend tests from the project root

```bash
env -u DATABASE_URL PYTHONPATH=backend python -m pytest backend/tests -q
```

### Backend tests from the backend folder

```bash
cd backend
env -u DATABASE_URL python -m pytest -q
```

### Frontend build

```bash
cd frontend
npm run build
```

### Frontend lint

```bash
cd frontend
npm run lint
```

### Docker Compose config

```bash
docker compose config
```

### Diff whitespace check

```bash
git diff --check
```

## CI/CD

GitHub Actions validates pull requests and main branch pushes.

Current CI coverage includes:

- Backend test suite
- Backend Docker image build
- Frontend build

The project has been developed through small pull requests with explicit validation, milestone summaries, and post-merge checks.

## Architecture

For visual architecture and deployment diagrams, see:

```text
docs/g5-architecture-and-deployment-diagrams.md
```

```text
React + TypeScript frontend
        |
        | relative /api requests
        v
Vite proxy or hosting rewrite
        |
        v
FastAPI backend
        |
        | media and AI services
        v
YOLO, OpenCV, Pillow, FFmpeg, PyTorch
        |
        | optional persistence
        v
PostgreSQL
```

### Frontend

The frontend is a React and TypeScript application built with Vite. It provides media upload controls, image and video result panels, AI Assistant command UI, generated output history, video command history, analysis memory chat, User Mode, Developer Mode, and observability panels.

### Backend

The backend is a FastAPI service. It handles media upload, object detection, image crop/blur/zoom workflows, video trimming, frame extraction, sampled detection, tracking-related summaries, command parsing, command planning, command execution, LLM provider integration, analysis memory retrieval, PostgreSQL persistence, and JSON APIs for workflow results and logs.

### Database

PostgreSQL is used for persistence when `DATABASE_URL` is configured. It stores media metadata, detection results, inference logs, command logs, parser attempt logs, generated output history, workflow lineage, and analysis memory source data.

When `DATABASE_URL` is not set, the app keeps safe fallback behavior for local use.

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
- OpenCV
- Ultralytics YOLO
- PyTorch
- imageio-ffmpeg
- OpenAI SDK integration

### Database and Persistence

- PostgreSQL
- psycopg
- Filesystem storage for local uploads and generated outputs

### DevOps and Engineering

- Git and GitHub
- GitHub Actions
- Docker
- Docker Compose
- Render deployment documentation
- Milestone-based pull request workflow

## Project Structure

```text
vision-command-ai/
├── backend/
│   ├── app/
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── g-production-readiness-roadmap.md
│   ├── g0-production-deployment-context-audit.md
│   ├── g2-local-docker-demo-readiness.md
│   ├── g3-environment-and-secrets-cleanup.md
│   ├── environment-variables.md
│   └── render-deployment-evidence.md
│
├── docker-compose.yml
├── render.yaml
└── README.md
```

## Key Documentation

Milestone G docs:

```text
docs/g-production-readiness-roadmap.md
docs/g0-production-deployment-context-audit.md
docs/g2-local-docker-demo-readiness.md
docs/g3-environment-and-secrets-cleanup.md
docs/g5-architecture-and-deployment-diagrams.md
docs/g6-demo-walkthrough-package.md
docs/g7-final-smoke-checklist.md
docs/g8-portfolio-case-study.md
```

Demo and assistant docs:

```text
docs/local-ai-demo.md
docs/image-chat-demo.md
docs/video-chat-demo.md
docs/f6-analysis-memory-rag-demo-guide.md
docs/g6-demo-walkthrough-package.md
```

Deployment and environment docs:

```text
docs/environment-variables.md
docs/render-deployment-evidence.md
docs/render-first-deployment-runbook.md
docs/render-troubleshooting-notes.md
docs/production-env-checklist.md
```

Milestone summaries:

```text
docs/f-milestone-summary.md
docs/e3-demo-guide.md
docs/e4-milestone-summary.md
```

## Historical Render Deployment

VisionCommand AI was previously deployed on Render with:

- Render Static Site frontend
- Render Docker Web Service backend
- Render PostgreSQL database
- `/api/*` rewrite from frontend to backend
- smoke-tested image upload, detection, crop, blur, command execution, and database-backed logs

This is documented in:

```text
docs/render-deployment-evidence.md
docs/releases/v0.4.0.md
```

Current note:

The old Render deployment should be treated as historical evidence unless manually verified again. It depended on free-tier infrastructure and is not the current guaranteed live demo path.

## Current Limitations

Current known boundaries:

- The primary demo path is local Docker, not guaranteed live cloud hosting.
- Uploaded-video workflows process uploaded files, not live camera streams.
- Object tracking and tracking readiness features should not be described as full persistent multi-object tracking across all scenarios.
- Local filesystem media storage is suitable for local demos but not production user storage.
- `.pt` model artifacts are ignored by Git and must be supplied or downloaded locally.
- Real LLM provider use requires backend-only configuration.
- The project is not presented as a deployed production service for real users.

## Roadmap

Milestone G is focused on production readiness and portfolio packaging.

Completed:

- G.0 Production and deployment context audit
- G.1 Production readiness roadmap
- G.2 Local Docker demo hardening
- G.3 Environment and secrets cleanup
- G.4 README rewrite
- G.5 Architecture and deployment diagrams
- G.6 Demo and walkthrough package
- G.7 Final smoke checklist

Current slice:

- G.8 Portfolio case study

Planned:

- G.9 v1 readiness decision

## Portfolio Positioning

VisionCommand AI is intended to support applications for roles such as:

- Applied AI Developer
- Computer Vision Engineer
- AI Software Engineer
- Full-stack AI Developer
- Machine Learning Engineer
- ML Software Engineer
- LLM Developer
- LLMOps or MLOps-oriented AI Engineer

The project shows practical AI product engineering across frontend, backend, computer vision, LLM workflows, persistence, Docker, testing, documentation, and CI/CD.

## License

This project is currently maintained as a personal portfolio and learning project.
