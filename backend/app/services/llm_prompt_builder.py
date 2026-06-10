from app.services.model_classes import (
    get_class_aliases,
    get_supported_model_classes,
)


COMMAND_PARSER_PROMPT_VERSION = "prompt-v2"


EXPECTED_COMMAND_JSON_SCHEMA = {
    "type": "object",
    "required": ["action"],
    "properties": {
        "action": {
            "type": "string",
            "description": "Structured command action such as detect, crop_by_class, blur_by_class, extract_frame, extract_frames, detect_frames, track_video, or trim_video.",
        },
        "class_name": {
            "type": ["string", "null"],
            "description": "Detected object class requested by the user. Must be null or one of the supported YOLO object classes.",
        },
        "timestamp_seconds": {
            "type": ["number", "null"],
            "description": "Timestamp for single-frame extraction commands.",
        },
        "start_seconds": {
            "type": ["number", "null"],
            "description": "Start time for video range commands.",
        },
        "end_seconds": {
            "type": ["number", "null"],
            "description": "End time for video range commands.",
        },
        "interval_seconds": {
            "type": ["number", "null"],
            "description": "Sampling interval for multi-frame video commands.",
        },
    },
}


def _format_supported_object_classes():
    return ", ".join(get_supported_model_classes())


def _format_class_aliases():
    aliases = get_class_aliases()

    return "\n".join(
        f"- {alias} -> {class_name}"
        for alias, class_name in sorted(aliases.items())
    )


def build_command_parser_prompt(command: str):
    supported_object_classes = _format_supported_object_classes()
    class_aliases = _format_class_aliases()

    system_prompt = (
        "You are a command parser for a computer vision application. "
        "Convert the user's natural language command into a strict JSON object. "
        "Return only valid JSON. Do not include explanations. "
        "Only use object class names supported by the current YOLO model."
    )

    user_prompt = f"""
Parse this command:

{command}

Supported actions:
- detect
- crop_by_class
- blur_by_class
- blur_all_by_class
- extract_frame
- extract_frames
- detect_frames
- track_video
- trim_video

Supported object classes for class_name:
{supported_object_classes}

Class-name rules:
- class_name must be null or exactly one of the supported object classes listed above.
- Use null for actions that do not require an object class.
- Normalize common user words to supported class names before returning JSON.
- If the user asks for an unsupported object class, return the closest supported class only when it is clearly equivalent. Otherwise set class_name to null.

Common alias normalizations:
{class_aliases}

Return a JSON object matching the expected schema.
""".strip()

    return {
        "prompt_version": COMMAND_PARSER_PROMPT_VERSION,
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
        "expected_json_schema": EXPECTED_COMMAND_JSON_SCHEMA,
    }


COMMAND_PLANNER_PROMPT_VERSION = "planner-prompt-v1"


EXPECTED_COMMAND_PLAN_JSON_SCHEMA = {
    "type": "object",
    "required": [
        "media_type",
        "action",
        "target_class",
        "target_scope",
        "requires_detection",
        "requires_tracking",
        "parameters",
        "confidence",
        "needs_clarification",
        "clarification_question",
    ],
    "properties": {
        "media_type": {
            "type": "string",
            "description": "Media type for the command. Must be image, video, or unknown.",
        },
        "action": {
            "type": "string",
            "description": "Planned action such as detect, annotate, crop_by_class, blur_by_class, blur_all_by_class, zoom, track, extract_frames, summarize, or unknown.",
        },
        "target_class": {
            "type": ["string", "null"],
            "description": "Target object class. Must be null or exactly one supported YOLO object class.",
        },
        "target_scope": {
            "type": "string",
            "description": "Target scope such as single, all, largest, smallest, left, right, top, bottom, center, or unknown.",
        },
        "requires_detection": {
            "type": "boolean",
            "description": "Whether the plan requires object detection before execution.",
        },
        "requires_tracking": {
            "type": "boolean",
            "description": "Whether the plan requires video object tracking.",
        },
        "parameters": {
            "type": "object",
            "description": "Additional action parameters. Use an empty object when no extra parameters are needed.",
        },
        "confidence": {
            "type": "number",
            "description": "Planner confidence between 0 and 1.",
        },
        "needs_clarification": {
            "type": "boolean",
            "description": "Whether the user command is incomplete or ambiguous.",
        },
        "clarification_question": {
            "type": ["string", "null"],
            "description": "Clarifying question when needs_clarification is true. Otherwise null.",
        },
    },
}


def build_command_planner_prompt(command: str):
    supported_object_classes = _format_supported_object_classes()
    class_aliases = _format_class_aliases()

    system_prompt = (
        "You are a command planner for a computer vision media assistant. "
        "Convert the user's natural language command into a strict JSON command plan. "
        "Return only valid JSON. Do not include explanations. "
        "Only use object class names supported by the current YOLO model."
    )

    user_prompt = f"""
Plan this command:

{command}

Supported media_type values:
- image
- video
- unknown

Supported action values:
- detect
- annotate
- crop_by_class
- blur_by_class
- blur_all_by_class
- zoom
- track
- extract_frames
- summarize
- unknown

Supported target_scope values:
- single
- all
- largest
- smallest
- left
- right
- top
- bottom
- center
- unknown

Supported object classes for target_class:
{supported_object_classes}

Planning rules:
- target_class must be null or exactly one of the supported object classes listed above.
- Use null when the command does not target a specific object class.
- Normalize common user words to supported class names before returning JSON.
- Use needs_clarification=true when the command is incomplete, ambiguous, or cannot be safely executed.
- Use clarification_question to ask one direct question when clarification is needed.
- Set requires_detection=true for object detection, annotation, crop, blur, zoom, and tracking plans.
- Set requires_tracking=true only for video tracking plans.
- Use parameters={{}} when no additional parameters are required.

Common alias normalizations:
{class_aliases}

Return a JSON object matching the expected schema.
""".strip()

    return {
        "prompt_version": COMMAND_PLANNER_PROMPT_VERSION,
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
        "expected_json_schema": EXPECTED_COMMAND_PLAN_JSON_SCHEMA,
    }
