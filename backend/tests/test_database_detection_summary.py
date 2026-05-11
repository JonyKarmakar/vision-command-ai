from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_database_detection_summary_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/detection-summary")

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "total_detections": 0,
        "classes": [],
    }
