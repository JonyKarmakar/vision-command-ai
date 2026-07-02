# VisionCommand AI Architecture Overview

This document describes the architecture of VisionCommand AI from a system design and engineering perspective.

It explains how the frontend, backend, media-processing services, command intelligence layer, persistence layer, and CI/CD workflow fit together.

---

## System Purpose

VisionCommand AI is a full-stack AI media assistant for image and video workflows.

The system allows users to:

- Upload images and videos
- Run object detection
- Edit detected regions through crop, blur, and zoom actions
- Extract and analyze video frames
- Run sampled video detection
- Track objects across video frames
- Execute workflows through text or voice commands
- Inspect generated outputs and workflow history
- Switch between clean User Mode and technical Developer Mode

The architecture is designed to support both product-facing workflows and developer-facing inspection.

---

## High-Level Architecture

```text
User
 |
 | Browser interaction
 v
React + TypeScript Frontend
 |
 | HTTP requests through API client
 v
FastAPI Backend
 |
 | Service-layer orchestration
 v
Media Processing + AI Services
 |
 | Optional persistence
 v
PostgreSQL
```

Main responsibilities:

```text
Frontend:
User interface, workflow state, media previews, result panels, command controls, history panels

Backend:
API routing, validation, media processing, model inference, command execution, persistence orchestration

AI/media services:
YOLO detection, OpenCV/Pillow processing, video frame extraction, tracking, generated output handling

Database:
Media metadata, detection records, inference logs, command logs, parser attempts, generated output history

CI/CD:
Backend tests, Docker build validation, frontend build validation, pull request checks
```

---

## Frontend Architecture

The frontend is a React and TypeScript application built with Vite.

It is responsible for:

- Media upload controls
- Image workspace state
- Video workspace state
- AI Assistant input and command execution UI
- User Mode and Developer Mode display logic
- Image result panels
- Video result panels
- Generated Output History
- Video command history
- Workspace recovery controls
- LLMOps and observability panels
- API communication with the backend

The frontend does not run model inference directly. It sends media and command requests to the backend and renders structured responses.

---

## Frontend State Responsibilities

The frontend manages several workflow states.

Important state areas include:

```text
Image state:
Uploaded image, active image source, detection results, generated outputs

Video state:
Uploaded video, metadata, trimmed video, extracted frame, extracted frames, sampled detection, tracking results

Command state:
Assistant input, command result, parser/planner output, prepared execution output

History state:
Generated output history, video command history, workflow grouping, selected outputs

Mode state:
User Mode visibility, Developer Mode visibility, debug metadata visibility
```

The separation between User Mode and Developer Mode is handled primarily in the frontend. The backend still returns technical information, but the frontend decides how much of it should be exposed in each mode.

---

## Backend Architecture

The backend is a FastAPI application.

It is responsible for:

- API route handling
- Request validation
- File upload handling
- Media path management
- Object detection orchestration
- Image editing workflows
- Video processing workflows
- Command parsing and execution
- LLM provider integration
- Persistence fallback behavior
- JSON response generation

The backend is organized around routers, schemas, and service modules.

General structure:

```text
backend/
├── app/
│   ├── main.py
│   ├── schemas.py
│   ├── routers/
│   └── services/
└── tests/
```

---

## Service-Layer Design

The backend uses service modules to keep business logic separate from API route definitions.

Typical service responsibilities include:

```text
Detection service:
Runs object detection and returns structured detection results

Image operation services:
Crop, blur, zoom, annotate, and generated output handling

Video services:
Metadata extraction, trimming, frame extraction, sampled detection, tracking

Command services:
Command parsing, command planning, validation, prepared execution, execution routing

Database service:
Optional PostgreSQL persistence with safe fallback when DATABASE_URL is not configured

LLM services:
Provider status, prompt construction, parser/planner integration, output validation
```

This separation keeps the API layer thinner and makes the project easier to test and extend.

---

## Media Processing Architecture

VisionCommand AI supports both image and video workflows.

