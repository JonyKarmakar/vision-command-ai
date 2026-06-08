# Backend Port Environment Support

## Purpose

This document explains backend PORT environment support for VisionCommand AI.

The backend Dockerfile now supports a platform-provided PORT variable while keeping 8000 as the local default.

---

## Why This Matters

Some cloud platforms provide a PORT environment variable for web services.

If the container always binds to a fixed port, deployment can fail or the platform may not route traffic correctly.

The backend now starts with:

uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

This means:

- If PORT is set, the backend uses that value.
- If PORT is not set, the backend uses 8000.

---

## Local Behavior

Default local port:

8000

Local Docker Compose can continue using:

8000:8000

---

## Cloud Behavior

For cloud platforms such as Render, Railway, Fly.io, or Cloud Run, the platform may provide PORT automatically.

The backend container can now use the platform-provided value without another code change.

---

## Related Files

- backend/Dockerfile
- backend/.env.example
- docs/render-deployment-checklist.md
- docs/cloud-deployment-targets.md
