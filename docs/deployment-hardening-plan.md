# VisionCommand AI Deployment Hardening Plan

This document defines the recommended deployment hardening steps for VisionCommand AI.

It focuses on improving the project from a working demo deployment toward a more reliable production-style deployment.

---

## Purpose

VisionCommand AI has already been deployed as a first public Render demo.

The current deployment is useful for validation, but it still has expected limitations around free-tier compute, temporary media storage, inference latency, observability, and production readiness.

This document defines the next engineering improvements needed to harden the deployment.

---

## Current Deployment State

The current deployment uses:

```text
Frontend:
React/Vite static site

Backend:
FastAPI web service

Database:
Render PostgreSQL where configured

Model inference:
YOLO running inside the backend service

Media storage:
Local container filesystem for uploaded and generated media
```

Current deployment documentation is available in:

```text
docs/render-deployment-evidence.md
docs/render-first-deployment-runbook.md
docs/render-troubleshooting-notes.md
docs/deployment-readiness-summary.md
```

---

## Current Limitations

Known deployment limitations:

- Backend may sleep after inactivity on free-tier infrastructure.
- First request after sleep can be slow.
- YOLO inference can be slow on limited CPU resources.
- Uploaded and generated media are stored in temporary container storage.
- Local media files may disappear after container restarts.
- Persistent file storage is not yet production-ready.
- Monitoring is mostly manual.
- Application-level metrics can be expanded.
- Real user authentication is not implemented.
- Rate limiting and abuse protection are not yet implemented.

These limitations are acceptable for a portfolio demo, but they should be addressed before treating the app as a production service.

---

## Hardening Goals

The deployment hardening plan focuses on:

- Reliable media persistence
- Better environment configuration
- Safer production settings
- Improved observability
- Clearer smoke testing
- Better deployment rollback readiness
- Stronger operational documentation
- More realistic production architecture

---

## Priority 1: Persistent Media Storage

### Problem

Uploaded images, videos, generated outputs, extracted frames, and processed media currently depend on container-local storage in deployed environments.

This is not reliable for production because containers can restart or be replaced.

### Recommended improvement

Move uploaded and generated media to persistent object storage.

Possible storage options:

```text
S3-compatible object storage
Cloudinary
Supabase Storage
Render disk where appropriate
Google Cloud Storage
Azure Blob Storage
```

### Expected design

```text
User uploads media
 |
 v
Backend validates file
 |
 v
Backend stores media in object storage
 |
 v
Database stores metadata and storage URL/key
 |
 v
Frontend loads media through signed or public-safe URL
```

### Required metadata

For each stored media item, persist:

- Original filename
- Stored object key
- Media type
- MIME type
- File size
- Created timestamp
- Workflow source
- Generated output type where relevant
- Parent media item where relevant

---

## Priority 2: Environment Configuration

### Problem

Local, test, and deployed environments need clear configuration boundaries.

### Recommended improvement

Document and validate required environment variables.

Important environment areas:

```text
Backend:
DATABASE_URL
CORS origins
LLM provider keys where used
Storage provider credentials
Model configuration
Upload size limits

Frontend:
Backend API base URL
Environment mode
Feature flags where needed
```

### Expected behavior

- Missing optional services should fail gracefully.
- Missing required production settings should fail clearly.
- Local development should remain easy to run.
- Secrets must never be committed to Git.

---

## Priority 3: Production CORS and Security Settings

### Problem

Demo deployments often use permissive settings that should be tightened before production.

### Recommended improvement

Define production-safe settings for:

- CORS allowed origins
- Upload size limits
- Accepted file types
- Request validation
- Error response behavior
- API key handling
- Secret management
- Dependency updates

### Expected outcome

The backend should accept requests only from known frontend origins in production.

The upload layer should reject unsupported or unexpectedly large files before processing.

---

## Priority 4: Inference Performance

### Problem

Object detection and video workflows can be slow on free-tier or CPU-only infrastructure.

### Recommended improvement

Improve inference performance through:

- Smaller demo media files
- Clear frame sampling limits
- Model loading reuse
- Optional GPU-capable deployment target
- Async job handling for heavier video workflows
- Progress states for long-running workflows

### Possible future architecture

