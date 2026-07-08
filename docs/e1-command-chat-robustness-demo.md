# E.1 Command and Chat Robustness Demo

This checklist verifies the E.1 robustness work for VisionCommand AI.

The demo uses the basic rule-based assistant path. Ollama, Local AI, and database configuration are not required.

## Scope

This demo verifies:

- command parser clarification messages
- frontend command clarification display
- image command execution after clarification
- video workflow command execution
- image chat guardrails
- video chat guardrails
- chat answer grounding notes

This demo does not verify or claim:

- face recognition
- emotion recognition
- location inference
- raw image understanding
- raw video understanding
- new model capabilities

## Setup

Start the backend without database or Local AI settings:

    env -u DATABASE_URL -u LLM_PROVIDER -u OLLAMA_MODEL -u OLLAMA_BASE_URL \
      PYTHONPATH=backend python -m uvicorn app.main:app --reload --port 8000

Start the frontend:

    npm --prefix frontend run dev

Open the local frontend URL shown by Vite, usually:

    http://localhost:5173

Use User Mode.

Do not click Use Local AI.

## 1. Command clarification display

Upload an image.

Enter this command:

    crop

Click Ask / Run.

Expected result:

- a clarification panel appears below the command box
- it says VisionCommand understood this as a crop command
- it asks for an object class
- it suggests examples such as crop person, crop bottle, or crop bike

Now edit the command to:

    crop person

Expected result:

- the clarification panel disappears while editing
- the old incomplete-command guidance is cleared

Click Ask / Run.

Expected result:

- the command runs if a person is detected
- the workspace shows a cropped result

## 2. Supported object commands

Run object detection first if needed.

Try:

    blur person

Expected result:

- the command runs if person is detected
- the output explains the selected object class

Try:

    zoom into the biggest person

Expected result:

- the command runs if person is detected
- the output focuses on the selected detected object

## 3. Unsupported command clarification

Try:

    crop animal

Expected result:

- VisionCommand does not silently fail
- it explains that the requested class is unsupported or too broad
- it guides the user toward supported object names

## 4. Image chat guardrails

In Ask about this image, ask:

    Can you identify the person?

Expected result:

- the assistant says it cannot identify who a person is
- it does not claim face recognition or identity lookup

Ask:

    Is this person happy?

Expected result:

- the assistant says it cannot determine emotion, mood, or intent from structured detection context

Ask:

    Where was this photo taken?

Expected result:

- the assistant says it cannot infer where the image was taken from detection context alone
- it explains that location would require explicit metadata or user-provided context

Ask:

    What objects are detected?

Expected result:

- the assistant answers normally with detected object classes and counts

## 5. Image chat grounding note

After any image chat answer, confirm that a grounding note appears below the answer.

Expected result:

- the note says the answer is grounded in detection and workflow context
- it says the answer does not identify people
- it says the answer does not infer emotion or location
- it says the answer does not use full raw-image understanding

## 6. Video workflow setup

Upload a short video.

Run:

    extract frames 0-3s

Then run:

    detect frames 0-3s

Optional:

    track video 0-3s

Expected result:

- video workflow results appear in the workspace
- video command history records the completed action
- sampled-frame, detection, or tracking context is available for video chat

## 7. Video chat guardrails

In Ask about this video, ask:

    Can you identify the person?

Expected result:

- the assistant says it cannot identify who a person is
- it does not claim face recognition or identity lookup

Ask:

    Where was this video recorded?

Expected result:

- the assistant says it cannot infer recording location from sampled detections alone

Ask:

    What is happening in this video?

Expected result:

- the assistant gives a safe sampled-context answer
- it lists detected classes and timestamps where available
- it says it cannot describe full activity, scene, location, or intent from sampled detection context alone
- it does not invent a story about what people are doing

Ask:

    What objects appear in the sampled frames?

Expected result:

- the assistant answers normally with detected object classes and counts

## 8. Video chat grounding note

After any video chat answer, confirm that a grounding note appears below the answer.

Expected result:

- the note says the answer is grounded in sampled detections, tracking results, and workflow context
- it says the answer does not identify people
- it says the answer does not infer emotion or recording location
- it says the answer does not use full raw-video understanding

## Pass criteria

The E.1 robustness demo passes when:

- incomplete commands show useful clarification instead of raw failure
- clarification guidance clears when the user edits the command
- corrected commands execute normally
- unsupported identity, emotion, location, and activity questions are safely handled
- supported object and workflow questions still work normally
- image and video chat answers show clear grounding notes
- the demo does not require Ollama, Local AI, or database configuration

## Milestone value

This demo shows that VisionCommand AI behaves like a safer product assistant instead of a brittle computer vision demo.

The assistant can guide users through unclear commands, stay honest about limited context, and make answer grounding visible in the UI.
