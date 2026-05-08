from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app import main


client = TestClient(main.app)


FAKE_DETECTIONS = [
    {
        "class_id": 0,
        "class_name": "person",
        "confidence": 0.9123,
        "bbox": {
            "x1": 10.0,
            "y1": 20.0,
            "x2": 100.0,
            "y2": 200.0,
        },
    }
]


def create_test_image_bytes(width=120, height=80, image_format="PNG"):
    image = Image.new("RGB", (width, height), color="white")
    image_bytes = BytesIO()
    image.save(image_bytes, format=image_format)
    image_bytes.seek(0)
    return image_bytes


def test_detect_objects_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(
        main,
        "run_yolo_detection",
        lambda image_path, confidence_threshold=0.25, class_filter=None: FAKE_DETECTIONS,
    )

    image_path = test_upload_dir / "sample.png"
    image_path.write_bytes(b"fake image content")

    response = client.post("/vision/detect/sample.png")

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.png"
    assert data["confidence_threshold"] == 0.25
    assert data["class_filter"] is None
    assert data["detection_count"] == 1
    assert data["detections"] == FAKE_DETECTIONS


def test_detect_objects_with_custom_filters(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)

    received_filters = {}

    def fake_detection(image_path, confidence_threshold=0.25, class_filter=None):
        received_filters["confidence_threshold"] = confidence_threshold
        received_filters["class_filter"] = class_filter
        return FAKE_DETECTIONS

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "run_yolo_detection", fake_detection)

    image_path = test_upload_dir / "sample.png"
    image_path.write_bytes(b"fake image content")

    response = client.post(
        "/vision/detect/sample.png?confidence_threshold=0.75&class_filter=person"
    )

    assert response.status_code == 200

    data = response.json()
    assert data["confidence_threshold"] == 0.75
    assert data["class_filter"] == "person"
    assert received_filters["confidence_threshold"] == 0.75
    assert received_filters["class_filter"] == "person"


def test_detect_objects_file_not_found():
    response = client.post("/vision/detect/missing-image.png")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded image not found"
    }


def test_detect_objects_with_annotation_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"

    test_upload_dir.mkdir(parents=True, exist_ok=True)

    received_filters = {}

    def fake_detection(image_path, confidence_threshold=0.25, class_filter=None):
        received_filters["confidence_threshold"] = confidence_threshold
        received_filters["class_filter"] = class_filter
        return FAKE_DETECTIONS

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "run_yolo_detection", fake_detection)

    image_bytes = create_test_image_bytes()
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/detect/sample.png/annotated?confidence_threshold=0.8&class_filter=person"
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.png"
    assert data["confidence_threshold"] == 0.8
    assert data["class_filter"] == "person"
    assert received_filters["confidence_threshold"] == 0.8
    assert received_filters["class_filter"] == "person"
    assert data["detection_count"] == 1
    assert data["detections"] == FAKE_DETECTIONS
    assert data["annotated_filename"].endswith(".png")
    assert data["annotated_file_url"] == f"/media/outputs/{data['annotated_filename']}"

    annotated_path = test_output_dir / data["annotated_filename"]
    assert annotated_path.exists()

    output_response = client.get(data["annotated_file_url"])
    assert output_response.status_code == 200
    assert output_response.headers["content-type"] == "image/png"


def test_detect_objects_with_annotation_file_not_found():
    response = client.post("/vision/detect/missing-image.png/annotated")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded image not found"
    }
