import pytest
from fastapi import HTTPException

from app.services.llm_provider import (
    DisabledLLMProvider,
    LLMProviderNotConfiguredError,
    get_configured_provider_name,
    get_llm_provider,
    get_llm_provider_status,
    parse_command_with_provider,
)


def test_get_configured_provider_name_defaults_to_disabled(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    assert get_configured_provider_name() == "disabled"


def test_get_configured_provider_name_reads_env(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", " DISABLED ")

    assert get_configured_provider_name() == "disabled"


def test_get_llm_provider_returns_disabled_provider_by_default(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    provider = get_llm_provider()

    assert isinstance(provider, DisabledLLMProvider)
    assert provider.provider_name == "disabled"


def test_get_llm_provider_rejects_unsupported_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")

    with pytest.raises(HTTPException) as error:
        get_llm_provider()

    assert error.value.status_code == 400
    assert "Unsupported LLM provider" in error.value.detail


def test_disabled_llm_provider_raises_not_configured_error():
    provider = DisabledLLMProvider()

    with pytest.raises(LLMProviderNotConfiguredError) as error:
        provider.parse_command(
            system_prompt="system",
            user_prompt="user",
        )

    assert "not configured" in str(error.value)


def test_parse_command_with_provider_returns_503_when_disabled(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "disabled")

    with pytest.raises(HTTPException) as error:
        parse_command_with_provider(
            system_prompt="system",
            user_prompt="user",
        )

    assert error.value.status_code == 503
    assert "not configured" in error.value.detail


def test_llm_provider_status_default(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    status = get_llm_provider_status()

    assert status["provider_name"] == "disabled"
    assert status["is_supported"] is True
    assert status["is_configured"] is False
    assert status["real_llm_available"] is False
    assert status["supported_llm_providers"] == ["disabled"]


def test_llm_provider_status_for_unsupported_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")

    status = get_llm_provider_status()

    assert status["provider_name"] == "openai"
    assert status["is_supported"] is False
    assert status["is_configured"] is False
    assert status["real_llm_available"] is False
    assert status["supported_llm_providers"] == ["disabled"]
