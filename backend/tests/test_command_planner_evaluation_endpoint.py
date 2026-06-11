from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_command_planner_evaluation_endpoint_returns_summary():
    response = client.get("/commands/plan/evaluate")

    assert response.status_code == 200

    data = response.json()

    assert data["planner_mode"] == "rule_based"
    assert data["planner_type"] == "rule_based"
    assert data["planner_version"] == "v1"
    assert data["total_cases"] == 8
    assert data["passed_cases"] == 8
    assert data["failed_cases"] == 0
    assert data["accuracy"] == 1.0
    assert len(data["results"]) == 8


def test_command_planner_evaluation_endpoint_accepts_rule_based_mode():
    response = client.get("/commands/plan/evaluate?planner_mode=rule_based")

    assert response.status_code == 200
    assert response.json()["planner_mode"] == "rule_based"


def test_command_planner_evaluation_endpoint_rejects_unsupported_mode():
    response = client.get("/commands/plan/evaluate?planner_mode=llm")

    assert response.status_code == 400
    assert response.json()["detail"] == "Supported planner modes are: rule_based, llm_mock, real_llm"



def test_command_planner_evaluation_endpoint_accepts_llm_mock_mode():
    response = client.get("/commands/plan/evaluate?planner_mode=llm_mock")

    assert response.status_code == 200

    data = response.json()

    assert data["planner_mode"] == "llm_mock"
    assert data["planner_type"] == "llm_mock"
    assert data["planner_version"] == "mock-v1"
    assert data["accuracy"] == 1.0
