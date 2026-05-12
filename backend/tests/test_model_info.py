from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_model_info_endpoint():
    response = client.get("/model/info")

    assert response.status_code == 200

    data = response.json()
    assert data["model_name"] == main.MODEL_NAME
    assert data["task"] == "object_detection"
    assert data["framework"] == "Ultralytics YOLO"
    assert data["backend"] == "FastAPI"
    assert "detect" in data["supported_actions"]
    assert "command_execution" in data["supported_actions"]
