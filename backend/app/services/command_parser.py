import re

from fastapi import HTTPException


def normalize_requested_class_name(class_name: str):
    normalized = class_name.lower().strip()

    aliases = {
        "people": "person",
        "persons": "person",
    }

    if normalized in aliases:
        return aliases[normalized]

    if normalized.endswith("s") and len(normalized) > 1:
        return normalized[:-1]

    return normalized


def _extract_first_number(command: str):
    match = re.search(r"(\d+(?:\.\d+)?)", command)

    if not match:
        return None

    return float(match.group(1))


def _extract_two_numbers(command: str):
    matches = re.findall(r"(\d+(?:\.\d+)?)", command)

    if len(matches) < 2:
        return None

    return float(matches[0]), float(matches[1])


def parse_command(command: str):
    normalized_command = command.lower().strip()
    words = normalized_command.split()

    if "extract" in normalized_command and "frame" in normalized_command:
        timestamp_seconds = _extract_first_number(normalized_command)

        if timestamp_seconds is None:
            raise HTTPException(
                status_code=400,
                detail="Please specify a timestamp, for example: extract frame at 1 second",
            )

        return {
            "action": "extract_frame",
            "class_name": None,
            "timestamp_seconds": timestamp_seconds,
        }

    if "trim" in normalized_command and "video" in normalized_command:
        time_range = _extract_two_numbers(normalized_command)

        if time_range is None:
            raise HTTPException(
                status_code=400,
                detail="Please specify a start and end time, for example: trim video from 0 to 2 seconds",
            )

        start_seconds, end_seconds = time_range

        return {
            "action": "trim_video",
            "class_name": None,
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
        }

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
                detail="Please specify which class to crop, for example: crop person",
            )

        return {
            "action": "crop_by_class",
            "class_name": normalize_requested_class_name(" ".join(class_words)),
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
                detail="Please specify which class to blur, for example: blur person",
            )

        return {
            "action": "blur_all_by_class" if blur_all else "blur_by_class",
            "class_name": normalize_requested_class_name(" ".join(class_words)),
        }

    raise HTTPException(
        status_code=400,
        detail=(
            "Unsupported command. Try commands like: detect objects, crop person, "
            "crop bottle, blur person, extract frame at 1 second, "
            "trim video from 0 to 2 seconds"
        ),
    )
