# Milestone G: Production Readiness and Portfolio Packaging

This roadmap defines Milestone G for VisionCommand AI after completing Milestone F.

Milestone F added the analysis-memory RAG layer, grounded answers, source cards, safety boundaries, evaluation coverage, and demo documentation. Milestone G should now make the project easier to run, explain, trust, and present as a professional portfolio project.

## Final direction

Milestone G should focus on production readiness and portfolio packaging.

The goal is not to add another large AI feature immediately.

The goal is to make the existing project:

- reliable for local demo
- clear for technical reviewers and future maintainers
- honest about deployment status
- safe from overclaiming
- easy to run from the repository
- easy to explain as an applied AI engineering project
- ready for a release or v1 readiness decision

## Deployment strategy for Milestone G

The current deployment strategy is budget-aware.

Primary demo path:

- local/Docker-first demo

Secondary proof:

- historical Render deployment evidence from the v0.4.0 deployment milestone

Optional future path:

- optional temporary cloud demo only if manually revalidated

Not planned now:

- paid Render upgrade
- paid persistent disk
- paid managed PostgreSQL
- paid object storage
- paid always-on production deployment

## Why local/Docker-first now

VisionCommand AI was previously deployed on Render with frontend, backend, and PostgreSQL. That deployment proved that the project could run publicly as a controlled cloud demo.

However, the previous deployment depended on free-tier infrastructure. The free PostgreSQL database should now be treated as expired, stale, or unreliable unless manually verified again.

Because the current priority is job readiness and the budget is tight, Milestone G should not require paid cloud infrastructure.

The project should instead present:

- a strong local Docker demo
- historical deployment evidence
- clear limitations
- optional future cloud deployment notes

## G.0 Production and deployment context audit

Status: Implemented in PR #537

Purpose:

Document the previous deployment history, current deployment reality, and the new no-budget deployment strategy.

Implemented audit:

- `docs/g0-production-deployment-context-audit.md`

The audit documents:

- previous Render deployment work
- deployed Render resources
- smoke-tested cloud features
- known free-tier limitations
- current free-tier expiry risk
- current no-paid-deployment decision
- safe portfolio deployment claims
- unsafe deployment claims
- recommended current demo path

Boundary:

This does not redeploy the project, update cloud infrastructure, or change application behavior.

## G.1 Production readiness roadmap

Status: Implemented in PR #537

Purpose:

Define the Production Readiness and Portfolio Packaging milestone before changing README, Docker setup, deployment docs, or release status.

Implemented roadmap:

- `docs/g-production-readiness-roadmap.md`

Boundary:

This roadmap does not create a release or claim production completion.

## G.2 Local Docker demo hardening

Status: Implemented in PR #538

Purpose:

Make local Docker the official reliable demo path.

Implemented documentation:

- `docs/g2-local-docker-demo-readiness.md`

Implemented hardening:

- backend Docker default model path uses `/app/storage/models/yolo26n.pt`
- backend Docker startup creates storage folders, including `/app/storage/models`
- backend Docker config sets `YOLO_CONFIG_DIR=/tmp/Ultralytics`
- local Docker demo smoke path documents startup, health checks, frontend proxy checks, database checks, upload, detection, model inspection, and logs

Boundary:

This is local production-style demo readiness, not cloud deployment.

## G.3 Environment and secrets cleanup

Status: Implemented in PR #539

Purpose:

Make local, Docker, and optional deployment setup safe and understandable.

Implemented documentation:

- `docs/g3-environment-and-secrets-cleanup.md`

Implemented cleanup:

- backend `.env.example` now separates local non-Docker, Docker Compose, and production database values
- frontend `.env.example` now clarifies that frontend variables are public and `VITE_BACKEND_URL` is used for Vite proxy behavior
- optional Render config uses the current container model path
- environment documentation links to the Milestone G environment guidance
- safe and unsafe committed values are documented

Boundary:

No secrets are committed. Old Render credentials are not revived.

## G.4 README rewrite

Status: Implemented in PR #540

Purpose:

Turn the README into a professional portfolio entry point.

Implemented documentation:

- `README.md`
- `docs/g4-readme-current-portfolio-status.md`

