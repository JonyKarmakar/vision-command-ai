# F LLM and RAG Expansion Roadmap

Status: Planned

Milestone F starts after Milestone E.4 Command-driven Workflow Upgrade.

E.4 made the command workflow more inspectable and safer. Milestone F should now make the assistant more knowledgeable across previous analysis outputs, reports, and workflow history.

The goal is to add a practical RAG-style layer without turning VisionCommand AI into an endless framework experiment.

## Why this milestone exists

VisionCommand AI already demonstrates strong computer vision workflows, uploaded-video analysis, command planning, prepare-execution safety, and frontend traceability.

The main missing signal before v1 is deeper LLM engineering.

Milestone F should address that by allowing the assistant to retrieve previous image and video analysis context, answer questions across stored outputs, and show where the answer came from.

## What RAG means in this project

RAG in VisionCommand AI should mean retrieval-augmented answers over project-generated analysis context.

The first version should use data the app already produces:

- generated output history
- image detection summaries
- image workflow outputs
- video detection summaries
- video object timelines
- video key moments
- video privacy reviews
- tracking readiness summaries
- Markdown analysis reports
- command execution context when available

The assistant should retrieve relevant stored context before answering.

It should not guess from memory when stored evidence exists.

## What RAG should not mean yet

The first F milestone should not start with:

- a large external vector database
- LangChain-heavy architecture
- internet search
- chatbot over arbitrary websites
- autonomous multi-agent workflows
- cloud-only LLM dependency
- raw image or raw video multimodal reasoning
- private identity recognition
- unsupported activity inference

These can be future options, but they should not block v1.

## Existing project foundations

The project already has useful building blocks for F:

- PostgreSQL-backed generated output history
- generated output lineage by source filename
- image chat over structured image context
- video chat over structured video context
- local Ollama support
- rule-based fallback answers
- guarded video chat behavior
- command planning and prepare-execution metadata
- frontend JSON copy and download evidence
- Markdown report export

Milestone F should reuse these foundations before adding heavier infrastructure.

## F.0 LLM and RAG expansion roadmap

Status: Planned for PR #529

Purpose:

- define the F milestone scope
- define what RAG means for this project
- prevent unnecessary framework creep
- keep v1 scope realistic
- document safety boundaries before implementation

Expected output:

- `docs/f-llm-rag-expansion-roadmap.md`
- update the career skill roadmap to reference Milestone F

## F.1 Analysis knowledge base design

Status: Implemented in PR #530

Purpose:

Define a simple analysis memory model over existing generated outputs and analysis results.

Design document:

- `docs/f1-analysis-memory-knowledge-base-design.md`

The design explains:

- what counts as a retrievable analysis memory item
- how generated output records map into memory items
- which fields are searchable
- how source filenames and workflow lineage are preserved
- how no-result behavior should work
- how PostgreSQL unavailable behavior should work
- how image chat, video chat, and analysis memory chat should remain separate at first
- why deterministic retrieval comes before vector embeddings

Boundary:

This slice is design and service-shape focused. It does not add retrieval code, a public RAG endpoint, semantic embeddings, a vector database, frontend behavior, LLM behavior, or vision model behavior.

## F.2 Backend retrieval service over generated outputs

Status: Implemented in PR #531

Purpose:

Add a backend retrieval service that searches stored analysis outputs.

Implemented service:

- `backend/app/services/analysis_memory.py`

Implemented tests:

- `backend/tests/test_analysis_memory.py`

The first retrieval version uses deterministic search:

- keyword matching
- class-name hints from stored metadata
- media-type filtering
- result-type filtering
- source filename filtering
- action filtering
- recency ordering
- limit handling

The service can convert generated output records into analysis memory items and retrieve them with a deterministic score.

Boundary:

This is a backend service and test slice only. It does not add a public API endpoint, frontend behavior, LLM answer generation, semantic embeddings, vector search, internet search, or arbitrary document ingestion.

## F.3 RAG answer endpoint

Status: Planned

Purpose:

Add an assistant endpoint that retrieves relevant analysis memory and answers with grounded context.

Candidate endpoint:

