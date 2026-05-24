from app.services.llm_provider import (
    _infer_class_name_from_command,
    _repair_ollama_parsed_command,
)


def _parsed_command(action: str, class_name=None):
    return {
        "action": action,
        "class_name": class_name,
        "timestamp_seconds": None,
        "start_seconds": None,
        "end_seconds": None,
        "interval_seconds": None,
    }


def test_infer_class_name_from_model_vocabulary_aliases():
    assert _infer_class_name_from_command("crop bike") == "bicycle"
    assert _infer_class_name_from_command("blur phone") == "cell phone"
    assert _infer_class_name_from_command("track motorbike from 0 to 3 seconds") == "motorcycle"
    assert _infer_class_name_from_command("crop sofa") == "couch"


def test_infer_class_name_from_supported_plural_classes():
    assert _infer_class_name_from_command("crop cars") == "car"
    assert _infer_class_name_from_command("blur dogs") == "dog"
    assert _infer_class_name_from_command("track buses") == "bus"


def test_infer_class_name_returns_none_for_unsupported_class():
    assert _infer_class_name_from_command("crop wallet") is None


def test_repair_ollama_normalizes_existing_class_alias():
    repaired = _repair_ollama_parsed_command(
        _parsed_command("crop_by_class", class_name="bike"),
        "crop bike",
    )

    assert repaired["class_name"] == "bicycle"


def test_repair_ollama_infers_missing_class_from_prompt():
    repaired = _repair_ollama_parsed_command(
        _parsed_command("blur_by_class", class_name=None),
        "blur phone",
    )

    assert repaired["class_name"] == "cell phone"


def test_repair_ollama_drops_unsupported_class_name():
    repaired = _repair_ollama_parsed_command(
        _parsed_command("crop_by_class", class_name="wallet"),
        "crop wallet",
    )

    assert repaired["class_name"] is None
