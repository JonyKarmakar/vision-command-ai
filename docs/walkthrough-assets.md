# VisionCommand AI Walkthrough Assets

This document defines the recommended screenshots, sample media references, naming conventions, and expected outputs for demonstrating VisionCommand AI.

It is intended to support the product walkthrough without committing large media files directly into the repository.

---

## Purpose

The product walkthrough explains how the application behaves.

This document explains what assets should support that walkthrough.

The goal is to make demos, screenshots, and sample workflows consistent, reproducible, and easy to review.

---

## Asset Strategy

Large images, videos, generated outputs, and model artifacts should not be committed directly unless they are small and intentionally selected.

Recommended approach:

- Keep documentation in the repository.
- Keep large sample media outside Git or in a dedicated lightweight sample folder only when needed.
- Use screenshots selectively.
- Use consistent filenames.
- Document expected outputs clearly.
- Avoid committing temporary generated media from local test runs.

---

## Recommended Asset Categories

### 1. Application screenshots

Screenshots should show the main product workflows.

Recommended screenshots:

- Home screen in User Mode
- Image upload workspace
- Object detection result
- Crop or blur result
- Zoom result
- Generated Output History
- Video upload workspace
- Trimmed video result
- Extracted frame result
- Sampled video detection result
- Object tracking result
- Video command history
- Developer Mode metadata view
- LLMOps or command inspection panel

### 2. Sample input references

Sample inputs should be small and easy to explain.

Recommended input types:

- One image with clear detectable objects
- One short video clip, ideally 3 to 5 seconds
- One generated output from crop, blur, or zoom
- One extracted video frame
- One sampled detection result JSON example

### 3. Expected output references

Expected outputs should show what a reviewer should see after running a workflow.

Recommended outputs:

- Annotated detection image
- Cropped object image
- Blurred object image
- Zoomed object image
- Extracted video frame
- Multiple extracted frames
- Sampled video detection summary
- Object tracking summary
- Generated Output History item
- Video command history item

---

## Suggested Folder Structure

If small assets are later added to the repository, use this structure:

```text
docs/assets/
├── screenshots/
│   ├── user-mode-home.png
│   ├── image-detection-result.png
│   ├── generated-output-history.png
│   ├── video-workflow-results.png
│   ├── video-command-history.png
│   └── developer-mode-inspection.png
│
├── sample-inputs/
│   ├── sample-image.jpg
│   └── sample-video.mp4
│
└── sample-outputs/
    ├── annotated-detection.png
    ├── cropped-object.png
    ├── blurred-object.png
    ├── zoomed-object.png
    └── extracted-frame.png
```

Do not add large videos or unnecessary generated media to Git. If sample files become large, store them externally and document the source instead.

---

## Screenshot Naming Convention

Use short, descriptive, lowercase filenames.

Recommended style:

```text
user-mode-home.png
image-upload-ready.png
image-detection-result.png
zoomed-image-ready.png
generated-output-history.png
video-upload-ready.png
video-trimmed-result.png
video-extracted-frame.png
video-sampled-detection.png
video-tracking-result.png
video-command-history.png
developer-mode-metadata.png
llmops-command-inspection.png
```

Avoid:

```text
Screenshot 2026-07-02 at 14.03.11.png
test-final-final.png
output-copy-2.png
random-image.png
```

---

## Screenshot Quality Guidelines

Screenshots should be:

- Cropped to the relevant UI area
- Clear enough to read section titles and result labels
- Taken from a clean local run
- Free of unrelated browser tabs or private information
- Consistent in theme and browser zoom level
- Focused on one workflow state at a time

Recommended browser zoom:

```text
90% to 100%
```

Recommended screenshot width:

```text
1200px to 1600px
```

---

## Sample Image Requirements

A good sample image should include:

- One or more common YOLO-detectable objects
- Clear lighting
- Minimal blur
- No private personal information
- No sensitive or copyrighted context that would distract from the project

Good object examples:

```text
person
car
bottle
chair
cup
dog
cat
laptop
```

The sample image should make detection, crop, blur, and zoom easy to demonstrate.

---

## Sample Video Requirements

A good sample video should be:

- Short, ideally 3 to 5 seconds
- Small enough for local testing
- Visually clear
- Easy to process repeatedly
- Useful for frame extraction and sampled detection
- Free of private or sensitive content

Recommended video characteristics:

```text
Duration: 3 to 5 seconds
Resolution: 720p or lower for quick testing
Objects: at least one detectable object
Motion: simple movement is enough
```

---

## Recommended Walkthrough Screenshot Set

The first complete screenshot set should include the following files:

```text
docs/assets/screenshots/user-mode-home.png
docs/assets/screenshots/image-detection-result.png
docs/assets/screenshots/zoomed-image-ready.png
docs/assets/screenshots/generated-output-history.png
docs/assets/screenshots/video-workflow-results.png
docs/assets/screenshots/video-command-history.png
docs/assets/screenshots/developer-mode-inspection.png
```

This set is enough to communicate the product clearly without overloading the repository.

---

## Expected Workflow Evidence

When capturing walkthrough evidence, record the following:

### Image workflow evidence

- Uploaded image preview is visible.
- Detection result is visible.
- At least one generated output is visible.
- Generated Output History contains the output.
- A generated output can be used again as the active source.

### Video workflow evidence

- Uploaded video preview is visible.
- Trimmed video result is visible.
- Extracted frame result is visible.
- Sampled detection or tracking result is visible.
- Video command history contains completed actions.
- View result navigation points to the correct result panel.

### Developer Mode evidence

- Technical metadata is visible.
- JSON actions are available where supported.
- Parser, planner, logs, or observability panels are visible where relevant.

---

## What Not to Commit

Do not commit:

- Large raw videos
- Large generated media folders
- Temporary local outputs
- Private images or videos
- API keys or environment files
- Model weights unless intentionally managed
- Browser screenshots containing private tabs, emails, or tokens

---

## Relationship to Other Documentation

Use this document together with:

- `docs/product-walkthrough.md`
- `docs/architecture-overview.md`
- `docs/api-and-feature-reference.md`
- `docs/render-deployment-evidence.md`

The product walkthrough explains the flow.

This document defines the assets that should support the flow.

---

## Current Status

No final screenshot or sample media set is committed yet.

This document defines the standard for adding those assets later in a controlled and professional way.
