from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


class FakeXYXY:
    def __init__(self, values):
        self.values = values

    def tolist(self):
        return self.values


class FakeBox:
    cls = [0]
    conf = [0.9123]
    xyxy = [FakeXYXY([10.0, 20.0, 100.0, 200.0])]


class FakeResult:
    names = {0: "person"}
    boxes = [FakeBox()]


class FakeYoloModel:
    def __call__(self, image_path):
        return [FakeResult()]


def test_detect_objects_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "get_yolo_model", lambda: FakeYoloModel())

    image_path = test_upload_dir / "sample.png"
    image_path.write_bytes(b"fake image content")

    response = client.post("/vision/detect/sample.png")

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.png"
    assert data["detection_count"] == 1

    detection = data["detections"][0]
    assert detection["class_id"] == 0
    assert detection["class_name"] == "person"
    assert detection["confidence"] == 0.9123
    assert detection["bbox"] == {
        "x1": 10.0,
        "y1": 20.0,
        "x2": 100.0,
        "y2": 200.0,
    }


def test_detect_objects_file_not_found():
    response = client.post("/vision/detect/missing-image.png")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded image not found"
    }
