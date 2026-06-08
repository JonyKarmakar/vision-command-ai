# VisionCommand AI Deployment Smoke Test Checklist

## Purpose

This document defines the smoke test checklist for VisionCommand AI after deployment.

The goal is to verify that the deployed app works end-to-end before sharing the public demo link.

---

## When To Use This Checklist

Use this checklist after:

- First Render deployment
- Backend redeployment
- Frontend redeployment
- render.yaml changes
- Environment variable changes
- Database configuration changes
- Model configuration changes
- Storage configuration changes

---

## Required URLs

Before testing, collect these URLs:

Frontend public URL:

    <frontend public URL>

Backend public URL:

    <backend public URL>

Backend health URL:

    <backend public URL>/health

Backend model info URL:

    <backend public URL>/model/info

---

## Test Environment

Record the deployment environment:

Deployment platform:

    Render

Backend service:

    vision-command-backend

Frontend service:

    vision-command-frontend

Database:

    vision-command-db

LLM provider:

    disabled

Storage mode:

    local container storage

Model name:

    yolo26n.pt

---

## Smoke Test Rule

Test one layer at a time.

Recommended order:

1. Backend health
2. Backend model information
3. Database status
4. Frontend page load
5. Frontend routing
6. Frontend API rewrite
7. Image upload
8. Object detection
9. Output rendering
10. Crop and blur
11. Command workflow
12. Optional video workflow

Do not start debugging multiple layers at once.

---

## Backend Smoke Tests

### Test 1: Backend Health

Open:

    <backend public URL>/health

Expected result:

- Backend responds successfully
- Status indicates healthy
- No server error appears

Pass:

    yes / no

Notes:

    <notes>

---

### Test 2: Backend Model Info

Open:

    <backend public URL>/model/info

Expected result:

- Backend responds successfully
- Model metadata is returned
- Model name is visible
- App version is visible if available

Pass:

    yes / no

Notes:

    <notes>

---

### Test 3: Backend Database Status

Open database status endpoint if available.

Example:

    <backend public URL>/db/status

Expected result:

- Database status is returned
- If database is configured, connection is healthy
- If database is not configured, the response clearly reports that status

Pass:

    yes / no / not available

Notes:

    <notes>

---

### Test 4: Backend Logs

Open backend deployment logs.

Expected result:

- Backend starts successfully
- Uvicorn starts without crashing
- No repeated database connection errors
- No missing environment variable errors
- No secret values are printed

Pass:

    yes / no

Notes:

    <notes>

---

## Frontend Smoke Tests

### Test 5: Frontend Loads

Open:

    <frontend public URL>

Expected result:

- Frontend loads successfully
- Main UI appears
- No blank white screen
- No build asset 404 errors

Pass:

    yes / no

Notes:

    <notes>

---

### Test 6: Frontend Refresh Works

Refresh the frontend page.

Expected result:

- Page reloads successfully
- No 404 after refresh
- SPA fallback works

Pass:

    yes / no

Notes:

    <notes>

---

### Test 7: Browser Console

Open browser DevTools and inspect the Console tab.

Expected result:

- No critical JavaScript errors
- No failed environment variable errors
- No secret values are visible

Pass:

    yes / no

Notes:

    <notes>

---

### Test 8: Frontend API Rewrite

Open browser DevTools and inspect the Network tab.

Trigger a backend request from the frontend.

Expected result:

- Frontend sends API request through the correct route
- API request reaches the backend
- No CORS issue appears
- No 404 from incorrect rewrite order

Pass:

    yes / no

Notes:

    <notes>

---

## Image Workflow Smoke Tests

### Test 9: Image Upload

Upload a small test image.

Recommended first test:

- small JPG
- less than 2 MB
- contains a common object such as person, car, bottle, or chair

Expected result:

- Upload succeeds
- Preview appears
- Backend stores or processes the uploaded file
- No upload size or network error appears

Pass:

    yes / no

Notes:

    <notes>

---

### Test 10: Object Detection

Run object detection on the uploaded image.

Expected result:

- Detection request succeeds
- Detected objects appear in the UI
- Confidence scores appear if available
- Backend logs do not show model loading failure

Pass:

    yes / no

Notes:

    <notes>

---

### Test 11: Annotated Output

Generate or open the annotated output image.

Expected result:

- Annotated image appears
- Output URL works
- Bounding boxes are visible
- No output file 404 appears immediately after generation

Pass:

    yes / no

Notes:

    <notes>

---

### Test 12: Crop By Coordinates

Run crop by coordinates.

Expected result:

- Crop request succeeds
- Cropped output appears
- Output URL works

Pass:

    yes / no

Notes:

    <notes>

---

### Test 13: Blur By Coordinates

Run blur by coordinates.

Expected result:

- Blur request succeeds
- Blurred output appears
- Output URL works

Pass:

    yes / no

