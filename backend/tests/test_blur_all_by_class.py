from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app import main


client = TestClient(main.app)


def create_test_image_bytes(width=140, height=100, image_format="PNG"):
    image = Image.new("RGB", (width, height), color="white")
    image_bytes = BytesIO()
    image.save(image_bytes, format=image_format)
    image_bytes.seek(0)
    return image_bytes


def test_blur_all_objects_by_class_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"

    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    fake_detections = [
        {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.90,
            "bbox": {
                "x1": 10,
                "y1": 10,
                "x2": 50,
                "y2": 50,
            },
        },
        {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.80,
            "bbox": {
                "x1": 60,
                "y1": 20,
                "x2": 120,
                "y2": 80,
            },
        },
    ]

    def fake_detection(image_path, confidence_threshold=0.25, class_filter=None):
        assert confidence_threshold == 0.3
        assert class_filter == "person"
        return fake_detections

    monkeypatch.setattr(main, "run_yolo_detection", fake_detection)

    image_bytes = create_test_image_bytes()
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/blur-all-by-class/sample.png",
        json={
            "class_name": "persons",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.png"
    assert data["class_name"] == "person"
    assert data["detection_count"] == 2
    assert data["blurred_filename"].endswith(".png")
    assert data["blurred_file_url"] == f"/media/outputs/{data['blurred_filename']}"
    assert data["blur_box"] == {
        "x1": 10,
        "y1": 10,
        "x2": 120,
        "y2": 80,
    }

    blurred_path = test_output_dir / data["blurred_filename"]
    assert blurred_path.exists()


def test_blur_all_objects_by_class_no_match(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "run_yolo_detection", lambda *args, **kwargs: [])

    image_bytes = create_test_image_bytes()
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/blur-all-by-class/sample.png",
        json={
            "class_name": "cat",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "No object found for class 'cat'"
    }
