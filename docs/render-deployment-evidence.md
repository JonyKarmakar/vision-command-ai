# VisionCommand AI Render Deployment Evidence

## Purpose

This document records the first successful Render deployment evidence for VisionCommand AI.

The goal is to document what was deployed, what was tested, what passed, and what limitations remain.

---

## Deployment Date

June 9, 2026

---

## Public Deployment URLs

Frontend:

https://vision-command-frontend.onrender.com

Backend:

https://vision-command-backend.onrender.com

---

## Render Resources

The first manual Render deployment includes:

- PostgreSQL database
- FastAPI backend web service
- React/Vite frontend static site

Resource names:

- vision-command-db
- vision-command-backend
- vision-command-frontend

---

## Backend Smoke Tests

The backend health endpoint passed.

Endpoint:

/health

Result:

status healthy

The backend model information endpoint passed.

Endpoint:

/model/info

Confirmed values:

- model name: yolo26n.pt
- task: object_detection
- framework: Ultralytics YOLO
- backend: FastAPI
- version: 0.3.0

---

## Frontend Smoke Tests

The frontend static site opened successfully.

The UI loaded correctly in the browser.

The frontend loaded successfully in a fresh incognito browser session.

No critical browser console errors were observed during the initial smoke test.

---

## Frontend to Backend Connectivity

The first frontend API calls initially failed with 404 because the frontend static site was calling /api routes without a rewrite rule.

The issue was fixed by adding Render static site rewrite rules.

Rewrite rules used:

- /api/* rewrites to https://vision-command-backend.onrender.com/*
- /* rewrites to /index.html

After adding the rewrite rules, frontend API calls returned 200.

Confirmed API calls:

- /api/model/info
- /api/db/stats
- /api/model/classes

---

## Database Connectivity

The backend successfully connected to Render PostgreSQL through DATABASE_URL.

Database-backed frontend buttons returned 200.

Confirmed database views:

- Database stats
- Detection history
- Detection summary
- Inference logs
- Inference summary

Observed stored data after smoke testing:

- 9 total stored detections
- 2 inference runs
- Detected classes included person and cup

---

## Image Workflow Smoke Test

The image workflow passed.

Tested flow:

1. Uploaded an image
2. Previewed the original image
3. Ran YOLO detection
4. Displayed annotated output
5. Generated detection results
6. Served output image back to frontend

Detection result:

- 6 visible detections in the first detection run
- Annotated output image loaded successfully

---

## Crop and Blur Smoke Test

The crop workflow passed.

Tested action:

- Crop by class person

Result:

- Crop request returned 200
- Cropped output image loaded successfully

The blur workflow passed.

Tested action:

- Blur by class person

Result:

- Blur request returned 200
- Blurred output image loaded successfully

---

## Command Workflow Smoke Test

The command workflow passed.

Tested commands:

- crop person
- blur person

Results:

- Command execute request returned 200
- Crop command generated output
- Blur command generated output

This confirms that the backend command parser and action execution pipeline worked in the deployed environment.

---

## Confirmed Working Production Flow

The first deployed production flow is:

Frontend user action
to Render static site
to /api rewrite
to FastAPI backend
to YOLO inference or image operation
to PostgreSQL logging where applicable
to generated output file
to frontend result display

---

## Known Limitations

The deployment is successful, but it is still a first demo deployment.

Known limitations:

- Render free backend may spin down after inactivity.
- First request after inactivity may be slow.
- YOLO inference is slow on the free instance.
- Detection took around 1 to 2 minutes during testing.
- Local container file storage is temporary.
- Uploaded and generated files may disappear after backend restart or redeploy.
- Free PostgreSQL is temporary and will expire unless upgraded.
- OpenAI provider is disabled for the first deployment.
- Ollama is not used in the hosted deployment.

---

## Deployment Status

The first Render deployment is considered successful.

Passed areas:

- Frontend deployment
- Backend deployment
- PostgreSQL database creation
- Frontend to backend routing
- Backend to database connection
- YOLO class loading
- Image upload
- Object detection
- Annotated output generation
- Crop action
- Blur action
- Command execution
- Detection history
- Inference logs
- Fresh incognito browser test

---

## Recommended Next Improvements

Recommended follow-up work:

1. Add a proper model artifact strategy for hosted deployment.
2. Improve inference speed by using a stronger instance or background jobs.
3. Add persistent object storage for uploaded and generated media.
4. Add a production storage cleanup policy.
5. Add a deployment troubleshooting section to README.
6. Add deployment URLs to README after final review.
7. Prepare v0.4.0 release notes for Render deployment readiness and first cloud deployment.

---

## Related Documents

- docs/render-deployment-checklist.md
- docs/render-troubleshooting-notes.md
- docs/render-first-deployment-runbook.md
- docs/deployment-smoke-test-checklist.md
- docs/deployment-readiness-summary.md
- docs/model-artifact-strategy.md
- docs/media-storage-plan.md
- docs/production-env-checklist.md
