from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app import main


client = TestClient(main.app)


def create_test_image_bytes(width=120, height=80, image_format="PNG"):
    image = Image.new("RGB", (width, height), color="white")
    image_bytes = BytesIO()
    image.save(image_bytes, format=image_format)
    image_bytes.seek(0)
    return image_bytes


def test_crop_best_object_by_class_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"

    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    fake_detections = [
        {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.75,
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
            "confidence": 0.95,
            "bbox": {
                "x1": 20,
                "y1": 15,
                "x2": 90,
                "y2": 70,
            },
        },
    ]

    def fake_detection(image_path, confidence_threshold=0.25, class_filter=None):
        assert confidence_threshold == 0.3
        assert class_filter == "person"
        return fake_detections

    monkeypatch.setattr(main, "run_yolo_detection", fake_detection)

    image_bytes = create_test_image_bytes(width=120, height=80)
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/crop-by-class/sample.png",
        json={
            "class_name": "person",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.png"
    assert data["class_name"] == "person"
    assert data["confidence_threshold"] == 0.3
    assert data["selected_detection"]["confidence"] == 0.95
    assert data["cropped_filename"].endswith(".png")
    assert data["cropped_file_url"] == f"/media/outputs/{data['cropped_filename']}"

    cropped_path = test_output_dir / data["cropped_filename"]
    assert cropped_path.exists()

    with Image.open(cropped_path) as cropped_image:
        assert cropped_image.size == (70, 55)


def test_crop_best_object_by_class_file_not_found():
    response = client.post(
        "/vision/crop-by-class/missing.png",
        json={
            "class_name": "person",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded image not found"
    }


def test_crop_best_object_by_class_no_match(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "run_yolo_detection", lambda *args, **kwargs: [])

    image_bytes = create_test_image_bytes(width=120, height=80)
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/crop-by-class/sample.png",
        json={
            "class_name": "cat",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "No object found for class 'cat'"
    }


def test_crop_best_object_by_class_invalid_threshold(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)

    image_bytes = create_test_image_bytes(width=120, height=80)
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/crop-by-class/sample.png",
        json={
            "class_name": "person",
            "confidence_threshold": 2.0,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "confidence_threshold must be between 0 and 1"
    }
