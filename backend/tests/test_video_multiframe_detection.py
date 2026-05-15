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


def test_detect_objects_on_multiple_extracted_frames_success(tmp_path, monkeypatch):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    def fake_detection(
        filename,
        image_path,
        confidence_threshold=0.25,
        class_filter=None,
        source_endpoint="video_frame_batch_detection",
    ):
        assert confidence_threshold == 0.3
        assert class_filter is None
        assert source_endpoint == "video_frame_batch_detection"
        return FAKE_DETECTIONS

    monkeypatch.setattr(
        main,
        "run_yolo_detection_with_inference_logging",
        fake_detection,
    )

    for filename in ["frame_one.jpg", "frame_two.jpg"]:
        frame_path = test_output_dir / filename
        image = Image.new("RGB", (120, 90), color="white")
        image.save(frame_path)

    response = client.post(
        "/video/detect-frames/annotated",
        json={
            "frame_filenames": ["frame_one.jpg", "frame_two.jpg"],
            "confidence_threshold": 0.3,
            "class_filter": None,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["frame_count"] == 2
    assert data["confidence_threshold"] == 0.3
    assert len(data["frames"]) == 2

    for frame_result in data["frames"]:
        assert frame_result["detection_count"] == 1
        assert frame_result["detections"] == FAKE_DETECTIONS
        assert frame_result["annotated_frame_filename"].endswith(".jpg")
        annotated_path = test_output_dir / frame_result["annotated_frame_filename"]
        assert annotated_path.exists()


def test_detect_objects_on_multiple_extracted_frames_empty_list():
    response = client.post(
        "/video/detect-frames/annotated",
        json={
            "frame_filenames": [],
            "confidence_threshold": 0.3,
            "class_filter": None,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "At least one frame filename is required"
    }


def test_detect_objects_on_multiple_extracted_frames_missing_frame():
    response = client.post(
        "/video/detect-frames/annotated",
        json={
            "frame_filenames": ["missing.jpg"],
            "confidence_threshold": 0.3,
            "class_filter": None,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Extracted frame not found: missing.jpg"
    }