### Image processing

Image processing includes:

- Image upload
- Image preview
- Object detection
- Annotated output generation
- Crop by coordinates or class
- Blur by coordinates or class
- Zoom by class or selected target
- Detection on generated outputs
- Generated output reuse

General flow:

```text
Image upload
 |
 v
Backend stores uploaded media
 |
 v
Detection or editing request
 |
 v
Image-processing service
 |
 v
Generated result path + metadata
 |
 v
Frontend renders result and history item
```

### Video processing

Video processing includes:

- Video upload
- Metadata extraction
- Trimmed video generation
- Single-frame extraction
- Multi-frame extraction
- Sampled video detection
- Detection on extracted frames
- Object tracking across sampled frames

General flow:

```text
Video upload
 |
 v
Backend stores uploaded video
 |
 v
Video metadata extraction
 |
 v
Video action request
 |
 v
Video-processing service
 |
 v
Generated output or structured result
 |
 v
Frontend renders ordered video result panel
 |
 v
Video command history records completed action
```

---

## Object Detection Flow

Object detection is handled by the backend.

General detection flow:

```text
Frontend sends detection request
 |
 v
FastAPI route validates request
 |
 v
Detection service loads or reuses model
 |
 v
YOLO inference runs on image or frame
 |
 v
Structured detections are returned
 |
 v
Annotated output may be generated
 |
 v
Results are persisted when database is configured
 |
 v
Frontend renders detections and outputs
```

Detection outputs are used by later workflows such as crop, blur, zoom, generated output reuse, and frame-level video analysis.

---

## Command Intelligence Architecture

VisionCommand AI includes an AI Assistant layer for text and voice-driven workflows.

The command layer supports:

- Rule-based command parsing
- Mock LLM command paths
- Real LLM command paths
- Command planning
- Prompt preview
- Prepared execution
- Validation before execution
- Execution routing to image or video workflows

General command flow:

```text
User enters command
 |
 v
Frontend sends command to backend
 |
 v
Parser or planner interprets command
 |
 v
Validation checks action, target, media state, and parameters
 |
 v
Prepared execution is created or action is executed
 |
 v
Backend returns structured result
 |
 v
Frontend routes result to the correct image or video panel
```

This design keeps command interpretation separate from actual media execution. It also allows Developer Mode to expose parser, planner, and validation details without affecting the clean User Mode experience.

---

## User Mode and Developer Mode Architecture

VisionCommand AI has two presentation modes.

### User Mode

User Mode focuses on product clarity.

It hides:

- Long technical filenames
- Low-level debug details
- Raw command output cards for video commands
- Unnecessary JSON details

It shows:

- Clean workspace states
- Image and video previews
- Generated outputs
- Ordered result panels
- Video command history
- View result navigation

### Developer Mode

Developer Mode focuses on technical inspection.

It shows:

- Original and stored filenames
- Content types
- Media metadata
- JSON copy and download actions
- Command parser and planner output
- LLM provider status
- Database summaries
- Debug command results
- Workflow export and reporting tools

This split allows the same system to support product demonstration and engineering inspection.

---

## Persistence Architecture

PostgreSQL is optional for local development.

When configured, it can store:

- Uploaded media metadata
- Detection results
- Inference logs
- Command logs
- Parser attempt logs
- Generated output history
- Workflow lineage records

When `DATABASE_URL` is not configured, the backend uses safe fallback behavior so local demos can still run.

Persistence flow:

```text
Backend workflow completes
 |
 v
Database service checks configuration
 |
 | DATABASE_URL configured
 |---------------------------> Save record to PostgreSQL
 |
 | DATABASE_URL missing
 |---------------------------> Return safe not_configured behavior
```

This design prevents local development from failing just because PostgreSQL is not running.

---

## Observability and LLMOps Architecture

Developer Mode exposes observability features for command and workflow inspection.

Observability areas include:

