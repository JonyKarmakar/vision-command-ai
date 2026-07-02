# VisionCommand AI

VisionCommand AI is a full-stack AI media assistant for image and video analysis, editing, workflow history, and AI-assisted command execution.

Users can upload images or videos, detect objects, crop or blur detected regions, zoom into targets, extract and analyze video frames, track objects across video, and review completed workflows through clean product-facing history panels.

The project is built as more than a computer vision demo. It combines practical Computer Vision, LLM-assisted command intelligence, full-stack AI engineering, workflow observability, PostgreSQL-backed persistence, Docker, CI/CD, and production-style development practices.

---

## Demo Status

VisionCommand AI currently supports a polished local demo flow with two modes.

### User Mode

User Mode provides a clean product-facing experience.

It focuses on:

- Clean image and video upload flows
- Object detection and editing results
- Generated output history
- Video command history
- Ordered result panels
- Simple View result navigation
- Minimal technical/debug wording

### Developer Mode

Developer Mode keeps the engineering depth visible.

It preserves:

- Original and stored filenames
- Content types and media metadata
- JSON copy and download actions
- Parser and planner metadata
- LLMOps and observability panels
- Database summaries and logs
- Generated output analytics
- Assistant/debug result cards

This separation allows the same application to work as both a clean AI product demo and a technical engineering showcase.

---

## Live Demo

A first public Render deployment was completed earlier and documented in the project docs.

Frontend demo:

```text
https://vision-command-frontend.onrender.com
```

Backend demo:

```text
https://vision-command-backend.onrender.com
```

Render free-tier limitations still apply. The backend may sleep after inactivity, first requests can be slow, YOLO inference is slower on free instances, and uploaded/generated media use temporary container storage unless a persistent storage strategy is added.

Deployment notes are available in:

```text
docs/render-deployment-evidence.md
docs/render-first-deployment-runbook.md
docs/render-troubleshooting-notes.md
```

---

## Core Capabilities

### Image workflows

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

### Video workflows

- Upload and preview videos
- Extract video metadata such as duration, FPS, frame count, width, and height
- Trim video clips
- Extract a single frame from a timestamp
- Extract multiple frames from a time range
- Run detection on extracted frames
- Run sampled detection across video
- Track objects across sampled video frames
- Review completed video actions through Video command history
- Navigate back to video results using View result actions
- Show video result panels in the order actions were completed

### AI Assistant workflows

- Run image and video commands through text input
- Use browser-based voice input for supported commands
- Execute commands such as crop, blur, zoom, trim video, extract frame, detect frames, and track video
- Support rule-based, mock LLM, and real LLM command paths
- Preview command plans and prepared execution outputs
- Preserve technical command outputs in Developer Mode

---

## Demo Flows

### Image demo flow

```text
Upload image
Detect objects
Filter detections
Crop or blur detected objects
Use AI Assistant to zoom into a target
Review generated outputs
Use a generated output as the active image
Run detection on generated output
```

### Video demo flow

```text
Upload video
Trim video
Extract one frame
Extract multiple frames
Detect objects across video
Detect objects on extracted frames
Track objects across video
Review Video command history
Use View result navigation
```

### Example AI Assistant commands

```text
detect objects
crop person
blur person
blur all persons
zoom person
extract frame at 1 second
extract frames from 0 to 3 seconds
detect frames from 0 to 3 seconds
trim video from 0 to 2 seconds
track video from 0 to 3 seconds
track person from 0 to 3 seconds
```

---

## Architecture

```text
React + TypeScript frontend
        |
        | /api requests
        v
FastAPI backend
        |
        | AI/media services
        v
YOLO, OpenCV, Pillow, FFmpeg, PyTorch
        |
        | optional persistence
        v
PostgreSQL
```

### Frontend

The frontend is a React and TypeScript application built with Vite. It manages User Mode and Developer Mode, media upload controls, image and video result panels, AI Assistant command UI, generated output history, video command history, workspace recovery panels, and observability dashboards.

### Backend

The backend is a FastAPI service. It handles image upload, video upload, object detection, image crop/blur/zoom workflows, video trimming, frame extraction, sampled detection, tracking, command parsing, planning, validation, execution, LLM provider integration, PostgreSQL persistence, and JSON APIs for workflow results and logs.

### Database

PostgreSQL is optional for local development but supported for persistence. When configured, it stores uploaded media metadata, detection results, inference logs, command logs, parser attempt logs, generated output history, and workflow lineage data.

When `DATABASE_URL` is not set, the app still runs with safe fallback behavior for local demos.

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
- OpenCV
- Ultralytics YOLO
- PyTorch
- imageio-ffmpeg
- OpenAI SDK

