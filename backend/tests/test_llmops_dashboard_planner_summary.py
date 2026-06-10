from fastapi.testclient import TestClient

from app import main
from app.main import app


client = TestClient(app)


def test_llmops_dashboard_includes_planner_evaluation_summary(monkeypatch):
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
    monkeypatch.setattr(
        main,
        "get_database_command_log_summary",
        lambda parser_mode=None, result_type=None: {
            "status": "healthy",
            "total_commands": 0,
            "by_parser_mode": [],
            "by_result_type": [],
            "by_parsed_action": [],
        },
    )

    response = client.get("/llmops/dashboard")

    assert response.status_code == 200

    data = response.json()
    planner_evaluation = data["planner_evaluation"]

    assert planner_evaluation["planner_mode"] == "rule_based"
    assert planner_evaluation["planner_type"] == "rule_based"
    assert planner_evaluation["planner_version"] == "v1"
    assert planner_evaluation["total_cases"] == 8
    assert planner_evaluation["passed_cases"] == 8
    assert planner_evaluation["failed_cases"] == 0
    assert planner_evaluation["accuracy"] == 1.0
