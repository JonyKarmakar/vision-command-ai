from fastapi import HTTPException
import pytest

from app.services import command_evaluation


def test_evaluate_real_llm_requires_available_provider(monkeypatch):
    monkeypatch.setattr(
        command_evaluation,
        "get_llm_provider_status",
        lambda: {
            "real_llm_available": False,
        },
    )

    with pytest.raises(HTTPException) as error:
        command_evaluation.evaluate_command_parser("real_llm")

    assert error.value.status_code == 503
    assert "requires a configured provider" in error.value.detail


def test_evaluate_real_llm_uses_real_llm_parser_mode(monkeypatch):
    monkeypatch.setattr(
        command_evaluation,
        "COMMAND_EVALUATION_CASES",
        [
            {
                "command": "detect objects",
                "expected": {
                    "action": "detect",
                    "class_name": None,
                },
            }
        ],
    )

    monkeypatch.setattr(
        command_evaluation,
        "get_llm_provider_status",
        lambda: {
            "real_llm_available": True,
        },
    )

    observed_parser_modes = []

    def fake_parse_command_with_mode(command: str, parser_mode: str):
        observed_parser_modes.append(parser_mode)

        return {
            "parser_mode": "real_llm",
            "parser_type": "real_llm",
            "parser_version": "prompt-v1",
            "parsed_command": {
                "action": "detect",
                "class_name": None,
                "timestamp_seconds": None,
                "start_seconds": None,
                "end_seconds": None,
                "interval_seconds": None,
            },
        }

    monkeypatch.setattr(
        command_evaluation,
        "parse_command_with_mode",
        fake_parse_command_with_mode,
    )

    result = command_evaluation.evaluate_command_parser("real_llm")

    assert observed_parser_modes == ["real_llm"]
    assert result["parser_type"] == "real_llm"
    assert result["parser_version"] == "prompt-v1"
    assert result["passed_cases"] == 1
    assert result["failed_cases"] == 0
    assert result["accuracy"] == 1.0
