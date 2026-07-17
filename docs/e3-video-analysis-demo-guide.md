# E.3 Professional Video Analysis Workflow Demo Guide

This guide demonstrates the completed Milestone E.3 video analysis workflow in VisionCommand AI.

E.3 turns uploaded video analysis from isolated frame processing into a professional workflow with object detection, annotated video output, timeline evidence, keyframes, privacy review, tracking readiness, motion/change summaries, Markdown reporting, and video chat grounded in structured analysis context.

## Demo purpose

Use this demo to show that VisionCommand AI can analyze an uploaded video through a product-style workflow, not only run a computer vision model once.

The demo proves that the system can:

- upload and inspect video metadata
- run object detection across uploaded-video frames
- generate a browser-playable annotated video
- summarize detected object classes across time
- show object timeline and key moments
- select representative keyframes
- show object presence across the video timeline
- summarize detection-based motion and object-class changes
- review privacy-sharing risk from detected classes
- evaluate class-level tracking readiness without claiming stable IDs
- export a Markdown video analysis report
- answer video questions using structured E.3 analysis context

## Important safety boundary

This milestone does not perform identity recognition, face detection, emotion inference, location inference, intent inference, private activity inference, optical-flow motion estimation, speed estimation, or real persistent object tracking IDs.

The tracking readiness summary is Option A only. It evaluates class-level detection continuity and explains whether classes are good candidates for future tracking. Option B remains future work for a serious backend tracker with persistent IDs and track-level summaries.

## Recommended demo setup

Start the backend and frontend in the normal local development setup.

Use a short uploaded video where common object classes appear clearly. A short clip with people, a sports ball, vehicles, animals, or everyday objects works well.

Keep the clip short for demo speed. A 3 to 10 second video is enough to show the full workflow.

## Demo flow

### 1. Open User Mode

Open the application in the browser and stay in User Mode for the main demo.

Explain that User Mode is the clean product workflow, while Developer Mode is available for observability and debugging.

### 2. Upload a video

Upload a short video in the video workspace.

Confirm that the app shows:

- original filename
- stored filename
- video duration
- resolution
- FPS
- frame count when available
- playable uploaded-video preview

Suggested narration:

> First, I upload a video and let the system read its metadata. This gives the assistant structured context before analysis starts.

### 3. Run video object detection

Click **Detect video objects**.

Confirm that the result shows:

- detection count
- processed frame count
- class summary
- confidence threshold
- class filter support
- generated annotated video output

Suggested narration:

> The system now runs object detection across the uploaded video frames and builds a structured result with class counts, timestamps, frame-level detections, and an annotated video output.

### 4. Review annotated video output

Play the annotated video.

Confirm that bounding boxes appear through the video and that the browser can play the output.

Suggested narration:

> The annotated video makes the result easy to inspect visually. This is useful because a portfolio demo should show evidence, not only text output.

### 5. Review object summary

Review the object summary panel.

Point out:

- which classes were detected
- how many processed frames each class appeared in
- total detection boxes per class
- highest confidence per class

Suggested narration:

> This object summary gives the high-level inventory of what the model detected in the video.

### 6. Review activity summary

Review the activity summary.

Explain that it is grounded in detected object classes, timestamps, and key moments.

Suggested narration:

> This summary is intentionally conservative. It summarizes detected visual patterns without claiming identity, emotion, intent, or private activity.

### 7. Review privacy-sharing risk

Review the privacy panel.

Confirm that it flags people or privacy-relevant classes when present.

Suggested narration:

> Before sharing a video externally, the assistant can help identify whether the video needs human review. It does not detect faces or identify people, but it can warn when people or other privacy-relevant object classes are present.

### 8. Review keyframe gallery

Review the keyframe gallery.

Confirm that it shows representative detection-rich frames with:

- timestamp
- detected box count
- detected classes
- highest confidence

Suggested narration:

> The keyframe gallery gives quick visual evidence from different moments in the clip, so the user does not need to scrub through the full video first.

### 9. Review object presence strip

Review the object presence strip.

Explain that it shows where classes appear across the timeline.

Suggested narration:

> The object presence strip turns detections into a compact temporal view. It shows class presence across the video, but it does not assign tracking IDs or track individual objects.

### 10. Review motion and change summary

Review the motion and change summary.

Confirm that it compares Beginning, Middle, and End segments.

