from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_database_stats_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/stats")

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "media_files_count": 0,
        "command_logs_count": 0,
    }
