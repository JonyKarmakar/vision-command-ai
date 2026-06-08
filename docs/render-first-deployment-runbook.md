# VisionCommand AI Render First Deployment Runbook

## Purpose

This runbook provides the step-by-step process for the first Render deployment of VisionCommand AI.

The goal is to deploy a working public demo while keeping known risks visible.

This is not the final production deployment plan.

---

## Deployment Goal

The first deployment should prove that the full application can run publicly with:

- Backend FastAPI service
- Frontend Vite static site
- PostgreSQL database
- Image upload
- Object detection
- Annotated output
- Crop and blur features
- Basic command workflow
- Dashboard or database-backed endpoints where available

---

## Pre-Deployment Checklist

Before starting Render deployment, confirm:

- [ ] Main branch is up to date
- [ ] GitHub Actions are passing
- [ ] Backend Docker image builds locally
- [ ] Frontend production build passes locally
- [ ] render.yaml exists at repository root
- [ ] backend/Dockerfile supports the PORT environment variable
- [ ] backend/.dockerignore excludes model artifacts
- [ ] docs/render-deployment-checklist.md has been reviewed
- [ ] docs/render-troubleshooting-notes.md has been reviewed
- [ ] docs/model-artifact-strategy.md has been reviewed

---

## Recommended First Deployment Mode

For the first deployment, keep the system simple.

Recommended settings:

- Use Render PostgreSQL
- Use backend Docker web service
- Use frontend static site
- Use LLM_PROVIDER=disabled
- Do not enable OpenAI yet
- Do not enable Ollama in cloud deployment
- Accept temporary local container storage limitation for the first demo
- Test with small images first
- Test with small videos only after image flow works

---

## Known First Deployment Limitations

The first deployment may still have these limitations:

1. Media files may disappear after backend restart or redeploy.
2. Local model file backend/yolo26n.pt is not committed to Git.
3. The backend image does not copy local .pt model files.
4. Detection may fail if MODEL_NAME=yolo26n.pt is not available in the deployed runtime.
5. Video features may be slower or unstable on small cloud instances.
6. OpenAI command parsing should remain disabled until the base app works.

These are acceptable for the first deployment if documented clearly.

---

## Deployment Resources

The first deployment should create:

1. PostgreSQL database
2. Backend web service
3. Frontend static site

Suggested service names:

- vision-command-db
- vision-command-backend
- vision-command-frontend

---

## Environment Variables

### Backend Environment Variables

Required backend variables:

    DATABASE_URL=<from Render PostgreSQL>
    STORAGE_ROOT=/app/storage
    MODEL_NAME=yolo26n.pt
    LLM_PROVIDER=disabled
    PYTHONUNBUFFERED=1

The platform may provide:

    PORT

Do not manually override PORT unless the platform requires it.

### Frontend Environment Variables

