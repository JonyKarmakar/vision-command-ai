from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_command_logs_endpoint_passes_parser_mode_filter(monkeypatch):
    captured = {}

    def fake_get_database_command_logs(limit: int = 20, parser_mode=None):
        captured["limit"] = limit
        captured["parser_mode"] = parser_mode

        return {
            "status": "healthy",
            "count": 0,
            "logs": [],
        }

    monkeypatch.setattr(main, "get_database_command_logs", fake_get_database_command_logs)

    response = client.get("/db/command-logs?limit=5&parser_mode=llm_mock")

    assert response.status_code == 200
    assert captured["limit"] == 5
    assert captured["parser_mode"] == "llm_mock"


def test_command_logs_endpoint_treats_all_parser_mode_as_no_filter(monkeypatch):
    captured = {}

    def fake_get_database_command_logs(limit: int = 20, parser_mode=None):
        captured["parser_mode"] = parser_mode

        return {
            "status": "healthy",
            "count": 0,
            "logs": [],
        }

    monkeypatch.setattr(main, "get_database_command_logs", fake_get_database_command_logs)

    response = client.get("/db/command-logs?parser_mode=all")

    assert response.status_code == 200
    assert captured["parser_mode"] is None


def test_command_logs_endpoint_rejects_invalid_parser_mode():
    response = client.get("/db/command-logs?parser_mode=invalid")

    assert response.status_code == 400
    assert "Supported parser modes" in response.json()["detail"]
