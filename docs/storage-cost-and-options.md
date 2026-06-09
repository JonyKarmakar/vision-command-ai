# VisionCommand AI Storage Cost and Options

## Purpose

This document explains the storage problem in VisionCommand AI and compares possible storage directions before implementing any paid cloud storage.

The goal is to make a cost-aware decision and avoid jumping into paid infrastructure too early.

---

## Current Situation

VisionCommand AI is deployed on Render with:

- React/Vite frontend static site
- FastAPI backend web service
- Render PostgreSQL database

The backend currently stores uploaded and generated media in local container folders.

Current storage root:

    /app/storage

Current media folders:

    /app/storage/uploads
    /app/storage/outputs
    /app/storage/videos
    /app/storage/logs

This works for the first public demo.

However, this is not a permanent production storage strategy.

---

## Current Storage Limitation

The current backend container storage is temporary.

That means uploaded and generated files may disappear when:

- The backend restarts
- The backend redeploys
- The container is replaced
- The free instance sleeps and wakes in a new runtime context

This can affect:

- Uploaded images
- Uploaded videos
- Annotated outputs
- Cropped outputs
- Blurred outputs
- Trimmed videos
- Extracted frames
- Tracking output frames

The database may still contain metadata, but the actual file may no longer exist.

---

## Why PostgreSQL Is Not Enough

PostgreSQL is good for structured data.

Examples:

- Uploaded media metadata
- File names
- File paths
- Detection records
- Confidence scores
- Bounding boxes
- Command logs
- Inference logs
- Summary analytics

PostgreSQL should not be used as the main storage location for large media files.

Media files should usually be stored in:

- Local filesystem for development
- Persistent disk for simple deployments
- Object storage for cloud production

The database should store references to those files.

---

## Storage Options

### Option 1: Keep Current Temporary Container Storage

This is the current setup.

Pros:

- Already working
- No extra setup
- No extra storage provider
- No payment needed
- Good enough for first demo

Cons:

- Files can disappear after restart or redeploy
- Not suitable for serious production use
- Database records may point to missing files
- Demo may become inconsistent over time

Best for:

- First public demo
- Short-term testing
- Learning deployment basics

Decision:

Keep this for now until the storage architecture is prepared.

---

### Option 2: Render Persistent Disk

Render can attach a persistent disk to a web service on paid instance types.

Pros:

- Simple mental model
- File paths can stay similar
- Easier than full object storage integration
- Good for small projects

Cons:

- Usually requires paid service setup
- Tied to Render
- Not as portable as object storage
- Scaling later may be harder

Best for:

- Small hosted demo
- Simple persistent file storage
- Learning basic persistent server storage

Decision:

Do not use immediately.

Consider only if the project needs simple persistence and the cost is acceptable.

---

### Option 3: Object Storage

Object storage means media files are stored in a bucket-like service.

Possible providers:

- Cloudflare R2
- Supabase Storage
- Google Cloud Storage
- AWS S3
- Azure Blob Storage

Pros:

- More production-like
- Better for uploaded and generated files
- More portable
- Can support public or signed URLs
- Better long-term architecture
- Good learning value for cloud storage

Cons:

- More setup complexity
- May require payment details
- Can create cost if usage grows
- Requires credentials and secure environment variables
- Requires code changes

Best for:

- Production-style media storage
- Portfolio-ready cloud architecture
- Learning real cloud storage patterns

Decision:

Good long-term direction, but not the first immediate implementation.

---

### Option 4: Hybrid Storage

Use local storage for development and object storage for production.

Example:

- Local development uses local filesystem
- Docker Compose uses local mounted folders
- Render production later uses object storage

Pros:

- Flexible
- Cost-safe during development
- Production-ready later
- Avoids vendor lock-in if designed well

Cons:

- Requires a storage abstraction layer
- Requires careful testing
- Requires environment-based behavior

Best for:

- This project

Decision:

This is the recommended direction.

---

## Recommended Cost-Safe Strategy

Do not add paid storage immediately.

Instead, use a phased approach.

### Phase 1: Document the storage options

Status:

    current branch

Goal:

- Understand the problem
- Document cost risks
- Document possible storage providers
- Avoid committing to a paid service too early

### Phase 2: Add a local StorageService abstraction

Goal:

- Keep current local storage behavior
- Move file handling behind a service interface
- Keep the app working exactly as before

Example future interface:

    save_upload(file)
    save_output(file)
    get_file_url(path)
    open_file(path)
    delete_file(path)

At first, the implementation should still use local storage.

### Phase 3: Add storage provider configuration

Possible future variable:

    STORAGE_BACKEND=local

Future values could include:

    local
    render_disk
    r2
    supabase
    gcs
    s3

This should not be implemented until the local service abstraction is stable.

### Phase 4: Choose a cloud storage provider later

Before choosing a provider, verify:

- Free tier
- Monthly cost
- Egress cost
- Operation/request cost
- Region availability
- Public URL support
- Signed URL support
- Python SDK support
- Ease of setup
- Portfolio value

Do not choose based only on popularity.

### Phase 5: Add object storage implementation

Only after the provider is selected:

- Add provider SDK
- Add credentials through environment variables
- Add upload logic
- Add output save logic
- Add URL generation logic
- Add tests
- Update deployment docs

---

## Important Cost Rule

Do not enter payment details or enable paid storage until the project needs it.

For now, the project should remain:

- Free or near-free
- Demo-safe
- Learning-focused
- Easy to roll back

Before selecting any paid or usage-based service, check the official pricing page again because cloud pricing can change.

---

## Recommended Next Technical Step

The next code branch should be:

    feature/storage-service-local

Goal:

Create a local storage service without changing current behavior.

This means the app still stores files locally, but the code becomes easier to extend later.

The first service should only support local storage.

Do not add cloud storage in that branch.

---

## What Not To Do Yet

Do not:

- Add Cloudflare R2 yet
- Add AWS S3 yet
- Add Google Cloud Storage yet
- Add Supabase Storage yet
- Add Render persistent disk yet
- Add payment details just for this step
- Store large media files in PostgreSQL
- Commit uploaded media files to Git
- Commit storage credentials to Git

---

## Success Criteria

This documentation step is successful when:

- The storage problem is clearly described
- Cost risk is clearly documented
- The current temporary-storage limitation is visible
- The recommended next step is local storage abstraction
- No paid provider has been selected yet
- No secrets or payment details are required

---

## Related Documents

- docs/media-storage-plan.md
- docs/render-deployment-evidence.md
- docs/render-first-deployment-runbook.md
- docs/production-env-checklist.md
- docs/model-artifact-strategy.md
- docs/releases/v0.4.0.md
