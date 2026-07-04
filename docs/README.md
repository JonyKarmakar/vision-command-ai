# VisionCommand AI Documentation

This folder contains the technical and product documentation for VisionCommand AI.

The main repository `README.md` provides the high-level project landing page. This documentation folder contains deeper references for architecture, walkthroughs, deployment, command intelligence, releases, and operational planning.

---

## Start Here

Recommended reading order:

1. `../README.md`
2. `docs/product-walkthrough.md`
3. `docs/architecture-overview.md`
4. `docs/api-and-feature-reference.md`
5. `docs/deployment-hardening-plan.md`

This order gives a reviewer the project overview first, then the product behavior, then the system architecture, then the detailed technical reference, and finally the deployment hardening plan.

---

## Product and Workflow Documentation

### Product walkthrough

```text
docs/product-walkthrough.md
```

Explains the main image, video, AI Assistant, User Mode, and Developer Mode workflows.

Use this document to understand how the application behaves from a product and engineering perspective.

### Walkthrough assets

```text
docs/walkthrough-assets.md
```

Defines recommended screenshots, sample media references, expected outputs, naming conventions, and asset quality guidelines.

Use this document before adding screenshots or sample media to the repository.

### Workspace recovery

```text
docs/workspace-recovery-flow.md
```

Documents workspace recovery behavior and workflow state restoration.

---

## Architecture and Technical Design

### Architecture overview

```text
docs/architecture-overview.md
```

Explains the frontend, backend, media-processing services, command intelligence layer, persistence layer, observability features, deployment setup, testing strategy, and CI/CD workflow.

### API and feature reference

```text
docs/api-and-feature-reference.md
```

Preserves the detailed API, feature inventory, endpoint notes, and technical reference material from the previous long README.

### Project vision and roadmap

```text
docs/project-vision-and-ai-roadmap.md
```

Describes the broader product direction and AI roadmap for VisionCommand AI.

---

## LLM and Command Intelligence Documentation

### LLM command parser architecture

```text
docs/llm-command-parser-architecture.md
```

Documents the command parser design, parser modes, LLM-backed command interpretation, and related command intelligence behavior.

### Command planner design

```text
docs/command-planner-design.md
```

Documents command planning, prepared execution, planner behavior, and validation concepts.

---

## Deployment Documentation

### Deployment hardening plan

```text
docs/deployment-hardening-plan.md
```

Defines the next engineering steps for improving the project from a public demo deployment toward a more reliable production-style deployment.

### Deployment readiness summary

```text
docs/deployment-readiness-summary.md
```

Summarizes deployment readiness status and related checks.

### Deployment smoke test checklist

```text
docs/deployment-smoke-test-checklist.md
```

Provides a checklist for validating deployment behavior after release or redeployment.

### Render deployment evidence

```text
docs/render-deployment-evidence.md
```

Documents evidence from the first Render deployment and smoke testing process.

### Render runbook and troubleshooting

```text
docs/render-first-deployment-runbook.md
docs/render-troubleshooting-notes.md
docs/render-blueprint-draft.md
docs/render-deployment-checklist.md
```

Contain Render-specific deployment setup, checklist, runbook, and troubleshooting notes.

---

## Environment and Storage Documentation

### Environment variables

```text
docs/environment-variables.md
```

Documents environment variables used by the backend, frontend, and deployment setup.

### Production environment checklist

```text
docs/production-env-checklist.md
```

Defines production environment checks and required configuration areas.

### Storage planning

```text
docs/media-storage-plan.md
docs/storage-cost-and-options.md
```

Documents storage considerations, media persistence options, and cost-related planning.

### Model artifact strategy

```text
docs/model-artifact-strategy.md
docs/dockerignore-model-artifacts.md
```

Documents how model artifacts and large files should be handled in development and deployment.

---

## Container and Build Documentation

```text
docs/backend-container-readiness.md
docs/backend-port-env-support.md
docs/frontend-production-build.md
docs/cloud-deployment-targets.md
```

These documents cover backend container readiness, port environment support, frontend production build behavior, and cloud deployment targets.

---

## Documentation Assets

```text
docs/assets/README.md
```

Use this document to understand the placeholder folder structure for future walkthrough screenshots, sample inputs, sample outputs, and rendered diagrams.

The asset folders are intentionally lightweight and should not be used for large videos, private media, or temporary generated files.

---

## Release Notes

Release notes are stored in:

```text
docs/releases/
```

Available release notes:

```text
docs/releases/v0.3.0.md
docs/releases/v0.4.0.md
docs/releases/v0.5.0.md
docs/releases/v0.5.1.md
docs/releases/v0.5.2.md
```

Use release notes to understand major completed milestones and how the project evolved.

---

## Documentation Maintenance Guidelines

When adding or changing documentation:

- Keep the main `README.md` focused as a GitHub landing page.
- Put detailed API and endpoint material in `docs/api-and-feature-reference.md`.
- Put walkthrough behavior in `docs/product-walkthrough.md`.
- Put architecture and system design in `docs/architecture-overview.md`.
- Put deployment production-readiness planning in `docs/deployment-hardening-plan.md`.
- Keep documentation focused on product behavior, architecture, operations, and engineering decisions.
- Avoid committing large media files unless intentionally selected and documented.
- Update this index when adding a new major documentation file.

---

## Current Documentation Structure

```text
README.md
docs/
├── README.md
├── api-and-feature-reference.md
├── architecture-overview.md
├── product-walkthrough.md
├── walkthrough-assets.md
├── deployment-hardening-plan.md
├── deployment-readiness-summary.md
├── deployment-smoke-test-checklist.md
├── environment-variables.md
├── production-env-checklist.md
├── render-deployment-evidence.md
├── render-first-deployment-runbook.md
├── render-troubleshooting-notes.md
├── project-vision-and-ai-roadmap.md
├── llm-command-parser-architecture.md
├── command-planner-design.md
├── workspace-recovery-flow.md
└── releases/
```
- [Local AI Demo Guide](local-ai-demo.md) - Run and present the Ollama-backed Local AI assistant flow.
