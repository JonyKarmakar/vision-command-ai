# F.6 Analysis Memory RAG Demo Guide

This guide shows how to demo the Milestone F analysis-memory RAG workflow in VisionCommand AI.

The goal is to demonstrate grounded retrieval over stored generated output history. The demo should be honest about what the system does and does not do.

## What this demo proves

This demo proves that VisionCommand AI can:

- store generated analysis outputs as reusable workflow memory
- retrieve relevant analysis-memory items from generated output history
- answer questions from retrieved metadata
- show retrieved source cards in the frontend
- explain grounding notes and limitations
- avoid unsupported identity, emotion, and capture-location inferences
- run backend grounding and safety evaluations

## What this demo does not claim

This demo does not claim:

- raw image understanding from pixels inside the analysis-memory chat endpoint
- raw video understanding from frames inside the analysis-memory chat endpoint
- face recognition or identity lookup
- emotion, intent, or mood inference
- capture-location inference
- semantic vector search
- external vector database retrieval
- internet search
- arbitrary document ingestion
- autonomous agents
- real LLM-generated RAG answers

The current analysis-memory chat endpoint uses deterministic metadata retrieval and a grounded rule-based answer layer.

## Prerequisites

Start from a clean main branch:

```bash
cd ~/Projects/vision-command-ai

git checkout main
git pull origin main
git status --short
```

Start the backend:

```bash
cd ~/Projects/vision-command-ai

uvicorn backend.app.main:app --reload
```

Start the frontend in a second terminal:

```bash
cd ~/Projects/vision-command-ai

npm --prefix frontend run dev
```

Open the frontend in the browser using the local Vite URL shown in the terminal.

## Demo story

Use this story when presenting the feature:

VisionCommand AI is not only producing image and video outputs. It can also remember generated analysis outputs as structured analysis memory. The assistant can then answer questions across that stored workflow history and show which retrieved outputs grounded the answer.

## Step 1: Create image analysis outputs

In the frontend:

1. Upload an image.
2. Run object detection.
3. Create at least one generated output, such as zoom, crop, blur, enhance, or background blur.
4. Open Generated Output History.
5. Confirm the generated output appears in the history panel.

Good examples to create:

- annotated detection output
- zoom person output
- blur person output
- enhanced command output

What to say:

The generated output history becomes the first source of analysis memory. Each saved output carries metadata such as label, action, source filename, output filename, result type, command text, parser mode, planner mode, and privacy signals when available.

## Step 2: Create video analysis outputs

In the frontend:

1. Upload a video.
2. Run video object detection or another video workflow.
3. Confirm the result appears in the generated output or workflow history where supported.
4. Keep the video output available for later analysis-memory questions.

Good examples to create:

- video object analysis
- annotated video output
- frame detection output
- tracking-readiness workflow output

What to say:

Video analysis outputs can also become analysis-memory sources when stored as generated outputs. The analysis-memory layer reads metadata from those outputs rather than reprocessing raw video frames.

## Step 3: Persist or load generated output history

In the Generated Output History panel:

1. Use Load Saved History if existing persisted outputs are available.
2. Create fresh outputs if no saved history exists.
3. Confirm there are visible generated output items before asking broad memory questions.

What to say:

Analysis memory is strongest when generated output history is persisted. If persistence is unavailable, the assistant should say that persisted analysis memory is not configured instead of pretending it has memory.

## Step 4: Ask analysis-memory questions

Open the Analysis Memory Chat panel in the assistant workspace.

Try these questions:

- What have I analyzed so far?
- Which outputs mention people?
- Which results may need privacy review?
- Find recent video analyses.
- Summarize the latest generated outputs.

Expected behavior:

- The assistant answers from retrieved generated-output metadata.
- The answer mentions how many analysis-memory items were retrieved.
- Retrieved source cards appear below the answer.
- Grounding notes explain that retrieval is deterministic metadata matching.
- Limitations explain that the endpoint does not inspect raw image pixels or video frames.

What to say:

This is a practical RAG-style workflow. The answer is grounded in retrieved project memory, and the UI exposes the source cards instead of hiding where the answer came from.

## Step 5: Use filters

In the Analysis Memory Chat panel:

