"""Command skills registry for E.4 command-driven workflows."""

from copy import deepcopy
from typing import Any, Dict, List, Optional


COMMAND_SKILLS_REGISTRY_VERSION = "e4.1-command-skills-registry-v1"


COMMAND_SKILLS: List[Dict[str, Any]] = [
    {
        "id": "detect_objects",
        "title": "Detect image objects",
        "category": "image_analysis",
        "execution_status": "implemented_command",
        "supported_media": ["image"],
        "user_examples": [
            "detect objects",
            "find people",
            "find cars",
        ],
        "mapped_actions": ["detect"],
        "mapped_workflows": [
            "POST /commands/execute",
            "POST /vision/detect/{filename}",
        ],
        "required_context": ["uploaded image or generated image output"],
        "optional_context": ["confidence threshold", "supported class name"],
        "outputs": [
            "annotated detection result",
            "detected object list",
            "class summary",
        ],
        "limitations": [
            "Only detects classes supported by the current object model.",
            "Does not identify people or infer private attributes.",
        ],
    },
    {
        "id": "crop_by_class",
        "title": "Crop detected objects by class",
        "category": "image_editing",
        "execution_status": "implemented_command",
        "supported_media": ["image"],
        "user_examples": [
            "crop person",
            "crop people",
            "crop phone",
        ],
        "mapped_actions": ["crop"],
        "mapped_workflows": [
            "POST /commands/execute",
            "POST /vision/crop/{filename}",
        ],
        "required_context": [
            "uploaded image or generated image output",
            "supported class name",
        ],
        "optional_context": ["confidence threshold"],
        "outputs": ["cropped image outputs", "crop metadata"],
        "limitations": [
            "Uses detection boxes rather than segmentation masks.",
            "Cannot crop unsupported object classes.",
        ],
    },
    {
        "id": "blur_by_class",
        "title": "Blur detected objects by class",
        "category": "image_editing",
        "execution_status": "implemented_command",
        "supported_media": ["image"],
        "user_examples": [
            "blur person",
            "blur people",
            "hide phones",
        ],
        "mapped_actions": ["blur", "blur_all"],
        "mapped_workflows": [
            "POST /commands/execute",
            "POST /vision/blur/{filename}",
        ],
        "required_context": [
            "uploaded image or generated image output",
            "supported class name",
        ],
        "optional_context": ["confidence threshold"],
        "outputs": ["blurred image output", "blur metadata"],
        "limitations": [
            "Uses rectangular detection boxes.",
            "Does not perform face detection or identity recognition.",
        ],
    },
    {
        "id": "zoom_by_class",
        "title": "Zoom into detected objects by class",
        "category": "image_analysis",
        "execution_status": "implemented_command",
        "supported_media": ["image"],
        "user_examples": [
            "zoom person",
            "zoom into the biggest person",
            "zoom left person",
        ],
        "mapped_actions": ["zoom"],
        "mapped_workflows": [
            "POST /commands/execute-prepared",
            "POST /vision/zoom/{filename}",
        ],
        "required_context": [
            "uploaded image or generated image output",
            "supported class name",
        ],
        "optional_context": [
            "target selection such as biggest, left, right, or center",
            "confidence threshold",
        ],
        "outputs": ["zoomed image output", "selected detection metadata"],
        "limitations": [
            "Depends on existing detector classes and bounding boxes.",
            "Does not create segmentation masks.",
        ],
    },
    {
        "id": "enhance_image",
        "title": "Enhance image appearance",
        "category": "image_editing",
        "execution_status": "implemented_command",
        "supported_media": ["image"],
        "user_examples": [
            "auto enhance image",
            "increase contrast",
            "sharpen image",
        ],
        "mapped_actions": ["enhance_image"],
        "mapped_workflows": [
            "POST /commands/execute",
            "POST /vision/enhance/{filename}",
            "POST /vision/enhance-output/{filename}",
        ],
        "required_context": ["uploaded image or generated image output"],
        "optional_context": [
            "brightness",
            "contrast",
            "saturation",
            "sharpness",
        ],
        "outputs": ["enhanced image output", "adjustment metadata"],
        "limitations": [
            "Uses deterministic image adjustments.",
            "Does not use a generative image model.",
        ],
    },
    {
        "id": "background_blur",
        "title": "Blur background around detected objects",
        "category": "image_editing",
        "execution_status": "implemented_command",
        "supported_media": ["image"],
        "user_examples": [
            "blur background",
            "keep people sharp",
            "stronger background blur",
        ],
        "mapped_actions": ["background_blur"],
        "mapped_workflows": [
            "POST /commands/execute",
            "POST /vision/background-blur/{filename}",
            "POST /vision/background-blur-output/{filename}",
        ],
        "required_context": ["uploaded image or generated image output"],
        "optional_context": ["confidence threshold", "blur strength"],
        "outputs": [
            "background-blurred image output",
            "foreground detection metadata",
        ],
        "limitations": [
            "Keeps rectangular detected regions sharp.",
            "Does not use segmentation masks yet.",
        ],
    },
    {
        "id": "trim_video",
        "title": "Trim uploaded video",
        "category": "video_editing",
        "execution_status": "implemented_command",
        "supported_media": ["video"],
        "user_examples": [
            "trim video from 1 to 4 seconds",
            "cut video from 0 to 3 seconds",
        ],
        "mapped_actions": ["trim_video"],
        "mapped_workflows": [
            "POST /commands/execute",
            "POST /video/trim/{filename}",
        ],
        "required_context": [
            "uploaded video",
            "start timestamp",
            "end timestamp",
        ],
        "optional_context": [],
        "outputs": ["trimmed video output", "trim metadata"],
        "limitations": [
            "Works on uploaded videos.",
            "Does not perform scene-aware trimming.",
        ],
    },
    {
        "id": "extract_video_frame",
        "title": "Extract frame from uploaded video",
        "category": "video_analysis",
        "execution_status": "implemented_command",
        "supported_media": ["video"],
        "user_examples": [
            "extract frame at 1 second",
            "show frame at 2 seconds",
        ],
        "mapped_actions": ["extract_frame"],
        "mapped_workflows": [
            "POST /commands/execute",
            "POST /video/frame/{filename}",
        ],
        "required_context": ["uploaded video", "timestamp"],
        "optional_context": [],
        "outputs": ["extracted frame image", "frame metadata"],
        "limitations": [
            "Extracts frames from uploaded videos.",
            "Does not analyze the frame unless a separate detection step runs.",
        ],
    },
    {
        "id": "detect_video_frames",
        "title": "Detect objects in selected video frames",
        "category": "video_analysis",
        "execution_status": "implemented_command",
        "supported_media": ["video"],
        "user_examples": [
            "show frames with people from 0 to 3 seconds",
            "find cars from 1 to 5 seconds",
        ],
        "mapped_actions": ["detect_frames"],
        "mapped_workflows": [
            "POST /commands/execute",
            "video frame extraction plus detection",
        ],
        "required_context": [
            "uploaded video",
            "supported class name",
            "time range",
        ],
        "optional_context": ["confidence threshold", "frame interval"],
        "outputs": [
            "sampled frame detections",
            "frame-level detection metadata",
        ],
        "limitations": [
            "This is sampled uploaded-video analysis, not live or streaming detection.",
            "Does not assign persistent object IDs.",
        ],
    },
    {
        "id": "video_object_analysis_workflow",
        "title": "Run professional uploaded-video object analysis",
        "category": "video_analysis",
        "execution_status": "workflow_available_manual",
        "supported_media": ["video"],
        "user_examples": [
            "detect video objects",
            "analyze this video",
            "summarize this video timeline",
        ],
        "mapped_actions": [],
        "mapped_workflows": [
            "POST /video/detect-objects/{filename}",
            "video object timeline",
            "key moments",
            "keyframe gallery",
            "object presence strip",
            "motion and change summary",
        ],
        "required_context": ["uploaded video"],
        "optional_context": [
            "confidence threshold",
            "class filter",
            "sampling interval",
        ],
        "outputs": [
            "annotated video output",
            "object timeline",
            "key moments",
            "keyframe gallery",
            "object presence strip",
            "motion/change summary",
        ],
        "limitations": [
            "Currently available through the video workflow UI.",
            "Command-triggered execution is planned for E.4.",
            "Does not assign persistent object IDs.",
        ],
    },
    {
        "id": "video_privacy_review",
        "title": "Review video privacy evidence",
        "category": "video_reporting",
        "execution_status": "workflow_available_manual",
        "supported_media": ["video"],
        "user_examples": [
            "review video privacy",
            "what should I check before sharing this video",
        ],
        "mapped_actions": [],
        "mapped_workflows": [
            "video privacy review panel",
            "video analysis report export",
            "video chat grounded in E.3 context",
        ],
        "required_context": ["video object analysis result"],
        "optional_context": ["detected class timeline"],
        "outputs": [
            "privacy review summary",
            "person/object timing evidence",
            "safe limitation notes",
        ],
        "limitations": [
            "Does not identify people.",
            "Does not detect faces.",
            "Does not infer emotions, intent, or private activities.",
            "Command-triggered report execution is planned for E.4.",
        ],
    },
    {
        "id": "video_analysis_report",
        "title": "Create video analysis report",
        "category": "video_reporting",
        "execution_status": "workflow_available_manual",
        "supported_media": ["video"],
        "user_examples": [
            "create a video analysis report",
            "export this video timeline report",
        ],
        "mapped_actions": [],
        "mapped_workflows": [
            "video analysis Markdown report export",
            "video object detection result",
            "video privacy review",
            "tracking readiness summary",
        ],
        "required_context": ["video object analysis result"],
        "optional_context": [],
        "outputs": ["Markdown video analysis report"],
        "limitations": [
            "Currently generated from the frontend workflow.",
            "Command-driven report generation is planned for E.4.",
        ],
    },
    {
        "id": "tracking_readiness_summary",
        "title": "Summarize tracking readiness",
        "category": "video_analysis",
        "execution_status": "workflow_available_manual",
        "supported_media": ["video"],
        "user_examples": [
            "is this ready for tracking",
            "summarize tracking readiness",
        ],
        "mapped_actions": [],
        "mapped_workflows": [
            "tracking readiness summary panel",
            "video chat grounded in E.3 context",
        ],
        "required_context": ["video object analysis result"],
        "optional_context": ["object timeline"],
        "outputs": [
            "class-level tracking-readiness candidates",
            "limitations for real tracking",
        ],
        "limitations": [
            "This is not real persistent object tracking.",
            "Stable track IDs are not assigned yet.",
            "Real backend tracking remains future work.",
        ],
    },
    {
        "id": "supported_classes_explanation",
        "title": "Explain supported object classes",
        "category": "command_support",
        "execution_status": "partially_implemented_command_support",
        "supported_media": ["image", "video"],
        "user_examples": [
            "what objects can you detect",
            "can you detect helmets",
            "why cannot you blur wallets",
        ],
        "mapped_actions": [],
        "mapped_workflows": [
            "supported class registry",
            "alias normalization",
            "unsupported class fallback messages",
        ],
        "required_context": [],
        "optional_context": ["requested class name"],
        "outputs": [
            "supported class explanation",
            "unsupported class limitation message",
            "suggested supported classes",
        ],
        "limitations": [
            "The current detector only supports its known class list.",
            "Open-vocabulary detection is future work.",
        ],
    },
]


def get_command_skills_registry() -> Dict[str, Any]:
    """Return the complete command skills registry."""

    skills = deepcopy(COMMAND_SKILLS)

    return {
        "version": COMMAND_SKILLS_REGISTRY_VERSION,
        "milestone": "E.4.1",
        "status": "foundation",
        "description": (
            "Registry of implemented command skills, manual workflow skills, "
            "planned command-driven workflows, required context, outputs, "
            "and limitations."
        ),
        "skill_count": len(skills),
        "skills": skills,
        "notes": [
            "implemented_command skills can already run through command execution.",
            "workflow_available_manual skills exist in the app but are not fully command-triggered yet.",
            "planned E.4 work should connect manual workflows to command execution safely.",
            "The registry is not a claim that every listed workflow is already command-driven.",
        ],
    }


def get_command_skill_by_id(skill_id: str) -> Optional[Dict[str, Any]]:
    """Return one command skill by ID."""

    normalized_skill_id = skill_id.strip().lower().replace(" ", "_").replace("-", "_")

    for skill in COMMAND_SKILLS:
        if skill["id"] == normalized_skill_id:
            return deepcopy(skill)

    return None
