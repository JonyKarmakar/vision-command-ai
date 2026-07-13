import re

from fastapi import HTTPException

from app.services.model_classes import (
    build_unsupported_class_message,
    is_supported_model_class,
    normalize_model_class_name,
)


def normalize_requested_class_name(class_name: str):
    return normalize_model_class_name(class_name)


def normalize_supported_requested_class_name(class_name: str):
    normalized_class_name = normalize_requested_class_name(class_name)

    if is_supported_model_class(normalized_class_name):
        return normalized_class_name

    raise HTTPException(
        status_code=400,
        detail=build_unsupported_class_message(class_name),
    )



def _format_examples(examples: list[str]) -> str:
    return "; ".join(examples)


def _clarification_message(message: str, examples: list[str]) -> str:
    return f"{message} Try: {_format_examples(examples)}."


def _unsupported_command_message() -> str:
    return _clarification_message(
        "I could not map this command to a supported VisionCommand action yet.",
        [
            "detect objects",
        "auto enhance image",
        "improve brightness",
        "increase contrast",
        "sharpen image",
            "crop person",
            "crop bottle",
            "blur all people",
            "zoom into the biggest person",
            "find cars",
            "show frames with people from 0 to 3 seconds",
            "track person from 0 to 3 seconds",
            "trim video from 0 to 2 seconds",
        ],
    )


def _extract_numbers(command: str):
    return [float(value) for value in re.findall(r"(\d+(?:\.\d+)?)", command)]


def _extract_first_number(command: str):
    numbers = _extract_numbers(command)

    if not numbers:
        return None

    return numbers[0]


def _extract_two_numbers(command: str):
    numbers = _extract_numbers(command)

    if len(numbers) < 2:
        return None

    return numbers[0], numbers[1]


