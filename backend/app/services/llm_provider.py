import json
import os
import re
from urllib import error as url_error
from urllib import request as url_request

from fastapi import HTTPException
from openai import OpenAI

from app.services.model_classes import (
    get_class_aliases,
    get_supported_model_classes,
    normalize_model_class_name,
)


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

COMMAND_PLANNER_OUTPUT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "media_type",
        "action",
        "target_class",
        "target_scope",
        "requires_detection",
        "requires_tracking",
        "parameters",
        "confidence",
        "needs_clarification",
        "clarification_question",
    ],
    "properties": {
        "media_type": {
            "type": "string",
            "enum": ["image", "video", "unknown"],
        },
        "action": {
            "type": "string",
            "enum": [
                "detect",
                "annotate",
                "crop_by_class",
                "blur_by_class",
                "blur_all_by_class",
                "zoom",
                "track",
                "extract_frames",
                "summarize",
                "unknown",
            ],
        },
        "target_class": {
            "type": ["string", "null"],
        },
        "target_scope": {
            "type": "string",
            "enum": [
                "single",
                "all",
                "largest",
                "smallest",
                "left",
                "right",
                "top",
                "bottom",
                "center",
                "unknown",
            ],
        },
        "requires_detection": {
            "type": "boolean",
        },
        "requires_tracking": {
            "type": "boolean",
        },
        "parameters": {
            "type": "object",
        },
        "confidence": {
            "type": "number",
        },
        "needs_clarification": {
            "type": "boolean",
        },
        "clarification_question": {
            "type": ["string", "null"],
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

    def plan_command(self, system_prompt: str, user_prompt: str) -> dict:
        raise NotImplementedError


class DisabledLLMProvider(BaseLLMProvider):
    provider_name = "disabled"

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        raise LLMProviderNotConfiguredError(
            "Real LLM provider is not configured: LLM_PROVIDER is disabled. "
            "Set LLM_PROVIDER to a supported external provider before using parser_mode=real_llm."
        )

    def plan_command(self, system_prompt: str, user_prompt: str) -> dict:
        raise LLMProviderNotConfiguredError(
            "Real LLM provider is not configured: LLM_PROVIDER is disabled. "
            "Set LLM_PROVIDER to a supported external provider before using planner_mode=real_llm."
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

    def _generate_json_with_schema(
        self,
        system_prompt: str,
        user_prompt: str,
        schema_name: str,
        output_schema: dict,
    ) -> dict:
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
                    "name": schema_name,
                    "strict": True,
                    "schema": output_schema,
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

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        return self._generate_json_with_schema(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            schema_name="vision_command_parser",
            output_schema=COMMAND_PARSER_OUTPUT_SCHEMA,
        )

    def plan_command(self, system_prompt: str, user_prompt: str) -> dict:
        return self._generate_json_with_schema(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            schema_name="vision_command_planner",
            output_schema=COMMAND_PLANNER_OUTPUT_SCHEMA,
        )


def _prompt_contains_phrase(normalized_prompt: str, phrase: str) -> bool:
    normalized_phrase = " ".join(phrase.lower().strip().split())

    if not normalized_phrase:
        return False

    return re.search(
        rf"(?<!\\w){re.escape(normalized_phrase)}(?!\\w)",
        normalized_prompt,
    ) is not None


def _pluralize_phrase(phrase: str) -> str:
    if phrase.endswith("y") and len(phrase) > 1:
        return f"{phrase[:-1]}ies"

    if phrase.endswith(("s", "x", "z", "ch", "sh")):
        return f"{phrase}es"

    return f"{phrase}s"


def _normalize_llm_class_name(class_name):
    if not class_name:
        return None

    normalized_class_name = normalize_model_class_name(str(class_name))
    supported_classes = set(get_supported_model_classes())

    if normalized_class_name in supported_classes:
        return normalized_class_name

    return None


def _build_class_phrase_map():
    phrase_to_class = {}

    for class_name in get_supported_model_classes():
        phrase_to_class[class_name] = class_name
        phrase_to_class[_pluralize_phrase(class_name)] = class_name

    for alias, class_name in get_class_aliases().items():
        normalized_class_name = _normalize_llm_class_name(class_name)

        if normalized_class_name:
            phrase_to_class[alias] = normalized_class_name

    return phrase_to_class


def _infer_class_name_from_command(user_prompt: str):
    normalized_prompt = " ".join(user_prompt.lower().strip().split())

    if not normalized_prompt:
        return None

    phrase_to_class = _build_class_phrase_map()

    for phrase, class_name in sorted(
        phrase_to_class.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):
        if _prompt_contains_phrase(normalized_prompt, phrase):
            return _normalize_llm_class_name(class_name)

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

    if repaired_command["class_name"]:
        repaired_command["class_name"] = _normalize_llm_class_name(
            repaired_command["class_name"]
        )

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

    def _generate_json_with_schema(
        self,
        system_prompt: str,
        user_prompt: str,
        output_schema: dict,
    ) -> dict:
        if not self.is_configured():
            raise LLMProviderNotConfiguredError(
                "Ollama provider is selected but OLLAMA_BASE_URL or OLLAMA_MODEL is missing."
            )

        endpoint = f"{self.base_url.rstrip('/')}/api/generate"

        payload = {
            "model": self.model,
            "system": system_prompt,
            "prompt": user_prompt,
            "format": output_schema,
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
            return json.loads(raw_output)
        except json.JSONDecodeError as exception:
            raise LLMProviderOutputError(
                f"Ollama response field was not valid JSON: {str(exception)}"
            )

    def parse_command(self, system_prompt: str, user_prompt: str) -> dict:
        parsed_output = self._generate_json_with_schema(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            output_schema=COMMAND_PARSER_OUTPUT_SCHEMA,
        )

        return _repair_ollama_parsed_command(parsed_output, user_prompt)

    def plan_command(self, system_prompt: str, user_prompt: str) -> dict:
        return self._generate_json_with_schema(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            output_schema=COMMAND_PLANNER_OUTPUT_SCHEMA,
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


def plan_command_with_provider(system_prompt: str, user_prompt: str) -> dict:
    provider = get_llm_provider()

    try:
        return provider.plan_command(system_prompt, user_prompt)
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
        "supported_planner_modes": [
            "rule_based",
            "llm_mock",
            "real_llm",
        ],
    }