1. Set Media to Images.
2. Ask: What have I analyzed so far?
3. Set Media to Videos.
4. Ask: Find recent video analyses.
5. Add a source filename if you want to narrow retrieval to one upload.

Expected behavior:

- Image filtering should focus retrieval on image outputs.
- Video filtering should focus retrieval on video outputs.
- Source filename filtering should narrow retrieval when matching records exist.
- If no records match, the assistant should return a clear no-result answer.

What to say:

These filters make the retrieval behavior inspectable. The system is not claiming broad semantic search. It is doing deterministic retrieval over known metadata fields.

## Step 6: Demo privacy behavior

Ask:

- Which results may need privacy review?
- What should I blur or check before sharing?

Expected behavior:

- If retrieved items contain privacy signals, the assistant should mention them.
- If no strong privacy signal is found, the assistant should still recommend manual review.
- The answer should mention practical review targets such as people, screens, documents, text, license plates, and sensitive objects.

What to say:

The assistant is conservative. It can surface stored privacy signals, but it still recommends manual review because metadata-only retrieval is not a complete privacy scanner.

## Step 7: Demo safety boundaries

Ask unsupported questions:

- Who is this person?
- Is this person happy?
- Where was this video recorded?

Expected behavior:

- For identity questions, the assistant should refuse identity lookup or face recognition.
- For emotion questions, the assistant should refuse emotion, mood, or intent inference.
- For location questions, the assistant should refuse capture-location inference unless explicit metadata or user-provided context exists.

What to say:

This is important for portfolio quality. The system does not overclaim. It gives useful grounded answers where possible and refuses unsupported inferences where needed.

## Step 8: Demo no-result behavior

Ask a question that should not match the available memory, such as:

- Find cat analysis.
- Show bicycle outputs.

Expected behavior:

- The assistant should say it could not find matching analysis memory.
- It should suggest creating new outputs, loading saved history, or asking with a source filename, object class, action, or result type.
- It should not invent sources.

What to say:

A trustworthy RAG system must handle missing context honestly. No-result behavior is part of the product quality, not a failure.

## Step 9: Demo Developer Mode details

Turn on Developer Mode.

In the Analysis Memory Chat panel:

1. Ask a memory question.
2. Expand the response payload.
3. Review retrieval status, retrieval mode, retrieval version, retrieved sources, grounding notes, and limitations.

What to say:

Developer Mode makes the RAG workflow auditable. This supports LLMOps-style evaluation and debugging because the retrieved source payload is visible.

## Step 10: Run backend grounding evaluations

Run the F.5 grounding evaluation tests:

```bash
cd ~/Projects/vision-command-ai

PYTHONPATH=backend pytest backend/tests/test_analysis_memory_grounding_evaluation.py backend/tests/test_analysis_memory_chat_endpoint.py backend/tests/test_analysis_memory.py -q
```

Expected result:

```text
23 passed
```

What to say:

The project includes automated grounding and safety evaluations. They cover relevant retrieval, no-result behavior, privacy behavior, retrieved source cards, identity safety, emotion safety, location safety, and not-configured fallback behavior.

## Demo pass checklist

The demo passes when:

- generated output history contains one or more useful outputs
- Analysis Memory Chat answers a broad memory question
- retrieved source cards are visible
- grounding notes are visible
- limitations are visible
- media and source filename filters can be explained
- privacy questions produce conservative answers
- identity, emotion, and location questions are refused safely
- no-result questions do not invent sources
- backend grounding evaluation tests pass

## Recommended portfolio explanation

Use this wording:

VisionCommand AI includes a practical analysis-memory RAG layer. It retrieves stored generated-output metadata and uses that evidence to answer questions about previous image and video workflows. The frontend shows retrieved source cards and grounding notes, while backend evaluation cases test grounded behavior, source-card presence, no-result handling, privacy behavior, and safety boundaries.

Avoid this wording:

- The system understands all images and videos semantically.
- The system uses vector search.
- The system identifies people.
- The system detects emotions.
- The system knows where an image or video was captured.
- The system is a fully autonomous agent.
- The system performs real LLM RAG answer generation.

## Next recommended improvement

After this demo guide, the next step is the F milestone summary. That summary should decide whether the project is ready to move toward production readiness and v1 packaging, or whether another feature-expansion milestone is needed first.
