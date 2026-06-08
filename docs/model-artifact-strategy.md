# VisionCommand AI Model Artifact Strategy

## Purpose

This document explains the model artifact strategy for VisionCommand AI.

The goal is to make YOLO model handling clear before cloud deployment.

---

## Current Model Usage

The backend loads the YOLO model through:

MODEL_NAME

Current default value:

MODEL_NAME=yolo26n.pt

The backend uses this value when creating the Ultralytics YOLO model.

Relevant backend behavior:

- backend/app/config.py defines MODEL_NAME
- backend/app/main.py passes MODEL_NAME into YOLO
- backend/.env.example documents MODEL_NAME
- backend/Dockerfile sets MODEL_NAME=yolo26n.pt
- render.yaml sets MODEL_NAME=yolo26n.pt

---

## Current Local Model File

A local model file exists at:

backend/yolo26n.pt

This file is ignored by Git because .gitignore includes:

*.pt

This means the model file is available locally, but it is not committed to the repository.

---

## Current Docker Behavior

The backend Dockerfile currently copies only the backend application code:

COPY app ./app

It does not copy:

backend/yolo26n.pt

Therefore, the current backend Docker image does not include the local YOLO model file.

This is acceptable for local development only if the model is available outside the image or if Ultralytics can resolve the model name at runtime.

For cloud deployment, this must be handled deliberately.

---

## Current Risk

If the deployed backend cannot access yolo26n.pt, object detection can fail when the backend tries to run:

YOLO(MODEL_NAME)

This can happen even if:

- the backend starts successfully
- /health works
- /model/info works
- file upload works
- PostgreSQL works

The failure may only appear when running detection.

---

## Model Artifact Options

### Option 1: Use Ultralytics Downloadable Model

Use a standard Ultralytics model name that can be downloaded automatically at runtime.

Pros:

- No large model file in Git
- Simple deployment
- Works well for first public demo if internet access is available

Cons:

- Requires runtime internet access
- First detection may be slower
- Depends on external model availability
- The model name must be valid and downloadable

Best for:

- First demo
- Quick deployment
- Portfolio showcase

---

### Option 2: Copy Model File Into Docker Image

Copy the model file into the backend image during Docker build.

Example future direction:

- Keep model file in a controlled artifact location
- Copy it into the image
- Set MODEL_NAME to the copied path

Pros:

- Predictable runtime behavior
- No runtime model download needed
- Detection works even without internet after image build

Cons:

- Image becomes larger
- Build context becomes larger
- Model file management must be clear
- Large files should not be committed casually to Git

Best for:

- Stable demos
- Controlled deployment
- Small or medium model files

---

### Option 3: Mount Model File

Mount the model file into the backend container.

Pros:

- Model stays outside the image
- Useful for self-hosted or VM-based deployments
- Can update model without rebuilding image

Cons:

- Hosting-platform dependent
- More operational setup
- Not ideal for simple Render deployment unless persistent disk strategy is used

Best for:

- Self-hosted deployment
- Docker Compose deployment
- VM deployment

---

### Option 4: Download Model From Object Storage at Startup

Store the model file in object storage and download it when the backend starts.

Possible storage providers:

- Google Cloud Storage
- AWS S3
- Azure Blob Storage
- Cloudflare R2
- Supabase Storage

Pros:

- Model is not committed to Git
- Model can be versioned externally
- Good long-term architecture
- Works better for larger artifacts

Cons:

- Requires startup download logic
- Requires storage credentials
- Startup may be slower
- Needs caching and error handling

Best for:

- Production learning
- Larger model artifacts
- Cloud-native deployment

---

### Option 5: Use a Model Registry

Use a model registry or artifact management system.

Possible tools:

- MLflow Model Registry
- DVC
- Hugging Face Hub
- Cloud artifact storage
- Custom artifact registry

Pros:

- Strong MLOps learning value
- Supports model versioning
- Supports reproducibility
- Better for long-term project maturity

Cons:

- More setup complexity
- Not needed for first public demo
- Requires clear artifact governance

Best for:

- Future MLOps milestone
- Model version tracking
- Production-grade ML workflow

---

## Recommended First Deployment Strategy

For the first Render deployment, use the simplest reliable approach.

Recommended first approach:

1. Confirm whether yolo26n.pt is a valid model name in the deployed environment.
2. If it fails, switch MODEL_NAME to a standard downloadable Ultralytics model for the first demo.
3. Keep local yolo26n.pt ignored by Git.
4. Do not commit large model files yet.
5. Add a stronger artifact strategy later.

The first deployment goal is a working public demo, not perfect model artifact management.

---

## Recommended Long-Term Strategy

Recommended long-term approach:

1. Keep model artifacts out of Git.
2. Add a model artifact storage location.
3. Add a model download/cache step.
4. Add model version metadata.
5. Add clear environment variables for model source and model path.
6. Add tests for model availability.
7. Add documentation for updating model versions.

Possible future variables:

MODEL_NAME=yolo26n.pt

MODEL_SOURCE=local

MODEL_ARTIFACT_URL=

MODEL_CACHE_DIR=/app/models

MODEL_VERSION=v1

Future MODEL_SOURCE values:

- local
- downloadable
- object_storage
- registry

---

## Docker Context Consideration

The repository-level .gitignore excludes:

*.pt

Git ignore rules and Docker ignore rules are separate.

The backend Docker ignore file now excludes common model artifact patterns:

*.pt
*.onnx
*.engine
*.torchscript

This helps prevent local model artifacts from being sent into the Docker build context.

This reduces accidental Docker build context size and keeps model artifact handling explicit.

---

## Render Deployment Consideration

render.yaml currently sets:

MODEL_NAME=yolo26n.pt

The first deployment must verify that detection works on Render.

Test after deployment:

1. Open /health
2. Open /model/info
3. Upload image
4. Run object detection
5. Check backend logs if detection fails

If detection fails because the model is missing:

- Use a standard downloadable model
- Or add model copying/downloading strategy in a follow-up branch

---

## What This Branch Does Not Change

This branch does not change backend code.

This branch does not add model files.

This branch does not change Dockerfile behavior.

This branch only documents model artifact risks and future strategy.

---

## Recommended Follow-up Branches

Possible follow-up branches:

1. chore/dockerignore-model-artifacts
2. chore/model-name-validation
3. feature/model-artifact-download
4. docs/model-versioning-plan
5. feature/mlflow-model-registry

---

## Model Artifact Readiness Checklist

Before public deployment:

- [ ] Confirm selected MODEL_NAME
- [ ] Confirm whether model is downloadable or local-only
- [ ] Confirm deployed backend can access the model
- [ ] Confirm detection works after deployment
- [ ] Confirm model file is not accidentally committed
- [ ] Confirm Docker build context does not include unnecessary model files
- [ ] Confirm future model update strategy
- [ ] Confirm model version tracking plan
- [ ] Confirm model storage strategy for production

---

## Related Files

- backend/app/config.py
- backend/app/main.py
- backend/app/routers/model.py
- backend/Dockerfile
- backend/.env.example
- backend/.dockerignore
- .gitignore
- render.yaml
- docs/render-deployment-checklist.md
- docs/render-troubleshooting-notes.md
- docs/media-storage-plan.md
