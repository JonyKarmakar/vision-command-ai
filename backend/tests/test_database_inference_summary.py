from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_database_inference_summary_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/inference-summary")

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "total_inferences": 0,
        "average_inference_time_ms": 0,
        "max_inference_time_ms": 0,
        "total_detections": 0,
        "average_detections_per_run": 0,
        "by_endpoint": [],
    }
