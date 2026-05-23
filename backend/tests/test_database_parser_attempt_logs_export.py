from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_export_parser_attempt_logs_csv_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/parser-attempt-logs/export")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.headers["x-parser-logs-status"] == "not_configured"
    assert response.headers["x-parser-logs-count"] == "0"
    assert "attachment; filename=\"parser_attempt_logs.csv\"" in response.headers["content-disposition"]

    csv_text = response.text

    assert "timestamp,command,parser_mode,parser_type,parser_version,success,latency_ms,parsed_command,error" in csv_text


def test_export_parser_attempt_logs_csv_accepts_filters_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get(
        "/db/parser-attempt-logs/export?limit=10&parser_mode=rule_based&success=true"
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.headers["x-parser-logs-status"] == "not_configured"
    assert response.headers["x-parser-logs-count"] == "0"
