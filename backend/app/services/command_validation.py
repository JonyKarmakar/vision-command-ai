from fastapi import HTTPException


SUPPORTED_ACTIONS = {
    "detect",
    "crop_by_class",
    "blur_by_class",
    "blur_all_by_class",
    "extract_frame",
    "extract_frames",
    "detect_frames",
    "track_video",
    "trim_video",
}


def _require_key(parsed_command: dict, key: str):
    if key not in parsed_command or parsed_command[key] is None:
        raise HTTPException(
            status_code=400,
            detail=f"Parsed command is missing required field: {key}",
        )


def _require_number(parsed_command: dict, key: str):
    _require_key(parsed_command, key)

    if not isinstance(parsed_command[key], (int, float)):
        raise HTTPException(
            status_code=400,
            detail=f"Parsed command field must be numeric: {key}",
        )


def validate_parsed_command(parsed_command: dict):
    if not isinstance(parsed_command, dict):
        raise HTTPException(
            status_code=400,
            detail="Parsed command must be a JSON object",
        )

    action = parsed_command.get("action")

    if action not in SUPPORTED_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported parsed action: {action}",
        )

    if action in {"crop_by_class", "blur_by_class", "blur_all_by_class"}:
        _require_key(parsed_command, "class_name")

    if action == "extract_frame":
        _require_number(parsed_command, "timestamp_seconds")

        if parsed_command["timestamp_seconds"] < 0:
            raise HTTPException(
                status_code=400,
                detail="timestamp_seconds must be greater than or equal to 0",
            )

    if action in {"extract_frames", "detect_frames", "track_video", "trim_video"}:
        _require_number(parsed_command, "start_seconds")
        _require_number(parsed_command, "end_seconds")

        if parsed_command["end_seconds"] <= parsed_command["start_seconds"]:
            raise HTTPException(
                status_code=400,
                detail="end_seconds must be greater than start_seconds",
            )

    if action in {"extract_frames", "detect_frames", "track_video"}:
        _require_number(parsed_command, "interval_seconds")

        if parsed_command["interval_seconds"] <= 0:
            raise HTTPException(
                status_code=400,
                detail="interval_seconds must be greater than 0",
            )

    return parsed_command
