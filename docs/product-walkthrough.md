# VisionCommand AI Product Walkthrough

This document provides a structured walkthrough of VisionCommand AI from a product and engineering perspective.

It is intended for project reviewers, collaborators, maintainers, and technical readers who want to understand how the main image, video, AI Assistant, User Mode, and Developer Mode workflows behave.

---

## Purpose

VisionCommand AI is a full-stack AI media assistant for image and video workflows.

The walkthrough demonstrates how the application supports:

- Image upload and object detection
- Image editing through crop, blur, and zoom actions
- Generated output reuse and history
- Video upload and metadata inspection
- Video trimming and frame extraction
- Sampled video detection and object tracking
- AI Assistant command execution
- User Mode and Developer Mode separation
- Workflow observability and technical inspection

---

## Recommended Setup

Run the backend and frontend locally for the most reliable walkthrough.

### Backend

```bash
cd backend

source ../vision-env/bin/activate
env -u DATABASE_URL uvicorn app.main:app --reload
```

Expected backend URL:

```text
http://127.0.0.1:8000
```

### Frontend

In a separate terminal:

```bash
cd frontend

npm run dev
```

Expected frontend URL:

```text
http://127.0.0.1:5173
```

---

## Walkthrough Modes

VisionCommand AI has two main modes.

### User Mode

User Mode is the clean product-facing mode.

Use this mode to inspect:

- Simplified workspace cards
- Clean image and video outputs
- Generated output history
- Video command history
- Ordered result panels
- Simple navigation to completed results

### Developer Mode

Developer Mode exposes technical details.

Use this mode to inspect:

- Original and stored filenames
- Media metadata
- JSON output actions
- Parser and planner metadata
- Assistant/debug result cards
- Logs and observability panels
- Database-backed summaries where configured

---

## Image Workflow

### Step 1: Upload an image

Action:

- Open the image upload area.
- Select a supported image file.
- Confirm that the preview appears.

Expected result:

- The image preview is visible.
- The image workspace shows that the image is ready.
- In User Mode, unnecessary filename details are hidden.
- In Developer Mode, technical upload metadata remains available.

---

### Step 2: Run object detection

Action:

- Run object detection on the uploaded image.

Expected result:

- Detected objects are listed.
- An annotated image output is generated.
- Confidence values and class names are available.
- The backend returns structured detection data.

Technical behavior:

- The backend runs object detection.
- The frontend renders the detection summary and annotated output.
- Detection results can be used by later editing actions.

---

### Step 3: Filter detection results

Action:

- Adjust confidence threshold.
- Optionally filter by object class.

Expected result:

- Detection results update based on the selected threshold or class.
- The UI remains usable for follow-up crop, blur, or zoom actions.

---

### Step 4: Crop, blur, or zoom a detected object

Action:

- Choose an object class or detected target.
- Run crop, blur, or zoom.

Expected result:

- A generated output image is created.
- The output appears in the result area.
- The output is added to Generated Output History.
- The generated output can be reused as the active source.

Technical behavior:

- The frontend sends an editing request to the backend.
- The backend applies the operation using image-processing utilities.
- The frontend receives the generated media path and metadata.

---

### Step 5: Reuse a generated output

Action:

- Open Generated Output History.
- Select a generated output.
- Use it as the active source.
- Run detection again.

Expected result:

- The selected generated output becomes the active image.
- Detection can run on the generated media.
- The workflow can continue from the new output.

Product value:

- The workflow supports multi-step editing instead of one-time inference only.

---

## AI Assistant Workflow

### Step 1: Run a text command

Example commands:

```text
detect objects
crop person
blur person
blur all persons
zoom person
```

Expected result:

- The command is parsed.
- The system prepares or executes the matching action.
- The output appears in the relevant image result area.

---

### Step 2: Inspect command behavior in Developer Mode

Action:

- Switch to Developer Mode.
- Run or inspect an AI Assistant command result.

Expected result:

- Technical command output is visible.
- Parser or planner metadata is available where supported.
- Debug details remain available without affecting User Mode.

Technical behavior:

