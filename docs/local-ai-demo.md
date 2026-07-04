# Local AI Demo Guide

This guide explains how to run VisionCommand AI with a local Ollama model and demo the real local LLM assistant flow.

The goal of this flow is to show that VisionCommand AI is not only using rule-based command parsing. In Local AI mode, the assistant can use a configured local LLM provider to understand natural image and video commands, then send validated actions to the existing computer vision workflow.

## What this demonstrates

Local AI mode demonstrates the v1 assistant workflow:

1. Upload an image or video.
2. Use text or voice to give a natural command.
3. Check that Local AI is available.
4. Select Local AI in User Mode.
5. Run the assistant command.
6. Review the generated result.
7. Inspect technical parser/provider details in Developer Mode if needed.

This connects:

- Computer vision workflows
- Local LLM command understanding
- User Mode assistant UX
- Developer Mode parser/provider observability
- LLMOps-style validation and evaluation

## Requirements

Install Ollama locally and make sure at least one model is available.

Recommended lightweight local model:

    ollama pull llama3.2:1b

Check installed models:

    ollama list

Expected example:

    llama3.2:1b

## Start Ollama

Run Ollama in a separate terminal:

    ollama serve

Check that Ollama is reachable:

    curl -s http://localhost:11434/api/tags | python -m json.tool

## Start the backend with Local AI enabled

From the backend directory:

    cd backend

    env -u DATABASE_URL \
      LLM_PROVIDER=ollama \
      OLLAMA_MODEL=llama3.2:1b \
      OLLAMA_BASE_URL=http://localhost:11434 \
      uvicorn app.main:app --reload

Check provider status:

    curl -s http://localhost:8000/llm/provider/status | python -m json.tool

Expected fields:

    {
      "provider_name": "ollama",
      "provider_model": "llama3.2:1b",
      "is_configured": true,
      "real_llm_available": true
    }

## Start the frontend

In another terminal:

    cd frontend
    npm run dev

Open the local frontend URL shown by Vite, usually:

    http://localhost:5173

## User Mode demo flow

1. Upload an image.
2. Find the AI Assistant card.
3. Click Check Local AI.
4. Confirm Local AI becomes available.
5. Click Use Local AI.
6. Type or speak a command.
7. Click Ask / Run.
8. Review the result and Generated Outputs.

The User Mode assistant should show friendly Local AI status such as:

    Assistant intelligence
    Local AI selected
    Local AI status: Available with ollama / llama3.2:1b

## Demo commands

### Image command: zoom

    Zoom into the person on the left

Expected result:

- The command is parsed through the Local AI flow.
- A zoom output is generated.
- The output appears in Generated Outputs.
- The visible zoom result remains available even after running another image command.

### Image command: privacy blur

    Blur all people in the image

Expected result:

- A blurred output is generated.
- People detected by the model are blurred.
- The result appears in the blur preview and Generated Outputs.

### Video command: extract frame

    Extract a frame at 1 second

Expected result:

- The command is parsed with timestamp_seconds in seconds.
- A frame is extracted from the uploaded video.

## Voice command demo

Use the Speak button in User Mode.

The browser speech recognition feature converts speech to text and places it into the assistant command box. The command then uses the same assistant flow as typed commands.

Recommended spoken examples:

    Zoom into the person on the left
    Blur all people in the image
    Extract a frame at 1 second

Voice support depends on browser support for the Web Speech API.

## Developer Mode checks

Developer Mode keeps the technical workflow available.

Use Developer Mode to inspect:

- Parser mode
- Parser type
- Parser version
- LLM provider status
- Prompt preview
- Parser evaluation
- LLMOps dashboard
- Command logs and parser attempt logs

Useful check:

    curl -s -X POST http://localhost:8000/commands/parse \
      -H "Content-Type: application/json" \
      -d '{
        "command": "Zoom into the person on the left",
        "parser_mode": "real_llm"
      }' | python -m json.tool

Expected parsed command:

    {
      "action": "zoom_by_class",
      "class_name": "person",
      "target_scope": "left"
    }

## Local AI unavailable behavior

If Local AI is unavailable, User Mode should show a friendly status and still allow basic command usage.

Common causes:

- Ollama is not running.
- The backend was started without LLM_PROVIDER=ollama.
- OLLAMA_MODEL does not match an installed model.
- OLLAMA_BASE_URL is incorrect.

Use this backend startup command for the local demo:

    env -u DATABASE_URL \
      LLM_PROVIDER=ollama \
      OLLAMA_MODEL=llama3.2:1b \
      OLLAMA_BASE_URL=http://localhost:11434 \
      uvicorn app.main:app --reload

## Known limitations

Local AI mode currently focuses on command understanding and execution. It is not yet a full multimodal vision-language assistant.

Known v1 limitations:

- The LLM receives structured command context, not raw image pixels.
- Image and video chat analysis are planned as separate v1 milestones.
- Small local models can still produce imperfect outputs, so backend validation and repair logic are used.
- Zoom target selection may need a focused follow-up when multiple similar objects are visible.
- Hosted cloud deployment should normally use LLM_PROVIDER=disabled or a hosted provider first; Ollama is best for local or self-hosted use.

## Milestone B demo checklist

Use this checklist before recording or presenting the v1 demo:

- [ ] Ollama is running.
- [ ] llama3.2:1b is installed.
- [ ] Backend is started with LLM_PROVIDER=ollama.
- [ ] /llm/provider/status returns real_llm_available: true.
- [ ] Frontend is running.
- [ ] User Mode shows Local AI controls.
- [ ] Check Local AI shows the provider and model.
- [ ] Use Local AI selects the local LLM flow.
- [ ] Zoom into the person on the left produces a zoom output.
- [ ] Blur all people in the image produces a privacy edit.
- [ ] Generated Outputs preserves the produced outputs.
- [ ] Developer Mode can show parser/provider details if needed.

## Related documentation

- [LLM Command Parser Architecture](llm-command-parser-architecture.md)
- [API and Feature Reference](api-and-feature-reference.md)
- [Product Walkthrough](product-walkthrough.md)
- [Environment Variables](environment-variables.md)
- [Architecture Overview](architecture-overview.md)
