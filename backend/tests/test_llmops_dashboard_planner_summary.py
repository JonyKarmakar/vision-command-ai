from fastapi.testclient import TestClient

from app import main
from app.main import app


client = TestClient(app)


def _mock_dashboard_database_calls(monkeypatch):
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


def test_llmops_dashboard_includes_planner_evaluation_comparison_summary(monkeypatch):
    _mock_dashboard_database_calls(monkeypatch)

    response = client.get("/llmops/dashboard")

    assert response.status_code == 200

    data = response.json()
    planner_evaluation = data["planner_evaluation"]

    assert planner_evaluation["include_real_llm"] is False
    assert planner_evaluation["skipped_evaluations"] == []
    assert len(planner_evaluation["evaluations"]) == 2

    rule_based_summary = planner_evaluation["evaluations"][0]
    llm_mock_summary = planner_evaluation["evaluations"][1]

    assert rule_based_summary["planner_mode"] == "rule_based"
    assert rule_based_summary["planner_type"] == "rule_based"
    assert rule_based_summary["planner_version"] == "v1"
    assert rule_based_summary["total_cases"] == 8
    assert rule_based_summary["passed_cases"] == 8
    assert rule_based_summary["failed_cases"] == 0
    assert rule_based_summary["accuracy"] == 1.0

    assert llm_mock_summary["planner_mode"] == "llm_mock"
    assert llm_mock_summary["planner_type"] == "llm_mock"
    assert llm_mock_summary["planner_version"] == "mock-v1"
    assert llm_mock_summary["total_cases"] == 8
    assert llm_mock_summary["passed_cases"] == 8
    assert llm_mock_summary["failed_cases"] == 0
    assert llm_mock_summary["accuracy"] == 1.0


def test_llmops_dashboard_skips_real_llm_planner_when_provider_unavailable(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "disabled")
    _mock_dashboard_database_calls(monkeypatch)

    response = client.get("/llmops/dashboard?include_real_llm=true")

    assert response.status_code == 200

    planner_evaluation = response.json()["planner_evaluation"]

    assert planner_evaluation["include_real_llm"] is True
    assert len(planner_evaluation["evaluations"]) == 2
    assert planner_evaluation["skipped_evaluations"] == [
        {
            "planner_mode": "real_llm",
            "reason": "Real LLM provider is not configured or available.",
        }
    ]
