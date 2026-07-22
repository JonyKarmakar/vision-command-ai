# G.0 Production and Deployment Context Audit

This document audits the production and deployment context for VisionCommand AI before starting the rest of Milestone G.

The purpose is to avoid confused deployment claims and to define a budget-aware deployment strategy for portfolio readiness.

## Current conclusion

VisionCommand AI should not require paid deployment during Milestone G.

The official current demo strategy should be:

- primary demo path: local/Docker-first demo
- secondary proof: historical Render deployment evidence
- optional later path: temporary cloud demo before interviews
- not planned now: paid always-on production deployment

## Why this audit is needed

VisionCommand AI has already had deployment work.

The project was previously deployed on Render as a controlled public demo around the v0.4.0 milestone. That deployment included frontend, backend, and PostgreSQL.

However, the previous deployment used free-tier resources. The old free PostgreSQL database should now be treated as expired, stale, or unreliable unless manually verified again.

The project also changed significantly after v0.4.0. Later milestones added generated output history, workflow lineage, video workflow upgrades, real LLM exposure, analysis memory, and RAG-style grounded retrieval.

Therefore, the project needs a current production-readiness plan that separates:

- historical deployment evidence
- current active demo status
- local demo reliability
- future paid deployment options

## Historical Render deployment summary

The first public Render deployment was documented during the v0.4.0 deployment milestone.

Historical deployed resources:

- `vision-command-db`
- `vision-command-backend`
- `vision-command-frontend`

Historical public URLs:

- `https://vision-command-frontend.onrender.com`
- `https://vision-command-backend.onrender.com`

These URLs should now be treated as historical deployment evidence, not guaranteed active production URLs.

## What the previous deployment proved

The previous Render deployment proved that VisionCommand AI could run as a public cloud demo with:

- React/Vite frontend static site
- FastAPI backend web service
- Render PostgreSQL database
- frontend-to-backend API routing through Render rewrite rules
- backend-to-database connectivity through `DATABASE_URL`
- YOLO model information endpoint
- image upload
- object detection
- annotated output generation
- crop by class
- blur by class
- command execution
- database-backed detection history
- database-backed detection summary
- inference logs
- inference summary
- incognito browser smoke testing

This is valuable portfolio evidence.

## What the previous deployment did not prove

The previous Render deployment did not prove:

- permanent production uptime
- permanent database persistence on free tier
- persistent uploaded/generated media storage
- production-grade object storage
- production monitoring
- production authentication
- production access control
- production-scale video processing
- permanent real LLM cloud operation
- current compatibility with every later feature added after v0.4.0

It should be described as a successful first public cloud demo, not a final production deployment.

## Current Render status risk

The current Render deployment should be considered stale unless manually re-tested.

Known risks:

- free PostgreSQL database may have expired
- old database data may be deleted
- backend may sleep after inactivity
- first backend request may be slow
- YOLO inference may be slow on free compute
- uploaded and generated media may disappear after restart or redeploy
- PostgreSQL metadata may remain while actual media files disappear
- frontend README links may still point to old URLs
- later features may not have been smoke-tested on the old deployment

## Budget decision

Current budget decision:

Do not pay for deployment now.

Do not upgrade the old Render PostgreSQL database now.

Do not add paid persistent disk now.

Do not add paid object storage now.

Do not make a live cloud URL the required portfolio demo path now.

Reason:

The project already has historical deployment evidence. The next value is to make the project reliable, explainable, and demo-ready without creating monthly costs.

## Current recommended demo path

The recommended current demo path is local/Docker-first.

The target demo flow should be:

```text
clone repository
configure local environment
start Docker services
open frontend
verify backend health
upload image
run detection
create generated output
load generated output history
ask analysis-memory question
inspect retrieved source cards
run tests
explain historical Render deployment evidence
```

This avoids depending on expired free-tier infrastructure.

## Safe portfolio deployment claims

Safe claims:

