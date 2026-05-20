from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_llm_provider_status_endpoint():
    response = client.get("/llm/provider/status")

    assert response.status_code == 200

    data = response.json()
    assert data["provider_name"] == "disabled"
    assert data["is_configured"] is False
    assert data["real_llm_available"] is False
    assert data["supported_parser_modes"] == [
        "rule_based",
        "llm_mock",
        "real_llm",
    ]
