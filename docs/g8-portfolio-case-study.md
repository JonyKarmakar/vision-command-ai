# G.8 Portfolio Case Study

This document presents VisionCommand AI as a professional project case study.

It summarizes the product idea, architecture, implemented workflows, engineering decisions, limitations, and future direction.

## Case study summary

VisionCommand AI is a full-stack applied AI media assistant for image and video analysis, editing, command execution, and analysis-memory retrieval.

The project demonstrates how computer vision, backend APIs, frontend product design, command intelligence, persistence, local deployment, and documentation can be combined into one end-to-end AI engineering project.

Current reliable demo path:

```text
Local Docker Compose
```

Historical deployment evidence:

```text
Previous Render deployment during the v0.4.0 milestone
```

Current deployment boundary:

```text
The project should not be described as currently cloud-hosted unless the cloud deployment is manually verified again.
```

## Problem and motivation

Many computer vision projects stay limited to a model notebook or a single prediction script.

VisionCommand AI explores a broader product-style question:

```text
What would it look like if a user could upload media, ask for analysis or editing through normal commands, review generated outputs, and then ask grounded questions about previous results?
```

The project was built to demonstrate practical AI engineering beyond isolated model inference.

It focuses on:

- usable frontend workflows
- backend media processing
- image and video object detection
- command-driven interactions
- generated output history
- analysis memory over previous outputs
- Docker-based local demo readiness
- clear documentation and known limitations

## Product concept

VisionCommand AI provides a user-facing media workspace.

Users can:

- upload images
- upload short videos
- run object detection
- view annotated outputs
- crop or blur detected objects
- run command-driven workflows
- inspect generated output history
- ask structured image and video questions
- ask analysis-memory questions about previous generated outputs

The application has two product modes:

- User Mode for a cleaner product experience
- Developer Mode for observability, logs, planning metadata, and implementation details

## System architecture

The project uses a full-stack architecture.

