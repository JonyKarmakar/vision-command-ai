from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_command_log_summary_endpoint(monkeypatch):
    monkeypatch.setattr(
        main,
        "get_database_command_log_summary",
        lambda: {
            "status": "healthy",
            "total_commands": 3,
            "by_parser_mode": [
                {"name": "rule_based", "count": 2},
                {"name": "llm_mock", "count": 1},
            ],
            "by_result_type": [
                {"name": "annotated_detection", "count": 2},
                {"name": "crop_by_class", "count": 1},
            ],
            "by_parsed_action": [
                {"name": "detect", "count": 2},
                {"name": "crop_by_class", "count": 1},
            ],
        },
    )

    response = client.get("/db/command-log-summary")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["total_commands"] == 3
    assert data["by_parser_mode"][0]["name"] == "rule_based"
    assert data["by_parser_mode"][0]["count"] == 2
