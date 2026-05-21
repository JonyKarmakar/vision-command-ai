from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_database_parser_attempt_logs_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/parser-attempt-logs")

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "count": 0,
        "logs": [],
    }
