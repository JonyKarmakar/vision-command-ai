from app.services.llm_prompt_builder import (
    COMMAND_PARSER_PROMPT_VERSION,
    build_command_parser_prompt,
)


def test_prompt_version_updated_for_supported_classes():
    assert COMMAND_PARSER_PROMPT_VERSION == "prompt-v3"


def test_prompt_includes_supported_object_classes():
    prompt_preview = build_command_parser_prompt("crop bike")
    user_prompt = prompt_preview["user_prompt"]

    assert "Supported object classes for class_name:" in user_prompt
    assert "person" in user_prompt
    assert "bicycle" in user_prompt
    assert "cell phone" in user_prompt
    assert "sports ball" in user_prompt


def test_prompt_includes_class_alias_guidance():
    prompt_preview = build_command_parser_prompt("blur phone")
    user_prompt = prompt_preview["user_prompt"]

    assert "Common alias normalizations:" in user_prompt
    assert "- bike -> bicycle" in user_prompt
    assert "- phone -> cell phone" in user_prompt
    assert "- motorbike -> motorcycle" in user_prompt
    assert "- sofa -> couch" in user_prompt


def test_prompt_schema_class_name_mentions_supported_yolo_classes():
    prompt_preview = build_command_parser_prompt("crop bike")
    schema = prompt_preview["expected_json_schema"]

    assert (
        schema["properties"]["class_name"]["description"]
        == "Detected object class requested by the user. Must be null or one of the supported YOLO object classes."
    )