def parse_command(command: str):
    normalized_command = command.lower().strip()
    words = normalized_command.split()

    if "detect" in normalized_command and "frames" in words:
        numbers = _extract_numbers(normalized_command)

        if len(numbers) < 2:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a frame detection command, but I need a start and end time.",
                    ["detect frames from 0 to 3 seconds"],
                ),
            )

        start_seconds = numbers[0]
        end_seconds = numbers[1]
        interval_seconds = numbers[2] if len(numbers) >= 3 else 1.0

        return {
            "action": "detect_frames",
            "class_name": None,
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
            "interval_seconds": interval_seconds,
        }

    if "extract" in normalized_command and "frames" in words:
        numbers = _extract_numbers(normalized_command)

        if len(numbers) < 2:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a multi-frame extraction command, but I need a start and end time.",
                    ["extract frames from 0 to 3 seconds"],
                ),
            )

        start_seconds = numbers[0]
        end_seconds = numbers[1]
        interval_seconds = numbers[2] if len(numbers) >= 3 else 1.0

        return {
            "action": "extract_frames",
            "class_name": None,
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
            "interval_seconds": interval_seconds,
        }

    if "extract" in normalized_command and "frame" in normalized_command:
        timestamp_seconds = _extract_first_number(normalized_command)

        if timestamp_seconds is None:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a frame extraction command, but I need a timestamp.",
                    ["extract frame at 1 second"],
                ),
            )

        return {
            "action": "extract_frame",
            "class_name": None,
            "timestamp_seconds": timestamp_seconds,
        }

    if "track" in normalized_command:
        time_range = _extract_two_numbers(normalized_command)

        if time_range is None:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a tracking command, but I need a start and end time.",
                    ["track video from 0 to 3 seconds", "track person from 0 to 3 seconds"],
                ),
            )

        start_seconds, end_seconds = time_range

        # Remove numbers from the command before trying to extract class words.
        command_without_numbers = re.sub(r"\d+(?:\.\d+)?", "", normalized_command)
        words_without_numbers = command_without_numbers.split()

        ignored_words = {
            "track",
            "video",
            "from",
            "to",
            "second",
            "seconds",
            "the",
            "a",
            "an",
            "object",
            "objects",
            "detected",
        }

        class_words = [
            word for word in words_without_numbers
            if word not in ignored_words
        ]

        class_name = normalize_supported_requested_class_name(" ".join(class_words)) if class_words else None

        return {
            "action": "track_video",
            "class_name": class_name,
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
            "interval_seconds": 1.0,
        }

    if "trim" in normalized_command and "video" in normalized_command:
        time_range = _extract_two_numbers(normalized_command)

        if time_range is None:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a trim command, but I need a start and end time.",
                    ["trim video from 0 to 2 seconds"],
                ),
            )

        start_seconds, end_seconds = time_range

        return {
            "action": "trim_video",
            "class_name": None,
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
        }

    if "show" in words and "frames" in words:
        numbers = _extract_numbers(normalized_command)

        if len(numbers) < 2:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a frame search command, but I need a start and end time.",
                    ["show frames with people from 0 to 3 seconds"],
                ),
            )

        start_seconds = numbers[0]
        end_seconds = numbers[1]
        interval_seconds = numbers[2] if len(numbers) >= 3 else 1.0

        command_without_numbers = re.sub(r"\d+(?:\.\d+)?", "", normalized_command)
        words_without_numbers = command_without_numbers.split()

        ignored_words = {
            "show",
            "frame",
            "frames",
            "with",
            "containing",
            "that",
            "have",
            "has",
            "from",
            "to",
            "at",
            "every",
            "second",
            "seconds",
            "the",
            "a",
            "an",
            "object",
            "objects",
            "detected",
            "in",
            "image",
            "photo",
            "picture",
            "video",
        }

        class_words = [
            word for word in words_without_numbers
            if word not in ignored_words
        ]

        if not class_words:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a frame search command, but I need an object class.",
                    ["show frames with people from 0 to 3 seconds"],
                ),
            )

        return {
            "action": "detect_frames",
            "class_name": normalize_supported_requested_class_name(" ".join(class_words)),
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
            "interval_seconds": interval_seconds,
        }

    if "find" in words:
        ignored_words = {
            "find",
            "the",
            "a",
            "an",
            "object",
            "objects",
            "detected",
            "in",
            "image",
            "photo",
            "picture",
            "video",
            "frame",
            "frames",
        }

        class_words = [
            word for word in words
            if word not in ignored_words
        ]

        if not class_words:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a find command, but I need an object class.",
                    ["find cars", "find people", "detect objects"],
                ),
            )

        return {
            "action": "detect",
            "class_name": normalize_supported_requested_class_name(" ".join(class_words)),
        }

    enhancement_terms = {
        "enhance",
        "brightness",
        "brighten",
        "brighter",
        "contrast",
        "saturation",
        "saturate",
        "sharpness",
        "sharpen",
        "sharper",
    }

    if any(term in normalized_command for term in enhancement_terms):
        parsed_command = {
            "action": "enhance_image",
            "brightness": 1.0,
            "contrast": 1.0,
            "saturation": 1.0,
            "sharpness": 1.0,
        }

        has_specific_adjustment = False

        if (
            "brightness" in words
            or "brighten" in words
            or "brighter" in words
        ):
            parsed_command["brightness"] = 1.12
            has_specific_adjustment = True

        if "contrast" in words:
            parsed_command["contrast"] = 1.12
            has_specific_adjustment = True

        if "saturation" in words or "saturate" in words:
            parsed_command["saturation"] = 1.12
            has_specific_adjustment = True

        if "sharpness" in words or "sharpen" in normalized_command or "sharper" in words:
            parsed_command["sharpness"] = 1.45
            has_specific_adjustment = True

        if "auto" in words or not has_specific_adjustment:
            parsed_command.update(
                {
                    "brightness": 1.1,
                    "contrast": 1.12,
                    "saturation": 1.08,
                    "sharpness": 1.35,
                }
            )

        return parsed_command

    if "detect" in normalized_command:
        return {
            "action": "detect",
            "class_name": None,
        }

    if "crop" in normalized_command:
        ignored_words = {
            "crop",
            "the",
            "a",
            "an",
            "object",
            "objects",
            "best",
            "detected",
        }

        class_words = [
            word for word in words
            if word not in ignored_words
        ]

        if not class_words:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a crop command, but I need an object class.",
                    ["crop person", "crop bottle", "crop bike"],
                ),
            )

        return {
            "action": "crop_by_class",
            "class_name": normalize_supported_requested_class_name(" ".join(class_words)),
        }

    if "blur" in normalized_command:
        blur_all = "all" in words

        ignored_words = {
            "blur",
            "the",
            "a",
            "an",
            "object",
            "objects",
            "best",
            "detected",
            "all",
        }

        class_words = [
            word for word in words
            if word not in ignored_words
        ]

        if not class_words:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a blur command, but I need an object class.",
                    ["blur person", "blur all people", "blur phone"],
                ),
            )

        return {
            "action": "blur_all_by_class" if blur_all else "blur_by_class",
            "class_name": normalize_supported_requested_class_name(" ".join(class_words)),
        }

    if "zoom" in normalized_command:
        target_scope = None
        scope_aliases = {
            "best": "best",
            "largest": "largest",
            "biggest": "largest",
            "main": "largest",
            "left": "left",
            "right": "right",
            "center": "center",
            "centre": "center",
            "middle": "center",
            "single": "single",
        }

        ignored_words = {
            "zoom",
            "in",
            "on",
            "into",
            "the",
            "a",
            "an",
            "object",
            "objects",
            "detected",
        }

        class_words = []
        for word in words:
            if word in scope_aliases:
                target_scope = scope_aliases[word]
                continue

            if word not in ignored_words:
                class_words.append(word)

        if not class_words:
            raise HTTPException(
                status_code=400,
                detail=_clarification_message(
                    "I understood this as a zoom command, but I need an object class.",
                    ["zoom person", "zoom into the biggest person", "zoom left person"],
                ),
            )

        parsed_command = {
            "action": "zoom_by_class",
            "class_name": normalize_supported_requested_class_name(" ".join(class_words)),
        }

        if target_scope:
            parsed_command["target_scope"] = target_scope

        return parsed_command


    supported_examples = [
        "detect objects",
        "crop person",
        "crop bottle",
        "blur person",
        "zoom person",
        "extract frame at 1 second",
        "extract frames from 0 to 3 seconds",
        "detect frames from 0 to 3 seconds",
        "track video from 0 to 3 seconds",
        "track person from 0 to 3 seconds",
        "trim video from 0 to 2 seconds",
    ]

    raise HTTPException(
        status_code=400,
        detail=_unsupported_command_message(),
    )
