# VisionCommand AI Media Storage Plan

## Purpose

This document explains the media storage plan for VisionCommand AI.

The goal is to prepare the project for production-style media persistence without changing the current local file-based backend implementation yet.

---

## Current Local Storage Structure

The backend stores runtime files under STORAGE_ROOT.

Current default:

STORAGE_ROOT=storage

Inside the backend container, the production-style default is:

STORAGE_ROOT=/app/storage

Current storage folders:

- uploads
- outputs
- videos
- logs

Current backend config maps these folders as:

- UPLOAD_DIR = STORAGE_ROOT / uploads
- OUTPUT_DIR = STORAGE_ROOT / outputs
- VIDEO_DIR = STORAGE_ROOT / videos
- LOG_DIR = STORAGE_ROOT / logs

---

## Current File Types

### Uploaded Images

Uploaded image files are saved under:

backend/storage/uploads

The backend returns file URLs like:

/media/uploads/{filename}

These files are used by:

- object detection
- annotated detection
- crop operations
- blur operations
- class-based crop and blur
- command execution workflows

---

### Uploaded Videos

Uploaded video files are saved under:

backend/storage/videos

The backend returns file URLs like:

/media/videos/{filename}

These files are used by:

- video metadata extraction
- video trimming
- frame extraction
- sampled detection
- multi-frame detection
- tracking workflows

---

### Generated Outputs

Generated files are saved under:

backend/storage/outputs

The backend returns file URLs like:

/media/outputs/{filename}

Output files include:

- annotated images
- cropped images
- blurred images
- trimmed videos
- extracted frames
- annotated frames
- tracking outputs

---

### Logs

Runtime logs are saved under:

backend/storage/logs

Examples:

- command_logs.jsonl
- parser_attempt_logs.jsonl

Some logs are also stored in PostgreSQL when DATABASE_URL is configured.

---

## Current Serving Strategy

The backend currently serves stored files directly using FastAPI FileResponse.

Current serving endpoints include:

- GET /media/uploads/{filename}
- GET /media/outputs/{filename}
- GET /media/videos/{filename}

This is simple and works well for local development.

---

## Current Metadata Strategy

PostgreSQL stores metadata and analytics data.

Examples:

- original filename
- stored filename
- content type
- width and height
- storage path
- file URL
- command logs
- detection results
- inference logs
- parser attempt logs

PostgreSQL does not store the actual image, video, or generated output files.

This means database deployment alone does not make media files persistent.

---

## Current Local Docker Compose Behavior

In local Docker Compose, backend storage is mounted as a local volume:

./backend/storage:/app/storage

This means files survive backend container restarts during local development.

However, this behavior depends on the developer machine.

It is not a production storage strategy.

---

## Why Local Container Storage Is Risky in Production

Local container storage is risky in cloud deployment because:

- Containers can be replaced during redeployments
- Local filesystem data may disappear after restart
- Multiple backend instances would not share the same files
- Scaling the backend could create inconsistent media access
- Backups are harder to manage
- Generated outputs may become unavailable after deployment updates

For production, uploaded and generated media should not depend only on the container filesystem.

---

## First Deployment Options

### Option 1: Keep local filesystem temporarily

This is the simplest option.

Use case:

- Portfolio demo
- Single backend container
- Short-lived demo environment
- No guarantee that uploaded/generated files survive redeployment

Pros:

- No major code change
- Fastest path to first demo
- Works with current backend

Cons:

- Not reliable
- Files may disappear after redeploy
- Not suitable for real users
- Not suitable for multiple backend instances

---

### Option 2: Use persistent volume

Some hosting platforms support persistent disks or volumes.

Use case:

- Single backend instance
- Simple production-style deployment
- Low traffic demo with persistent files

Pros:

- Smaller code change
- Files survive container restart
- Similar to current local Docker Compose behavior

Cons:

- Platform-dependent
- Harder to scale horizontally
- Backup strategy still needed
- Not as flexible as object storage

---

### Option 3: Use object storage

Object storage is the recommended long-term direction.

Examples:

- Google Cloud Storage
- AWS S3
- Azure Blob Storage
- Cloudflare R2
- Supabase Storage
- MinIO for self-hosted development

Use case:

- Real production deployment
- Multiple backend instances
- Persistent uploaded and generated files
- Public or signed file URLs
- Better backup and lifecycle control

Pros:

- Durable
- Scalable
- Works across backend instances
- Clear separation between metadata and files
- Better production architecture

Cons:

- Requires code changes
- Requires storage credentials
- Requires upload/download abstraction
- Requires file URL strategy
- Requires local development fallback

---

## Recommended Direction

Recommended first public-deployment direction:

- Use managed PostgreSQL for metadata
- Use object storage for actual files
- Keep local filesystem storage for development

Recommended architecture:

- PostgreSQL stores metadata
- Object storage stores uploaded and generated files
- Backend writes files through a storage service abstraction
- Frontend receives file URLs from the backend
- Local development continues to use backend/storage

---

## Suggested Storage Abstraction

A future implementation should introduce a storage service layer.

Possible file:

backend/app/services/storage_service.py

Responsibilities:

- Save uploaded image
- Save uploaded video
- Save generated output
- Read file for model processing
- Return frontend-accessible file URL
- Delete files if needed
- Support local filesystem mode
- Support object storage mode later

Suggested environment variable:

MEDIA_STORAGE_PROVIDER=local

Future provider values:

- local
- gcs
- s3
- azure
- r2
- supabase
- minio

Suggested variables for object storage:

- MEDIA_BUCKET_NAME
- MEDIA_PUBLIC_BASE_URL
- MEDIA_SIGNED_URL_EXPIRY_SECONDS
- GOOGLE_APPLICATION_CREDENTIALS
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- AZURE_STORAGE_CONNECTION_STRING

Only backend should receive storage credentials.

Storage secrets must not be exposed to the frontend.

---

## Migration Path From Local Filesystem to Object Storage

A safe migration path:

1. Keep current local filesystem behavior.
2. Add MEDIA_STORAGE_PROVIDER=local.
3. Add storage_service.py with local implementation first.
4. Refactor upload and output writes to use storage_service.py.
5. Keep tests passing with local filesystem mode.
6. Add object storage provider support.
7. Store object keys and URLs in PostgreSQL.
8. Update media_files table strategy if needed.
9. Test uploads, detection, annotation, cropping, blur, video trim, frame extraction, and tracking.
10. Add cleanup and retention policy.

---

## Data Model Direction

Current media metadata includes:

- original_filename
- stored_filename
- content_type
- width
- height
- storage_path
- file_url
- created_at

Future media metadata could include:

- storage_provider
- bucket_name
- object_key
- public_url
- signed_url_required
- file_size_bytes
- media_type
- related_job_id
- user_id or workspace_id
- retention_expires_at

This should be introduced later when the project adds authentication, users, or workspaces.

---

## File URL Strategy

Current local file URL examples:

- /media/uploads/{filename}
- /media/videos/{filename}
- /media/outputs/{filename}

Future object storage options:

### Public URLs

The backend returns a public object storage URL.

Good for:

- public demo assets
- generated outputs that are safe to share

Risk:

- files may be accessible by anyone with the link

### Signed URLs

The backend returns temporary signed URLs.

Good for:

- private files
- user-specific uploads
- production security

Risk:

- more implementation complexity

For the first portfolio deployment, public or backend-proxied URLs may be acceptable.

For user accounts and private workspaces, signed URLs are recommended.

---

## Security Considerations

Before public deployment, check:

- Allowed file types
- Maximum upload size
- Filename sanitization
- Virus/malware scanning if public users are allowed
- Access control for private files
- Signed URLs for private media
- Cleanup of old files
- Avoid exposing local absolute paths to users
- Avoid storing secrets in frontend variables

Current backend uses generated UUID filenames, which helps avoid direct filename collisions.

---

## Cleanup and Retention

Generated files can grow quickly.

Examples:

- extracted frames
- annotated frames
- multi-frame detection outputs
- tracking outputs
- uploaded videos

Future cleanup policy should define:

- How long temporary files are kept
- Whether generated outputs expire
- Whether original uploads expire
- Whether users can delete files
- Whether old logs are archived
- Whether background cleanup jobs are needed

Possible future retention examples:

- Delete temporary extracted frames after 24 hours
- Keep final annotated outputs for 7 days
- Keep user-selected saved outputs permanently
- Keep analytics logs in PostgreSQL for portfolio/demo history

---

## First Deployment Recommendation

For the first cloud demo, use one of these approaches:

### Fastest demo path

- Keep local filesystem storage
- Use one backend instance
- Accept that files may not survive redeployment
- Clearly document this limitation

### Better portfolio path

- Use persistent volume if the hosting provider supports it
- Keep current backend logic mostly unchanged
- Use one backend instance
- Document backup limitations

### Best production-learning path

- Add storage_service.py
- Keep local filesystem provider
- Add object storage provider later
- Use managed PostgreSQL plus object storage

Recommended learning path for VisionCommand AI:

1. First deploy with managed PostgreSQL.
2. Keep filesystem storage temporarily.
3. Then add media storage abstraction.
4. Then connect object storage.
5. Then add cleanup/retention policy.

---

## Media Storage Readiness Checklist

Before public deployment:

- [ ] Decide first storage target
- [ ] Confirm whether hosting provider filesystem is persistent
- [ ] Confirm maximum upload size
- [ ] Confirm video upload limits
- [ ] Confirm generated output persistence
- [ ] Confirm backend can serve uploaded files after restart
- [ ] Confirm backend can serve output files after redeploy
- [ ] Confirm old files are not committed to Git
- [ ] Confirm storage credentials are backend-only
- [ ] Decide public URL vs signed URL strategy
- [ ] Decide retention and cleanup rules
- [ ] Decide whether object storage is required for first public release

---

## Current Risks

### Risk 1: Files can disappear after redeploy

If the backend uses only container-local storage, uploaded and generated files may be lost.

### Risk 2: Database rows can point to missing files

PostgreSQL may store file metadata even if the actual file no longer exists.

### Risk 3: Horizontal scaling will break file access

If multiple backend containers run at the same time, one container may not have files created by another container.

### Risk 4: Storage can grow quickly

Video uploads and frame extraction can create many large files.

### Risk 5: Absolute storage paths are not portable

Current metadata may include local paths like storage/uploads or /app/storage/uploads.

Future metadata should prefer portable object keys.

---

## What This Branch Does Not Change

This branch does not change backend storage code.

It only documents the current behavior and future production plan.

Code changes should happen in a separate milestone.

Recommended follow-up branch:

feature/media-storage-abstraction

---

## Related Files

- backend/app/config.py
- backend/app/main.py
- backend/app/services/database_service.py
- backend/.dockerignore
- docker-compose.yml
- docs/database-deployment-plan.md
- docs/deployment-roadmap.md
- docs/environment-variables.md
