import pytest
from fastapi import HTTPException

from app.services.command_evaluation import evaluate_command_planner


def test_evaluate_command_planner_returns_summary():
    result = evaluate_command_planner("rule_based")

    assert result["planner_mode"] == "rule_based"
    assert result["planner_type"] == "rule_based"
    assert result["planner_version"] == "v1"
    assert result["total_cases"] == 8
    assert result["passed_cases"] == 8
    assert result["failed_cases"] == 0
    assert result["accuracy"] == 1.0
    assert len(result["results"]) == 8


def test_evaluate_command_planner_result_shape():
    result = evaluate_command_planner("rule_based")
    first_case = result["results"][0]

    assert set(first_case.keys()) == {
        "command",
        "expected",
        "actual",
        "passed",
        "error",
    }
    assert first_case["passed"] is True
    assert first_case["error"] is None


def test_evaluate_command_planner_rejects_unsupported_mode():
    with pytest.raises(HTTPException) as exception_info:
        evaluate_command_planner("llm")

    assert exception_info.value.status_code == 400
    assert exception_info.value.detail == "Supported planner modes are: rule_based, llm_mock"



def test_evaluate_command_planner_accepts_llm_mock_mode():
    result = evaluate_command_planner("llm_mock")

    assert result["planner_mode"] == "llm_mock"
    assert result["planner_type"] == "llm_mock"
    assert result["planner_version"] == "mock-v1"
    assert result["total_cases"] == 8
    assert result["passed_cases"] == 8
    assert result["failed_cases"] == 0
    assert result["accuracy"] == 1.0
