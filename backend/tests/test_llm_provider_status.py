from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_llm_provider_status_endpoint(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_MODEL", raising=False)
    monkeypatch.delenv("OLLAMA_BASE_URL", raising=False)
    monkeypatch.delenv("OLLAMA_MODEL", raising=False)

    response = client.get("/llm/provider/status")

    assert response.status_code == 200

    data = response.json()
    assert data["provider_name"] == "disabled"
    assert data["provider_model"] is None
    assert data["is_supported"] is True
    assert data["is_configured"] is False
    assert data["real_llm_available"] is False
    assert data["supported_llm_providers"] == ["disabled", "ollama", "openai"]
    assert data["supported_parser_modes"] == [
        "rule_based",
        "llm_mock",
        "real_llm",
    ]


def test_llm_provider_status_endpoint_with_configured_openai(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")

    response = client.get("/llm/provider/status")

    assert response.status_code == 200

    data = response.json()
    assert data["provider_name"] == "openai"
    assert data["provider_model"] == "test-model"
    assert data["is_supported"] is True
    assert data["is_configured"] is True
    assert data["real_llm_available"] is True
    assert data["supported_llm_providers"] == ["disabled", "ollama", "openai"]


def test_llm_provider_status_endpoint_with_configured_ollama(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://localhost:11434")
    monkeypatch.setenv("OLLAMA_MODEL", "llama3.2")

    response = client.get("/llm/provider/status")

    assert response.status_code == 200

    data = response.json()
    assert data["provider_name"] == "ollama"
    assert data["provider_model"] == "llama3.2"
    assert data["is_supported"] is True
    assert data["is_configured"] is True
    assert data["real_llm_available"] is False
    assert data["supported_llm_providers"] == ["disabled", "ollama", "openai"]


def test_llm_provider_status_endpoint_with_unsupported_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")

    response = client.get("/llm/provider/status")

    assert response.status_code == 200

    data = response.json()
    assert data["provider_name"] == "gemini"
    assert data["provider_model"] is None
    assert data["is_supported"] is False
    assert data["is_configured"] is False
    assert data["real_llm_available"] is False
    assert data["supported_llm_providers"] == ["disabled", "ollama", "openai"]
