# VisionCommand AI Render Troubleshooting Notes

## Purpose

This document collects troubleshooting notes for deploying VisionCommand AI on Render.

The goal is to make deployment issues easier to diagnose during the first public demo deployment.

---

## General Troubleshooting Flow

When deployment fails, check in this order:

1. Render service logs
2. GitHub Actions logs
3. Docker build logs
4. Backend health endpoint
5. Frontend browser console
6. Network tab for failed API calls
7. Database connection status
8. Media file persistence behavior
9. Model loading behavior

Do not change multiple things at once.

Fix one issue, redeploy, and test again.

---

## Issue 1: Docker Hub 500 Error During CI or Build

### Symptom

Docker build fails while pulling the base image.

Example error:

failed to fetch oauth token

or:

unexpected status from POST request to https://auth.docker.io/token: 500 Internal Server Error

or:

failed to resolve source metadata for docker.io/library/python:3.9-slim

### Likely Cause

This is usually an external Docker Hub authentication or registry availability issue.

It is not caused by documentation-only changes.

### What To Do

First action:

- Re-run failed jobs in GitHub Actions.

If it fails again with the same Docker Hub 500 error:

- Wait a few minutes.
- Re-run failed jobs again.
- Check whether Docker Hub is having temporary availability issues.

### What Not To Do

Do not change application code just because Docker Hub returned a temporary 500 error.

Do not merge a PR if required checks are still failing.

---

## Issue 2: Docker Build Fails Locally

### Symptom

Local Docker build fails with:

docker build -t vision-command-backend ./backend

### What To Check

Check:

- Docker Desktop is running
- Internet connection is working
- Docker can pull python:3.9-slim
- backend/Dockerfile syntax is valid
- backend/requirements.txt installs correctly
- Docker has enough disk space
- Docker has enough memory

### Useful Commands

docker ps

docker build --no-cache -t vision-command-backend-debug ./backend

docker system df

docker builder prune

Use prune commands carefully because they remove cached Docker data.

---

## Issue 3: Docker Container Fails To Start Locally

### Symptom

Docker image builds successfully, but container fails to start.

### What To Check

Check running containers:

docker ps

Check all containers:

docker ps -a

Check logs:

docker logs container_name

Remove broken test container:

docker rm -f vision-command-backend-port-test

### Backend Port Test

Expected successful runtime test:

- Container starts
- Uvicorn logs show the selected port
- Health endpoint returns HTTP 200

Example expected log:

Uvicorn running on http://0.0.0.0:8010

Expected health response:

HTTP/1.1 200 OK

{"status":"healthy"}

---

## Issue 4: Backend Health Check Fails on Render

### Symptom

Render deploys the backend, but health check fails.

### What To Check

Check:

- Health check path is /health
- Backend starts without crashing
- Backend uses the platform PORT variable
- Render logs show Uvicorn startup
- Required environment variables are configured
- Dockerfile builds successfully

### Expected Backend Startup

The backend should bind to:

0.0.0.0

The backend should use:

PORT

with default fallback:

8000

### Related Files

- backend/Dockerfile
- docs/backend-port-env-support.md

---

## Issue 5: Frontend Loads But API Calls Fail

### Symptom

Frontend opens in the browser, but upload, detection, dashboard, or command features fail.

### Likely Cause

Frontend cannot reach the backend API.

### What To Check

Open browser DevTools.

Check:

- Console errors
- Network tab
- Failed /api requests
- Response status codes
- Whether requests are going to the frontend URL or backend URL

### Render Static Site Rewrite

For the first Render deployment, frontend should use rewrite rules.

Expected API rewrite:

Source:

/api/*

Destination:

https://vision-command-backend.onrender.com/*

Action:

Rewrite

SPA fallback:

Source:

/*

Destination:

/index.html

Action:

Rewrite

Order matters.

The /api/* rewrite must come before the /* fallback.

---

## Issue 6: 404 on Frontend Routes

### Symptom

Refreshing a frontend route returns 404.

### Likely Cause

Single-page app fallback rewrite is missing.

### Fix

Add this rewrite rule to the Render Static Site:

Source:

/*

Destination:

/index.html

Action:

Rewrite

This allows React/Vite routes to work after browser refresh.

---

## Issue 7: Upload Fails

### Symptom

Image or video upload fails.

### What To Check

Check:

- Upload size
- Render request size limits
- Frontend network error
- Backend logs
- Whether /api/media/upload reaches backend
- Whether backend storage folder exists
- Whether STORAGE_ROOT is configured

### Current Storage Root

Recommended current container value:

STORAGE_ROOT=/app/storage

### Important Limitation

If no persistent disk or object storage is configured, uploaded files may disappear after restart or redeploy.

---

## Issue 8: Output File URL Returns 404

### Symptom

Detection, crop, blur, frame extraction, or tracking succeeds, but the returned output URL gives 404.

### What To Check

Check:

- Was the output file actually created?
- Is the output file under /app/storage/outputs?
- Is the frontend URL using /api/media/outputs or /media/outputs correctly?
- Did the backend restart after the file was created?
- Is storage ephemeral?

### Likely Cause

On a cloud platform, local container storage may be temporary.

If the backend restarts, output files may be gone.

### Long-Term Fix

Use object storage or a persistent disk strategy.

Related document:

docs/media-storage-plan.md

---

## Issue 9: Database Shows Not Configured

### Symptom

Database endpoints return:

status: not_configured

### Likely Cause

DATABASE_URL is missing in backend environment variables.

### What To Check

Check backend environment variables in Render.

Required:

DATABASE_URL

Use the Render PostgreSQL internal database URL if backend and database are in the same Render region.

Do not put DATABASE_URL in frontend variables.

---

## Issue 10: Database Connection Fails

### Symptom

Backend logs show PostgreSQL connection errors.

### What To Check

Check:

- DATABASE_URL is copied correctly
- Database is running
- Backend and database are in compatible regions
- Internal URL vs external URL
- SSL requirement
- Database user and password
- Connection limits

### First Fix

Use the provider-generated connection URL exactly as given.

Do not manually rewrite the connection string unless necessary.

---

## Issue 11: YOLO Model Loading Fails

### Symptom

Upload works, but detection fails when backend tries to load YOLO.

### What To Check

Check:

- MODEL_NAME value
- Whether the model file exists in the container
- Whether Ultralytics can download the model
- Whether the deployed environment has internet access
- Whether the model name is valid

### Current Value

MODEL_NAME=yolo26n.pt

### Possible Fixes

- Use a standard downloadable Ultralytics model
- Copy the model into the production image in a future branch
- Download the model during backend startup in a future branch
- Store model artifacts in object storage
- Add a model artifact strategy document

Do not commit large model files without deciding repository strategy.

---

## Issue 12: Video Processing Is Slow or Fails

### Symptom

Video trim, frame extraction, sampled detection, or tracking fails.

### Likely Cause

Video workflows need more CPU, memory, disk, and timeout allowance than image workflows.

### What To Do

For first deployment:

- Use small video files
- Test one video feature at a time
- Start with frame extraction
- Then test detection on one extracted frame
- Avoid large videos during first demo

Future improvements:

- Background jobs
- Queue system
- Object storage
- Job status tracking
- Worker service

---

## Issue 13: OpenAI Provider Fails

### Symptom

LLM command parsing fails when LLM_PROVIDER=openai.

### What To Check

Check:

- OPENAI_API_KEY is set in backend environment variables
- OPENAI_MODEL is set
- LLM_PROVIDER=openai
- API key is not in frontend variables
- Backend logs show provider status
- /llm/provider-status endpoint works

### First Deployment Recommendation

Keep:

LLM_PROVIDER=disabled

Enable OpenAI only after the base app works.

---

## Issue 14: Ollama Does Not Work on Render

### Symptom

LLM_PROVIDER=ollama fails in cloud deployment.

### Likely Cause

Ollama is better suited for local or self-hosted environments.

### Recommended Action

Do not use Ollama for the first Render deployment.

Use one of these modes instead:

- LLM_PROVIDER=disabled
- LLM_PROVIDER=openai

---

## Issue 15: Environment Variable Mistake

### Symptom

Backend or frontend behaves differently from local development.

### What To Check

Backend-only variables:

- DATABASE_URL
- STORAGE_ROOT
- MODEL_NAME
- LLM_PROVIDER
- OPENAI_API_KEY
- OPENAI_MODEL
- OLLAMA_BASE_URL
- OLLAMA_MODEL
- PYTHONUNBUFFERED
- PORT

Frontend variable:

- VITE_BACKEND_URL

Important rule:

Never put backend secrets in frontend variables.

---

## Issue 16: GitHub Actions Fails But Local Build Passes

### Symptom

Local Docker build passes, but GitHub Actions fails.

### What To Check

Check:

- GitHub Actions log
- Whether failure is external registry issue
- Whether requirements installation failed
- Whether Docker Hub pull failed
- Whether the workflow is using the correct build context

### First Action

If error is external Docker Hub 500:

- Re-run failed jobs.

If error is code or dependency related:

- Reproduce locally with docker build --no-cache
- Fix the root cause in a branch
- Push an update to the PR

---

## Issue 17: Render Deployment Works But App Breaks After Redeploy

### Symptom

App works after initial deploy, then uploaded files or outputs disappear after redeploy.

### Likely Cause

Ephemeral filesystem.

### Fix Options

- Add Render persistent disk
- Add object storage
- Add storage abstraction layer
- Avoid promising media persistence in the first demo

---

## First Demo Troubleshooting Checklist

For the first public Render demo, verify:

- [ ] Backend /health works
- [ ] Backend /model/info works
- [ ] Frontend opens
- [ ] Frontend /api rewrite works
- [ ] Image upload works
- [ ] Object detection works
- [ ] Annotated image output works
- [ ] Crop works
- [ ] Blur works
- [ ] Small video upload works
- [ ] Single frame extraction works
- [ ] Detection on extracted frame works
- [ ] PostgreSQL connection works
- [ ] Database-backed dashboard endpoint works
- [ ] Logs are visible
- [ ] Media persistence limitation is understood
- [ ] OpenAI is disabled for first deployment
- [ ] Known risks are documented

---

## Related Files

- backend/Dockerfile
- backend/.env.example
- frontend/vite.config.ts
- frontend/Dockerfile.prod
- frontend/nginx.conf
- docs/render-deployment-checklist.md
- docs/backend-port-env-support.md
- docs/cloud-deployment-targets.md
- docs/database-deployment-plan.md
- docs/media-storage-plan.md
