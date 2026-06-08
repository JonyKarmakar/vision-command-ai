# VisionCommand AI Production Environment Checklist

## Purpose

This document defines the production environment variable checklist for VisionCommand AI.

The goal is to avoid deployment mistakes, prevent secret leakage, and make cloud configuration easier to review before deployment.

---

## Environment Variable Groups

VisionCommand AI environment variables should be grouped into:

1. Backend runtime variables
2. Backend database variables
3. Backend storage variables
4. Backend model variables
5. Backend LLM provider variables
6. Frontend variables
7. Platform-provided variables
8. Local-only variables

---

## Backend Runtime Variables

These variables belong to the backend service only.

### PYTHONUNBUFFERED

Recommended value:

    PYTHONUNBUFFERED=1

Purpose:

- Makes Python logs easier to read in cloud deployment logs.
- Helps debugging because logs appear immediately.

Required for first deployment:

    yes

Secret:

    no

---

### PORT

Recommended value:

    Platform-provided

Local fallback:

    8000

Purpose:

- Defines the port the backend server binds to.
- Cloud platforms often provide this automatically.

Required for first deployment:

    yes, but usually platform-provided

Secret:

    no

Important:

Do not manually override PORT unless the deployment platform requires it.

---

## Backend Database Variables

These variables belong to the backend service only.

### DATABASE_URL

Recommended value:

    Provider-generated PostgreSQL connection string

Purpose:

- Allows the backend to connect to PostgreSQL.
- Used by database-backed features, logs, analytics, and metadata persistence.

Required for first deployment:

    yes

Secret:

    yes

Where to configure:

    Backend service environment variables

Where not to configure:

    Frontend environment variables

Important:

Never expose DATABASE_URL to the browser.

---

## Backend Storage Variables

These variables belong to the backend service only.

### STORAGE_ROOT

Recommended first deployment value:

    STORAGE_ROOT=/app/storage

Purpose:

- Defines where uploaded files, generated outputs, videos, logs, and local media artifacts are stored inside the backend container.

Required for first deployment:

    yes

Secret:

    no

Current limitation:

Without persistent disk or object storage, files may disappear after backend restart or redeploy.

Related document:

    docs/media-storage-plan.md

---

## Backend Model Variables

These variables belong to the backend service only.

### MODEL_NAME

Current value:

    MODEL_NAME=yolo26n.pt

Purpose:

- Defines the YOLO model name or path used by the backend detection pipeline.

Required for first deployment:

    yes

Secret:

    no

Current risk:

The local file backend/yolo26n.pt is ignored by Git and is not copied into the backend Docker image.

Detection may fail if the deployed runtime cannot access this model.

Related document:

    docs/model-artifact-strategy.md

---

### Future MODEL_SOURCE

Possible future values:

    local
    downloadable
    object_storage
    registry

Purpose:

- Defines where the model artifact should come from.

Required for first deployment:

    no

Secret:

    no

Status:

    future improvement

---

### Future MODEL_ARTIFACT_URL

Purpose:

- Defines a remote model artifact location.

Required for first deployment:

    no

Secret:

    maybe

Status:

    future improvement

Important:

If the URL is private or signed, treat it as a secret.

---

### Future MODEL_CACHE_DIR

Possible future value:

    MODEL_CACHE_DIR=/app/models

Purpose:

- Defines where downloaded model artifacts should be cached.

Required for first deployment:

    no

Secret:

    no

Status:

    future improvement

---

### Future MODEL_VERSION

Possible future value:

    MODEL_VERSION=v1

Purpose:

- Tracks the deployed model version.

Required for first deployment:

    no

Secret:

    no

Status:

    future improvement

---

## Backend LLM Provider Variables

These variables belong to the backend service only.

### LLM_PROVIDER

Recommended first deployment value:

    LLM_PROVIDER=disabled

Possible values:

    disabled
    openai
    ollama

Purpose:

- Controls whether command parsing uses a rule-based/local mode or an external LLM provider.

Required for first deployment:

    yes

Secret:

    no

Recommendation:

Keep disabled for the first deployment.

Enable OpenAI only after the base app works.

Do not use Ollama for the first hosted Render deployment.

---

### OPENAI_API_KEY

Purpose:

- Enables OpenAI-backed command parsing when LLM_PROVIDER=openai.

Required for first deployment:

    no

Secret:

    yes

Where to configure:

    Backend service environment variables

Where not to configure:

    Frontend environment variables
    Git repository
    render.yaml with real secret value

Important:

Never commit this value.

---

### OPENAI_MODEL

Possible value:

    OPENAI_MODEL=gpt-4o-mini

Purpose:

- Defines the OpenAI model used for command parsing.

Required for first deployment:

    no

Secret:

    no

Where to configure:

    Backend service environment variables

---

### OLLAMA_BASE_URL

Purpose:

- Defines the Ollama server URL for local/self-hosted LLM usage.

Required for first deployment:

    no

Secret:

    no

Recommendation:

Do not configure this for first hosted Render deployment.

---

### OLLAMA_MODEL

Purpose:

- Defines the Ollama model name for local/self-hosted LLM usage.

Required for first deployment:

    no

Secret:

    no

Recommendation:

Do not configure this for first hosted Render deployment.

---

## Frontend Variables

Frontend variables are exposed to the browser.

Do not put backend secrets in frontend variables.

---

### VITE_BACKEND_URL

Purpose:

- Defines backend API URL if the frontend directly calls the backend.

Required for first deployment:

    maybe

If using /api/* rewrite rules:

    not required

If direct backend calls are used:

    required

Secret:

    no

Important:

Only public values should be used in Vite frontend environment variables.

---

## Platform-Provided Variables

Some deployment platforms provide runtime variables automatically.

Examples:

- PORT
- service hostnames
- internal database URLs
- deployment metadata

Do not duplicate platform-provided values unless required.

---

## Local-Only Variables

Local development can use:

    backend/.env
    frontend/.env.local

These files should not be committed.

The repository should only contain safe examples such as:

    backend/.env.example

---

## Variables That Must Never Be Committed

Do not commit real values for:

- DATABASE_URL
- OPENAI_API_KEY
- private model artifact URLs
- cloud storage secret keys
- database passwords
- access tokens
- signed URLs
- production service credentials

---

## First Deployment Recommended Values

For the first Render deployment, use:

    DATABASE_URL=<from PostgreSQL provider>
    STORAGE_ROOT=/app/storage
    MODEL_NAME=yolo26n.pt
    LLM_PROVIDER=disabled
    PYTHONUNBUFFERED=1

The platform should provide:

    PORT

Frontend may not need a backend URL if /api/* rewrite is configured.

---

## First Deployment Validation Checklist

Before deployment:

- [ ] DATABASE_URL is set only on the backend
- [ ] OPENAI_API_KEY is not configured unless OpenAI is being tested
- [ ] LLM_PROVIDER is set to disabled
- [ ] STORAGE_ROOT is set to /app/storage
- [ ] MODEL_NAME is set and understood
- [ ] PORT is not manually overridden unless required
- [ ] No secret values are committed to Git
- [ ] No backend secrets are placed in frontend variables
- [ ] render.yaml does not contain real secret values
- [ ] backend/.env is not committed
- [ ] frontend/.env.local is not committed

---

## Post-Deployment Validation Checklist

After deployment:

- [ ] Backend /health works
- [ ] Backend /model/info works
- [ ] Database status endpoint works or reports status clearly
- [ ] Frontend loads
- [ ] Frontend refresh works
- [ ] /api rewrite works
- [ ] Image upload works
- [ ] Object detection works
- [ ] Backend logs do not expose secrets
- [ ] Browser console does not expose secrets
- [ ] Network tab does not expose backend secrets

---

## Recommended Follow-Up Improvements

Future improvements:

1. Add environment variable validation at backend startup.
2. Add missing-variable warnings for optional features.
3. Add a safe /config/status endpoint that exposes only non-secret configuration status.
4. Add object storage variables after storage strategy is implemented.
5. Add model artifact variables after artifact download support is implemented.
6. Add production secrets checklist for each cloud provider.

---

## Related Files

- backend/.env.example
- backend/app/config.py
- backend/Dockerfile
- render.yaml
- docs/render-first-deployment-runbook.md
- docs/render-deployment-checklist.md
- docs/render-troubleshooting-notes.md
- docs/model-artifact-strategy.md
- docs/media-storage-plan.md