- Parser outputs
- Planner outputs
- LLM provider status
- Command logs
- Inference summaries
- Database summaries
- Generated output analytics
- Workflow export and report generation

The goal is to make the system inspectable, not only usable.

This supports MLOps and LLMOps-style thinking by making command behavior, inference behavior, and workflow metadata visible during development and testing.

---

## API Domain Overview

The backend API is organized around workflow domains.

Main API domains include:

```text
Health and model status:
Backend readiness and model information

Media:
Image and video upload, uploaded media access, generated outputs

Vision:
Detection, annotation, crop, blur, zoom

Video:
Metadata extraction, trimming, frame extraction, sampled detection, tracking

Commands:
Command parsing, planning, prepared execution, command execution

Database:
Detection history, inference logs, command logs, generated output persistence

LLMOps:
Provider status, parser evaluation, planner comparison, observability summaries
```

Detailed endpoint-level information is preserved in:

```text
docs/api-and-feature-reference.md
```

---

## Deployment Architecture

The project includes deployment configuration for Render.

Public demo deployment includes:

```text
Frontend:
Static React/Vite deployment

Backend:
FastAPI web service

Database:
Render PostgreSQL where configured
```

Render free-tier considerations:

- Backend may sleep after inactivity
- First request after sleep can be slow
- YOLO inference may be slow on free-tier compute
- Local container media storage is temporary
- Persistent media storage should be improved for production usage

Deployment documentation is available in:

```text
docs/render-deployment-evidence.md
docs/render-first-deployment-runbook.md
docs/render-troubleshooting-notes.md
```

---

## CI/CD Architecture

The project uses GitHub Actions for pull request and main branch validation.

Current CI responsibilities include:

- Running backend tests
- Building backend Docker image
- Building the React frontend

Standard development flow:

```text
Create feature branch
 |
 v
Implement focused change
 |
 v
Run local checks
 |
 v
Open pull request
 |
 v
GitHub Actions validate PR
 |
 v
Merge to main
 |
 v
Verify post-merge main CI
```

This workflow keeps the project aligned with production-style engineering practices.

---

## Testing Strategy

Testing currently focuses on backend behavior, frontend build validation, and linting.

Common checks:

```bash
env -u DATABASE_URL PYTHONPATH=backend python -m pytest backend/tests -q
```

```bash
cd frontend
npm run build
npm run lint
```

```bash
git diff --check
```

Documentation-only changes still go through pull request CI to confirm that the repository remains healthy.

---

## Key Design Decisions

### Keep the model behind the backend

The frontend does not run YOLO directly. Model inference is handled by backend services, which keeps model loading, file paths, validation, and generated output handling centralized.

### Preserve User Mode and Developer Mode separately

The application supports a clean user experience without removing technical inspection tools. This makes the same project useful for demos, debugging, and portfolio review.

### Treat generated outputs as workflow assets

Generated outputs are not only temporary visual results. They can be tracked, reused, inspected, and included in workflow history.

### Keep database configuration optional

Local development should not break when PostgreSQL is unavailable. The backend therefore supports safe fallback behavior when `DATABASE_URL` is unset.

### Keep detailed API material outside the README

The main README is now a clean project landing page. Detailed API and feature reference material is preserved in `docs/api-and-feature-reference.md`.

---

## Current Limitations

Current limitations include:

- Persistent media storage needs a stronger production-ready storage solution
- Render free-tier infrastructure can be slow for model inference
- Video tracking is a practical baseline and can be improved
- Real LLM evaluation coverage can be expanded
- Architecture diagrams can be improved with visual assets
- Frontend state management may need further modularization as the app grows

---

## Related Documentation

- `README.md`
- `docs/api-and-feature-reference.md`
- `docs/product-walkthrough.md`
- `docs/project-vision-and-ai-roadmap.md`
- `docs/llm-command-parser-architecture.md`
- `docs/command-planner-design.md`
- `docs/workspace-recovery-flow.md`
- `docs/deployment-readiness-summary.md`
- `docs/render-deployment-evidence.md`
