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
            "x2": 60.0,
            "y2": 70.0,
        },
    }
]


def test_detect_objects_on_extracted_frame_success(tmp_path, monkeypatch):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    def fake_detection(
        filename,
        image_path,
        confidence_threshold=0.25,
        class_filter=None,
        source_endpoint="video_frame_detection",
    ):
        assert filename == "frame_sample.jpg"
        assert confidence_threshold == 0.3
        assert class_filter is None
        assert source_endpoint == "video_frame_detection"
        return FAKE_DETECTIONS

    monkeypatch.setattr(
        main,
        "run_yolo_detection_with_inference_logging",
        fake_detection,
    )

    frame_path = test_output_dir / "frame_sample.jpg"
    image = Image.new("RGB", (120, 90), color="white")
    image.save(frame_path)

    response = client.post(
        "/video/detect-frame/frame_sample.jpg/annotated?confidence_threshold=0.3"
    )

    assert response.status_code == 200

    data = response.json()
    assert data["frame_filename"] == "frame_sample.jpg"
    assert data["confidence_threshold"] == 0.3
    assert data["detection_count"] == 1
    assert data["detections"] == FAKE_DETECTIONS
    assert data["annotated_frame_filename"].endswith(".jpg")
    assert data["annotated_frame_file_url"] == f"/media/outputs/{data['annotated_frame_filename']}"

    annotated_path = test_output_dir / data["annotated_frame_filename"]
    assert annotated_path.exists()


def test_detect_objects_on_extracted_frame_not_found():
    response = client.post("/video/detect-frame/missing.jpg/annotated")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Extracted frame not found"
    }
