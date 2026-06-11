import pytest
from fastapi import HTTPException

from app.services import command_planner
from app.services.command_planner import (
    get_planner_metadata,
    plan_command_with_mode,
    validate_command_plan,
)


def test_get_planner_metadata_real_llm():
    metadata = get_planner_metadata("real_llm")

    assert metadata["planner_mode"] == "real_llm"
    assert metadata["planner_type"] == "real_llm"
    assert metadata["planner_version"] == "not_configured"


def test_validate_command_plan_accepts_valid_plan():
    plan = validate_command_plan(
        {
            "media_type": "image",
            "action": "blur_by_class",
            "target_class": "person",
            "target_scope": "single",
            "requires_detection": True,
            "requires_tracking": False,
            "parameters": {},
            "confidence": 0.9,
            "needs_clarification": False,
            "clarification_question": None,
        }
    )

    assert plan.media_type == "image"
    assert plan.action == "blur_by_class"
    assert plan.target_class == "person"
    assert plan.target_scope == "single"


def test_validate_command_plan_normalizes_class_alias():
    plan = validate_command_plan(
        {
            "media_type": "image",
            "action": "blur_by_class",
            "target_class": "phone",
            "target_scope": "single",
            "requires_detection": True,
            "requires_tracking": False,
            "parameters": {},
            "confidence": 0.9,
            "needs_clarification": False,
            "clarification_question": None,
        }
    )

    assert plan.target_class == "cell phone"


def test_validate_command_plan_marks_unsupported_class_for_clarification():
    plan = validate_command_plan(
        {
            "media_type": "image",
            "action": "blur_by_class",
            "target_class": "dragon",
            "target_scope": "single",
            "requires_detection": True,
            "requires_tracking": False,
            "parameters": {},
            "confidence": 0.4,
            "needs_clarification": False,
            "clarification_question": None,
        }
    )

    assert plan.target_class is None
    assert plan.needs_clarification is True
    assert plan.clarification_question == "Which supported object class should I use for this command?"


def test_validate_command_plan_rejects_non_object_output():
    with pytest.raises(HTTPException) as exception_info:
        validate_command_plan(["not", "an", "object"])

    assert exception_info.value.status_code == 502
    assert exception_info.value.detail == "LLM planner output must be a JSON object."


def test_validate_command_plan_rejects_invalid_schema():
    with pytest.raises(HTTPException) as exception_info:
        validate_command_plan({"action": "blur_by_class"})

    assert exception_info.value.status_code == 502
    assert "LLM planner output did not match the command plan schema" in exception_info.value.detail


def test_plan_command_with_mode_real_llm_uses_provider(monkeypatch):
    def fake_plan_command_with_provider(system_prompt, user_prompt):
        assert "command planner" in system_prompt
        assert "Blur all people" in user_prompt

        return {
            "media_type": "image",
            "action": "blur_all_by_class",
            "target_class": "people",
            "target_scope": "all",
            "requires_detection": True,
            "requires_tracking": False,
            "parameters": {},
            "confidence": 0.88,
            "needs_clarification": False,
            "clarification_question": None,
        }

    monkeypatch.setattr(
        command_planner,
        "plan_command_with_provider",
        fake_plan_command_with_provider,
    )

    result = plan_command_with_mode("Blur all people", "real_llm")

    assert result["planner_mode"] == "real_llm"
    assert result["planner_type"] == "real_llm"
    assert result["planner_version"] == "planner-prompt-v1"
    assert result["plan"].action == "blur_all_by_class"
    assert result["plan"].target_class == "person"
    assert result["plan"].target_scope == "all"
