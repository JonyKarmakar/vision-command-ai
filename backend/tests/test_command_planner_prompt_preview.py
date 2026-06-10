from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_command_planner_prompt_preview_endpoint_returns_prompt():
    response = client.post(
        "/commands/plan/prompt-preview",
        json={
            "command": "Blur all people",
            "planner_mode": "rule_based",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["command"] == "Blur all people"
    assert data["prompt_version"] == "planner-prompt-v1"
    assert "system_prompt" in data
    assert "user_prompt" in data
    assert "expected_json_schema" in data


def test_command_planner_prompt_preview_endpoint_includes_planner_schema_fields():
    response = client.post(
        "/commands/plan/prompt-preview",
        json={
            "command": "Crop the bike",
            "planner_mode": "llm_mock",
        },
    )

    assert response.status_code == 200

    schema = response.json()["expected_json_schema"]
    required_fields = schema["required"]

    assert "media_type" in required_fields
    assert "action" in required_fields
    assert "target_class" in required_fields
    assert "target_scope" in required_fields
    assert "needs_clarification" in required_fields


def test_command_planner_prompt_preview_endpoint_includes_class_alias_guidance():
    response = client.post(
        "/commands/plan/prompt-preview",
        json={
            "command": "Blur the phone",
            "planner_mode": "rule_based",
        },
    )

    assert response.status_code == 200

    user_prompt = response.json()["user_prompt"]

    assert "Common alias normalizations:" in user_prompt
    assert "- phone -> cell phone" in user_prompt
    assert "- bike -> bicycle" in user_prompt
