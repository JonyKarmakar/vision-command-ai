from fastapi import HTTPException

from app.services.model_classes import (
    build_unsupported_class_message,
    is_supported_model_class,
    normalize_model_class_name,
)


SUPPORTED_ACTIONS = {
    "detect",
    "crop_by_class",
    "blur_by_class",
    "blur_all_by_class",
    "zoom_by_class",
    "extract_frame",
    "extract_frames",
    "detect_frames",
    "track_video",
    "trim_video",
    "enhance_image",
    "background_blur",
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


def _normalize_and_validate_class_name(parsed_command: dict):
    class_name = parsed_command.get("class_name")

    if class_name is None:
        return parsed_command

    if not isinstance(class_name, str) or not class_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Parsed command field must be a non-empty string: class_name",
        )

    normalized_class_name = normalize_model_class_name(class_name)

    if is_supported_model_class(normalized_class_name):
        parsed_command["class_name"] = normalized_class_name
        return parsed_command

    raise HTTPException(
        status_code=400,
        detail=build_unsupported_class_message(class_name),
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

    if action in {"crop_by_class", "blur_by_class", "blur_all_by_class", "zoom_by_class"}:
        _require_key(parsed_command, "class_name")

    if action == "enhance_image":
        for key in ("brightness", "contrast", "saturation", "sharpness"):
            if key in parsed_command:
                _require_number(parsed_command, key)

                if parsed_command[key] < 0 or parsed_command[key] > 3:
                    raise HTTPException(
                        status_code=400,
                        detail=f"{key} must be between 0 and 3",
                    )

    if action == "background_blur":
        for key in ("confidence_threshold", "padding_ratio", "blur_radius"):
            if key in parsed_command:
                _require_number(parsed_command, key)

        if parsed_command.get("confidence_threshold", 0.25) < 0 or parsed_command.get("confidence_threshold", 0.25) > 1:
            raise HTTPException(
                status_code=400,
                detail="confidence_threshold must be between 0 and 1",
            )

        if parsed_command.get("padding_ratio", 0.04) < 0 or parsed_command.get("padding_ratio", 0.04) > 0.5:
            raise HTTPException(
                status_code=400,
                detail="padding_ratio must be between 0 and 0.5",
            )

        if parsed_command.get("blur_radius", 18.0) < 1 or parsed_command.get("blur_radius", 18.0) > 80:
            raise HTTPException(
                status_code=400,
                detail="blur_radius must be between 1 and 80",
            )

    if parsed_command.get("class_name") is not None:
        parsed_command = _normalize_and_validate_class_name(parsed_command)

    if action == "zoom_by_class" and parsed_command.get("target_scope") is not None:
        target_scope = str(parsed_command["target_scope"]).lower()
        allowed_target_scopes = {"best", "largest", "left", "right", "center", "single"}

        if target_scope not in allowed_target_scopes:
            raise HTTPException(
                status_code=400,
                detail=(
                    "zoom_by_class target_scope must be one of: "
                    "best, largest, left, right, center, single"
                ),
            )

        parsed_command["target_scope"] = target_scope

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
