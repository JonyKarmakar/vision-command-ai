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

    if "extract" in normalized_command and "frames" in words:
        numbers = _extract_numbers(normalized_command)

        if len(numbers) < 2:
            raise HTTPException(
                status_code=400,
                detail="Please specify a start and end time, for example: extract frames from 0 to 3 seconds",
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
            "extract frames from 0 to 3 seconds, trim video from 0 to 2 seconds"
        ),
    )
