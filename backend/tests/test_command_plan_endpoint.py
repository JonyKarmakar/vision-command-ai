from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_plan_command_endpoint_blur_all_people():
    response = client.post(
        "/commands/plan",
        json={
            "command": "Blur all people",
            "planner_mode": "rule_based",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["media_type"] == "image"
    assert data["action"] == "blur_all_by_class"
    assert data["target_class"] == "person"
    assert data["target_scope"] == "all"
    assert data["requires_detection"] is True
    assert data["requires_tracking"] is False
    assert data["needs_clarification"] is False


def test_plan_command_endpoint_uses_model_class_aliases():
    response = client.post(
        "/commands/plan",
        json={
            "command": "Crop the bike",
            "planner_mode": "rule_based",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["action"] == "crop_by_class"
    assert data["target_class"] == "bicycle"
    assert data["target_scope"] == "single"


def test_plan_command_endpoint_returns_clarification_for_incomplete_command():
    response = client.post(
        "/commands/plan",
        json={
            "command": "Crop the object",
            "planner_mode": "rule_based",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["action"] == "crop_by_class"
    assert data["target_class"] is None
    assert data["needs_clarification"] is True
    assert data["clarification_question"] == "Which object class should I use for this command?"


def test_plan_command_endpoint_rejects_unsupported_planner_mode():
    response = client.post(
        "/commands/plan",
        json={
            "command": "Blur all people",
            "planner_mode": "llm",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Supported planner modes are: rule_based, llm_mock"



def test_plan_command_endpoint_accepts_llm_mock_mode():
    response = client.post(
        "/commands/plan",
        json={
            "command": "Blur all people",
            "planner_mode": "llm_mock",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["action"] == "blur_all_by_class"
    assert data["target_class"] == "person"
    assert data["target_scope"] == "all"
