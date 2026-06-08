# VisionCommand AI Database Deployment Plan

## Purpose

This document explains the database deployment plan for VisionCommand AI.

The goal is to prepare the project for a production-style PostgreSQL setup without changing the current database code yet.

---

## Current Local Database Setup

VisionCommand AI currently uses PostgreSQL through Docker Compose for local development.

Current local database service:

- Image: postgres:16-alpine
- Database name: vision_command
- User: vision_user
- Password: vision_password
- Local port: 5432
- Docker volume: postgres_data

The backend connects through DATABASE_URL.

Local Docker Compose backend value:

DATABASE_URL=postgresql://vision_user:vision_password@postgres:5432/vision_command

The Docker Compose PostgreSQL setup is for local development only. Production should use a managed PostgreSQL database or a properly secured self-hosted PostgreSQL instance.

---

## Current Backend Database Behavior

The backend reads the database connection string from:

DATABASE_URL

The database service currently uses psycopg directly.

If DATABASE_URL is not configured, many database functions return a safe not_configured response instead of crashing.

This allows parts of the app to work without PostgreSQL, but database-backed dashboards and logs require DATABASE_URL.

---

## Current Tables

The backend initializes tables in application code using CREATE TABLE IF NOT EXISTS and ALTER TABLE ADD COLUMN IF NOT EXISTS where needed.

Current database-backed areas include:

### media_files

Stores metadata for uploaded media.

Used for:

- Uploaded image history
- Uploaded video/media history
- Reusing uploaded files from the frontend

### command_logs

Stores command execution logs.

Used for:

- Command history
- Parser-mode command analytics
- Result-type filtering
- LLMOps command summary

### detection_results

Stores YOLO detection result rows.

Used for:

- Detection history
- Detection summary
- Class-based analytics

### model_inference_logs

Stores model inference metadata.

Used for:

- Inference logs
- Inference summary
- Model usage monitoring

### parser_attempt_logs

Stores parser attempt metadata.

Used for:

- Parser attempt logs
- Parser summaries
- Parser error breakdowns
- LLMOps monitoring

---

## Current Initialization Strategy

The current initialization strategy is application-managed.

The backend creates or updates tables when database-related functions are called.

Advantages:

- Simple for local development
- No separate migration tool required yet
- Easy to run in Docker Compose
- Safe for early-stage development

Limitations:

- Schema changes are distributed across application code
- No versioned migration history
- Harder to audit production schema changes
- More risky as the project grows
- Rollbacks are not formally managed

For the first deployment, this approach can continue if the project remains small.

For a more production-ready version, the project should eventually introduce a migration tool.

Possible future migration tools:

- Alembic
- SQLModel plus Alembic
- SQLAlchemy plus Alembic
- Raw SQL migration files

---

## Managed PostgreSQL Options

Potential managed PostgreSQL providers:

- Neon
- Supabase PostgreSQL
- Railway PostgreSQL
- Render PostgreSQL
- Google Cloud SQL for PostgreSQL
- AWS RDS for PostgreSQL
- Azure Database for PostgreSQL

For a budget-friendly portfolio deployment, the best first options are:

- Neon
- Supabase PostgreSQL
- Railway PostgreSQL
- Render PostgreSQL

For a more production-style Google Cloud deployment:

- Google Cloud SQL for PostgreSQL

---

## Recommended First Database Target

Recommended first database target:

- Managed PostgreSQL

Recommended providers to compare first:

- Neon
- Supabase
- Railway
- Render
- Google Cloud SQL

Selection criteria:

- Free or low-cost tier
- Easy DATABASE_URL configuration
- Works with FastAPI backend
- Allows external backend connection
- Backup or restore support
- Clear connection limits
- Low maintenance
- Simple dashboard for inspecting data

---

## Production Environment Variables

Required backend variable:

DATABASE_URL

Production pattern:

DATABASE_URL=postgresql://user:password@host:port/database

Production rules:

- Store DATABASE_URL only in the backend hosting provider environment.
- Do not commit production DATABASE_URL to Git.
- Do not place DATABASE_URL in frontend variables.
- Do not reuse local Docker Compose credentials in production.

