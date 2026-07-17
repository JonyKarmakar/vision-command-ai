# VisionCommand AI Career Skill Roadmap

This document tracks how VisionCommand AI supports the user's long-term career positioning across applied AI, computer vision, LLM engineering, LLMOps, MLOps, data engineering, and full-stack AI software development.

It also records advanced features that are intentionally deferred so they are not forgotten or confused with already implemented work.

## Current positioning

VisionCommand AI is a full-stack computer vision and AI assistant project.

The project currently demonstrates:

- a FastAPI backend
- a React and TypeScript frontend
- uploaded image and video workflows
- YOLO-based object detection
- OpenCV and Pillow image/video processing
- PostgreSQL-backed persistence features
- Docker and GitHub Actions CI
- local Ollama integration
- structured image and video chat
- rule-based and guarded LLM answer flows
- professional image analysis workflows
- professional uploaded-video analysis workflows
- Markdown report export
- user/developer mode separation
- tests and milestone documentation

The project should not yet be described as a complete v1.0 AI product.

Current honest status:

- strong full-stack AI/CV portfolio foundation
- strong image and video workflow foundation
- improving command and chat layer
- limited real LLM depth
- limited MLOps depth
- no RAG yet
- no MLflow yet
- no cloud deployment yet
- no real persistent object tracking IDs yet
- no open-vocabulary detection yet
- no multiple deep learning model comparison yet

## Target job roles

VisionCommand AI should gradually build evidence for these target roles:

- AI Engineer
- ML Engineer
- Data Engineer
- LLM Engineer
- LLM Developer
- Applied AI Developer
- Computer Vision Engineer
- AI Software Engineer
- Machine Learning Engineer
- Full-stack AI Developer
- ML Software Engineer
- LLMOps or Evaluation Engineer
- MLOps-oriented AI Engineer

The project does not need to prove all of these at once.

The roadmap should make sure that each role has visible evidence somewhere in the project over time.

## Skills already demonstrated

### Full-stack AI software engineering

Implemented evidence:

- FastAPI backend API design
- React and TypeScript frontend
- reusable frontend sections and workflow panels
- REST API integration
- generated output history
- user/developer mode UI design
- local development workflow
- GitHub pull request workflow
- GitHub Actions CI
- backend and frontend validation
- Docker backend build checks

Relevant roles:

- AI Software Engineer
- Full-stack AI Developer
- Applied AI Developer
- ML Software Engineer

Current limitation:

The app is still local-first and not yet production deployed.

### Computer vision foundation

Implemented evidence:

- YOLO-based object detection
- image annotation
- crop by class
- blur by class
- zoom by class
- background blur around detected objects
- image enhancement controls
- video upload and metadata extraction
- video frame extraction
- sampled video detection
- full uploaded-video object detection pass
- annotated video output
- video object timeline
- video key moments
- keyframe gallery
- object presence strip
- detection-based motion/change summary
- privacy review based on detected classes
- tracking-readiness summary

Relevant roles:

- Computer Vision Engineer
- Applied AI Developer
- AI Engineer
- Machine Learning Engineer

Current limitation:

The project currently relies mostly on a single YOLO-style detector and deterministic post-processing. It does not yet compare multiple vision models or use open-vocabulary detection.

### Structured AI assistant and LLM foundation

Implemented evidence:

- command parser foundation
- command planner foundation
- local Ollama provider support
- rule-based fallback behavior
- real LLM parser flow
- structured image chat
- structured video chat
- image chat grounding notes
- video chat grounding notes
- real_llm_guarded behavior for unsafe video summaries
- provider status UI
- prompt preview and prompt-version metadata
- backend tests for grounded chat behavior

Relevant roles:

- AI Engineer
- LLM Engineer
- LLM Developer
- Applied AI Developer
- AI Software Engineer

Current limitation:

The project does not yet have advanced LLM workflows such as RAG, tool-routing, multi-step agents, evaluation dashboards, prompt regression datasets, or production-grade observability.

### LLMOps and evaluation foundation

Implemented evidence:

- parser evaluation cases
- planner evaluation cases
- command robustness evaluation
- LLM provider status
- parser attempt logs
- command log summaries
- prompt previews
- rule-based fallback
- guarded real LLM output for video chat

Relevant roles:

- LLMOps Engineer
- Evaluation Engineer
- AI Engineer
- LLM Engineer

Current limitation:

This is still early LLMOps. The project needs richer evaluation datasets, scoring, regression tracking, failure taxonomy, prompt version comparison, and optional experiment tracking.

### Software quality and engineering process

Implemented evidence:

- many small scoped PRs
- backend tests
- frontend build and lint checks
- Docker build checks
- milestone documentation
- demo guides
- safety boundaries in documentation
- explicit limitation notes in UI and reports

Relevant roles:

- AI Software Engineer
- ML Software Engineer
- Full-stack AI Developer
- MLOps-oriented AI Engineer

Current limitation:

The project needs stronger production deployment, monitoring, release automation, and environment management before being called production-ready.

## Skills partially demonstrated

These skills are visible but not yet deep enough.

### MLOps

Current evidence:

- Docker build checks
- CI validation
- backend tests
- model-backed inference endpoint behavior
- reproducible local development patterns

Missing:

- MLflow experiment tracking
- model registry
- model versioning
- dataset versioning
- evaluation metrics tracking
- model drift monitoring
- deployment monitoring
- scheduled evaluation jobs
- model lifecycle documentation

### Data engineering

Current evidence:

- structured API responses
- generated output persistence
- PostgreSQL-backed history features
- JSON and Markdown exports
- event-style logs for parser and command behavior

Missing:

- ingestion pipelines
- batch processing
- stream processing
- feature store
- data validation frameworks
- analytics warehouse integration
- cloud storage integration
- production data lineage

### Cloud and production deployment

Current evidence:

- Docker build
- local environment documentation
- CI checks

Missing:

- deployed demo environment
- cloud object storage
- cloud database
- secrets management
- observability
- health checks
- deployment pipeline
- cost-aware cloud architecture
- monitoring and alerting

### Advanced deep learning

Current evidence:

- YOLO-based detection integration
- OpenCV/Pillow processing
- model inference abstraction points

Missing:

- multiple model backends
- model comparison
- custom model training
- fine-tuning
- segmentation
- open-vocabulary detection
- visual grounding
- multimodal model integration
- model evaluation metrics beyond app behavior

## Advanced features intentionally deferred

The following features are important but intentionally skipped for now.

They should not be claimed as implemented until dedicated milestones add them.

### Real object tracking with persistent IDs

Current status:

- tracking readiness is implemented
- real persistent tracking IDs are not implemented

Future scope:

- IoU-based tracking baseline
- SORT-style tracker exploration
- ByteTrack or DeepSORT exploration
- track IDs across processed frames
- track-level first seen and last seen
- track-level confidence summary
- track-level report section
- video chat answers grounded in real track IDs

Relevant roles:

- Computer Vision Engineer
- ML Engineer
- Applied AI Developer

### Open-vocabulary and text-prompted detection

Current status:

- not implemented

Future scope:

- YOLO-World exploration
- Grounding DINO exploration
- OWL-ViT exploration
- Florence-style visual grounding exploration
- text-prompted object search
- unsupported-object fallback improvements
- open-vocabulary detection evaluation

Relevant roles:

- Computer Vision Engineer
- Applied AI Developer
- AI Engineer

### Segmentation and precise editing

Current status:

- rectangular detection-box edits are implemented
- segmentation masks are not implemented

Future scope:

- SAM or similar segmentation integration
- mask-based blur
- mask-based background removal
- mask-based object cutout
- cleaner before/after comparisons
- segmentation quality review

Relevant roles:

- Computer Vision Engineer
- AI Software Engineer
- Full-stack AI Developer

### Actual multimodal vision-language analysis

Current status:

- structured chat uses detection context
- raw video/image understanding by multimodal LLM is not implemented

Future scope:

- image-to-text reasoning with a multimodal model
- visual question answering
- multimodal summary generation
- grounding against detections
- hallucination guardrails
- comparison between detector-only and multimodal answers

Relevant roles:

- AI Engineer
- LLM Engineer
- Applied AI Developer
- Computer Vision Engineer

### RAG for vision workflows

Current status:

- not implemented

Future scope:

- document or policy upload
- vector database integration
- retrieval over project docs, safety policies, or user-provided instructions
- RAG-grounded report generation
- privacy policy review against uploaded policy
- citation-backed answers

Relevant roles:

- LLM Engineer
- LLM Developer
- AI Engineer
- Applied AI Developer

### LLM agents and tool use

Current status:

- command and planner foundation exists
- true agentic tool execution is not yet implemented

Future scope:

- command skills registry
- tool selection
- multi-step workflows
- planning with validation
- safe execution boundaries
- retry and clarification loops
- command-driven report generation

Relevant roles:

- AI Engineer
- LLM Engineer
- Applied AI Developer
- Full-stack AI Developer

### LLMOps and evaluation

Current status:

- basic parser/planner evaluation and prompt metadata exist
- full evaluation framework is not implemented

Future scope:

- prompt regression datasets
- answer grading criteria
- hallucination checks
- grounding checks
- safety checks
- prompt version comparison
- automated evaluation dashboard
- stored evaluation results
- human review workflow

Relevant roles:

- LLMOps Engineer
- Evaluation Engineer
- LLM Engineer
- AI Engineer

### MLOps and MLflow

Current status:

- not implemented beyond Docker/CI basics

Future scope:

- MLflow experiment tracking
- model registry
- model version comparison
- dataset version references
- evaluation metrics logging
- model artifact tracking
- inference run logging
- model card documentation

Relevant roles:

- MLOps-oriented AI Engineer
- ML Engineer
- Machine Learning Engineer
- ML Software Engineer

### Cloud deployment

Current status:

- not implemented

Future scope:

- cloud deployment architecture
- container deployment
- managed database
- object storage for uploads/outputs
- secret management
- monitoring
- logging
- cost-aware deployment plan
- public or private demo environment

Relevant roles:

- AI Software Engineer
- Full-stack AI Developer
- MLOps-oriented AI Engineer
- Data Engineer

### Data engineering and analytics

Current status:

- limited structured logging and persistence exist

Future scope:

- event logging pipeline
- usage analytics
- workflow analytics
- evaluation result storage
- batch report generation
- data validation
- dashboard for app usage and model behavior

Relevant roles:

- Data Engineer
- AI Engineer
- MLOps-oriented AI Engineer

## Roadmap from current state

Current completed milestones:

- Milestone B: Real Local LLM Assistant Command Flow
- Milestone C: Structured Image Chat Analysis
- Milestone D: Structured Video Chat Analysis
- Milestone E.1: Command and chat robustness
- Milestone E.2: Professional image analysis workflow
- Milestone E.3: Professional video analysis workflow

Correct next milestone:

- Milestone E.4: Command-driven workflow upgrade

Packaging and v1 release remain postponed until after E.4.

## E.4 Command-driven workflow upgrade

Purpose:

Make VisionCommand AI feel like a command assistant, not only a UI with buttons.

Planned slices:

### E.4.1 Command skills registry

Goals:

- define supported command skills
- map skills to current image/video workflows
- define required context for each skill
- define outputs and limitations
- prepare command execution for multi-step workflows

Example skills:

- analyze image
- create image privacy report
- create image analysis report
- detect video objects
- create video analysis report
- summarize video timeline
- review video privacy
- summarize tracking readiness
- explain supported classes
- clarify unsupported requests

### E.4.2 Context-aware command execution

Goals:

- make commands use existing uploaded image/video context
- reuse existing detection results where possible
- ask for missing context when needed
- avoid rerunning expensive workflows unnecessarily
- provide clearer command result summaries

Example commands:

- analyze this image
- create a privacy report for this image
- summarize this video
- find people in the video and summarize when they appear
- show key moments with sports ball
- export a video analysis report

### E.4.3 Command-driven reports

Goals:

- allow commands to trigger existing report workflows
- generate image report from command
- generate video report from command
- summarize report sections in chat

### E.4.4 Multi-step vision workflows

Goals:

- support simple workflow chains
- validate each step before execution
- keep user-visible progress and results clear

Example workflows:

- detect people, blur them, compare before and after
- detect video objects, summarize timeline, export report
- analyze image, review privacy, export Markdown report

### E.4.5 Shared command and chat vocabulary

Goals:

- align command parser, image chat, and video chat vocabulary
- improve aliases and supported-class explanations
- reduce differences between button workflows, chat answers, and command execution

### E.4.6 E.4 demo guide

Goals:

- document command-driven workflow demo
- define safe portfolio wording
- explain what is command-driven and what remains manual

## Future milestone candidates after E.4

### E.5 Advanced Computer Vision Models

Possible scope:

- real tracking Option B
- segmentation
- open-vocabulary detection
- model comparison
- custom model support

### E.6 LLM and RAG Upgrade

Possible scope:

- RAG over project docs or policy documents
- stronger LLM tool routing
- multimodal LLM exploration
- grounded report generation
- LLM-assisted workflow explanations

### E.7 LLMOps and Evaluation

Possible scope:

- prompt evaluation dataset
- answer-quality scoring
- safety and hallucination checks
- prompt version comparison
- evaluation dashboard

### E.8 MLOps and MLflow

Possible scope:

- MLflow tracking
- model registry
- experiment logging
- inference metadata logging
- model card documentation

### E.9 Cloud and Production Readiness

Possible scope:

- containerized deployment
- cloud storage
- managed database
- monitoring
- secrets management
- production architecture documentation

### F.1 v1.0 Readiness Review