- The command layer converts natural language into structured actions.
- Validation protects unsupported or unsafe command execution.
- Prepared execution allows inspection before running selected actions.

---

## Video Workflow

### Step 1: Upload a video

Action:

- Select a supported video file.
- Confirm that the video preview appears.

Expected result:

- Video preview is visible.
- Video metadata is available.
- Metadata can include duration, FPS, frame count, width, and height.

---

### Step 2: Trim the video

Action:

- Select a start and end time.
- Run trim video.

Expected result:

- A trimmed video output is generated.
- The result appears in the video result area.
- The completed action appears in Video command history.

---

### Step 3: Extract a single frame

Action:

- Select a timestamp.
- Extract one frame.

Expected result:

- A frame image is generated.
- The extracted frame appears as a result.
- The completed action appears in Video command history.

---

### Step 4: Extract multiple frames

Action:

- Select a time range.
- Extract multiple frames.

Expected result:

- Multiple frame images are generated.
- Extracted frames appear in the result area.
- The completed action appears in Video command history.

---

### Step 5: Run sampled video detection

Action:

- Run detection across sampled video frames.

Expected result:

- Detection results are generated across sampled frames.
- Results appear in the video result area.
- Result panels follow the order actions were completed.

Technical behavior:

- The backend samples video frames.
- Object detection runs on sampled frames.
- The frontend renders the structured detection output.

---

### Step 6: Run object tracking

Action:

- Run video tracking.
- Optionally target a class such as person.

Expected result:

- Tracking results are generated across sampled frames.
- The completed action appears in Video command history.
- The View result action scrolls back to the matching output.

Technical behavior:

- The tracking workflow connects detections across sampled frames.
- It provides a practical baseline for temporal object workflow inspection.

---

## Video Command History

Video command history records completed video workflow actions.

It can include:

- Video workspace ready
- Trimmed video ready
- Extracted frame ready
- Extracted frames ready
- Sampled detection results
- Frame detection results
- Object tracking results

Expected behavior:

- Each completed action appears as a history item.
- View result scrolls to the matching result panel.
- Result order matches action completion order.

---

## Developer Inspection Checklist

Use Developer Mode to inspect the engineering layer.

Check:

- Uploaded media metadata
- Detection result JSON
- Generated output metadata
- Command parser output
- Planner or prepared execution output
- LLMOps panels where available
- Database summaries where configured
- Workflow export or report actions
- Error handling for unsupported commands

---

## Expected End State

After completing the walkthrough, the application should demonstrate:

- A successful image detection and editing workflow
- A reusable generated output workflow
- A successful AI Assistant command workflow
- A successful video trim or frame extraction workflow
- A successful sampled detection or tracking workflow
- Video command history with result navigation
- Clear separation between User Mode and Developer Mode

---

## Known Limitations

Current limitations include:

- Render free-tier deployments may sleep after inactivity.
- First backend requests after sleep can be slow.
- YOLO inference is slower on free-tier infrastructure.
- Uploaded and generated media need stronger persistent storage for production deployment.
- Video tracking is currently a practical baseline and can be improved further.
- Real LLM evaluation coverage can be expanded.

---

## Troubleshooting

### Backend is not responding

Check that the backend server is running:

```bash
cd backend
env -u DATABASE_URL uvicorn app.main:app --reload
```

Then open:

```text
http://127.0.0.1:8000/health
```

### Frontend cannot reach backend

Check the frontend development server:

```bash
cd frontend
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

### Detection is slow

Object detection can be slow depending on local machine resources, model loading time, video size, and sampled frame count.

For video workflows, use short sample clips when testing locally.

---

## Related Documentation

- `README.md`
- `docs/api-and-feature-reference.md`
- `docs/architecture-overview.md`
- `docs/walkthrough-assets.md`
- `docs/project-vision-and-ai-roadmap.md`
- `docs/llm-command-parser-architecture.md`
- `docs/command-planner-design.md`
- `docs/workspace-recovery-flow.md`
- `docs/deployment-readiness-summary.md`
- `docs/render-deployment-evidence.md`