### Database and persistence

- PostgreSQL
- psycopg

### DevOps

- Git
- GitHub
- GitHub Actions
- Docker
- Docker Compose
- Render deployment configuration

---

## Project Structure

```text
vision-command-ai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── schemas.py
│   │   ├── routers/
│   │   └── services/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   └── types/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── releases/
│   ├── api-and-feature-reference.md
│   ├── llm-command-parser-architecture.md
│   ├── command-planner-design.md
│   ├── workspace-recovery-flow.md
│   └── render-deployment-evidence.md
│
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

## Local Setup

### Backend

From the backend folder:

```bash
cd backend

python -m venv ../vision-env
source ../vision-env/bin/activate

pip install -r requirements.txt
env -u DATABASE_URL uvicorn app.main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

### Frontend

In a separate terminal:

```bash
cd frontend

npm install
npm run dev
```

The frontend runs at:

```text
http://127.0.0.1:5173
```

### Optional Docker Compose setup

```bash
docker compose up --build
```

Docker Compose is intended for running the backend, frontend, and PostgreSQL together.

---

## Testing

### Backend tests from the project root

```bash
env -u DATABASE_URL PYTHONPATH=backend python -m pytest backend/tests -q
```

### Backend tests from the backend folder

```bash
cd backend

env -u DATABASE_URL python -m pytest -q
```

### Frontend checks

```bash
cd frontend

npm run build
npm run lint
```

### Diff whitespace check

```bash
git diff --check
```

Recent verified local test status:

```text
Backend tests: 325 passed
Frontend build: passed
Frontend lint: passed
```

---

## CI/CD

GitHub Actions validate pull requests and main branch pushes.

Current workflows include:

- Backend tests
- Backend Docker image build
- Frontend build

The project workflow uses:

```text
feature branch
pull request
CI checks
merge to main
post-merge main CI verification
```

Recent demo-readiness PRs were merged only after pull request checks and post-merge main push checks passed.

---

## Documentation

Detailed documentation is available in the `docs/` folder.

Important docs include:

```text
docs/README.md
docs/api-and-feature-reference.md
docs/product-walkthrough.md
docs/architecture-overview.md
docs/walkthrough-assets.md
docs/project-vision-and-ai-roadmap.md
docs/llm-command-parser-architecture.md
docs/command-planner-design.md
docs/workspace-recovery-flow.md
docs/deployment-readiness-summary.md
docs/deployment-hardening-plan.md
docs/render-deployment-evidence.md
docs/releases/v0.3.0.md
docs/releases/v0.4.0.md
docs/releases/v0.5.0.md
docs/releases/v0.5.1.md
docs/releases/v0.5.2.md
```

The detailed API and feature inventory from the previous README is preserved in:

```text
docs/api-and-feature-reference.md
```

---

## Recent Demo-Readiness Milestones

### PR #455: Video command history panel

Added a Video command history panel after the AI Assistant. Completed video workflow actions are now visible in one place, with View result navigation back to matching video outputs.

### PR #456: Video result ordering polish

Video result panels now follow the order actions are completed. Sampled detection results no longer appear before earlier results such as trim or extracted frames. User Mode no longer shows generic Assistant result cards for video commands.

### PR #457: Final User Mode copy polish

User Mode now hides long uploaded image filenames, shows a clean image workspace readiness status, and uses **Zoomed image ready** for zoom command outputs. Developer Mode still preserves technical metadata and Assistant/debug wording.

---

## Current Status

VisionCommand AI is currently in a polished demo-ready local state.

Stable areas include:

- Image upload, detection, crop, blur, zoom, and generated output reuse
- Video upload, trim, frame extraction, sampled detection, frame detection, and tracking
- User Mode and Developer Mode separation
- AI Assistant command execution for image and video workflows
- Generated output history and video command history
- LLM parser/planner tooling and observability panels
- PostgreSQL-backed persistence where configured
- Docker and CI-backed development workflow

The next recommended work is documentation refinement, architecture visuals, sample media references, and deployment hardening rather than additional core UI features.

---

## Roadmap

Possible next improvements:

- Add final walkthrough screenshots using the `docs/assets/` placeholder structure
- Expand architecture visuals in `docs/architecture-overview.md` with screenshots or rendered diagrams
- Implement deployment hardening items from `docs/deployment-hardening-plan.md`
- Add more robust video tracking methods
- Expand real LLM evaluation coverage
- Add user-facing screenshots to the README
- Prepare a portfolio case study version of the project

---

## License

This project is currently developed as a personal learning and portfolio project.
