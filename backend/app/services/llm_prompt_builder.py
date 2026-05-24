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
