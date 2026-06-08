# VisionCommand AI Render Deployment Checklist

## Purpose

This document defines the first Render deployment checklist for VisionCommand AI.

The goal is to prepare a practical public demo deployment on Render without changing application code yet.

---

## Recommended First Render Architecture

Recommended first Render setup:

- Render PostgreSQL database
- Render backend Web Service using backend/Dockerfile
- Render frontend Static Site using frontend production build
- Static Site rewrite from /api/* to the public backend URL
- LLM_PROVIDER=disabled for the first deployment
- Local filesystem storage temporarily, with limitation documented

This keeps the first deployment simple and avoids changing frontend fetch calls immediately.

---

## Why This Approach

The frontend currently uses relative API paths such as:

- /api/media/upload
- /api/vision/detect
- /api/video/trim
- /api/db/stats
- /api/commands/parse
- /api/llmops/dashboard

In local development, Vite proxies /api to the backend.

In a Render Static Site deployment, the frontend can keep using /api if Render rewrite rules proxy /api/* to the backend public URL.

This avoids changing frontend code in the first deployment milestone.

---

## Important Limitation

The current backend stores uploaded and generated files in local storage folders.

Render services use ephemeral local filesystem storage unless a persistent disk is attached.

For the first demo, this is acceptable only if the limitation is understood:

- Uploaded files may disappear after redeploy or restart.
- Generated outputs may disappear after redeploy or restart.
- PostgreSQL rows may remain while actual files are gone.
- This is not suitable for real users yet.

A future milestone should add object storage or a persistent disk strategy.

---

## Render Resources to Create

Create these resources in Render:

1. PostgreSQL database
2. Backend Web Service
3. Frontend Static Site

Optional later:

- Persistent disk for backend storage
- Object storage integration
- OpenAI provider configuration
- Custom domain

---

## Step 1: Create Render PostgreSQL

Create a new Render PostgreSQL database.

Suggested name:

vision-command-db

Recommended region:

Use the same region for database and backend.

After creation, copy the internal database URL for backend service usage.

Set this value later as:

DATABASE_URL

Notes:

- Use the internal URL when the backend is also on Render in the same region.
- Do not commit the database URL to Git.
- Do not expose the database URL to the frontend.

---

## Step 2: Create Backend Web Service

Create a new Render Web Service from the GitHub repository.

Suggested service name:

vision-command-backend

Recommended root directory:

backend

Runtime/build type:

Docker

Dockerfile:

backend/Dockerfile

Health check path:

/health

Backend should expose:

8000

Current backend Docker command runs Uvicorn on:

0.0.0.0:8000

If Render fails to detect the port, use a follow-up code change to make the backend Docker command read the PORT environment variable.

---

## Step 3: Configure Backend Environment Variables

Minimum backend variables:

DATABASE_URL

Use the Render PostgreSQL internal URL.

STORAGE_ROOT

Recommended value for current container:

/app/storage

MODEL_NAME

Recommended value:

yolo26n.pt

LLM_PROVIDER

Recommended first value:

disabled

PYTHONUNBUFFERED

Recommended value:

1

Optional later:

OPENAI_API_KEY

Only set this after the base deployment works.

OPENAI_MODEL

Example value later:

gpt-4o-mini

OLLAMA_BASE_URL

Do not use for the first Render deployment.

OLLAMA_MODEL

Do not use for the first Render deployment.

---

## Step 4: Backend Media Storage Warning

For the first deployment, backend files will use:

/app/storage

Unless a persistent disk is attached, this storage is temporary.

For first demo testing, this is acceptable.

Do not present this as production-ready user storage.

Future options:

- Attach a Render persistent disk
- Add object storage
- Add storage_service.py abstraction
- Store only metadata in PostgreSQL and actual media in object storage

---

## Step 5: Check YOLO Model Loading

The backend uses:

MODEL_NAME=yolo26n.pt

Before public demo testing, confirm whether Ultralytics can load the model during runtime.

Test endpoints after deployment:

- GET /health
- GET /model/info
- POST /media/upload
- POST /vision/detect/{filename}

If model loading fails, possible fixes:

- Change MODEL_NAME to a standard downloadable Ultralytics model
- Copy the model into the backend image in a future branch
- Download the model during startup in a future branch
- Store the model in object storage and fetch it in a future branch

Do not commit large model files directly unless the repository strategy allows it.

---

## Step 6: Create Frontend Static Site

Create a new Render Static Site from the same GitHub repository.

Suggested service name:

vision-command-frontend

Root directory:

frontend

Build command:

npm ci && npm run build

Publish directory:

dist

Environment variables:

No backend secrets.

For this first Render Static Site approach, VITE_BACKEND_URL is not enough by itself because the current built frontend uses relative /api calls.

Use Render rewrites instead.

---

## Step 7: Configure Frontend Rewrites

After the backend Web Service has a public URL, configure frontend Static Site redirects/rewrites.

Example backend public URL:

https://vision-command-backend.onrender.com

Add rewrite rule for API calls:

Source:

/api/*

Destination:

https://vision-command-backend.onrender.com/*

Action:

Rewrite

Add SPA fallback rule:

Source:

/*

Destination:

/index.html

Action:

Rewrite

Order matters.

The /api/* rewrite should come before the /* SPA fallback rewrite.

---

## Step 8: First Deployment Test Flow

Test backend first:

- Open backend /health
- Open backend /model/info
- Open backend /db/stats
- Confirm database status
- Confirm logs are visible in Render dashboard

Then test frontend:

- Open frontend URL
- Upload image
- Run object detection
- Generate annotated image
- Test crop
- Test blur
- Upload small video
- Extract one frame
- Detect objects on extracted frame
- Check dashboard/analytics panels
- Check LLMOps dashboard in disabled mode

Use small files for first deployment.

---

## Step 9: Database Verification

After testing uploads and commands, verify database-backed endpoints:

- GET /db/stats
- GET /db/media-files
- GET /db/detections
- GET /db/detection-summary
- GET /db/inference-logs
- GET /db/inference-summary
- GET /db/command-logs
- GET /db/command-log-summary
- GET /db/parser-attempt-logs
- GET /db/parser-attempt-summary

Expected behavior:

- If DATABASE_URL is configured correctly, database status should be healthy.
- If DATABASE_URL is missing or wrong, database-backed endpoints may show not_configured or fail.
- Upload and detection workflows should not be blocked by optional database logging failures.

---

## Step 10: OpenAI Provider Later

Do not enable OpenAI in the first deployment attempt.

First deploy with:

LLM_PROVIDER=disabled

After the base app works, update backend environment variables:

LLM_PROVIDER=openai

OPENAI_API_KEY=your_backend_only_secret

OPENAI_MODEL=gpt-4o-mini

Then redeploy backend and test:

- /llm/provider-status
- /commands/parse
- /llmops/dashboard

Do not put OPENAI_API_KEY in frontend variables.

---

## Step 11: Known First Deployment Risks

### Risk 1: Backend port detection

Backend currently binds to 8000.

If Render has trouble detecting the port, update the Docker CMD in a future branch to use the PORT environment variable.

### Risk 2: Media files disappear

Without a persistent disk or object storage, files may disappear after restart or redeploy.

### Risk 3: Large video processing may fail

Small Render instances may not handle large video files well.

Use small demo files first.

### Risk 4: Static site API rewrite may need adjustment

If /api rewrite does not proxy uploads correctly, use a follow-up frontend configuration or backend CORS approach.

### Risk 5: YOLO model loading may fail

If the model file is not available in the deployed runtime, adjust MODEL_NAME or introduce a model artifact strategy.

---

## Minimum First Deployment Success Criteria

The first Render deployment is successful when:

- Backend /health works
- Frontend loads publicly
- Frontend can call backend through /api rewrite
- PostgreSQL connection works
- Image upload works
- Object detection works
- Annotated output is returned
- At least one database-backed dashboard endpoint works
- Logs are visible in Render
- Known limitations are documented

---

## Recommended Follow-up Branches

After first Render checklist:

1. docs/render-troubleshooting-notes
2. chore/backend-port-env-support
3. feature/media-storage-abstraction
4. feature/object-storage-provider
5. chore/render-blueprint-draft
6. chore/openai-production-config

---

## Related Files

- backend/Dockerfile
- frontend/package.json
- frontend/vite.config.ts
- frontend/Dockerfile.prod
- frontend/nginx.conf
- backend/.env.example
- frontend/.env.example
- docs/deployment-roadmap.md
- docs/environment-variables.md
- docs/database-deployment-plan.md
- docs/media-storage-plan.md
- docs/cloud-deployment-targets.md
