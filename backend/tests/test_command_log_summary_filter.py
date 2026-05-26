from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_command_log_summary_passes_parser_filter(monkeypatch):
    def fake_get_database_command_log_summary(parser_mode=None):
        assert parser_mode == "llm_mock"
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

    response = client.get("/db/command-log-summary?parser_mode=llm_mock")

    assert response.status_code == 200
    assert response.json()["by_parser_mode"][0]["name"] == "llm_mock"


def test_command_log_summary_all_parser_filter_becomes_none(monkeypatch):
    def fake_get_database_command_log_summary(parser_mode=None):
        assert parser_mode is None
        return {
            "status": "healthy",
            "total_commands": 0,
            "by_parser_mode": [],
            "by_result_type": [],
            "by_parsed_action": [],
        }

    monkeypatch.setattr(
        main,
        "get_database_command_log_summary",
        fake_get_database_command_log_summary,
    )

    response = client.get("/db/command-log-summary?parser_mode=all")

    assert response.status_code == 200
    assert response.json()["total_commands"] == 0


def test_command_log_summary_rejects_invalid_parser_mode():
    response = client.get("/db/command-log-summary?parser_mode=invalid")

    assert response.status_code == 400
    assert response.json()["detail"] == "Supported parser modes are: rule_based, llm_mock, real_llm"
