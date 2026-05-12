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


def parse_command(command: str):
    normalized_command = command.lower().strip()
    words = normalized_command.split()

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
        detail="Unsupported command. Try commands like: detect objects, crop person, crop bottle, blur person",
    )