```text
React and TypeScript frontend
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

More detailed diagrams are documented in:

```text
docs/g5-architecture-and-deployment-diagrams.md
```

## Key implemented workflows

### Image workflows

Implemented image capabilities include:

- image upload and preview
- object detection with YOLO
- annotated detection output
- confidence and class filtering
- object inventory
- spatial summary
- object crop gallery
- crop detected object by class
- blur detected object by class
- generated output history

These workflows show a practical computer vision feature path from upload to result review.

### Video workflows

Implemented video capabilities include:

- video upload and preview
- video metadata review
- trimming
- frame extraction
- sampled frame detection
- frame-level detection results
- keyframe gallery
- object presence and timeline-style review
- privacy-focused video review
- video command history

These workflows focus on uploaded-video analysis and review.

The project should not be described as live camera processing or real-time video streaming.

### Command workflows

Implemented command capabilities include:

- natural-language command input
- parser and planner flow
- supported command skill metadata
- plan preview
- prepared execution
- manual confirmation gate
- execution readiness labels
- safety hints
- audit summary

This shows how an AI-style assistant workflow can be structured around safer command preparation rather than immediate uncontrolled execution.

### LLM-aware assistant workflows

The project includes LLM-aware assistant architecture and local AI support.

Implemented assistant-related capabilities include:

- local AI provider status
- structured image chat
- structured video chat
- command parsing paths
- mock and provider-aware behavior
- guardrails and grounding notes

The project does not claim unrestricted autonomous reasoning.

It keeps assistant behavior tied to available media context, generated outputs, or explicitly supported workflow metadata.

### Analysis memory and RAG-style grounding

Milestone F added analysis-memory retrieval over generated outputs.

Implemented capabilities include:

- generated output history as retrievable context
- backend retrieval service
- analysis-memory chat endpoint
- frontend Analysis Memory Chat panel
- source-card based responses
- grounding and safety evaluation cases
- RAG demo guide

This is RAG-style because answers are grounded in retrieved project-generated output context.

Current boundary:

- no external web search
- no external vector database
- no claim of deep semantic vector retrieval
- no claim that memory chat directly re-analyzes raw media
- no unsupported identity, emotion, or location claims

## Production-readiness work

Milestone G focused on making the project easier to run, understand, validate, and present honestly.

Completed production-readiness work includes:

- production and deployment context audit
- local Docker demo hardening
- environment and secrets cleanup
- README rewrite
- architecture and deployment diagrams
- demo walkthrough package
- final smoke checklist

This work improved project trustworthiness without pretending the application is an active production service.

## Deployment approach

Current primary demo path:

```text
Local Docker Compose
```

This path runs:

- PostgreSQL
- FastAPI backend
- React/Vite frontend

Historical deployment evidence:

```text
Render frontend, backend, and PostgreSQL deployment during the v0.4.0 milestone
```

Current safe deployment claim:

```text
VisionCommand AI previously had a controlled Render deployment, and the current reliable demo path is local Docker.
```

Current unsafe deployment claim:

```text
VisionCommand AI is currently guaranteed to be live as a cloud-hosted product.
```

## Engineering decisions

### Keep local Docker as the primary current demo path

The project previously had Render deployment evidence, but the current budget-aware and reliable path is local Docker.

This avoids claiming active cloud availability when cloud resources may expire or require paid services.

### Keep backend secrets backend-only

The project separates backend-only secrets from frontend public variables.

Relevant docs:

```text
docs/environment-variables.md
docs/g3-environment-and-secrets-cleanup.md
```

### Store model artifacts outside Git

YOLO model artifacts are not committed to the repository.

The local Docker setup expects model files under local storage or downloads them when appropriate.

### Use generated outputs as analysis memory

Instead of claiming broad autonomous memory, the project grounds analysis-memory answers in saved/generated output records.

This keeps the RAG-style layer understandable and bounded.

### Keep limitations visible

The README and Milestone G docs explicitly document current boundaries.

This makes the project easier to trust during review.

## Validation and quality practices

The project uses:

- small pull requests
- GitHub Actions CI
- backend tests
- frontend build checks
- frontend lint checks
- Docker image build checks
- `git diff --check`
- smoke check documentation
- milestone summaries
- explicit limitation reviews

The final smoke checklist is documented in:

```text
docs/g7-final-smoke-checklist.md
```

## What the project demonstrates

VisionCommand AI demonstrates:

- full-stack AI application development
- practical computer vision workflows
- image and uploaded-video processing
- command-driven AI workflow design
- backend API development with FastAPI
- frontend product implementation with React and TypeScript
- PostgreSQL-backed persistence
- generated output history and lineage thinking
- RAG-style retrieval over generated analysis context
- LLM-aware architecture and local AI integration
- Docker-based local deployment
- CI-backed engineering workflow
- public documentation discipline
- honest production-readiness boundaries

## Current limitations

Current limitations include:

- local Docker is the primary demo path
- current cloud deployment is historical unless manually verified again
- uploaded-video workflows process files, not live camera streams
- object tracking should not be described as full persistent multi-object tracking in every scenario
- identity recognition is not supported
- emotion recognition is not supported
- capture-location inference is not guaranteed
- production media storage is not implemented
- enterprise-grade monitoring and security hardening are not complete
- v1 readiness is not decided before G.9

## Future work

Possible future improvements include:

- temporary or paid cloud redeployment if needed
- managed PostgreSQL for persistent cloud storage
- object storage for media and generated outputs
- stronger production logging and monitoring
- automated smoke test runner
- embeddings and vector database integration
- hybrid retrieval for analysis memory
- richer RAG evaluation metrics
- additional vision models
- stronger video tracking with persistent object IDs
- real-time camera or stream support as a separate future milestone
- MLflow or experiment tracking
- cloud deployment documentation with current validation evidence

## Recommended project description

```text
VisionCommand AI is a full-stack applied AI media assistant that lets users upload images or videos, run computer vision workflows, execute command-driven editing actions, and ask grounded questions about previous generated outputs. It combines a React and TypeScript frontend, FastAPI backend, YOLO/OpenCV/PyTorch media processing, PostgreSQL persistence, Docker-based local deployment, and LLM-aware assistant workflows. The current reliable demo path is local Docker, while an earlier Render deployment is documented as historical cloud deployment evidence.
```

## Related documentation

```text
README.md
docs/README.md
docs/product-walkthrough.md
docs/g5-architecture-and-deployment-diagrams.md
docs/g6-demo-walkthrough-package.md
docs/g7-final-smoke-checklist.md
docs/f-milestone-summary.md
docs/visioncommand-ai-career-skill-roadmap.md
```

## Boundary

G.8 does not add product features.

G.8 does not create a cloud deployment.

G.8 does not claim active production hosting.

G.8 does not claim live camera or real-time stream processing.

G.8 does not claim identity recognition.

G.8 does not claim v1 readiness.

G.8 only adds a professional public project case study for the current implemented system.