Implemented update:

- README now leads with the local Docker demo path
- old Render deployment is described as historical evidence, not a guaranteed active live demo
- implemented image, video, command, LLM, analysis memory, persistence, Docker, and CI/CD capabilities are summarized
- Docker quickstart, smoke checks, model artifact notes, local setup, testing, architecture, limitations, and portfolio positioning are documented
- Milestone G status is reflected in the README

Boundary:

The README does not present old Render URLs as guaranteed active production demos.

## G.5 Architecture and deployment diagrams

Status: Implemented in PR #541

Purpose:

Make the system visually understandable.

Implemented documentation:

- `docs/g5-architecture-and-deployment-diagrams.md`

Implemented diagrams:

- full system architecture
- local Docker architecture
- local Docker request flow
- historical Render deployment architecture
- command execution architecture
- generated output history and analysis memory flow
- analysis-memory RAG-style flow
- deployment status view

Boundary:

The diagrams show implemented behavior and clearly label historical or optional deployment paths.

## G.6 Demo and walkthrough package

Status: Implemented in PR #542

Purpose:

Prepare a professional public walkthrough package for reviewing and validating the project.

Implemented documentation:

- `docs/g6-demo-walkthrough-package.md`

Implemented content:

- local Docker demo prerequisites
- local validation checks
- five-minute product walkthrough
- ten-minute technical walkthrough
- screenshot checklist
- demo evidence checklist
- recommended project explanation
- what the demo proves
- what the demo does not prove
- troubleshooting notes
- fallback validation notes

Boundary:

This is public project documentation. It keeps the walkthrough focused on product review, technical validation, and known project boundaries.

## G.7 Final smoke checklist

Status: Implemented in PR #543

Purpose:

Create one final validation checklist before tagging or release decision.

Implemented documentation:

- `docs/g7-final-smoke-checklist.md`

Checklist covers:

- repository and branch checks
- CI checks
- local Docker startup
- backend and frontend health checks
- frontend load check
- image workflow smoke check
- command workflow smoke check
- generated output history smoke check
- analysis memory smoke check
- video workflow smoke check
- documentation link review
- known limitation review
- final decision record

Boundary:

This is the checklist definition. It does not claim that the final smoke test has already passed.

## G.8 Portfolio case study

Status: Implemented in PR #544

Purpose:

Create a professional public project case study for review and portfolio documentation.

Implemented documentation:

- `docs/g8-portfolio-case-study.md`

The case study explains:

- why the project exists
- what problem it solves
- product concept
- technical architecture
- image, video, command, LLM-aware, and RAG-style capabilities
- production-readiness work
- engineering decisions
- validation and quality practices
- deployment approach
- limitations
- future improvements

Boundary:

This is public project documentation. It does not claim active production hosting, real-time stream processing, identity recognition, or v1 readiness.

## G.9 v1 readiness decision

Status: Planned

Purpose:

Decide whether the project is ready for v1.0.0 or should use another release tag first.

Possible outcomes:

- tag `v1.0.0`
- tag `v0.6.0` as the production-readiness milestone
- complete one small cleanup milestone before v1.0.0

Current recommendation:

Do not promise v1.0.0 before G is complete.

## After Milestone G

After G, choose based on job timeline.

Option 1:

Release and apply for jobs.

This includes final project wording, portfolio case study material, GitHub pinned project polish, and public demo documentation.

Option 2:

Milestone H Advanced Deployment.

Only do this if budget or a strong reason appears.

Possible work:

- paid Render or alternative hosting
- managed PostgreSQL
- object storage
- cloud smoke tests
- production logs
- monitoring
- custom domain

Option 3:

Milestone H Advanced AI.

Only do this after packaging.

Possible work:

- embeddings
- vector database
- hybrid retrieval
- real LLM-generated grounded answers
- RAG answer quality scoring
- retrieval precision and recall metrics
- MLflow or experiment tracking
- persistent object tracking with stable IDs
- additional vision models
- real-time camera or stream support

## Main principle

From this point, every roadmap decision should support this goal:

Make VisionCommand AI easier to understand, trust, demo, and use as proof of applied AI engineering ability.

The project should not keep adding features just because more features are possible.
