from fastapi import HTTPException


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
            "Set up an external LLM provider before using parser_mode=real_llm."
        )


def get_llm_provider() -> BaseLLMProvider:
    return DisabledLLMProvider()


def parse_command_with_provider(system_prompt: str, user_prompt: str) -> dict:
    provider = get_llm_provider()

    try:
        return provider.parse_command(system_prompt, user_prompt)
    except LLMProviderNotConfiguredError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        )