```text
Frontend
 |
 v
FastAPI API service
 |
 v
Job queue
 |
 v
Worker service for inference and video processing
 |
 v
Object storage + database
```

This is not required for the current demo, but it is a realistic next step for heavier workloads.

---

## Priority 5: Observability

### Problem

The project has Developer Mode and internal summaries, but deployed observability can be improved.

### Recommended improvement

Add clearer operational visibility for:

- Request failures
- Inference latency
- Upload failures
- Video processing failures
- Command parsing failures
- LLM provider failures
- Database persistence failures
- Storage provider failures

### Useful metrics

```text
Average inference time
Upload success/failure count
Command success/failure count
Video processing duration
Generated output count
Database persistence status
LLM provider status
Backend health status
```

### Expected outcome

The app should be easier to debug after deployment without relying only on manual browser testing.

---

## Priority 6: Deployment Smoke Tests

### Problem

Manual smoke testing exists, but it should be standardized for future deployments.

### Recommended smoke test checklist

After every production deployment, verify:

- Frontend loads successfully.
- Backend `/health` returns success.
- Frontend can reach backend through configured API routing.
- Image upload works.
- Object detection works.
- Annotated output loads.
- Crop, blur, or zoom output loads.
- Generated Output History updates.
- Video upload works.
- At least one video workflow completes.
- Database-backed summaries work where configured.
- Developer Mode inspection remains available.

Related checklist:

```text
docs/deployment-smoke-test-checklist.md
```

---

## Priority 7: Error Handling and User Feedback

### Problem

Production deployments need clear user-facing errors for failed workflows.

### Recommended improvement

Improve error states for:

- Unsupported file type
- File too large
- Backend unavailable
- Model loading failure
- Detection failure
- Video processing failure
- LLM provider unavailable
- Database unavailable
- Storage upload failure

Expected behavior:

- User Mode should show clear non-technical messages.
- Developer Mode should expose technical details for debugging.
- Failed operations should not break the whole workspace.

---

## Priority 8: Release and Rollback Readiness

### Problem

As the project grows, deployment changes should be easier to review and roll back.

### Recommended improvement

Maintain:

- Release notes
- Deployment checklist
- Known limitations
- Environment variable checklist
- Smoke test results
- Rollback notes
- Main branch CI verification

Expected workflow:

```text
Prepare release notes
Verify local checks
Merge PR
Verify main CI
Deploy
Run smoke tests
Record deployment evidence
```

---

## Priority 9: Production Data Boundaries

### Problem

The project processes user-uploaded media. Production usage would require clearer data boundaries.

### Recommended improvement

Before real users, define:

- Media retention policy
- Generated output retention policy
- Deletion behavior
- Access control
- Privacy expectations
- Logging boundaries
- User authentication strategy

For the current portfolio demo, avoid uploading private or sensitive media.

---

## Suggested Hardening Order

Recommended order:

```text
1. Persistent media storage plan
2. Environment variable validation
3. Production CORS and upload limits
4. Deployment smoke test standardization
5. Better error states
6. Inference performance improvements
7. Observability expansion
8. Release and rollback checklist
9. Authentication and data retention planning
```

---

## Near-Term Implementation Candidates

Good near-term PR candidates:

- Add object storage design document.
- Add environment variable validation helper.
- Add clearer upload size/type validation documentation.
- Add deployment smoke test evidence template.
- Add production CORS checklist.
- Add screenshot-backed deployment evidence.
- Add sample media and walkthrough screenshot set.
- Add better frontend error state documentation.

---

## Current Status

The current deployment is suitable as a public demo and technical validation target.

It is not yet a production-grade hosted media service.

The next hardening focus should be persistent media storage, environment validation, deployment smoke testing, and clearer production error handling.

---

## Related Documentation

- `README.md`
- `docs/deployment-readiness-summary.md`
- `docs/deployment-smoke-test-checklist.md`
- `docs/environment-variables.md`
- `docs/production-env-checklist.md`
- `docs/render-deployment-evidence.md`
- `docs/render-first-deployment-runbook.md`
- `docs/render-troubleshooting-notes.md`
- `docs/storage-cost-and-options.md`
- `docs/walkthrough-assets.md`