- VisionCommand AI was previously deployed on Render as a controlled public demo.
- The previous deployment included frontend, backend, and PostgreSQL.
- The previous deployment was smoke-tested for image upload, YOLO detection, generated outputs, crop, blur, command execution, database views, and frontend-backend routing.
- The current recommended demo path is local/Docker-first because the previous deployment used free-tier resources.
- The project includes deployment documentation, Render runbooks, environment docs, smoke test checklists, and production-readiness planning.
- The project shows practical awareness of cloud deployment, database persistence, media storage, model artifacts, and cost constraints.

## Unsafe or outdated deployment claims

Avoid claiming:

- The Render deployment is currently guaranteed active.
- The old Render database is still available.
- The project currently has permanent cloud persistence.
- The project currently has production-grade object storage.
- The project currently has paid production infrastructure.
- The project is production-complete.
- The public URLs are the official required demo path.
- All features added after v0.4.0 have been tested on the old Render deployment.

## Existing deployment documentation

Important existing deployment docs include:

- `docs/deployment-roadmap.md`
- `docs/cloud-deployment-targets.md`
- `docs/database-deployment-plan.md`
- `docs/frontend-production-build.md`
- `docs/media-storage-plan.md`
- `docs/model-artifact-strategy.md`
- `docs/production-env-checklist.md`
- `docs/render-blueprint-draft.md`
- `docs/render-deployment-checklist.md`
- `docs/render-deployment-evidence.md`
- `docs/render-first-deployment-runbook.md`
- `docs/render-troubleshooting-notes.md`
- `docs/deployment-smoke-test-checklist.md`
- `docs/deployment-readiness-summary.md`
- `docs/deployment-hardening-plan.md`
- `docs/storage-cost-and-options.md`
- `docs/releases/v0.4.0.md`
- `docs/releases/v0.5.1.md`

These docs are useful, but they need to be reframed around the current no-budget local/Docker-first strategy.

## Important production risks to carry forward

### Database persistence

PostgreSQL is used for metadata and logs when `DATABASE_URL` is configured.

Risk:

Free cloud PostgreSQL may expire or become unavailable.

Current decision:

Use Docker/local PostgreSQL as the primary demo path. Treat cloud database as optional.

### Media persistence

Uploaded and generated files currently rely on filesystem storage.

Risk:

Container filesystem storage is temporary on many cloud services unless persistent disk or object storage is added.

Current decision:

Use local storage for demo. Document object storage as future work.

### Model artifact handling

YOLO model loading must be verified in any deployment environment.

Risk:

Local model files may not be committed or copied into cloud containers.

Current decision:

Keep model deployment as a documented risk for future cloud work. Verify local model behavior during Docker hardening.

### Video workload limits

Video processing can be heavy.

Risk:

Free cloud compute may be slow or unstable for video processing.

Current decision:

Local demo should include video only where resources allow. Cloud demo should not promise heavy video processing.

### LLM provider behavior

Local Ollama is not suitable for simple hosted cloud deployment.

Risk:

Cloud LLM setup can fail or create cost if enabled too early.

Current decision:

Keep cloud LLM optional. Make local and disabled-provider behavior clear.

### Environment and secrets

Deployment uses backend secrets such as `DATABASE_URL` and optional LLM keys.

Risk:

Secrets can be exposed if put into frontend variables or committed files.

Current decision:

G.3 should clean environment and secrets documentation.

## Recommended Milestone G order

Recommended next slices:

1. G.1 Production readiness roadmap
2. G.2 Local Docker demo hardening
3. G.3 Environment and secrets cleanup
4. G.4 README rewrite
5. G.5 Architecture and deployment diagrams
6. G.6 Demo script and screenshot package
7. G.7 Final smoke checklist
8. G.8 Portfolio case study
9. G.9 v1 readiness decision

This audit and the G roadmap are the foundation for those slices.

## Final recommendation

Do not spend money on cloud deployment right now.

Do not treat the old Render deployment as the current active demo.

Keep the old Render deployment as historical deployment evidence.

Make local Docker the official current demo path.

Use Milestone G to make the project clean, explainable, testable, and portfolio-ready.

After G, decide whether to release and apply for jobs, revisit advanced deployment, or revisit advanced AI work.