---

## Deployment Connection Considerations

The backend container must be able to reach the managed PostgreSQL database.

Things to check before deployment:

- Does the database provider allow external connections?
- Is SSL required?
- Does the connection string include SSL mode?
- Does the backend hosting provider allow outbound database connections?
- Are there IP allowlist restrictions?
- Are connection limits acceptable?
- What happens when the backend scales to multiple instances?

Some managed PostgreSQL providers require connection strings with SSL options.

Example pattern:

DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

The exact value should come from the selected database provider.

---

## Backup and Persistence

Production database must be persistent.

Minimum expectations:

- Data should survive backend restarts
- Data should survive deployment updates
- Data should not depend on a local container filesystem
- There should be a backup/export option

For first deployment:

- Use the managed provider's built-in backups if available
- Export important data manually if backups are not included in the free tier
- Keep local Docker Compose only for development

---

## Data Stored in PostgreSQL vs File Storage

PostgreSQL currently stores metadata and analytics data.

Examples:

- Uploaded media metadata
- Command logs
- Detection rows
- Inference logs
- Parser attempt logs
- Summaries derived from logs

PostgreSQL does not currently store the actual uploaded image/video/output files.

Actual files are stored in backend storage folders.

This means database deployment alone does not solve media persistence.

The media storage plan must be handled separately.

Recommended future direction:

- PostgreSQL stores metadata
- Object storage stores actual uploaded/generated files
- Database rows store object keys, file URLs, or storage paths

---

## First Deployment Strategy

For the first cloud deployment, keep the database strategy simple:

1. Create managed PostgreSQL database.
2. Copy the provider DATABASE_URL.
3. Configure DATABASE_URL in the backend hosting provider.
4. Deploy backend.
5. Start the backend and let current application-managed table initialization create tables.
6. Test database-backed endpoints.
7. Confirm dashboards load correctly.
8. Confirm command logs and parser logs are stored.
9. Confirm media metadata is stored.
10. Document the selected provider and connection setup.

---

## Database Readiness Checklist

Before public deployment:

- [ ] Managed PostgreSQL provider selected
- [ ] DATABASE_URL configured as backend secret
- [ ] Local Docker Compose credentials not used in production
- [ ] Backend can connect to production database
- [ ] Health/database status endpoint works
- [ ] Tables initialize successfully
- [ ] Media metadata saves correctly
- [ ] Command logs save correctly
- [ ] Detection results save correctly
- [ ] Inference logs save correctly
- [ ] Parser attempt logs save correctly
- [ ] LLMOps dashboard can read database-backed summaries
- [ ] Backup/export option is understood
- [ ] Connection limits are understood
- [ ] SSL requirements are understood
- [ ] Media file persistence is documented separately

---

## Current Risks

### Risk 1: No formal migration framework

Current schema initialization is application-managed.

This is acceptable for early deployment but should eventually move to migrations.

Recommended future milestone:

- Add Alembic or raw SQL migration files

### Risk 2: Database is not enough for media persistence

PostgreSQL stores metadata, not uploaded/generated media files.

Recommended future milestone:

- Add object storage or persistent volume strategy

### Risk 3: Connection limits

Managed PostgreSQL free tiers may have low connection limits.

Recommended mitigation:

- Keep initial deployment small
- Avoid unnecessary connection-heavy behavior
- Consider pooling later if needed

### Risk 4: Local credentials are only for development

docker-compose.yml credentials must not be used in production.

Recommended mitigation:

- Use provider-managed production credentials
- Store credentials only in backend environment variables

---

## Future Improvements

Possible future improvements:

- Add migration system
- Add database schema documentation
- Add SQL seed/init scripts
- Add backup/export documentation
- Add connection pooling
- Add object storage references in media_files
- Add user/workspace ownership when authentication is introduced
- Add retention policy for logs and analytics

---

## Related Files

- docker-compose.yml
- backend/.env.example
- backend/app/services/database_service.py
- backend/app/main.py
- docs/deployment-roadmap.md
- docs/environment-variables.md
