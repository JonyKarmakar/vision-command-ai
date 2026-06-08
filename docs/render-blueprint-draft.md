# Render Blueprint Draft

## Purpose

This document explains the first Render Blueprint draft for VisionCommand AI.

The goal is to prepare Render infrastructure-as-code using render.yaml without deploying the project yet.

---

## Files Added

This branch adds:

- render.yaml
- docs/render-blueprint-draft.md

---

## What render.yaml Defines

The draft Blueprint defines three Render resources:

1. Backend Web Service
2. Frontend Static Site
3. PostgreSQL Database

---

## Backend Service

Service name:

vision-command-backend

Runtime:

docker

Root directory:

backend

Health check path:

/health

The backend uses the existing backend/Dockerfile.

The Dockerfile already supports the PORT environment variable and falls back to port 8000 locally.

---

## Backend Environment Variables

The backend receives:

DATABASE_URL

This is linked from the Render PostgreSQL database using fromDatabase.

STORAGE_ROOT

Value:

/app/storage

MODEL_NAME

Value:

yolo26n.pt

LLM_PROVIDER

Value:

disabled

PYTHONUNBUFFERED

Value:

1

---

## Frontend Static Site

Service name:

vision-command-frontend

Runtime:

static

Root directory:

frontend

Build command:

npm ci && npm run build

Static publish path:

dist

Because the frontend service uses rootDir: frontend, the build command and publish path are relative to the frontend directory.

---

## Frontend Routes

The frontend static site includes two rewrite rules.

API rewrite:

/api/*

rewrites to:

https://vision-command-backend.onrender.com/*

SPA fallback:

/*

rewrites to:

/index.html

The /api/* rewrite must come before the /* fallback.

---

## PostgreSQL Database

Database name:

vision-command-db

Database name inside PostgreSQL:

vision_command

User:

vision_user

Plan:

free

The backend reads the connection string through DATABASE_URL.

---

## Important Draft Limitation

The backend URL inside the frontend route is currently a placeholder:

https://vision-command-backend.onrender.com

If Render assigns a different backend URL, update render.yaml before syncing the Blueprint.

---

## Secrets

This draft does not include OpenAI secrets.

The first deployment should use:

LLM_PROVIDER=disabled

If OpenAI is enabled later, add the following variables through the Render Dashboard or as sync false placeholders:

OPENAI_API_KEY

OPENAI_MODEL

Do not commit secret values to render.yaml.

---

## Media Storage Limitation

This draft does not solve persistent media storage.

Current storage uses:

/app/storage

Without a Render persistent disk or object storage, uploaded and generated files may disappear after redeploy or restart.

This is acceptable only for the first demo.

---

## Validation

Before using this Blueprint in Render:

- Confirm service names
- Confirm backend public URL
- Confirm database plan
- Confirm region if needed
- Confirm rewrite rules
- Confirm Render accepts the Blueprint syntax
- Confirm no secrets are committed

---

## Related Files

- render.yaml
- backend/Dockerfile
- frontend/package.json
- docs/render-deployment-checklist.md
- docs/render-troubleshooting-notes.md
- docs/backend-port-env-support.md
- docs/cloud-deployment-targets.md
