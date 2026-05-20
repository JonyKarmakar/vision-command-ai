import pytest
from fastapi import HTTPException

from app.services.llm_provider import (
    DisabledLLMProvider,
    LLMProviderNotConfiguredError,
    get_llm_provider,
    parse_command_with_provider,
)


def test_get_llm_provider_returns_disabled_provider_by_default():
    provider = get_llm_provider()

    assert isinstance(provider, DisabledLLMProvider)
    assert provider.provider_name == "disabled"


def test_disabled_llm_provider_raises_not_configured_error():
    provider = DisabledLLMProvider()

    with pytest.raises(LLMProviderNotConfiguredError) as error:
        provider.parse_command(
            system_prompt="system",
            user_prompt="user",
        )

    assert "not configured" in str(error.value)


def test_parse_command_with_provider_returns_503_when_not_configured():
    with pytest.raises(HTTPException) as error:
        parse_command_with_provider(
            system_prompt="system",
            user_prompt="user",
        )

    assert error.value.status_code == 503
    assert "not configured" in error.value.detail
