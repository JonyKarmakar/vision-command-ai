from app.services import command_evaluation


def test_evaluate_command_parser_uses_selected_parser_mode(monkeypatch):
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

    observed_parser_modes = []

    def fake_parse_command_with_mode(command: str, parser_mode: str):
        observed_parser_modes.append(parser_mode)

        return {
            "parsed_command": {
                "action": "detect",
                "class_name": None,
                "timestamp_seconds": None,
                "start_seconds": None,
                "end_seconds": None,
                "interval_seconds": None,
            }
        }

    monkeypatch.setattr(
        command_evaluation,
        "parse_command_with_mode",
        fake_parse_command_with_mode,
    )

    result = command_evaluation.evaluate_command_parser("llm_mock")

    assert observed_parser_modes == ["llm_mock"]
    assert result["parser_type"] == "llm_mock"
    assert result["parser_version"] == "mock-v1"
    assert result["passed_cases"] == 1
    assert result["failed_cases"] == 0
    assert result["accuracy"] == 1.0


def test_command_matches_expected_compares_expected_subset():
    actual = {
        "action": "crop_by_class",
        "class_name": "person",
        "timestamp_seconds": None,
        "start_seconds": None,
        "end_seconds": None,
        "interval_seconds": None,
    }

    expected = {
        "action": "crop_by_class",
        "class_name": "person",
    }

    assert command_evaluation.command_matches_expected(actual, expected) is True


def test_command_matches_expected_detects_mismatch():
    actual = {
        "action": "crop_by_class",
        "class_name": "person",
    }

    expected = {
        "action": "crop_by_class",
        "class_name": "car",
    }

    assert command_evaluation.command_matches_expected(actual, expected) is False