Notes:

    <notes>

---

### Test 14: Crop By Class

Run crop by class, for example person or bottle.

Expected result:

- Class-based crop request succeeds
- Best matching object is cropped
- Output URL works

Pass:

    yes / no

Notes:

    <notes>

---

### Test 15: Blur By Class

Run blur by class, for example person or bottle.

Expected result:

- Class-based blur request succeeds
- Matching object is blurred
- Output URL works

Pass:

    yes / no

Notes:

    <notes>

---

## Command Workflow Smoke Tests

### Test 16: Rule-Based Command

Run a simple command.

Example commands:

    detect objects
    crop person
    blur person

Expected result:

- Command is parsed
- Correct action runs
- Result appears in the UI
- Command history or logs update if available

Pass:

    yes / no

Notes:

    <notes>

---

### Test 17: LLM Provider Status

Check provider status if the endpoint or UI panel is available.

Expected first deployment result:

- LLM provider is disabled
- App still works with rule-based commands
- No OpenAI key is required for first deployment

Pass:

    yes / no / not available

Notes:

    <notes>

---

## Database-Backed Feature Smoke Tests

### Test 18: Command Logs

Check command logs or command history if available.

Expected result:

- Recent command appears
- Timestamp appears if available
- No database error appears

Pass:

    yes / no / not available

Notes:

    <notes>

---

### Test 19: Dashboard Or Analytics

Open dashboard or analytics panel if available.

Expected result:

- Dashboard loads
- Database-backed metrics appear
- Empty states are handled clearly
- No backend 500 error appears

Pass:

    yes / no / not available

Notes:

    <notes>

---

## Optional Video Smoke Tests

Only run these after the image workflow passes.

### Test 20: Small Video Upload

Upload a very small video file.

Recommended first test:

- short duration
- small file size
- common format such as MP4

Expected result:

- Upload succeeds
- Backend accepts the file
- No timeout occurs

Pass:

    yes / no / skipped

Notes:

    <notes>

---

### Test 21: Frame Extraction

Run frame extraction if available.

Expected result:

- Frame extraction succeeds
- Extracted frame appears
- Output URL works

Pass:

    yes / no / skipped

Notes:

    <notes>

---

### Test 22: Video Detection Or Tracking

Run video detection or tracking only if the platform has enough resources.

Expected result:

- Request completes
- Result appears
- Backend does not crash
- Timeout is acceptable for demo scope

Pass:

    yes / no / skipped

Notes:

    <notes>

---

## Model Artifact Smoke Test

During the first detection test, inspect backend logs.

Possible failure signs:

- model file not found
- yolo26n.pt missing
- failed to load model
- failed to download model
- permission error

If model loading fails:

1. Confirm MODEL_NAME.
2. Confirm whether the model exists in the deployed runtime.
3. Consider switching to a standard downloadable Ultralytics model.
4. Keep local model files out of Git.
5. Record the issue as a follow-up branch.

Pass:

    yes / no

Notes:

    <notes>

---

## Media Storage Smoke Test

After generating an output file:

1. Open the output URL.
2. Refresh the output URL.
3. Refresh the frontend.
4. Confirm output still appears.
5. Redeploy only if needed to test persistence behavior.

Expected first deployment result:

- Output appears immediately after generation
- Long-term persistence is not guaranteed yet

Pass:

    yes / no

Notes:

    <notes>

---

## Secret Exposure Check

Check:

- Backend logs
- Frontend browser console
- Frontend Network tab
- Render dashboard visible variables
- GitHub repository files

Expected result:

- DATABASE_URL is not exposed in frontend
- OPENAI_API_KEY is not exposed
- No production secret is committed
- No secret appears in browser output

Pass:

    yes / no

Notes:

    <notes>

---

## Final Deployment Decision

Mark the deployment status:

- [ ] Ready to share as public demo
- [ ] Ready for internal testing only
- [ ] Needs backend fix
- [ ] Needs frontend fix
- [ ] Needs database fix
- [ ] Needs model artifact fix
- [ ] Needs storage fix
- [ ] Needs environment variable fix

Decision notes:

    <notes>

---

## Minimum Public Demo Criteria

The app can be shared publicly if:

- [ ] Frontend URL opens
- [ ] Frontend refresh works
- [ ] Backend health works
- [ ] Image upload works
- [ ] Object detection works
- [ ] Annotated output works
- [ ] At least one crop or blur feature works
- [ ] At least one command workflow works
- [ ] No secrets are exposed
- [ ] Known limitations are documented

---

## Related Files

- docs/render-first-deployment-runbook.md
- docs/render-deployment-checklist.md
- docs/render-troubleshooting-notes.md
- docs/production-env-checklist.md
- docs/model-artifact-strategy.md
- docs/media-storage-plan.md
- render.yaml
- backend/Dockerfile
- frontend/package.json
