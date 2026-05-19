from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_command_parser_comparison_endpoint():
    response = client.get("/commands/evaluate/compare")

    assert response.status_code == 200

    data = response.json()

    assert data["parser_modes"] == ["rule_based", "llm_mock"]
    assert len(data["evaluations"]) == 2

    rule_based_result = data["evaluations"][0]
    llm_mock_result = data["evaluations"][1]

    assert rule_based_result["parser_type"] == "rule_based"
    assert rule_based_result["parser_version"] == "v1"
    assert rule_based_result["failed_cases"] == 0
    assert rule_based_result["accuracy"] == 1.0

    assert llm_mock_result["parser_type"] == "llm_mock"
    assert llm_mock_result["parser_version"] == "mock-v1"
    assert llm_mock_result["failed_cases"] == 0
    assert llm_mock_result["accuracy"] == 1.0

    assert rule_based_result["total_cases"] == llm_mock_result["total_cases"]
