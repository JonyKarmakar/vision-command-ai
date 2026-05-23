from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_database_parser_attempt_summary_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/parser-attempt-summary")

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "total_attempts": 0,
        "successful_attempts": 0,
        "failed_attempts": 0,
        "success_rate": 0,
        "average_latency_ms": 0,
        "by_parser_mode": [],
        "by_parser_type": [],
        "by_error": [],
    }


def test_database_parser_attempt_summary_filters_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get(
        "/db/parser-attempt-summary?parser_mode=rule_based&success=true"
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "total_attempts": 0,
        "successful_attempts": 0,
        "failed_attempts": 0,
        "success_rate": 0,
        "average_latency_ms": 0,
        "by_parser_mode": [],
        "by_parser_type": [],
        "by_error": [],
    }


def test_database_parser_attempt_summary_includes_error_breakdown_when_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/parser-attempt-summary")

    assert response.status_code == 200
    assert "by_error" in response.json()
    assert response.json()["by_error"] == []
