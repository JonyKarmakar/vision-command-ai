from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_llm_provider_status_endpoint(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    response = client.get("/llm/provider/status")

    assert response.status_code == 200

    data = response.json()
    assert data["provider_name"] == "disabled"
    assert data["is_supported"] is True
    assert data["is_configured"] is False
    assert data["real_llm_available"] is False
    assert data["supported_llm_providers"] == ["disabled"]
    assert data["supported_parser_modes"] == [
        "rule_based",
        "llm_mock",
        "real_llm",
    ]


def test_llm_provider_status_endpoint_with_unsupported_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")

    response = client.get("/llm/provider/status")

    assert response.status_code == 200

    data = response.json()
    assert data["provider_name"] == "openai"
    assert data["is_supported"] is False
    assert data["is_configured"] is False
    assert data["real_llm_available"] is False
    assert data["supported_llm_providers"] == ["disabled"]
