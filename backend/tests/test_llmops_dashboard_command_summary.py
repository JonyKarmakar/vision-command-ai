from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_llmops_dashboard_includes_command_log_summary(monkeypatch):
    monkeypatch.setattr(
        main,
        "get_database_command_log_summary",
        lambda parser_mode=None, result_type=None: {
            "status": "healthy",
            "total_commands": 2,
            "by_parser_mode": [
                {"name": "rule_based", "count": 1},
                {"name": "llm_mock", "count": 1},
            ],
            "by_result_type": [
                {"name": "annotated_detection", "count": 2},
            ],
            "by_parsed_action": [
                {"name": "detect", "count": 2},
            ],
        },
    )

    monkeypatch.setattr(
        main,
        "get_database_parser_attempt_summary",
        lambda parser_mode=None, success=None: {
            "status": "healthy",
            "total_attempts": 0,
            "successful_attempts": 0,
            "failed_attempts": 0,
            "success_rate": 0,
            "by_parser_mode": [],
            "by_success": [],
        },
    )
    monkeypatch.setattr(
        main,
        "get_database_parser_attempt_logs",
        lambda limit=10, parser_mode=None, success=None: {
            "status": "healthy",
            "count": 0,
            "logs": [],
        },
    )

    response = client.get("/llmops/dashboard")

    assert response.status_code == 200

    data = response.json()

    assert "command_log_summary" in data
    assert data["command_log_summary"]["total_commands"] == 2
    assert data["command_log_summary"]["by_parser_mode"][0]["name"] == "rule_based"
