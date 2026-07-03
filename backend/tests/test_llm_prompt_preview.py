from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_command_parser_prompt_preview_endpoint():
    response = client.post(
        "/commands/parse/prompt-preview",
        json={
            "command": "track person from 0 to 3 seconds",
            "parser_mode": "llm_mock",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["command"] == "track person from 0 to 3 seconds"
    assert data["parser_mode"] == "llm_mock"
    assert data["prompt_version"] == "prompt-v3"
    assert "computer vision application" in data["system_prompt"]
    assert "track person from 0 to 3 seconds" in data["user_prompt"]
    assert "expected_json_schema" in data
    assert "action" in data["expected_json_schema"]["properties"]
