# Video Chat Demo Guide

This guide explains how to demo the VisionCommand AI video chat workflow.

Video Chat lets a user ask natural questions about the current video workflow. The first v1 version answers from structured video and workflow context, including video upload metadata, trim results, frame detections, sampled-frame detections, tracking results, command results, and generated output history.

It does not yet send raw video pixels to a multimodal video-language model.

## What this demonstrates

Video Chat demonstrates that VisionCommand AI can work as an assistant for video workflows, not only as a command executor.

The demo shows:

- Natural question answering about the current video workflow
- Object-summary answers from sampled-frame detection context
- Privacy guidance from detected classes
- Workflow-history answers from generated outputs
- Rule-based fallback when Local AI is unavailable
- Local AI answers when Ollama is available
- Guarded Local AI answers when sampled detections are not enough to describe full video activity
- Developer Mode context summary for transparency

## Feature entry point

In the frontend, upload a video and open the assistant area.

The panel is titled:

    Ask about this video

Example questions are shown as quick actions.

The backend endpoint is:

    POST /assistant/video-chat

The frontend sends structured video context to the backend, and the backend returns an assistant answer.

## Context used by Video Chat

The first v1 version uses structured context already available in the app.

Possible context includes:

- video upload result
- video trim result
- video frame detection result
- video multi-frame detection result
- video sampled detection result
- video tracking result
- command result
- generated output history

This makes the answer grounded in the workflow, not invented from unseen raw video pixels.

## User Mode demo

1. Start the backend.
2. Start the frontend.
3. Upload a video.
4. Run sampled detection or tracking.
5. Go to the assistant card.
6. Find Ask about this video.
7. Choose an example question or type your own.
8. Click Ask video.
9. Review the assistant answer.

Recommended questions:

    What happens in this video?
    What objects appear in the sampled frames?
    Should I blur anything for privacy?
    What changed between frames?
    What did I do to this video so far?

## Rule-based fallback demo

The rule-based fallback works without Ollama or OpenAI.

Start backend with LLM settings disabled:

    cd backend

    env -u DATABASE_URL -u LLM_PROVIDER -u OLLAMA_MODEL -u OLLAMA_BASE_URL \
      uvicorn app.main:app --reload

Ask:

    Should I blur anything for privacy?

Expected behavior:

- The assistant answers from structured video detection and workflow context.
- The answer source shows rule_based.
- The answer stays available even when Local AI is not configured.

This fallback makes the feature safe for normal development, CI, and demos where Ollama is unavailable.

## Local AI video chat demo

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
4. Ask a question in Ask about this video.
5. Confirm the answer source is real_llm or real_llm_guarded.

Recommended question:

    What happens in this video?

Expected Local AI answer behavior:

- It should answer from structured sampled-frame and workflow context.
- It should not claim to watch raw video pixels.
- It should not invent activity, movement, scene, sport, location, or intent from object classes alone.
- It should not say faces were detected unless face appears in the structured context.
- It should not discuss model accuracy unless the user asks about model performance.
- It should recommend manual review for faces, screens, documents, text, license plates, and sensitive objects when privacy is mentioned.

## Guarded Local AI behavior

Video Chat includes a grounding guardrail for sampled-detection summary questions.

When the question asks for a video summary and the current context only has sampled detections without tracking, the backend may return:

    "responder_type": "real_llm_guarded"

This means Local AI was available, but the assistant replaced an over-specific answer with a safer structured answer.

Example guarded answer:

    Based on sampled frames at 0s and 1s, the structured video context contains detections for person (2), sports ball (1). I cannot describe the full activity, scene, location, or intent from this sampled detection context alone. No tracking result is available. This is based on sampled video/workflow context, not raw video-level understanding.

This behavior is intentional. It prevents a small local model from inventing unsupported visual details from class labels alone.

## Manual API check

