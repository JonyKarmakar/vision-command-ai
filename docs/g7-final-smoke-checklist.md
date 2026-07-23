# G.7 Final Smoke Checklist

This document defines the final smoke checklist for VisionCommand AI before a release-readiness decision.

It is a checklist document, not a record that all checks have already passed.

## Purpose

G.7 provides one final validation path for the current local demo and documentation state.

Use this checklist before:

- tagging a release
- recording a v1 readiness decision
- capturing final demo screenshots
- preparing the final portfolio case study
- sharing the project as a stable local demo

## Scope

This checklist validates the current recommended demo path:

```text
Local Docker Compose
```

It also checks that documentation, CI, known limitations, and project claims remain consistent.

This checklist does not validate an active production cloud deployment.

## Required starting state

Before running this checklist:

- work from the repository root
- start from `main`
- pull the latest remote changes
- keep model artifacts out of Git
- use non-private sample media
- avoid exposing secrets or personal data in screenshots

Commands:

```bash
git checkout main
git pull origin main
git status --short
```

Expected result:

```text
Working tree is clean.
```

## 1. Repository and branch checks

| Check | Command or action | Expected result |
| --- | --- | --- |
| Current branch | `git branch --show-current` | `main` |
| Remote sync | `git pull origin main` | already up to date |
| Working tree | `git status --short` | no output |
| Large artifacts | inspect `backend/storage` and model files | not staged for Git |

## 2. CI checks

Verify that the latest `main` branch checks are passing.

Command:

```bash
gh run list --branch main --limit 5
```

Expected result:

- latest Frontend CI run passed
- latest Backend CI run passed
- no blocking failed checks on the target main commit

Minimum required GitHub Actions checks:

- Frontend CI
- Backend Docker image build
- Backend tests

## 3. Local Docker startup

Start the local full-stack demo.

```bash
docker compose down --remove-orphans
docker compose up --build -d
```

Wait for startup:

```bash
sleep 20
docker compose ps
```

Expected services:

- PostgreSQL container is running
- backend container is running
- frontend container is running

## 4. Backend and frontend health checks

Backend health:

```bash
curl -sS http://localhost:8000/health
```

Frontend proxy health:

```bash
curl -sS http://localhost:5173/api/health
```

Model info through frontend proxy:

```bash
curl -sS http://localhost:5173/api/model/info
```

Database stats through frontend proxy:

```bash
curl -sS http://localhost:5173/api/db/stats
```

Generated output history through frontend proxy:

```bash
curl -sS "http://localhost:5173/api/db/generated-outputs?limit=3"
```

Expected result:

- health endpoints respond successfully
- model info endpoint responds
- database endpoint responds
- generated output history endpoint responds

## 5. Frontend load check

Open:

```text
http://localhost:5173
```

Expected result:

- the frontend loads without a blank screen
- User Mode is available
- upload controls are visible
- main workflow panels are usable

Optional browser check:

- open browser developer tools
- confirm there are no repeated API failures
- confirm there are no obvious uncaught runtime errors

## 6. Image workflow smoke check

Use a small non-private image.

Required checks:

- upload image
- preview uploaded image
- run object detection
- confirm detection result appears
- confirm annotated output appears when requested
- confirm object inventory appears when detections are available
- confirm spatial summary appears when detections are available
- confirm object crop gallery appears when detections are available
- run one crop or blur action by class
- confirm generated output appears in history

Expected result:

```text
Image upload, detection, analysis panels, editing action, and generated output history work through the frontend.
```

## 7. Command workflow smoke check

Use a simple command after an image has been uploaded and detected.

Recommended commands:

```text
crop person
blur person
find person
```

Required checks:

- command is accepted
- plan or parsed result is shown
- prepared execution details appear where applicable
- manual confirmation gate appears where applicable
- command execution produces a result or clear message
- command audit summary appears where applicable
- unsupported classes or incomplete commands produce clear feedback

Expected result:

```text
Command parsing, planning, prepared execution, safety feedback, and result display work through the frontend.
```

