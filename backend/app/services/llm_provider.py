import json
import os

from fastapi import HTTPException
from openai import OpenAI


SUPPORTED_LLM_PROVIDERS = {"disabled", "openai", "ollama"}


COMMAND_PARSER_OUTPUT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "action",
        "class_name",
        "timestamp_seconds",
        "start_seconds",
        "end_seconds",
        "interval_seconds",
    ],
    "properties": {
        "action": {
            "type": "string",
            "enum": [
                "detect",
                "crop_by_class",
                "blur_by_class",
                "blur_all_by_class",
                "extract_frame",
                "extract_frames",
                "detect_frames",
                "track_video",
                "trim_video",
            ],
        },
        "class_name": {
            "type": ["string", "null"],
        },
        "timestamp_seconds": {
            "type": ["number", "null"],
        },
        "start_seconds": {
            "type": ["number", "null"],
        },
        "end_seconds": {
            "type": ["number", "null"],
        },
        "interval_seconds": {
            "type": ["number", "null"],
        },
    },
}


class LLMProviderNotConfiguredError(Exception):
    pass


class LLMProviderOutputError(Exception):
    pass


class LLMProviderNotImplementedError(Exception):
    pass


class BaseLLMProvider:
    provider_name = "base"

    def is_configured(self) -> bool:
        return False

    def get_model_name(self):
        return None

    def is_available_for_real_llm(self) -> bool:
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

    def get_model_name(self):
        return self.model or None

    def is_available_for_real_llm(self) -> bool:
        return self.is_configured()

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        if not self.is_configured():
            raise LLMProviderNotConfiguredError(
                "OpenAI provider is selected but OPENAI_API_KEY or OPENAI_MODEL is missing."
            )

        client = OpenAI(api_key=self.api_key)

        response = client.responses.create(
            model=self.model,
            instructions=system_prompt,
            input=user_prompt,
            text={
                "format": {
                    "type": "json_schema",
                    "name": "vision_command_parser",
                    "strict": True,
                    "schema": COMMAND_PARSER_OUTPUT_SCHEMA,
                }
            },
        )

        raw_output = getattr(response, "output_text", None)

        if not raw_output:
            raise LLMProviderOutputError(
                "OpenAI response did not include output_text."
            )

        try:
            return json.loads(raw_output)
        except json.JSONDecodeError as error:
            raise LLMProviderOutputError(
                f"OpenAI response was not valid JSON: {str(error)}"
            )


class OllamaLLMProvider(BaseLLMProvider):
    provider_name = "ollama"

    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "").strip()
        self.model = os.getenv("OLLAMA_MODEL", "").strip()

    def is_configured(self) -> bool:
        return bool(self.base_url and self.model)

    def get_model_name(self):
        return self.model or None

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        if not self.is_configured():
            raise LLMProviderNotConfiguredError(
                "Ollama provider is selected but OLLAMA_BASE_URL or OLLAMA_MODEL is missing."
            )

        raise LLMProviderNotImplementedError(
            "Ollama provider configuration exists, but the local LLM API call is not implemented yet."
        )


def get_configured_provider_name() -> str:
    return os.getenv("LLM_PROVIDER", "disabled").strip().lower()


def get_llm_provider() -> BaseLLMProvider:
    provider_name = get_configured_provider_name()

    if provider_name == "disabled":
        return DisabledLLMProvider()

    if provider_name == "openai":
        return OpenAILLMProvider()

    if provider_name == "ollama":
        return OllamaLLMProvider()

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
    except LLMProviderOutputError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        )


def get_llm_provider_status():
    provider_name = get_configured_provider_name()
    is_supported = provider_name in SUPPORTED_LLM_PROVIDERS

    provider_model = None
    is_configured = False
    real_llm_available = False

    if is_supported:
        provider = get_llm_provider()
        is_configured = provider.is_configured()
        provider_model = provider.get_model_name()
        real_llm_available = provider.is_available_for_real_llm()

    return {
        "provider_name": provider_name,
        "provider_model": provider_model,
        "is_supported": is_supported,
        "is_configured": is_configured,
        "real_llm_available": real_llm_available,
        "supported_llm_providers": sorted(SUPPORTED_LLM_PROVIDERS),
        "supported_parser_modes": [
            "rule_based",
            "llm_mock",
            "real_llm",
        ],
    }