- `POST /assistant/analysis-memory-chat`

The endpoint should accept:

- user question
- response mode
- optional media type filter
- optional source filename filter
- optional limit
- optional current workflow context

The response should include:

- answer
- responder type
- prompt version
- retrieved item count
- retrieved sources
- grounding notes
- limitations

Boundary:

The answer must be grounded in retrieved items. If nothing relevant is found, the assistant should say that clearly.

## F.4 Frontend analysis memory chat panel

Status: Planned

Purpose:

Add a frontend panel where the user can ask questions across previous generated outputs and analysis results.

The panel should show:

- question input
- example questions
- answer
- retrieved source count
- retrieved source cards
- grounding notes
- responder type
- prompt version in Developer Mode

Example questions:

- What have I analyzed so far?
- Which outputs mention people?
- Which results may need privacy review?
- Compare the recent image and video outputs.
- Find generated outputs from this source file.
- Summarize the latest analysis reports.

Boundary:

The panel should not replace image chat or video chat. It should answer across analysis memory.

## F.5 RAG grounding and safety evaluation cases

Status: Planned

Purpose:

Add backend tests and evaluation cases for retrieval and grounded answer behavior.

Evaluation should cover:

- relevant retrieval
- no-result behavior
- privacy question behavior
- source citation behavior
- unsupported identity or emotion questions
- stale or missing context
- local fallback behavior
- real LLM guarded behavior when available

Boundary:

This does not need a full evaluation dashboard yet. It should create a reliable foundation for future LLMOps work.

## F.6 RAG demo guide

Status: Planned

Purpose:

Document how to demo the analysis memory and RAG workflow.

The guide should show:

- how to create image and video analysis outputs
- how to persist or load generated output history
- how to ask analysis-memory questions
- how to inspect retrieved sources
- how to verify grounded answers
- how to explain limitations honestly

Boundary:

The guide should not claim raw multimodal reasoning or autonomous agents.

## F.7 F milestone summary

Status: Planned

Purpose:

Summarize what Milestone F implemented and decide whether the project is ready to move to production readiness and v1 packaging.

The summary should document:

- completed F slices
- what the RAG layer proves
- what it does not prove
- safety boundaries
- deferred advanced LLM work
- recommendation for the next milestone

## Expected completed F capability

At the end of F, VisionCommand AI should be able to answer questions such as:

- What have I analyzed so far?
- Which generated outputs include people?
- Which video analyses had privacy concerns?
- What source files produced the latest outputs?
- Compare the latest image and video analysis results.
- Summarize recent reports with source references.

The answer should be based on retrieved analysis memory, not unsupported guessing.

## Safety boundaries

Milestone F must preserve these boundaries:

- no identity recognition
- no face recognition unless an implemented detector explicitly supports it later
- no emotion inference
- no private activity inference
- no raw video understanding claim
- no raw image multimodal model claim unless implemented later
- no internet search
- no arbitrary personal-data document ingestion
- no claim that local LLM answers are always correct
- no claim that retrieval is semantic unless embeddings are actually implemented

## Implementation principles

Use small PRs.

Prefer boring, testable services over heavy frameworks.

Reuse existing project data before adding new infrastructure.

Keep local-first behavior working.

Keep rule-based fallback behavior available.

Add tests before broadening the feature.

Keep Developer Mode transparent.

Show retrieved sources instead of hiding them.

Say when no relevant context is found.

## Recommended PR sequence

Recommended implementation sequence:

- PR #529: Add F LLM and RAG expansion roadmap
- F.1: Add analysis memory design document
- F.2: Add backend analysis memory retrieval service
- F.3: Add analysis memory chat endpoint
- F.4: Add frontend analysis memory chat panel
- F.5: Add RAG grounding and safety evaluation cases
- F.6: Add RAG demo guide
- F.7: Add F milestone summary

The sequence can change if implementation reveals a better order, but the milestone should stay focused.

## v1 relationship

Milestone F is required before v1 because it addresses the current lack of visible RAG and deeper LLM engineering.

Completing F does not automatically make the project v1.0 ready.

After F, the project should still complete production readiness and portfolio packaging before a v1.0 release.
