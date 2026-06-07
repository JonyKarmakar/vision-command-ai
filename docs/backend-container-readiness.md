# Backend Container Readiness

## Purpose

This document explains the backend container-readiness improvements for VisionCommand AI.

The goal is to prepare the FastAPI backend for production-style container deployment without choosing a final cloud provider yet.

---

## Current Backend Runtime

The backend uses:

- Python
- FastAPI
- Uvicorn
- Ultralytics YOLO
- OpenCV
- Pillow
- imageio-ffmpeg
- PostgreSQL through DATABASE_URL
- Optional LLM providers through backend environment variables

The backend exposes port 8000.

---

## Runtime Storage

The backend stores runtime files in a storage root.

Default local value:

STORAGE_ROOT=storage

Production-style container value:

STORAGE_ROOT=/app/storage

Runtime folders:

- uploads
- outputs
- videos
- logs

The backend now creates these folders when the app starts.

The Dockerfile also creates these folders inside the container image so the runtime layout is explicit.

---

## Model Configuration

The backend uses MODEL_NAME to decide which YOLO model Ultralytics should load.

Default value:

MODEL_NAME=yolo26n.pt

Important notes:

- The local model file is not committed to Git.
- The backend image does not copy the model file directly.
- Production deployment must choose a clear model-loading strategy.

Possible model-loading strategies:

- Use Ultralytics model download behavior if acceptable
- Copy the model file into a production image
- Mount the model file in a self-hosted deployment
- Store the model in object storage and download it during startup
- Use a future model registry or artifact storage approach

For now, this branch keeps the model configurable and documents the deployment decision.

---

## Dockerfile Changes

The backend Dockerfile now defines:

- PYTHONUNBUFFERED=1
- STORAGE_ROOT=/app/storage
- MODEL_NAME=yolo26n.pt

It also creates:

- /app/storage/uploads
- /app/storage/outputs
- /app/storage/videos
- /app/storage/logs

This makes the container runtime layout clearer and safer.

---

## What This Branch Does Not Solve Yet

This branch does not fully deploy the backend.

Still required before production deployment:

- Decide final model-loading strategy
- Decide persistent media/output storage strategy
- Connect to managed PostgreSQL
- Configure production secrets
- Confirm cloud provider resource limits
- Confirm upload size and timeout behavior
- Confirm CORS/API routing from frontend
- Confirm object storage or persistent volume strategy

---

## Related Files

- backend/Dockerfile
- backend/app/config.py
- backend/.env.example
- docs/deployment-roadmap.md
- docs/environment-variables.md
