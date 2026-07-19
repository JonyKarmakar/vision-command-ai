# F.1 Analysis Memory Knowledge Base Design

This document defines the first analysis memory knowledge base design for Milestone F.

The goal is to create a practical RAG foundation over VisionCommand AI outputs without introducing a large framework, external vector database, or unsupported multimodal claims.

## Purpose

Analysis memory should let the assistant retrieve previous project-generated context before answering questions.

The first version should answer questions over data that VisionCommand AI already creates, stores, or displays.

Example user questions:

- What have I analyzed so far?
- Which outputs mention people?
- Which results may need privacy review?
- What source files produced the latest outputs?
- Compare the latest image and video outputs.
- Summarize recent reports with source references.

## Existing foundation

VisionCommand AI already has useful foundations for analysis memory:

- PostgreSQL-backed generated output history
- generated output lineage by source filename
- generated output workflow grouping
- frontend generated output filters
- image chat over structured image context
- video chat over structured video context
- local Ollama support
- rule-based fallback answers
- guarded video chat behavior
- Markdown report export
- Developer Mode metadata visibility

The first analysis memory layer should reuse these foundations before adding heavier retrieval infrastructure.

## Existing generated output fields

The existing generated output record already contains important retrievable metadata:

- `id`
- `action`
- `label`
- `filename`
- `file_url`
- `source`
- `source_filename`
- `created_by`
- `command_text`
- `result_type`
- `execution_mode`
- `parser_mode`
- `parser_type`
- `planner_mode`
- `created_at`

These fields are enough for the first retrieval version.

## Analysis memory item

The first normalized memory item should be called an analysis memory item.

Proposed fields:

- `memory_id`
- `source_record_id`
- `source_record_type`
- `media_type`
- `source_filename`
- `output_filename`
- `file_url`
- `label`
- `action`
- `result_type`
- `command_text`
- `created_by`
- `created_at`
- `summary_text`
- `search_text`
- `detected_classes`
- `privacy_signals`
- `workflow_signals`
- `llm_metadata`
- `limitations`

## Field definitions

### memory_id

Stable ID for the analysis memory item.

For generated outputs, the first version can reuse the generated output `id`.

### source_record_id

ID of the original stored record.

For F.2, this should point to the generated output `id`.

### source_record_type

Type of stored record used to create the memory item.

Initial value:

- `generated_output`

Future values can include:

- `image_analysis_result`
- `video_analysis_result`
- `markdown_report`
- `command_execution_audit`

### media_type

High-level media type.

Initial values:

- `image`
- `video`
- `unknown`

The first version can infer media type from available fields, action names, result types, source values, filenames, or future explicit metadata.

### source_filename

Original uploaded file or workflow source filename when available.

This field is important for questions such as:

- What did I analyze from this source file?
- Which outputs came from this uploaded image?
- Show the workflow history for this file.

### output_filename

Filename of the generated output.

This usually maps to the generated output `filename`.

### file_url

Link to the stored output when available.

This lets the frontend show retrieved source cards with open or download actions.

### label

Human-readable label for the output.

Examples:

- Object detection result
- Cropped person
- Blurred person
- YOLO on generated output
- Annotated video

### action

Machine-readable action that produced the output.

Examples:

- `detect_objects`
- `crop_by_class`
- `blur_by_class`
- `zoom_by_class`
- `video_object_detection`
- `video_report_export`

### result_type

Type of result produced by the workflow.

This helps retrieval answer questions about outputs, reports, detection results, edits, and command results.

### command_text

Original user command when the output came from command execution.

This helps answer workflow questions such as:

- What commands did I run?
- Which outputs came from blur commands?
- What did I ask the assistant to do?

### created_by

Human-readable source of the output.

This helps separate outputs created by direct UI actions from outputs created by command execution or generated-output workflows.

### created_at

Timestamp used for recency ordering.

The first retrieval service should sort newest results first unless the user asks otherwise.

### summary_text

A short text summary generated from structured fields.

Initial examples:

- `Object detection result created from image.jpg using detect_objects.`
- `Generated output crop_person.png created from command crop person.`
- `Video analysis output created from clip.mp4 with privacy review context.`

The first version can use deterministic templates. It does not need an LLM summary.

### search_text

Combined lowercase text used for deterministic retrieval.

It should include:

- label
- action
- result type
- command text
- source filename
- output filename
- created by
- detected class names when available
- privacy signal text when available
- workflow signal text when available

### detected_classes

List of detected object classes when known.

For F.2, this may be empty for generated outputs if the record does not yet store detailed detection JSON.

Future versions can populate it from image detection results, video object detection results, Markdown reports, or richer persisted analysis records.

### privacy_signals

Structured privacy-related hints.

Initial values can include:

- `person_present`
- `privacy_review_available`
- `manual_privacy_check_recommended`
- `unknown`

F.2 can start conservatively and infer only from action, label, command text, result type, or available class names.

### workflow_signals

Workflow-level hints.

Examples:

- `created_by_command`
- `created_from_generated_output`
- `has_source_filename`
- `has_parser_metadata`
- `has_planner_metadata`
- `has_file_url`

### llm_metadata

Optional metadata for LLM and command workflow traceability.

Initial fields can include:

- `execution_mode`
- `parser_mode`
- `parser_type`
- `planner_mode`

### limitations

List of limitations for the memory item.

Examples:

- `Generated output metadata does not include raw image understanding.`
- `Detected classes may be unavailable for this output.`
- `This item links to an output file but does not contain a full report.`
- `Privacy signals are conservative and require manual review.`

## Retrieval scope for F.2

F.2 should retrieve analysis memory items from generated output history first.

In scope:

- retrieve recent generated outputs
- search by keyword
- search by source filename
- search by action
- search by result type
- search by command text
- search by media type when it can be inferred
- return source cards for grounding

Out of scope for F.2:

- vector embeddings
- semantic search claims
- external document ingestion
- internet search
- raw image analysis
- raw video analysis
- automatic report generation
- database schema changes unless clearly needed

## Retrieval result shape

A retrieval response should include:

- `status`
- `query`
- `count`
- `items`
- `filters`
- `retrieval_mode`
- `limitations`

Proposed item shape:

```json
{
  "memory_id": "generated-output-id",
  "source_record_id": "generated-output-id",
  "source_record_type": "generated_output",
  "media_type": "image",
  "source_filename": "source.jpg",
  "output_filename": "crop_person.png",
  "file_url": "/outputs/crop_person.png",
  "label": "Cropped person",
  "action": "crop_by_class",
  "result_type": "image_edit",
  "command_text": "crop person",
  "created_at": "2026-07-19T12:00:00Z",
  "summary_text": "Cropped person output created from source.jpg.",
  "detected_classes": ["person"],
  "privacy_signals": ["person_present"],
  "workflow_signals": ["created_by_command", "has_source_filename"],
  "limitations": [
    "This memory item is based on stored output metadata."
  ]
}
```

## Deterministic retrieval strategy

The first retrieval version should be deterministic and testable.

Recommended scoring signals:

- exact source filename match
- exact output filename match
- exact action match
- exact result type match
- command text match
- label match
- detected class match when available
- privacy signal match when available
- recency boost

The service should not claim semantic vector retrieval until embeddings exist.

## No-result behavior

If no relevant item is found, the retrieval service should return an empty list and a clear limitation.

Example limitation:

- `No matching analysis memory items were found. Try loading persisted generated output history or creating new analysis outputs first.`

The assistant should not invent an answer when retrieval returns no relevant context.

## PostgreSQL unavailable behavior

Existing generated output persistence safely returns `not_configured` when `DATABASE_URL` is unavailable.

F.2 should preserve that behavior.

When PostgreSQL is unavailable, the retrieval service should return:

- `status: not_configured`
- `count: 0`
- empty `items`
- a limitation explaining that persisted analysis memory is unavailable

The frontend can still later send current session context to F.3, but backend persisted retrieval should remain honest.

## Relationship to image chat and video chat

Image chat and video chat answer questions about the current image or current video workflow.

Analysis memory chat should answer questions across previous generated outputs and stored analysis context.

These should remain separate at first:

- image chat: current image context
- video chat: current video context
- analysis memory chat: retrieved stored context across outputs

Future work can combine them, but F.1 and F.2 should keep the boundaries simple.

## Relationship to generated output history

Generated output history is the first source of analysis memory.

The memory layer should not replace generated output history.

It should transform generated output records into retrieval-friendly memory items.

## Relationship to future embeddings

Embeddings can be added later if deterministic retrieval becomes too limited.

A future semantic retrieval version can add:

- embedding text construction
- local embedding model
- vector index
- vector similarity scoring
- hybrid keyword and vector retrieval
- evaluation cases comparing keyword and semantic retrieval

This should not be part of the first F.2 service.

## Relationship to future backend audit persistence

E.4 added a frontend command execution audit summary.

If a later milestone persists command audit records to PostgreSQL, those records can become another analysis memory source.

For F.1, command audit persistence is not required.

## Safety boundaries

Analysis memory must not claim:

- identity recognition
- face recognition
- emotion inference
- private activity inference
- raw image understanding
- raw video understanding
- semantic vector search unless embeddings exist
- complete audit logging unless backend audit persistence exists

## F.1 done criteria

F.1 is done when:

- the analysis memory item model is documented
- the first retrieval source is documented
- deterministic retrieval strategy is documented
- no-result behavior is documented
- PostgreSQL unavailable behavior is documented
- image chat, video chat, and analysis memory chat boundaries are documented
- future embeddings are clearly deferred
- safety boundaries are clear

## Recommended next implementation slice

After F.1, implement F.2 as a backend service only.

Recommended F.2 files:

- `backend/app/services/analysis_memory.py`
- `backend/tests/test_analysis_memory.py`

F.2 should not add a public assistant endpoint yet.

It should only convert generated output records into memory items and retrieve them with deterministic search.
