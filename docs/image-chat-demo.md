# Image Chat Demo Guide

This guide explains how to demo the VisionCommand AI image chat workflow.

Image Chat lets a user ask natural questions about the current image. The first v1 version answers from structured image and workflow context, including upload metadata, detection results, generated outputs, active generated image source, and command results.

It does not yet send raw image pixels to a multimodal vision-language model.

## What this demonstrates

Image Chat demonstrates that VisionCommand AI can do more than execute image commands. It can also answer questions about the current image workflow.

The demo shows:

- Natural question answering about the current image
- Object-summary answers from detection context
- Privacy guidance from detected classes
- Workflow-history answers from generated outputs
- Rule-based fallback when Local AI is unavailable
- Local AI answers when Ollama is available
- Developer Mode context summary for transparency

## Feature entry point

In the frontend, upload an image and open the assistant area.

The panel is titled:

    Ask about this image

Example questions are shown as quick actions.

The backend endpoint is:

    POST /assistant/image-chat

The frontend sends structured context to the backend, and the backend returns an assistant answer.

## Context used by Image Chat

The first v1 version uses structured context already available in the app.

Possible context includes:

- upload result
- detection result
- crop result
- blur result
- command result
- generated output history
- active generated image source

This makes the answer grounded in the workflow, not invented from an unseen image.

## User Mode demo

1. Start the backend.
2. Start the frontend.
3. Upload an image.
4. Run object detection or an assistant command that creates image context.
5. Go to the assistant card.
6. Find Ask about this image.
7. Choose an example question or type your own.
8. Click Ask image.
9. Review the assistant answer.

Recommended questions:

    What do you see in this image?
    What objects are detected?
    What should I blur for privacy?
    What did I do to this image so far?

## Rule-based fallback demo

The rule-based fallback works without Ollama or OpenAI.

Start backend with LLM settings disabled:

    cd backend

    env -u DATABASE_URL -u LLM_PROVIDER -u OLLAMA_MODEL -u OLLAMA_BASE_URL \
      uvicorn app.main:app --reload

Ask:

    What should I blur for privacy?

Expected behavior:

- The assistant answers from structured detection/workflow context.
- The answer source shows rule_based.
- The answer stays available even when Local AI is not configured.

This fallback makes the feature safe for normal development, CI, and demos where Ollama is unavailable.

## Local AI image chat demo

Start Ollama:

    ollama serve

Check that the model is installed:

    ollama list

Recommended local model:

    llama3.2:1b

Start backend with Ollama enabled:

    cd backend

    env -u DATABASE_URL \
      LLM_PROVIDER=ollama \
      OLLAMA_MODEL=llama3.2:1b \
      OLLAMA_BASE_URL=http://localhost:11434 \
      uvicorn app.main:app --reload

Check provider status:

    curl -s http://localhost:8000/llm/provider/status | python -m json.tool

Expected important fields:

    {
      "provider_name": "ollama",
      "provider_model": "llama3.2:1b",
      "is_configured": true,
      "real_llm_available": true
    }

In User Mode:

1. Click Check Local AI.
2. Confirm Local AI is available.
3. Click Use Local AI.
4. Ask a question in Ask about this image.
5. Confirm the answer source is real_llm.

Recommended question:

    What should I blur for privacy?

Expected Local AI answer behavior:

- It should mention detected people or persons when person detections exist.
- It should not claim faces were detected unless face appears in the structured context.
- It should remind the user to manually check screens, documents, text, license plates, and other sensitive details.
- It should not discuss model accuracy unless the user asks about model performance.

## Manual API check

Use this curl command to test the backend directly:

    curl -s -X POST http://localhost:8000/assistant/image-chat \
      -H "Content-Type: application/json" \
      -d '{
        "question": "What should I blur for privacy?",
        "response_mode": "auto",
        "image_context": {
          "detectionResult": {
            "detection_count": 3,
            "detections": [
              {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.91,
                "bbox": {
                  "x1": 10,
                  "y1": 20,
                  "x2": 100,
                  "y2": 200
                }
              },
              {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.86,
                "bbox": {
                  "x1": 120,
                  "y1": 40,
                  "x2": 220,
                  "y2": 230
                }
              },
              {
                "class_id": 2,
                "class_name": "car",
                "confidence": 0.82,
                "bbox": {
                  "x1": 240,
                  "y1": 50,
                  "x2": 400,
                  "y2": 210
                }
              }
            ]
          }
        }
      }' | python -m json.tool

Expected with Local AI enabled:

    "responder_type": "real_llm"

Expected with Local AI unavailable:

    "responder_type": "rule_based"

## Developer Mode checks

Developer Mode shows extra context for inspection.

Use Developer Mode to verify:

- Answer source
- Prompt version
- Context summary
- Detected class counts
- Generated output count
- Used context keys

The context summary helps explain why the assistant answered a certain way.

## Good demo sequence

Use this sequence for a clean demo:

1. Upload an image with one or more people.
2. Run Detect objects.
3. Ask What objects are detected?
4. Ask What should I blur for privacy?
5. Run Blur all people in the image.
6. Ask What did I do to this image so far?
7. Switch to Developer Mode.
8. Show the image chat context summary.

This sequence demonstrates detection, privacy guidance, generated output history, and transparent assistant context.

## Known limitations

Image Chat v1 is intentionally structured-context based.

Known limitations:

- It does not yet use raw image pixels.
- It is not a full multimodal vision-language model.
- It depends on available detection and workflow context.
- It can miss sensitive content that was not detected.
- It may not detect private text, screens, documents, faces, or license plates unless those appear in the structured context.
- Users should manually review privacy-sensitive media before sharing.
- Video chat analysis is planned separately.

## Milestone C demo checklist

Before recording or presenting the demo:

- [ ] Frontend is running.
- [ ] Backend is running.
- [ ] Image upload works.
- [ ] Detection result exists for the current image.
- [ ] Ask about this image panel is visible.
- [ ] What objects are detected? returns a grounded answer.
- [ ] What should I blur for privacy? returns practical privacy guidance.
- [ ] Rule-based fallback works when Local AI is unavailable.
- [ ] Local AI answer works when Ollama is available.
- [ ] Developer Mode shows image chat context summary.
- [ ] The demo explains that Image Chat uses structured workflow context, not raw pixels yet.

## Related documentation

- [Local AI Demo Guide](local-ai-demo.md)
- [Product Walkthrough](product-walkthrough.md)
- [API and Feature Reference](api-and-feature-reference.md)
- [LLM Command Parser Architecture](llm-command-parser-architecture.md)
- [Architecture Overview](architecture-overview.md)
