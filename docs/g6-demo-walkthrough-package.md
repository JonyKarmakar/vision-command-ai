# G.6 Demo and Walkthrough Package

This document defines the public demo and walkthrough package for VisionCommand AI during Milestone G.

The goal is to make the project easier to present, validate, and review while keeping the repository focused on public product documentation.

## Purpose

G.6 prepares a professional project-facing walkthrough package.

It helps reviewers understand:

- what the application does
- how to run the local Docker demo
- which feature flow to review first
- which screenshots should be captured later
- what the demo proves
- what the demo does not prove
- how to validate the demo behavior
- which limitations are known

This document is written as public project documentation.

## Current demo scope

The current primary demo path is:

```text
Local Docker Compose
```

The current local app URL is:

```text
http://localhost:5173
```

The current backend health endpoint is:

```text
http://localhost:8000/health
```

The previous Render deployment remains historical deployment evidence.

It should not be presented as the current guaranteed active live demo unless it is manually verified again.

## Demo prerequisites

Before running the walkthrough, prepare:

- Docker and Docker Compose
- the repository cloned locally
- local main branch synced with `origin/main`
- optional local YOLO model file at `yolo26n.pt`
- a small non-private image for image workflows
- a short non-private video for uploaded-video workflows
- a browser for the frontend demo

Recommended local model preparation:

```bash
mkdir -p backend/storage/models
cp yolo26n.pt backend/storage/models/yolo26n.pt
```

Model files are ignored by Git and should not be committed.

## Start the local Docker demo

From the repository root:

```bash
docker compose down --remove-orphans
docker compose up --build -d
```

Wait for services to start:

```bash
sleep 20
docker compose ps
```

Open:

```text
http://localhost:5173
```

## Local validation before walkthrough

Run these checks before capturing screenshots or presenting the demo.

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

## Five-minute product walkthrough

This walkthrough focuses on product behavior.

### 1. Open the application

Show the local frontend:

```text
http://localhost:5173
```

Purpose:

- show that the app runs locally as a complete product-style interface
- show User Mode as the clean default experience
- avoid starting with Developer Mode unless the reviewer asks for engineering details

### 2. Image workflow

Recommended sequence:

1. upload a non-private image
2. run object detection
3. review annotated detection output
4. show object inventory and spatial summary
5. apply crop or blur by class
6. show generated output history
7. reuse a generated output if useful

What this demonstrates:

- practical object detection
- image editing based on detected regions
- result history and workflow continuity
- product-facing output organization

### 3. Video workflow

Recommended sequence:

1. upload a short non-private video
2. inspect video metadata
3. trim a small clip
4. extract one frame
5. run detection on extracted frames or sampled video frames
6. show keyframe gallery, timeline, object presence, or privacy review where available
7. show Video command history

What this demonstrates:

- uploaded-video processing
- frame-level computer vision workflow
- ordered video result panels
- structured review of completed video actions

### 4. Command workflow

Recommended sequence:

1. enter a simple image command such as `crop person` or `blur person`
2. show command parsing and planning
3. show prepared execution details
4. confirm and run the prepared action
5. review command output and audit summary

What this demonstrates:

- command-driven workflow
- parser and planner separation
- safe prepared execution flow
- manual confirmation before action execution

### 5. Analysis memory workflow

Recommended sequence:

1. create or load generated output history
2. open Analysis Memory Chat
3. ask a question about previous outputs
4. review the grounded answer
5. review retrieved source cards
6. show notes and limitations

What this demonstrates:

- generated output history as analysis memory
- retrieval-style grounding
- source-card based explanation
- safe answer boundaries

## Ten-minute technical walkthrough

This walkthrough focuses on architecture and engineering.

### 1. Full-stack structure

Show the architecture summary:

```text
docs/g5-architecture-and-deployment-diagrams.md
```

Explain the implemented stack:

- React and TypeScript frontend
- FastAPI backend
- YOLO, OpenCV, Pillow, FFmpeg, and PyTorch media workflows
- PostgreSQL persistence
- Docker Compose local demo
- GitHub Actions CI

### 2. Request flow

Show how the browser uses relative `/api/...` requests.

In local Docker, the Vite proxy forwards those requests to the backend container.

Relevant docs:

```text
docs/g2-local-docker-demo-readiness.md
docs/g5-architecture-and-deployment-diagrams.md
```