Suggested narration:

> This is a detection-based change summary. It compares which object classes appear across different video segments. It does not perform optical flow, speed estimation, direction estimation, or real object tracking.

### 11. Review tracking readiness summary

Review the tracking readiness summary.

Confirm that it shows:

- strong, moderate, or limited class-level tracking candidates
- frame coverage
- active frames
- total boxes
- first-to-last timing
- explicit limitation that stable object IDs are not assigned

Suggested narration:

> This is Option A tracking readiness. It is intentionally honest. It tells us whether a class has enough detection continuity to be a good candidate for future tracking. Real persistent tracking IDs are saved for a later backend tracking milestone.

### 12. Ask video understanding questions

Use the video chat panel and ask these questions:

- Summarize this video analysis
- What objects appear and when?
- What are the key moments?
- What should I review for privacy?
- Is this ready for real tracking?

Expected behavior:

- summary answer uses structured E.3 analysis context
- object timing answer uses first-to-last timing per class
- key moments answer is grouped by second
- privacy answer mentions review boundaries
- tracking answer clearly says readiness only and no stable IDs
- answers do not claim identity, face detection, emotion, location, raw-video understanding, or stable tracking IDs

Suggested narration:

> The chat answer is not guessing from raw pixels. It is grounded in the structured video analysis result already produced by the workflow.

### 13. Export Markdown report

Click **Download Markdown report**.

Confirm that the report includes:

- video overview
- detection settings
- annotated video output reference
- object summary
- activity summary
- privacy review
- keyframe gallery
- tracking summary
- motion and change summary
- object presence strip
- object timeline
- key moments
- limitations

Suggested narration:

> The export turns the workflow into a portable analysis report. This makes the project feel closer to a practical AI product than a notebook demo.

## Developer Mode demo

Switch to Developer Mode after the User Mode demo.

Show:

- video chat context summary
- response source and prompt version
- structured context keys
- backend-safe rule-based fallback behavior
- LLM provider status if relevant

Suggested narration:

> Developer Mode gives observability into the assistant behavior. It helps show that the project includes product engineering and LLM grounding, not only computer vision output.

## Recommended portfolio wording

Use language like:

> Built a professional uploaded-video analysis workflow with object detection, annotated video output, temporal summaries, privacy review, tracking-readiness analysis, Markdown report export, and grounded video chat over structured analysis context.

Avoid saying:

- live or streaming video detection
- live camera tracking
- face recognition
- identity recognition
- emotion detection
- activity recognition from raw video
- persistent object tracking IDs

Better wording:

- uploaded-video object detection
- structured video analysis
- detection-based temporal summaries
- class-level tracking readiness
- grounded video chat over analysis context
- product-style computer vision workflow

## Implemented PR map

- PR #500: real uploaded-video object detection pipeline
- PR #501: annotated video output
- PR #502: object timeline and key moments
- PR #503: activity summary
- PR #504: video analysis report export
- PR #505: E.3 milestone summary and roadmap correction
- PR #506: video privacy review
- PR #507: keyframe gallery
- PR #508: object presence strip
- PR #509: motion and change summary
- PR #510: tracking readiness summary
- PR #511: video understanding chat context
- PR #512: E.3 video analysis demo guide

## Validation checklist

Before recording or presenting the demo, confirm:

- video upload works
- video metadata appears
- Detect video objects completes
- annotated video plays in the browser
- class summary appears
- activity summary appears
- privacy review appears
- keyframe gallery appears
- object presence strip appears
- motion/change summary appears
- tracking readiness summary appears
- Markdown report downloads
- video chat answers the five recommended questions
- object timing and key-moment answers are different
- answers avoid unsupported claims
- Developer Mode context summary shows video object analysis context

## Troubleshooting

If annotated video does not play, rerun video object detection and confirm the backend generated a browser-playable annotated MP4.

If video chat gives only sampled-frame answers, rerun **Detect video objects** first so the E.3 object detection result is available in context.

If class filter options are empty, run detection once with all classes so the UI can populate detected classes.

If detections look wrong, try a clearer short video and adjust the confidence threshold.

If the report misses a section, rerun the relevant workflow panel and download the report again.

## E.3 completion statement

Milestone E.3 is complete when this guide is merged with PR #512 and the main CI checks pass.

After E.3, the project can move to the next milestone only after confirming the next scope clearly.
