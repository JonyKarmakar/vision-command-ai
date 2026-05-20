import os

from fastapi import HTTPException


SUPPORTED_LLM_PROVIDERS = {"disabled", "openai"}


class LLMProviderNotConfiguredError(Exception):
    pass


class LLMProviderNotImplementedError(Exception):
    pass


class BaseLLMProvider:
    provider_name = "base"

    def is_configured(self) -> bool:
        return False

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        raise NotImplementedError


class DisabledLLMProvider(BaseLLMProvider):
    provider_name = "disabled"

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        raise LLMProviderNotConfiguredError(
            "Real LLM provider is not configured: LLM_PROVIDER is disabled. "
            "Set LLM_PROVIDER to a supported external provider before using parser_mode=real_llm."
        )


class OpenAILLMProvider(BaseLLMProvider):
    provider_name = "openai"

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model = os.getenv("OPENAI_MODEL", "").strip()

    def is_configured(self) -> bool:
        return bool(self.api_key and self.model)

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        if not self.is_configured():
            raise LLMProviderNotConfiguredError(
                "OpenAI provider is selected but OPENAI_API_KEY or OPENAI_MODEL is missing."
            )

        raise LLMProviderNotImplementedError(
            "OpenAI provider configuration exists, but the real API call is not implemented yet."
        )


def get_configured_provider_name() -> str:
    return os.getenv("LLM_PROVIDER", "disabled").strip().lower()


def get_llm_provider() -> BaseLLMProvider:
    provider_name = get_configured_provider_name()

    if provider_name == "disabled":
        return DisabledLLMProvider()

    if provider_name == "openai":
        return OpenAILLMProvider()

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
    except LLMProviderNotImplementedError as error:
        raise HTTPException(
            status_code=501,
            detail=str(error),
        )


def get_llm_provider_status():
    provider_name = get_configured_provider_name()
    is_supported = provider_name in SUPPORTED_LLM_PROVIDERS

    provider_model = None
    is_configured = False

    if is_supported:
        provider = get_llm_provider()
        is_configured = provider.is_configured()

        if isinstance(provider, OpenAILLMProvider):
            provider_model = provider.model or None

    return {
        "provider_name": provider_name,
        "provider_model": provider_model,
        "is_supported": is_supported,
        "is_configured": is_configured,
        "real_llm_available": False,
        "supported_llm_providers": sorted(SUPPORTED_LLM_PROVIDERS),
        "supported_parser_modes": [
            "rule_based",
            "llm_mock",
            "real_llm",
        ],
    }
