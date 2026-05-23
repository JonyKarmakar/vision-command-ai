from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_llmops_dashboard_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_MODEL", raising=False)
    monkeypatch.delenv("OLLAMA_BASE_URL", raising=False)
    monkeypatch.delenv("OLLAMA_MODEL", raising=False)

    response = client.get("/llmops/dashboard")

    assert response.status_code == 200

    data = response.json()

    assert data["provider_status"]["provider_name"] == "disabled"
    assert data["provider_status"]["real_llm_available"] is False

    assert data["parser_attempt_summary"]["status"] == "not_configured"
    assert data["parser_attempt_summary"]["total_attempts"] == 0

    assert data["recent_parser_attempt_logs"]["status"] == "not_configured"
    assert data["recent_parser_attempt_logs"]["count"] == 0
    assert data["recent_parser_attempt_logs"]["logs"] == []


def test_llmops_dashboard_limit_parameter(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/llmops/dashboard?limit=5")

    assert response.status_code == 200

    data = response.json()
    assert "provider_status" in data
    assert "parser_attempt_summary" in data
    assert "recent_parser_attempt_logs" in data


def test_llmops_dashboard_accepts_log_filters_when_database_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    response = client.get(
        "/llmops/dashboard?limit=5&parser_mode=rule_based&success=true"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["provider_status"]["provider_name"] == "disabled"
    assert data["parser_attempt_summary"]["status"] == "not_configured"
    assert data["recent_parser_attempt_logs"]["status"] == "not_configured"
    assert data["recent_parser_attempt_logs"]["count"] == 0
    assert data["recent_parser_attempt_logs"]["logs"] == []


def test_llmops_dashboard_filters_summary_and_logs_when_database_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    response = client.get(
        "/llmops/dashboard?limit=5&parser_mode=rule_based&success=true"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["parser_attempt_summary"]["status"] == "not_configured"
    assert data["parser_attempt_summary"]["total_attempts"] == 0
    assert data["recent_parser_attempt_logs"]["status"] == "not_configured"
    assert data["recent_parser_attempt_logs"]["count"] == 0


def test_llmops_dashboard_includes_parser_evaluation(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/llmops/dashboard")

    assert response.status_code == 200

    data = response.json()

    assert "parser_evaluation" in data
    assert "evaluations" in data["parser_evaluation"]

    evaluations = data["parser_evaluation"]["evaluations"]

    assert len(evaluations) == 2

    parser_types = {evaluation["parser_type"] for evaluation in evaluations}

    assert parser_types == {"rule_based", "llm_mock"}

    for evaluation in evaluations:
        assert "parser_version" in evaluation
        assert "total_cases" in evaluation
        assert "passed_cases" in evaluation
        assert "failed_cases" in evaluation
        assert "accuracy" in evaluation
        assert evaluation["total_cases"] > 0
        assert evaluation["accuracy"] >= 0


def test_llmops_dashboard_parser_evaluation_is_compact(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/llmops/dashboard")

    assert response.status_code == 200

    evaluations = response.json()["parser_evaluation"]["evaluations"]

    for evaluation in evaluations:
        assert "results" not in evaluation
