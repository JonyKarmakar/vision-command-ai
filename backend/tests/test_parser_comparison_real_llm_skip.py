from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_parser_comparison_skips_real_llm_when_provider_unavailable(monkeypatch):
    def fake_evaluate_command_parser(parser_mode):
        return {
            "parser_type": parser_mode,
            "parser_version": "test",
            "total_cases": 1,
            "passed_cases": 1,
            "failed_cases": 0,
            "accuracy": 1.0,
            "results": [],
        }

    monkeypatch.setattr(main, "evaluate_command_parser", fake_evaluate_command_parser)
    monkeypatch.setattr(
        main,
        "get_llm_provider_status",
        lambda: {
            "provider_name": "disabled",
            "provider_model": None,
            "is_supported": True,
            "is_configured": False,
            "real_llm_available": False,
        },
    )

    response = client.get("/commands/evaluate/compare?include_real_llm=true")

    assert response.status_code == 200

    data = response.json()

    assert "real_llm" in data["parser_modes"]
    assert len(data["evaluations"]) == 2
    assert data["skipped_evaluations"][0]["parser_mode"] == "real_llm"
