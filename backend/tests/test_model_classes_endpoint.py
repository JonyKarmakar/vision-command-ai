from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_model_classes_endpoint():
    response = client.get("/model/classes")

    assert response.status_code == 200

    data = response.json()

    assert data["model_name"] == main.MODEL_NAME
    assert data["class_count"] == len(data["classes"])
    assert "person" in data["classes"]
    assert "bicycle" in data["classes"]
    assert "cell phone" in data["classes"]
    assert data["aliases"]["bike"] == "bicycle"
    assert data["aliases"]["phone"] == "cell phone"
