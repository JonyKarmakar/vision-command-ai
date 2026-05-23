import json

import pytest
from fastapi import HTTPException

from app.services import llm_provider
from app.services.llm_provider import (
    DisabledLLMProvider,
    LLMProviderNotConfiguredError,
    OllamaLLMProvider,
    OpenAILLMProvider,
    get_configured_provider_name,
    get_llm_provider,
    get_llm_provider_status,
    parse_command_with_provider,
)


def test_get_configured_provider_name_defaults_to_disabled(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    assert get_configured_provider_name() == "disabled"


def test_get_configured_provider_name_reads_env(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", " OLLAMA ")

    assert get_configured_provider_name() == "ollama"


def test_get_llm_provider_returns_disabled_provider_by_default(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    provider = get_llm_provider()

    assert isinstance(provider, DisabledLLMProvider)
    assert provider.provider_name == "disabled"


def test_get_llm_provider_returns_openai_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")

    provider = get_llm_provider()

    assert isinstance(provider, OpenAILLMProvider)
    assert provider.provider_name == "openai"
    assert provider.is_configured() is True


def test_get_llm_provider_returns_ollama_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2")

    provider = get_llm_provider()

    assert isinstance(provider, OllamaLLMProvider)
    assert provider.provider_name == "ollama"
    assert provider.is_configured() is True
    assert provider.get_model_name() == "llama3.2"


def test_get_llm_provider_rejects_unsupported_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")

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


def test_parse_command_with_openai_returns_503_when_missing_config(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_MODEL", raising=False)

    with pytest.raises(HTTPException) as error:
        parse_command_with_provider(
            system_prompt="system",
            user_prompt="user",
        )

    assert error.value.status_code == 503
    assert "OPENAI_API_KEY" in error.value.detail


def test_parse_command_with_ollama_returns_503_when_missing_config(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.delenv("OLLAMA_BASE_URL", raising=False)
    monkeypatch.delenv("OLLAMA_MODEL", raising=False)

    with pytest.raises(HTTPException) as error:
        parse_command_with_provider(
            system_prompt="system",
            user_prompt="user",
        )

    assert error.value.status_code == 503
    assert "OLLAMA_BASE_URL" in error.value.detail


def test_ollama_provider_parse_command_success(monkeypatch):
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2")

    expected_output = {
        "action": "crop_by_class",
        "class_name": "person",
        "timestamp_seconds": None,
        "start_seconds": None,
        "end_seconds": None,
        "interval_seconds": None,
    }

    class FakeOllamaResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def read(self):
            return json.dumps(
                {
                    "response": json.dumps(expected_output)
                }
            ).encode("utf-8")

    def fake_urlopen(request, timeout):
        assert request.full_url == "http://localhost:11434/api/generate"
        assert timeout == 60

        payload = json.loads(request.data.decode("utf-8"))

        assert payload["model"] == "llama3.2"
        assert payload["system"] == "system"
        assert payload["prompt"] == "user"
        assert payload["stream"] is False
        assert payload["format"]["type"] == "object"

        return FakeOllamaResponse()

    monkeypatch.setattr(llm_provider.url_request, "urlopen", fake_urlopen)

    provider = OllamaLLMProvider()

    assert provider.parse_command(
        system_prompt="system",
        user_prompt="user",
    ) == expected_output


def test_parse_command_with_ollama_provider_success(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2")

    expected_output = {
        "action": "detect",
        "class_name": None,
        "timestamp_seconds": None,
        "start_seconds": None,
        "end_seconds": None,
        "interval_seconds": None,
    }

    class FakeOllamaResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def read(self):
            return json.dumps(
                {
                    "response": json.dumps(expected_output)
                }
            ).encode("utf-8")

    monkeypatch.setattr(
        llm_provider.url_request,
        "urlopen",
        lambda request, timeout: FakeOllamaResponse(),
    )

    assert parse_command_with_provider(
        system_prompt="system",
        user_prompt="user",
    ) == expected_output


def test_parse_command_with_ollama_returns_502_when_response_is_invalid(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2")

    class FakeOllamaResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def read(self):
            return json.dumps(
                {
                    "response": "not valid json"
                }
            ).encode("utf-8")

    monkeypatch.setattr(
        llm_provider.url_request,
        "urlopen",
        lambda request, timeout: FakeOllamaResponse(),
    )

    with pytest.raises(HTTPException) as error:
        parse_command_with_provider(
            system_prompt="system",
            user_prompt="user",
        )

    assert error.value.status_code == 502
    assert "not valid JSON" in error.value.detail


def test_openai_provider_parse_command_success(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")

    expected_output = {
        "action": "crop_by_class",
        "class_name": "person",
        "timestamp_seconds": None,
        "start_seconds": None,
        "end_seconds": None,
        "interval_seconds": None,
    }

    class FakeResponses:
        def create(self, **kwargs):
            assert kwargs["model"] == "test-model"
            assert kwargs["instructions"] == "system"
            assert kwargs["input"] == "user"
            assert kwargs["text"]["format"]["type"] == "json_schema"
            assert kwargs["text"]["format"]["strict"] is True

            class FakeResponse:
                output_text = json.dumps(expected_output)

            return FakeResponse()

    class FakeOpenAIClient:
        responses = FakeResponses()

    monkeypatch.setattr(
        llm_provider,
        "OpenAI",
        lambda api_key: FakeOpenAIClient(),
    )

    provider = OpenAILLMProvider()

    assert provider.parse_command(
        system_prompt="system",
        user_prompt="user",
    ) == expected_output


def test_parse_command_with_openai_provider_success(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")

    expected_output = {
        "action": "crop_by_class",
        "class_name": "person",
        "timestamp_seconds": None,
        "start_seconds": None,
        "end_seconds": None,
        "interval_seconds": None,
    }

    class FakeResponses:
        def create(self, **kwargs):
            class FakeResponse:
                output_text = json.dumps(expected_output)

            return FakeResponse()

    class FakeOpenAIClient:
        responses = FakeResponses()

    monkeypatch.setattr(
        llm_provider,
        "OpenAI",
        lambda api_key: FakeOpenAIClient(),
    )

    assert parse_command_with_provider(
        system_prompt="system",
        user_prompt="user",
    ) == expected_output


def test_llm_provider_status_default(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    status = get_llm_provider_status()

    assert status["provider_name"] == "disabled"
    assert status["provider_model"] is None
    assert status["is_supported"] is True
    assert status["is_configured"] is False
    assert status["real_llm_available"] is False
    assert status["supported_llm_providers"] == ["disabled", "ollama", "openai"]


def test_llm_provider_status_for_configured_openai(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")

    status = get_llm_provider_status()

    assert status["provider_name"] == "openai"
    assert status["provider_model"] == "test-model"
    assert status["is_supported"] is True
    assert status["is_configured"] is True
    assert status["real_llm_available"] is True
    assert status["supported_llm_providers"] == ["disabled", "ollama", "openai"]


def test_llm_provider_status_for_configured_ollama(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2")

    status = get_llm_provider_status()

    assert status["provider_name"] == "ollama"
    assert status["provider_model"] == "llama3.2"
    assert status["is_supported"] is True
    assert status["is_configured"] is True
    assert status["real_llm_available"] is True
    assert status["supported_llm_providers"] == ["disabled", "ollama", "openai"]


def test_llm_provider_status_for_unsupported_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")

    status = get_llm_provider_status()

    assert status["provider_name"] == "gemini"
    assert status["provider_model"] is None
    assert status["is_supported"] is False
    assert status["is_configured"] is False
    assert status["real_llm_available"] is False
    assert status["supported_llm_providers"] == ["disabled", "ollama", "openai"]


def test_ollama_provider_repairs_missing_class_name(monkeypatch):
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2:1b")

    class FakeOllamaResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def read(self):
            return json.dumps(
                {
                    "response": json.dumps(
                        {
                            "action": "crop_by_class"
                        }
                    )
                }
            ).encode("utf-8")

    monkeypatch.setattr(
        llm_provider.url_request,
        "urlopen",
        lambda request, timeout: FakeOllamaResponse(),
    )

    provider = OllamaLLMProvider()

    assert provider.parse_command(
        system_prompt="system",
        user_prompt="crop person",
    ) == {
        "action": "crop_by_class",
        "class_name": "person",
        "timestamp_seconds": None,
        "start_seconds": None,
        "end_seconds": None,
        "interval_seconds": None,
    }


def test_ollama_provider_removes_irrelevant_time_fields_for_image_commands(monkeypatch):
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2:1b")

    class FakeOllamaResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

        def read(self):
            return json.dumps(
                {
                    "response": json.dumps(
                        {
                            "action": "blur_by_class",
                            "class_name": "car",
                            "timestamp_seconds": 0,
                            "start_seconds": 0,
                            "end_seconds": 1000,
                            "interval_seconds": 1,
                        }
                    )
                }
            ).encode("utf-8")

    monkeypatch.setattr(
        llm_provider.url_request,
        "urlopen",
        lambda request, timeout: FakeOllamaResponse(),
    )

    provider = OllamaLLMProvider()

    assert provider.parse_command(
        system_prompt="system",
        user_prompt="blur car",
    ) == {
        "action": "blur_by_class",
        "class_name": "car",
        "timestamp_seconds": None,
        "start_seconds": None,
        "end_seconds": None,
        "interval_seconds": None,
    }
