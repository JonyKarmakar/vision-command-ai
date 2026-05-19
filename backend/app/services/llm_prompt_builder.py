COMMAND_PARSER_PROMPT_VERSION = "prompt-v1"


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
            "description": "Detected object class requested by the user, such as person, bottle, car, or sports ball.",
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


def build_command_parser_prompt(command: str):
    system_prompt = (
        "You are a command parser for a computer vision application. "
        "Convert the user's natural language command into a strict JSON object. "
        "Return only valid JSON. Do not include explanations."
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

Return a JSON object matching the expected schema.
""".strip()

    return {
        "prompt_version": COMMAND_PARSER_PROMPT_VERSION,
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
        "expected_json_schema": EXPECTED_COMMAND_JSON_SCHEMA,
    }
