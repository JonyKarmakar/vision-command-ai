from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_llmops_dashboard_passes_parser_mode_to_command_summary(monkeypatch):
    captured = {}

    def fake_get_database_command_log_summary(parser_mode=None):
        captured["parser_mode"] = parser_mode
        return {
            "status": "healthy",
            "total_commands": 1,
            "by_parser_mode": [{"name": "llm_mock", "count": 1}],
            "by_result_type": [{"name": "annotated_detection", "count": 1}],
            "by_parsed_action": [{"name": "detect", "count": 1}],
        }

    monkeypatch.setattr(
        main,
        "get_database_command_log_summary",
        fake_get_database_command_log_summary,
    )

    response = client.get("/llmops/dashboard?parser_mode=llm_mock")

    assert response.status_code == 200
    assert captured["parser_mode"] == "llm_mock"

    data = response.json()

    assert data["command_log_summary"]["total_commands"] == 1
    assert data["command_log_summary"]["by_parser_mode"][0]["name"] == "llm_mock"
