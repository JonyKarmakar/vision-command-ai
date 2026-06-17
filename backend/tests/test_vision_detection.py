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



def test_detect_generated_output_success(tmp_path, monkeypatch):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir(parents=True, exist_ok=True)

    received_filters = {}

    def fake_detection(image_path, confidence_threshold=0.25, class_filter=None):
        received_filters["image_path"] = image_path
        received_filters["confidence_threshold"] = confidence_threshold
        received_filters["class_filter"] = class_filter
        return FAKE_DETECTIONS

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "run_yolo_detection", fake_detection)

    image_path = test_output_dir / "zoom_result.png"
    image_path.write_bytes(b"fake image content")

    response = client.post(
        "/vision/detect-output/zoom_result.png?confidence_threshold=0.7&class_filter=person"
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "zoom_result.png"
    assert data["source"] == "outputs"
    assert data["confidence_threshold"] == 0.7
    assert data["class_filter"] == "person"
    assert data["detection_count"] == 1
    assert data["detections"] == FAKE_DETECTIONS
    assert received_filters["image_path"] == image_path
    assert received_filters["confidence_threshold"] == 0.7
    assert received_filters["class_filter"] == "person"


def test_detect_generated_output_file_not_found():
    response = client.post("/vision/detect-output/missing-output.png")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Generated output image not found"
    }


def test_detect_generated_output_with_annotation_success(tmp_path, monkeypatch):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir(parents=True, exist_ok=True)

    received_filters = {}

    def fake_detection(image_path, confidence_threshold=0.25, class_filter=None):
        received_filters["image_path"] = image_path
        received_filters["confidence_threshold"] = confidence_threshold
        received_filters["class_filter"] = class_filter
        return FAKE_DETECTIONS

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "run_yolo_detection", fake_detection)

    image_bytes = create_test_image_bytes()
    image_path = test_output_dir / "zoom_result.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/detect-output/zoom_result.png/annotated?confidence_threshold=0.6"
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "zoom_result.png"
    assert data["source"] == "outputs"
    assert data["confidence_threshold"] == 0.6
    assert data["class_filter"] is None
    assert data["detection_count"] == 1
    assert data["detections"] == FAKE_DETECTIONS
    assert data["annotated_filename"].startswith("annotated_output_zoom_result_")
    assert data["annotated_file_url"] == f"/media/outputs/{data['annotated_filename']}"
    assert received_filters["image_path"] == image_path

    annotated_path = test_output_dir / data["annotated_filename"]
    assert annotated_path.exists()


def test_crop_generated_output_image_success(tmp_path, monkeypatch):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    image_bytes = create_test_image_bytes(width=120, height=80)
    image_path = test_output_dir / "zoom_result.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/crop-output/zoom_result.png",
        json={"x1": 10, "y1": 20, "x2": 80, "y2": 70},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "zoom_result.png"
    assert data["source"] == "outputs"
    assert data["cropped_filename"].startswith("crop_output_zoom_result_")
    assert data["cropped_file_url"] == f"/media/outputs/{data['cropped_filename']}"
    assert data["crop_box"] == {"x1": 10, "y1": 20, "x2": 80, "y2": 70}
    assert (test_output_dir / data["cropped_filename"]).exists()


def test_blur_generated_output_image_success(tmp_path, monkeypatch):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    image_bytes = create_test_image_bytes(width=120, height=80)
    image_path = test_output_dir / "zoom_result.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/blur-output/zoom_result.png",
        json={"x1": 10, "y1": 20, "x2": 80, "y2": 70},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "zoom_result.png"
    assert data["source"] == "outputs"
    assert data["blurred_filename"].startswith("blur_output_zoom_result_")
    assert data["blurred_file_url"] == f"/media/outputs/{data['blurred_filename']}"
    assert data["blur_box"] == {"x1": 10, "y1": 20, "x2": 80, "y2": 70}
    assert (test_output_dir / data["blurred_filename"]).exists()


def test_crop_generated_output_image_not_found():
    response = client.post(
        "/vision/crop-output/missing-output.png",
        json={"x1": 10, "y1": 20, "x2": 80, "y2": 70},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Generated output image not found"}