Purpose:

Decide whether the project is ready to be called v1.0.

This should happen only after E.4 and enough advanced roadmap clarity.

### F.2 Portfolio Release Polish

Purpose:

Prepare the project for GitHub, LinkedIn, CV, and interviews.

Scope:

- final README polish
- project screenshots
- demo script
- release notes
- CV bullets
- LinkedIn post
- interview explanation

## Role-to-feature mapping

### AI Engineer

Strong evidence already:

- AI workflow design
- image/video assistant features
- local LLM integration
- grounded chat
- full-stack AI app structure

Future evidence needed:

- stronger LLM workflows
- RAG
- cloud deployment
- evaluation framework

### ML Engineer

Strong evidence already:

- model inference integration
- backend inference APIs
- tests around model-backed workflows

Future evidence needed:

- model evaluation
- model comparison
- experiment tracking
- model registry
- MLflow

### Data Engineer

Strong evidence already:

- structured outputs
- persistence patterns
- logs and report exports

Future evidence needed:

- data pipelines
- storage architecture
- analytics dashboard
- event processing
- cloud data integration

### LLM Engineer or LLM Developer

Strong evidence already:

- local LLM integration
- prompt previews
- image/video chat
- grounded answer patterns

Future evidence needed:

- RAG
- tool-calling workflows
- prompt evaluation
- agentic workflow orchestration
- advanced context management

### Applied AI Developer

Strong evidence already:

- practical AI workflows
- UI-driven image/video analysis
- reports and user-facing outputs
- privacy review features

Future evidence needed:

- command-driven workflows
- deployment
- broader model support

### Computer Vision Engineer

Strong evidence already:

- object detection
- image/video processing
- temporal video summaries
- annotated outputs
- privacy and tracking-readiness analysis

Future evidence needed:

- real tracking
- segmentation
- open-vocabulary detection
- model evaluation
- custom training or fine-tuning

### AI Software Engineer

Strong evidence already:

- backend and frontend product architecture
- API design
- CI and tests
- user/developer modes
- structured reports

Future evidence needed:

- production deployment
- monitoring
- scalable architecture
- stronger error handling and observability

### Full-stack AI Developer

Strong evidence already:

- React frontend
- FastAPI backend
- AI workflow UI
- generated outputs
- report export
- chat and command interface

Future evidence needed:

- hosted demo
- auth or multi-user architecture if needed
- cloud storage
- production deployment flow

### LLMOps or Evaluation Engineer

Strong evidence already:

- prompt metadata
- parser and planner evaluation
- guarded answer behavior
- provider status

Future evidence needed:

- evaluation dashboard
- stored eval runs
- answer scoring
- prompt regression testing
- hallucination and grounding metrics

### MLOps-oriented AI Engineer

Strong evidence already:

- CI
- Docker
- model-backed API workflows

Future evidence needed:

- MLflow
- model registry
- experiment tracking
- monitoring
- deployment pipeline
- model cards

## Portfolio claim boundaries

Safe current wording:

- Built a full-stack AI computer vision assistant with image and uploaded-video workflows.
- Integrated YOLO-based object detection with FastAPI and React.
- Built professional image and uploaded-video analysis workflows with reports and grounded chat.
- Added local LLM support with rule-based fallback and grounding guardrails.
- Implemented CI, tests, Docker checks, and milestone documentation.

Avoid current overclaims:

- production-ready AI platform
- real-time video intelligence
- live camera tracking
- identity recognition
- face recognition
- emotion detection
- general activity recognition
- autonomous agentic AI
- enterprise MLOps platform
- full RAG system
- cloud-native production system
- persistent object tracking IDs

Future wording after later milestones:

- Add only after implementation and validation.
- Keep each claim tied to a specific feature, PR, or demo.

## Immediate next step

The next implementation milestone should be:

Milestone E.4 Command-driven workflow upgrade.

Recommended first slice:

PR #514 or next available PR: Add command skills registry.

The command skills registry should define what the assistant can do, what context each skill needs, which current workflow it maps to, and which limitations apply.

## Long-term principle

VisionCommand AI should become a flagship project through controlled milestone growth.

The goal is not to endlessly add random features.

The goal is to build a project that can honestly support strong interview conversations for applied AI, computer vision, LLM engineering, full-stack AI, LLMOps, MLOps, and production-oriented AI software roles.

## E.4 implementation status

E.4 has started with the command skills registry.

The registry is documented in `docs/e4-command-driven-workflow-upgrade.md` and exposed through backend command skill endpoints.

This is the foundation for future command-driven workflow routing. It does not yet mean all image and video workflows are fully command-triggered.
