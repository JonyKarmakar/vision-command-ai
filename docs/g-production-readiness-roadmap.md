# Milestone G: Production Readiness and Portfolio Packaging

This roadmap defines Milestone G for VisionCommand AI after completing Milestone F.

Milestone F added the analysis-memory RAG layer, grounded answers, source cards, safety boundaries, evaluation coverage, and demo documentation. Milestone G should now make the project easier to run, explain, trust, and present as a professional portfolio project.

## Final direction

Milestone G should focus on production readiness and portfolio packaging.

The goal is not to add another large AI feature immediately.

The goal is to make the existing project:

- reliable for local demo
- clear for recruiters and interviewers
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

- temporary free cloud demo before interviews if needed

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

Status: Planned

Purpose:

Make local Docker the official reliable demo path.

Work should verify or improve:

- Docker Compose startup
- backend health endpoint
- frontend startup
- frontend-to-backend API connectivity
- PostgreSQL initialization
- upload and output directory creation
- generated output history behavior
- analysis memory chat behavior
- one image workflow
- one video workflow if local resources allow
- clean stop and restart behavior

Boundary:

This is local production-style demo readiness, not cloud deployment.

## G.3 Environment and secrets cleanup

Status: Planned

Purpose:

Make local, Docker, and optional deployment setup safe and understandable.

Work should review or improve:

- `.env.example`
- backend environment documentation
- frontend environment documentation
- Docker environment documentation
- optional Render environment documentation
- stale Render credential warnings
- secret handling
- `DATABASE_URL` behavior
- `LLM_PROVIDER` behavior
- local-only values versus deployment values

Boundary:

No secrets should be committed. Old Render credentials should not be revived.

## G.4 README rewrite

Status: Planned

Purpose:

Turn the README into a professional portfolio entry point.

The README should clearly explain:

- what VisionCommand AI is
- what problem it solves
- core image, video, command, LLM, and RAG capabilities
- architecture summary
- quickstart
- local Docker demo
- local development setup
- testing commands
- historical Render deployment evidence
- current deployment status
- known limitations
- future roadmap
- portfolio positioning

Boundary:

The README should not present the old Render URLs as guaranteed active production demos.

## G.5 Architecture and deployment diagrams

Status: Planned

Purpose:

Make the system visually understandable.

Diagrams should include:

- full system architecture
- local Docker architecture
- historical Render deployment architecture
- analysis-memory RAG flow
- generated output history and analysis memory flow

Boundary:

Diagrams should show implemented behavior and clearly label historical or optional deployment paths.

## G.6 Demo script and screenshot package

Status: Planned

Purpose:

Prepare the project for interviews, LinkedIn, GitHub, and portfolio presentation.

Work should include:

- 5-minute demo script
- 10-minute technical demo script
- screenshot checklist
- feature walkthrough
- what to say
- what not to say
- backup demo plan if cloud is unavailable
- backup demo plan if Docker fails during an interview

## G.7 Final smoke checklist

Status: Planned

Purpose:

Create one final validation checklist before tagging or release decision.

Checklist should cover:

- backend tests
- frontend build
- frontend lint
- Docker startup
- backend health
- frontend load
- image upload
- object detection
- generated output history
- analysis memory chat
- command workflow
- video workflow if resources allow
- documentation links

## G.8 Portfolio case study

Status: Planned

Purpose:

Create reusable job-application material.

The case study should explain:

- why the project exists
- what problem it solves
- technical architecture
- AI, CV, LLM, and RAG capabilities
- production engineering practices
- evaluation and safety
- deployment lessons
- limitations
- future improvements

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

This includes CV project wording, LinkedIn post, portfolio case study, GitHub pinned project polish, and interview preparation.

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
