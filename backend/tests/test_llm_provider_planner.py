import pytest
from fastapi import HTTPException

from app.services.llm_provider import (
    COMMAND_PLANNER_OUTPUT_SCHEMA,
    DisabledLLMProvider,
    LLMProviderNotConfiguredError,
    plan_command_with_provider,
)


def test_command_planner_output_schema_contains_required_fields():
    required_fields = COMMAND_PLANNER_OUTPUT_SCHEMA["required"]

    assert "media_type" in required_fields
    assert "action" in required_fields
    assert "target_class" in required_fields
    assert "target_scope" in required_fields
    assert "requires_detection" in required_fields
    assert "requires_tracking" in required_fields
    assert "parameters" in required_fields
    assert "confidence" in required_fields
    assert "needs_clarification" in required_fields
    assert "clarification_question" in required_fields


def test_disabled_provider_plan_command_raises_planner_message():
    provider = DisabledLLMProvider()

    with pytest.raises(LLMProviderNotConfiguredError) as exception_info:
        provider.plan_command("system", "user")

    assert "planner_mode=real_llm" in str(exception_info.value)


def test_plan_command_with_provider_returns_503_when_disabled(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "disabled")

    with pytest.raises(HTTPException) as exception_info:
        plan_command_with_provider(
            system_prompt="system",
            user_prompt="user",
        )

    assert exception_info.value.status_code == 503
    assert "planner_mode=real_llm" in exception_info.value.detail