## 8. Generated output history smoke check

Required checks:

- create at least one image-generated output
- create at least one command-generated output if possible
- inspect generated output history
- remove one item if safe
- reload saved history
- confirm the panel remains usable after clear or reload actions

Expected result:

```text
Generated output history remains visible, usable, and connected to backend persistence when DATABASE_URL is configured.
```

## 9. Analysis memory smoke check

Prerequisite:

- at least one generated output exists or saved history is loaded

Required checks:

- open Analysis Memory Chat
- ask a question about previous outputs
- confirm grounded answer appears
- confirm source cards appear when matching outputs exist
- confirm limitations or no-result notes appear when context is insufficient
- confirm private or unsupported claims are not invented

Example questions:

```text
What outputs were generated from this image?
Which results include a person?
Summarize the previous generated outputs.
```

Expected result:

```text
Analysis memory chat returns grounded responses from saved/generated output context and shows source-card based support when available.
```

## 10. Video workflow smoke check

Use a short non-private video.

Required checks:

- upload video
- confirm video metadata appears
- trim a short clip or extract one frame
- run detection on one extracted frame or sampled frames
- confirm video result appears in chronological order
- confirm keyframe gallery, object presence, timeline, privacy review, or summary panels appear where applicable

Expected result:

```text
Uploaded-video workflows run through the frontend and produce reviewable outputs.
```

Resource note:

- prefer short videos
- prefer sampled-frame operations for smoke testing
- avoid large videos during final smoke checks

## 11. Documentation link review

Review these public documentation files:

```text
README.md
docs/README.md
docs/g-production-readiness-roadmap.md
docs/g5-architecture-and-deployment-diagrams.md
docs/g6-demo-walkthrough-package.md
docs/g7-final-smoke-checklist.md
```

Required checks:

- README links to current Milestone G docs
- docs index includes current G.7 checklist
- roadmap marks G.7 as the current implemented checklist document
- current cloud deployment claims are historical or optional only
- local Docker is presented as the primary current demo path
- limitations are visible and honest

## 12. Known limitation review

Confirm the project does not claim:

- active production cloud hosting
- live camera or real-time stream processing
- identity recognition
- emotion recognition
- guaranteed capture-location inference
- full persistent multi-object tracking in every scenario
- persistent production media storage
- enterprise-grade security or monitoring
- v1 production readiness before the G.9 decision

## 13. Stop local Docker demo

Stop containers while keeping the local database volume:

```bash
docker compose down --remove-orphans
```

Only remove volumes when intentionally resetting local data:

```bash
docker compose down --volumes --remove-orphans
```

## 14. Final decision record

After completing the checklist, record the result in the release or readiness notes.

Recommended decision labels:

```text
PASS
PASS WITH NOTES
BLOCKED
NOT RUN
```

Recommended decision fields:

```text
Date:
Commit:
Environment:
Docker status:
CI status:
Image workflow:
Video workflow:
Command workflow:
Generated output history:
Analysis memory:
Documentation links:
Known limitations:
Decision:
Notes:
```

## Minimum pass criteria

A minimum local release-readiness pass requires:

- latest main CI is passing
- local Docker stack starts
- frontend loads
- backend health responds
- frontend proxy health responds
- model info responds
- database stats responds
- image upload works
- image detection works
- one generated output is visible
- one command workflow is validated
- analysis memory returns a grounded answer or clear no-result response
- one lightweight video workflow is validated
- documentation links are current
- limitations remain honest

## Related documentation

```text
docs/deployment-smoke-test-checklist.md
docs/g2-local-docker-demo-readiness.md
docs/g5-architecture-and-deployment-diagrams.md
docs/g6-demo-walkthrough-package.md
```

## Boundary

G.7 does not run the smoke test automatically.

G.7 does not claim all checks have passed.

G.7 does not create a release tag.

G.7 does not create a cloud deployment.

G.7 does not add screenshots or generated media.

G.7 only defines the final validation checklist to use before the G.9 readiness decision.
