import pytest
from fastapi import HTTPException

from app.services.command_planner import get_planner_metadata, plan_command_with_mode


def test_get_planner_metadata_rule_based():
    metadata = get_planner_metadata("rule_based")

    assert metadata["planner_mode"] == "rule_based"
    assert metadata["planner_type"] == "rule_based"
    assert metadata["planner_version"] == "v1"


def test_get_planner_metadata_llm_mock():
    metadata = get_planner_metadata("llm_mock")

    assert metadata["planner_mode"] == "llm_mock"
    assert metadata["planner_type"] == "llm_mock"
    assert metadata["planner_version"] == "mock-v1"


def test_plan_command_with_mode_rule_based():
    result = plan_command_with_mode("Blur all people", "rule_based")

    assert result["planner_mode"] == "rule_based"
    assert result["planner_type"] == "rule_based"
    assert result["planner_version"] == "v1"
    assert result["plan"].action == "blur_all_by_class"
    assert result["plan"].target_class == "person"


def test_plan_command_with_mode_llm_mock():
    result = plan_command_with_mode("Crop the bike", "llm_mock")

    assert result["planner_mode"] == "llm_mock"
    assert result["planner_type"] == "llm_mock"
    assert result["planner_version"] == "mock-v1"
    assert result["plan"].action == "crop_by_class"
    assert result["plan"].target_class == "bicycle"


def test_plan_command_with_mode_rejects_unsupported_mode():
    with pytest.raises(HTTPException) as exception_info:
        plan_command_with_mode("Blur all people", "real_llm")

    assert exception_info.value.status_code == 400
    assert exception_info.value.detail == "Supported planner modes are: rule_based, llm_mock"
