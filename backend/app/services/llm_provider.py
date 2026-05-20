import os

from fastapi import HTTPException


SUPPORTED_LLM_PROVIDERS = {"disabled"}


class LLMProviderNotConfiguredError(Exception):
    pass


class BaseLLMProvider:
    provider_name = "base"

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        raise NotImplementedError


class DisabledLLMProvider(BaseLLMProvider):
    provider_name = "disabled"

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        raise LLMProviderNotConfiguredError(
            "Real LLM provider is not configured yet. "
            "Set LLM_PROVIDER to a supported external provider before using parser_mode=real_llm."
        )


def get_configured_provider_name() -> str:
    return os.getenv("LLM_PROVIDER", "disabled").strip().lower()


def get_llm_provider() -> BaseLLMProvider:
    provider_name = get_configured_provider_name()

    if provider_name == "disabled":
        return DisabledLLMProvider()

    raise HTTPException(
        status_code=400,
        detail=(
            f"Unsupported LLM provider: {provider_name}. "
            f"Supported providers are: {', '.join(sorted(SUPPORTED_LLM_PROVIDERS))}"
        ),
    )


def parse_command_with_provider(system_prompt: str, user_prompt: str) -> dict:
    provider = get_llm_provider()

    try:
        return provider.parse_command(system_prompt, user_prompt)
    except LLMProviderNotConfiguredError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        )


def get_llm_provider_status():
    provider_name = get_configured_provider_name()
    is_supported = provider_name in SUPPORTED_LLM_PROVIDERS
    is_configured = provider_name != "disabled" and is_supported

    return {
        "provider_name": provider_name,
        "is_supported": is_supported,
        "is_configured": is_configured,
        "real_llm_available": is_configured,
        "supported_llm_providers": sorted(SUPPORTED_LLM_PROVIDERS),
        "supported_parser_modes": [
            "rule_based",
            "llm_mock",
            "real_llm",
        ],
    }
