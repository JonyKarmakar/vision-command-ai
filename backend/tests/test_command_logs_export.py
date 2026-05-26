from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_command_logs_export_csv(monkeypatch):
    def fake_get_database_command_logs(limit=100, parser_mode=None):
        assert limit == 100
        assert parser_mode == "llm_mock"

        return {
            "status": "healthy",
            "count": 1,
            "logs": [
                {
                    "timestamp": "2026-05-25T15:00:00+00:00",
                    "filename": "example.jpg",
                    "command": "detect objects",
                    "confidence_threshold": 0.3,
                    "parsed_action": "detect",
                    "parsed_class": None,
                    "result_type": "annotated_detection",
                    "parser_mode": "llm_mock",
                    "parser_type": "llm_mock",
                    "parser_version": "mock-v1",
                }
            ],
        }

    monkeypatch.setattr(main, "get_database_command_logs", fake_get_database_command_logs)

    response = client.get("/db/command-logs/export?limit=100&parser_mode=llm_mock")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.headers["x-command-logs-count"] == "1"
    assert "attachment" in response.headers["content-disposition"]

    csv_text = response.text

    assert "timestamp,filename,command,confidence_threshold" in csv_text
    assert "detect objects" in csv_text
    assert "llm_mock" in csv_text
    assert "mock-v1" in csv_text


def test_command_logs_export_rejects_invalid_parser_mode():
    response = client.get("/db/command-logs/export?parser_mode=invalid")

    assert response.status_code == 400
    assert response.json()["detail"] == "Supported parser modes are: rule_based, llm_mock, real_llm"