Use this curl command to test the backend directly:

    curl -s -X POST http://localhost:8000/assistant/video-chat \
      -H "Content-Type: application/json" \
      -d '{
        "question": "What happens in this video?",
        "response_mode": "auto",
        "video_context": {
          "videoUploadResult": {
            "metadata": {
              "is_readable": true,
              "width": 854,
              "height": 480,
              "fps": 30,
              "frame_count": 120,
              "duration_seconds": 4.0
            }
          },
          "videoSampledDetectionResult": {
            "filename": "clip_2.mp4",
            "video_metadata": {
              "is_readable": true,
              "width": 854,
              "height": 480,
              "fps": 30,
              "frame_count": 120,
              "duration_seconds": 4.0
            },
            "detection": {
              "frame_count": 2,
              "frames": [
                {
                  "frame_filename": "frame_0.jpg",
                  "timestamp_seconds": 0,
                  "detections": [
                    {
                      "class_name": "person",
                      "confidence": 0.91,
                      "bbox": {}
                    },
                    {
                      "class_name": "sports ball",
                      "confidence": 0.77,
                      "bbox": {}
                    }
                  ],
                  "detection_count": 2
                },
                {
                  "frame_filename": "frame_1.jpg",
                  "timestamp_seconds": 1,
                  "detections": [
                    {
                      "class_name": "person",
                      "confidence": 0.88,
                      "bbox": {}
                    }
                  ],
                  "detection_count": 1
                }
              ]
            }
          }
        }
      }' | python -m json.tool

Expected with Local AI enabled and sampled detections without tracking:

    "responder_type": "real_llm_guarded"
    "prompt_version": "video-chat-prompt-v3"

Expected with Local AI unavailable:

    "responder_type": "rule_based"

## Developer Mode checks

Developer Mode shows extra context for inspection.

Use Developer Mode to verify:

- Answer source
- Prompt version
- Context summary
- Detected class counts
- Sampled frame count
- Sampled timestamps
- Tracking count
- Generated output count
- Used context keys

The context summary helps explain why the assistant answered a certain way.

## Good demo sequence

Use this sequence for a clean demo:

1. Upload a short video.
2. Run sampled video detection.
3. Ask What objects appear in the sampled frames?
4. Ask What happens in this video?
5. Confirm the answer stays grounded in sampled-frame context.
6. Ask Should I blur anything for privacy?
7. Run tracking if the video has repeated visible objects.
8. Ask What changed between frames?
9. Switch to Developer Mode.
10. Show the video chat context summary.

This sequence demonstrates video upload, sampled detection, Local AI, grounding guardrails, privacy guidance, and transparent assistant context.

## Known limitations

Video Chat v1 is intentionally structured-context based.

Known limitations:

- It does not yet use raw video pixels.
- It is not a full multimodal video-language model.
- It depends on available sampled-frame detection, tracking, and workflow context.
- It can miss sensitive content that was not detected.
- It cannot safely describe full activity, scene, location, or intent from class labels alone.
- It cannot answer movement questions reliably unless tracking context is available.
- Users should manually review privacy-sensitive videos before sharing.

## Milestone D demo checklist

Before recording or presenting the demo:

- [ ] Frontend is running.
- [ ] Backend is running.
- [ ] Ollama is running if demonstrating Local AI.
- [ ] Provider status shows Local AI available if using real_llm mode.
- [ ] A video is uploaded.
- [ ] Sampled detection or tracking has been run.
- [ ] Ask about this video appears.
- [ ] A summary question returns a grounded answer.
- [ ] Privacy guidance mentions manual review.
- [ ] Developer Mode shows video chat context summary.
- [ ] The demo clearly explains that v1 uses structured video/workflow context, not raw video understanding.

## Portfolio explanation

A concise way to present this feature:

    I added a structured video chat assistant to VisionCommand AI. It lets users ask natural questions about a video workflow, such as what objects appear, what should be reviewed for privacy, and what happened in the workflow. The assistant uses sampled-frame detections, tracking results, metadata, and generated output history. I also added a Local AI grounding guardrail so the assistant does not invent unsupported activity or scene details when the context is limited.

This is useful for explaining the project as a full-stack AI system with computer vision, Local LLM integration, prompt design, grounding logic, frontend UX, backend APIs, and production-style testing.