### 3. Persistence and analysis memory

Show how generated outputs are saved and later reused as analysis memory.

Relevant docs:

```text
docs/f6-analysis-memory-rag-demo-guide.md
docs/g5-architecture-and-deployment-diagrams.md
```

### 4. Environment and secrets

Show that backend secrets and frontend public variables are separated.

Relevant docs:

```text
docs/g3-environment-and-secrets-cleanup.md
docs/environment-variables.md
```

### 5. Testing and CI

Show GitHub Actions checks and local validation commands.

Relevant checks:

- backend tests
- backend Docker image build
- frontend build
- `git diff --check`

## Screenshot checklist

Screenshots should use non-private media and should avoid exposing local secrets, private filenames, browser tokens, or personal data.

Recommended screenshots:

- application home or main workspace
- User Mode image upload
- image detection result with annotated output
- object inventory and spatial summary
- object crop gallery
- generated output history
- video upload and metadata
- video frame extraction or sampled detection result
- keyframe gallery or object presence timeline
- command planning or prepared execution panel
- command execution result
- Analysis Memory Chat answer with source cards
- Developer Mode observability panel
- local Docker terminal with services running
- GitHub Actions checks passing
- Mermaid architecture diagram from `docs/g5-architecture-and-deployment-diagrams.md`

Store future selected screenshots under the documented walkthrough asset structure.

Relevant doc:

```text
docs/walkthrough-assets.md
```

## Demo evidence checklist

A complete demo evidence package should show:

- local Docker stack starts successfully
- frontend loads at `http://localhost:5173`
- backend health returns healthy
- frontend `/api/health` proxy returns healthy
- model info endpoint responds
- database stats endpoint responds
- image upload works
- image detection or editing action works
- generated output history is visible
- one video workflow works
- one command workflow works
- analysis memory chat returns grounded source cards
- CI checks are passing on main

## Recommended project explanation

Use this project-facing explanation:

```text
VisionCommand AI is a full-stack applied AI media assistant. It lets users upload images or videos, run computer vision workflows, edit detected objects, execute command-driven actions, and ask grounded questions about previous generated outputs. The backend handles media processing, command intelligence, persistence, and analysis-memory retrieval. The frontend provides a clean product mode and a developer mode for observability. The current reliable demo path is local Docker, and the earlier Render deployment is documented as historical cloud deployment evidence.
```

## What the demo proves

The demo proves:

- the app runs as a full-stack local Docker system
- image workflows are connected from frontend to backend
- uploaded-video workflows are available
- command parsing, planning, and prepared execution are implemented
- generated output history is visible and reusable
- analysis memory can retrieve and cite saved/generated outputs
- PostgreSQL-backed persistence works when configured
- the project uses CI-backed development practices
- deployment status and limitations are documented honestly

## What the demo does not prove

The demo does not prove:

- active production cloud hosting
- live camera or real-time stream processing
- identity recognition
- emotion recognition
- guaranteed capture-location inference
- persistent production media storage
- full persistent multi-object tracking in every scenario
- enterprise-grade security or monitoring
- v1 production readiness

## Troubleshooting notes

If the frontend does not load:

```bash
docker compose ps
docker compose logs --tail=120 frontend
```

If the backend does not respond:

```bash
docker compose ps
docker compose logs --tail=180 backend
```

If database-backed panels are empty:

```bash
curl -sS http://localhost:5173/api/db/stats
docker compose logs --tail=120 postgres
```

If the first detection is slow:

- confirm the model exists at `backend/storage/models/yolo26n.pt`
- allow time for first model loading
- check backend logs

If a video workflow is slow:

- use a short video
- use a short time range
- use sampled frame operations before heavier operations

## Fallback validation notes

If the full visual walkthrough cannot be completed, the project can still be validated through:

- README overview
- architecture diagrams
- local Docker health checks
- API smoke checks
- GitHub Actions CI results
- historical Render deployment evidence docs
- milestone summaries

This is a validation fallback for technical review, not a replacement for the full product walkthrough.

## Boundary

G.6 does not add new product features.

G.6 does not create a cloud deployment.

G.6 does not add actual screenshots.

G.6 does not add private career-preparation notes.

G.6 does not claim v1 readiness.

G.6 only creates a professional public demo and walkthrough package for the current implemented project.