If frontend API calls are handled through /api/* rewrite rules, the frontend may not need a public backend URL variable.

If direct backend calls are used, configure:

    VITE_BACKEND_URL=<backend public URL>

Do not put backend secrets in frontend environment variables.

---

## Deployment Option A: Render Blueprint

If using the Blueprint draft:

1. Confirm render.yaml exists at the repository root.
2. Confirm service names are correct.
3. Confirm the backend service name matches the frontend API rewrite destination.
4. Confirm database configuration.
5. Confirm no secrets are committed.
6. Start the Blueprint deployment.
7. Watch database, backend, and frontend logs.

Important:

The frontend rewrite currently uses a placeholder backend URL:

    https://vision-command-backend.onrender.com/*

If Render assigns a different backend URL, update render.yaml before syncing or redeploying the Blueprint.

---

## Deployment Option B: Manual Render Setup

If deploying manually:

1. Create PostgreSQL database.
2. Copy the internal database connection string.
3. Create backend Docker web service.
4. Set backend root directory to backend.
5. Set backend environment variables.
6. Set backend health check path to /health.
7. Deploy backend.
8. Confirm backend /health works.
9. Create frontend static site.
10. Set frontend root directory to frontend.
11. Set frontend build command to npm ci && npm run build.
12. Set frontend publish directory to dist.
13. Add frontend rewrite rules.
14. Deploy frontend.
15. Confirm frontend loads.

---

## Frontend Rewrite Rules

Recommended first deployment rewrite rules:

API rewrite:

    Source: /api/*
    Destination: https://vision-command-backend.onrender.com/*
    Action: Rewrite

SPA fallback:

    Source: /*
    Destination: /index.html
    Action: Rewrite

The /api/* rewrite must come before the /* fallback.

If the backend URL is different, replace the placeholder backend URL.

---

## Backend Smoke Tests

After backend deployment, test these endpoints:

    /health
    /model/info
    /db/status

Expected minimum result:

- /health returns healthy status
- /model/info returns model metadata
- /db/status confirms database status or clearly reports configuration status

If /health fails, inspect backend logs first.

---

## Frontend Smoke Tests

After frontend deployment:

1. Open the frontend public URL.
2. Refresh the page.
3. Confirm no 404 after refresh.
4. Open browser DevTools.
5. Check Console tab.
6. Check Network tab.
7. Confirm /api requests are routed to the backend.
8. Confirm no secret values appear in frontend output.

---

## Feature Smoke Test Order

Test features in this order:

1. Backend /health
2. Backend /model/info
3. Frontend page load
4. Frontend refresh behavior
5. Image upload
6. Object detection
7. Annotated output display
8. Crop by coordinates
9. Blur by coordinates
10. Crop by class
11. Blur by class
12. Command execution with rule-based parser
13. Command history or logs
14. Dashboard/database endpoints
15. Small video upload
16. Frame extraction
17. Video detection or tracking

Do not start video testing until the image workflow works.

---

## Model Artifact Check

During first detection test, watch backend logs.

If detection fails with a missing model error:

1. Confirm MODEL_NAME.
2. Confirm whether yolo26n.pt is available in the deployed runtime.
3. Consider switching to a standard downloadable Ultralytics model for the first demo.
4. Keep local .pt files out of Git.
5. Keep model artifact storage as a follow-up milestone.

Related document:

    docs/model-artifact-strategy.md

---

## Database Check

After backend deployment, confirm:

- DATABASE_URL is set
- Database connection works
- Tables initialize correctly if the app manages initialization
- Database-backed endpoints respond correctly
- Backend logs do not show connection failures

If database fails:

1. Check the database URL.
2. Check internal vs external connection string.
3. Check database region.
4. Check connection limits.
5. Check backend logs.

---

## Media Storage Check

Current first deployment storage:

    /app/storage

This is acceptable for demo testing, but it may not persist across restarts or redeploys unless persistent storage is configured.

Test:

1. Upload image.
2. Generate output.
3. Open output URL.
4. Restart or redeploy backend only if needed.
5. Check whether the file still exists.

Do not promise permanent media storage in the first demo.

Related document:

    docs/media-storage-plan.md

---

## LLM Provider Check

For first deployment, use:

    LLM_PROVIDER=disabled

This keeps the deployment simple.

After the base app works, OpenAI can be enabled in a separate milestone.

Do not use Ollama for the first hosted Render deployment.

---

## Failure Handling

If deployment fails:

1. Read backend logs.
2. Read frontend build logs.
3. Read GitHub Actions logs.
4. Check /health.
5. Check browser DevTools.
6. Check frontend rewrite rules.
7. Check database connection.
8. Check model artifact behavior.
9. Check media storage behavior.

Use:

    docs/render-troubleshooting-notes.md

Do not change multiple things at once.

---

## First Demo Success Criteria

The first public demo is successful if:

- [ ] Frontend public URL opens
- [ ] Frontend refresh works
- [ ] Backend /health works
- [ ] Backend /model/info works
- [ ] Image upload works
- [ ] Object detection works
- [ ] Annotated output appears
- [ ] Crop feature works
- [ ] Blur feature works
- [ ] At least one command workflow works
- [ ] Database connection works or status is clearly reported
- [ ] Known storage limitation is documented
- [ ] Known model artifact limitation is documented
- [ ] No secrets are exposed

---

## After First Successful Deployment

After the first successful deployment:

1. Save the frontend public URL.
2. Save the backend public URL.
3. Update deployment docs with final URLs if appropriate.
4. Take screenshots for README or portfolio.
5. Record a short demo video.
6. Open issues for storage, model artifacts, and OpenAI enablement.
7. Plan the next deployment-readiness branch.

---

## Recommended Follow-Up Milestones

Recommended next milestones:

1. Confirm deployed Render URLs in docs.
2. Add deployment screenshots.
3. Add persistent media storage strategy.
4. Add model artifact download or registry support.
5. Add OpenAI provider production configuration.
6. Add deployment health monitoring.
7. Add production environment variable checklist.
8. Add cloud cost notes.

---

## Related Files

- render.yaml
- backend/Dockerfile
- backend/.env.example
- backend/.dockerignore
- frontend/package.json
- docs/render-deployment-checklist.md
- docs/render-troubleshooting-notes.md
- docs/render-blueprint-draft.md
- docs/backend-port-env-support.md
- docs/model-artifact-strategy.md
- docs/dockerignore-model-artifacts.md
- docs/database-deployment-plan.md
- docs/media-storage-plan.md
