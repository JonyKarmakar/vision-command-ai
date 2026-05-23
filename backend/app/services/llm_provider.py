import json
import os
from urllib import error as url_error
from urllib import request as url_request

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


def _infer_class_name_from_command(user_prompt: str):
    normalized_prompt = user_prompt.lower()

    known_classes = {
        "person": ["person", "people", "persons"],
        "car": ["car", "cars"],
        "dog": ["dog", "dogs"],
        "cat": ["cat", "cats"],
        "bicycle": ["bicycle", "bicycles", "bike", "bikes"],
        "bus": ["bus", "buses"],
        "truck": ["truck", "trucks"],
        "chair": ["chair", "chairs"],
        "bottle": ["bottle", "bottles"],
    }

    for class_name, aliases in known_classes.items():
        if any(alias in normalized_prompt for alias in aliases):
            return class_name

    return None


def _repair_ollama_parsed_command(parsed_command: dict, user_prompt: str) -> dict:
    action = parsed_command.get("action")

    repaired_command = {
        "action": action,
        "class_name": parsed_command.get("class_name"),
        "timestamp_seconds": parsed_command.get("timestamp_seconds"),
        "start_seconds": parsed_command.get("start_seconds"),
        "end_seconds": parsed_command.get("end_seconds"),
        "interval_seconds": parsed_command.get("interval_seconds"),
    }

    if action in {
        "crop_by_class",
        "blur_by_class",
        "blur_all_by_class",
        "track_video",
    } and not repaired_command["class_name"]:
        repaired_command["class_name"] = _infer_class_name_from_command(user_prompt)

    if action in {
        "detect",
        "crop_by_class",
        "blur_by_class",
        "blur_all_by_class",
    }:
        repaired_command["timestamp_seconds"] = None
        repaired_command["start_seconds"] = None
        repaired_command["end_seconds"] = None
        repaired_command["interval_seconds"] = None

    if action == "extract_frame":
        repaired_command["class_name"] = None
        repaired_command["start_seconds"] = None
        repaired_command["end_seconds"] = None
        repaired_command["interval_seconds"] = None

    if action in {
        "extract_frames",
        "detect_frames",
    }:
        repaired_command["class_name"] = None
        repaired_command["timestamp_seconds"] = None

    if action == "track_video":
        repaired_command["timestamp_seconds"] = None

    if action == "trim_video":
        repaired_command["class_name"] = None
        repaired_command["timestamp_seconds"] = None
        repaired_command["interval_seconds"] = None

    return repaired_command



class OllamaLLMProvider(BaseLLMProvider):
    provider_name = "ollama"

    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "").strip()
        self.model = os.getenv("OLLAMA_MODEL", "").strip()

    def is_configured(self) -> bool:
        return bool(self.base_url and self.model)

    def get_model_name(self):
        return self.model or None

    def is_available_for_real_llm(self) -> bool:
        return self.is_configured()

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        if not self.is_configured():
            raise LLMProviderNotConfiguredError(
                "Ollama provider is selected but OLLAMA_BASE_URL or OLLAMA_MODEL is missing."
            )

        endpoint = f"{self.base_url.rstrip('/')}/api/generate"

        payload = {
            "model": self.model,
            "system": system_prompt,
            "prompt": user_prompt,
            "format": COMMAND_PARSER_OUTPUT_SCHEMA,
            "stream": False,
        }

        request = url_request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with url_request.urlopen(request, timeout=60) as response:
                response_body = response.read().decode("utf-8")
        except url_error.HTTPError as exception:
            error_body = exception.read().decode("utf-8", errors="replace")
            raise LLMProviderOutputError(
                f"Ollama request failed with status {exception.code}: {error_body}"
            )
        except url_error.URLError as exception:
            raise LLMProviderOutputError(
                f"Could not connect to Ollama provider: {exception.reason}"
            )
        except TimeoutError:
            raise LLMProviderOutputError(
                "Ollama request timed out."
            )

        try:
            response_json = json.loads(response_body)
        except json.JSONDecodeError as exception:
            raise LLMProviderOutputError(
                f"Ollama response was not valid JSON: {str(exception)}"
            )

        raw_output = response_json.get("response")

        if not raw_output:
            raise LLMProviderOutputError(
                "Ollama response did not include a response field."
            )

        try:
            parsed_output = json.loads(raw_output)
        except json.JSONDecodeError as exception:
            raise LLMProviderOutputError(
                f"Ollama response field was not valid JSON: {str(exception)}"
            )

        return _repair_ollama_parsed_command(parsed_output, user_prompt)


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
