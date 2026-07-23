# G.9 v1 Readiness Decision

This document records the Milestone G release-readiness decision for VisionCommand AI.

It does not create a Git tag.

It does not claim that v1.0.0 has been released.

## Decision summary

Current decision:

```text
Defer v1.0.0
```

Recommended next release label:

```text
v0.6.0 production-readiness milestone
```

Reason:

```text
VisionCommand AI is strong as a portfolio-ready local Docker demo, but v1.0.0 should wait until the final smoke checklist is executed, recorded, and attached to a release decision.
```

## Why not v1.0.0 yet

v1.0.0 should represent a stable release with executed final validation evidence.

The project currently has:

- strong local Docker demo readiness
- completed public documentation package
- architecture and deployment diagrams
- final smoke checklist
- professional case study
- passing CI on main after recent documentation PRs

However, the final smoke checklist is currently defined, not yet executed and recorded as formal evidence.

For that reason, v1.0.0 should be deferred.

## Recommended release path

Recommended sequence:

1. complete this G.9 decision document
2. merge the G.9 documentation PR
3. run the G.7 final smoke checklist on `main`
4. record the final smoke result
5. tag `v0.6.0` as the production-readiness milestone if the final smoke result is acceptable
6. consider `v1.0.0` only after another confirmed release-readiness review

## Why v0.6.0 is the safer next label

`v0.6.0` is a better next milestone label because it honestly reflects the current state.

It can represent:

- local Docker demo hardening
- environment and secrets cleanup
- current README rewrite
- architecture and deployment diagrams
- public demo walkthrough package
- final smoke checklist definition
- professional portfolio case study
- v1 readiness decision

It does not overclaim:

- active production cloud hosting
- full production operation
- enterprise-grade deployment
- completed final smoke evidence
- v1 release readiness

## Completed Milestone G evidence

Milestone G completed the following slices:

```text
G.0 Production and deployment context audit
G.1 Production readiness roadmap
G.2 Local Docker demo hardening
G.3 Environment and secrets cleanup
G.4 README rewrite
G.5 Architecture and deployment diagrams
G.6 Demo and walkthrough package
G.7 Final smoke checklist
G.8 Portfolio case study
G.9 v1 readiness decision
```

Main supporting documents:

```text
docs/g-production-readiness-roadmap.md
docs/g0-production-deployment-context-audit.md
docs/g2-local-docker-demo-readiness.md
docs/g3-environment-and-secrets-cleanup.md
docs/g5-architecture-and-deployment-diagrams.md
docs/g6-demo-walkthrough-package.md
docs/g7-final-smoke-checklist.md
docs/g8-portfolio-case-study.md
docs/g9-v1-readiness-decision.md
```

## Current safe project claims

Safe current claims:

- VisionCommand AI is a full-stack applied AI media assistant.
- The project supports image upload, detection, editing, and generated output history.
- The project supports uploaded-video workflows.
- The project supports command parsing, planning, prepared execution, safety hints, and audit summaries.
- The project includes structured image and video chat workflows.
- The project includes analysis-memory RAG-style retrieval over generated outputs.
- The project has a local Docker demo path.
- The project previously had a controlled Render deployment.
- The project has CI-backed frontend and backend validation.
- The project has public documentation for architecture, demo walkthrough, smoke checks, and case study.

## Current unsafe project claims

Avoid these claims:

- the project is currently live as a production cloud service
- the project has guaranteed active cloud hosting
- the project processes live camera streams
- the project performs real-time video stream processing
- the project performs identity recognition
- the project performs emotion recognition
- the project guarantees capture-location inference
- the project has full persistent multi-object tracking in every scenario
- the project has production-grade media storage
- the project has enterprise-grade security and monitoring
- the project is already v1.0.0-ready

## Readiness criteria for v1.0.0

Before v1.0.0, the project should have:

- G.7 final smoke checklist executed on `main`
- final smoke result recorded with commit hash and date
- local Docker demo confirmed from a clean start
- frontend health confirmed
- backend health confirmed
- model info confirmed
- database stats confirmed
- image workflow confirmed
- command workflow confirmed
- generated output history confirmed
- analysis memory confirmed
- at least one lightweight video workflow confirmed
- documentation links reviewed
- limitations reviewed
- release notes prepared
- tag decision recorded

Optional but helpful before v1.0.0:

- current cloud demo manually verified, or cloud status clearly omitted from v1 claims
- screenshot package captured with non-private media
- short demo video recorded
- automated smoke script added

## Final G.9 decision record

Decision:

```text
Defer v1.0.0
```

Recommended next release:

```text
v0.6.0 production-readiness milestone
```

Release tag created by this PR:

```text
No
```

Reason:

```text
Milestone G makes the project significantly easier to run, understand, validate, and present. However, v1.0.0 should wait until the final smoke checklist is executed and recorded as release evidence.
```

## Suggested next actions

After merging this document:

1. run the G.7 final smoke checklist on `main`
2. record the smoke result in a dedicated note or release preparation document
3. decide whether to tag `v0.6.0`
4. prepare public release notes for `v0.6.0` if the smoke result is acceptable
5. defer `v1.0.0` until the project has recorded final validation evidence

## Boundary

G.9 does not create a release tag.

G.9 does not declare v1.0.0 readiness.

G.9 does not state that final smoke validation was already run.

G.9 does not create a cloud deployment.

G.9 does not add product features.

G.9 only records the current readiness decision and recommended release path.
