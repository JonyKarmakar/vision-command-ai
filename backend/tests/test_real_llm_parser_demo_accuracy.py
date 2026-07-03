from app.services.llm_prompt_builder import build_command_parser_prompt
from app.services.llm_provider import (
    COMMAND_PARSER_OUTPUT_SCHEMA,
    _repair_ollama_parsed_command,
)


def _parsed_command(
    action,
    class_name=None,
    timestamp_seconds=None,
    start_seconds=None,
    end_seconds=None,
    interval_seconds=None,
    target_scope=None,
):
    command = {
        "action": action,
        "class_name": class_name,
        "timestamp_seconds": timestamp_seconds,
        "start_seconds": start_seconds,
        "end_seconds": end_seconds,
        "interval_seconds": interval_seconds,
    }

    if target_scope is not None:
        command["target_scope"] = target_scope

    return command


def test_real_llm_parser_schema_supports_zoom_target_scope():
    action_enum = COMMAND_PARSER_OUTPUT_SCHEMA["properties"]["action"]["enum"]

    assert "zoom_by_class" in action_enum
    assert "target_scope" in COMMAND_PARSER_OUTPUT_SCHEMA["properties"]


def test_ollama_repair_uses_actual_command_for_people_alias():
    prompt = build_command_parser_prompt("Blur all people in the image")["user_prompt"]

    repaired = _repair_ollama_parsed_command(
        _parsed_command(
            action="blur_all_by_class",
            class_name="traffic light",
        ),
        prompt,
    )

    assert repaired["action"] == "blur_all_by_class"
    assert repaired["class_name"] == "person"


def test_ollama_repair_converts_zoom_command_to_zoom_by_class():
    prompt = build_command_parser_prompt("Zoom into the person on the left")["user_prompt"]

    repaired = _repair_ollama_parsed_command(
        _parsed_command(action="detect"),
        prompt,
    )

    assert repaired["action"] == "zoom_by_class"
    assert repaired["class_name"] == "person"
    assert repaired["target_scope"] == "left"
    assert repaired["timestamp_seconds"] is None


def test_ollama_repair_keeps_extract_frame_timestamp_in_seconds():
    prompt = build_command_parser_prompt("Extract a frame at 1 second")["user_prompt"]

    repaired = _repair_ollama_parsed_command(
        _parsed_command(
            action="extract_frame",
            timestamp_seconds=1000,
        ),
        prompt,
    )

    assert repaired["action"] == "extract_frame"
    assert repaired["timestamp_seconds"] == 1.0
    assert repaired["class_name"] is None
