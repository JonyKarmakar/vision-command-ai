from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_command_parser_evaluation_endpoint():
    response = client.get("/commands/evaluate")

    assert response.status_code == 200

    data = response.json()
    assert data["parser_type"] == "rule_based"
    assert data["parser_version"] == "v1"
    assert data["total_cases"] >= 8
    assert data["passed_cases"] == data["total_cases"]
    assert data["failed_cases"] == 0
    assert data["accuracy"] == 1.0
    assert len(data["results"]) == data["total_cases"]


def test_command_parser_evaluation_endpoint_with_llm_mock_mode():
    response = client.get("/commands/evaluate?parser_mode=llm_mock")

    assert response.status_code == 200

    data = response.json()
    assert data["parser_type"] == "llm_mock"
    assert data["parser_version"] == "mock-v1"
    assert data["total_cases"] >= 8
    assert data["passed_cases"] == data["total_cases"]
    assert data["failed_cases"] == 0
    assert data["accuracy"] == 1.0


def test_command_parser_evaluation_endpoint_rejects_invalid_parser_mode():
    response = client.get("/commands/evaluate?parser_mode=llm")

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Supported parser modes are: rule_based, llm_mock"
    }
