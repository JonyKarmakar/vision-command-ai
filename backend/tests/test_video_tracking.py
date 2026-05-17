from fastapi.testclient import TestClient
from PIL import Image

from app import main


client = TestClient(main.app)


def test_track_sampled_video_objects_success(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_output_dir = tmp_path / "outputs"

    test_video_dir.mkdir(parents=True, exist_ok=True)
    test_output_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    video_path = test_video_dir / "sample.mp4"
    video_path.write_bytes(b"fake video content")

    monkeypatch.setattr(
        main,
        "extract_video_metadata",
        lambda video_path: {
            "is_readable": True,
            "width": 640,
            "height": 360,
            "fps": 30,
            "frame_count": 90,
            "duration_seconds": 3,
        },
    )

    def fake_extract_video_frames(filename, request):
        assert filename == "sample.mp4"
        assert request.start_seconds == 0
        assert request.end_seconds == 2
        assert request.interval_seconds == 1

        frames = [
            {
                "frame_filename": "frame_0.jpg",
                "frame_file_url": "/media/outputs/frame_0.jpg",
                "timestamp_seconds": 0,
                "frame_index": 0,
            },
            {
                "frame_filename": "frame_30.jpg",
                "frame_file_url": "/media/outputs/frame_30.jpg",
                "timestamp_seconds": 1,
                "frame_index": 30,
            },
        ]

        for frame in frames:
            Image.new("RGB", (120, 90), color="white").save(test_output_dir / frame["frame_filename"])

        return {
            "filename": filename,
            "start_seconds": 0,
            "end_seconds": 2,
            "interval_seconds": 1,
            "fps": 30,
            "video_duration_seconds": 3,
            "frame_count": len(frames),
            "frames": frames,
        }

    def fake_detection(
        filename,
        image_path,
        confidence_threshold=0.25,
        class_filter=None,
        source_endpoint="video_tracking",
    ):
        assert confidence_threshold == 0.3
        assert class_filter is None
        assert source_endpoint == "video_tracking"

        if filename == "frame_0.jpg":
            return [
                {
                    "class_id": 0,
                    "class_name": "person",
                    "confidence": 0.90,
                    "bbox": {
                        "x1": 10,
                        "y1": 10,
                        "x2": 50,
                        "y2": 80,
                    },
                }
            ]

        return [
            {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.95,
                "bbox": {
                    "x1": 15,
                    "y1": 12,
                    "x2": 55,
                    "y2": 82,
                },
            }
        ]

    monkeypatch.setattr(main, "extract_video_frames", fake_extract_video_frames)
    monkeypatch.setattr(main, "run_yolo_detection_with_inference_logging", fake_detection)
    monkeypatch.setattr(main, "save_detections_to_database", lambda *args, **kwargs: None)

    response = client.post(
        "/video/track-sampled/sample.mp4",
        json={
            "start_seconds": 0,
            "end_seconds": 2,
            "interval_seconds": 1,
            "confidence_threshold": 0.3,
            "class_filter": None,
            "max_distance_pixels": 80,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.mp4"
    assert data["frame_count"] == 2
    assert data["track_count"] == 1
    assert len(data["tracks"]) == 1
    assert data["tracks"][0]["class_name"] == "person"
    assert data["tracks"][0]["observation_count"] == 2

    first_track_id = data["frames"][0]["detections"][0]["track_id"]
    second_track_id = data["frames"][1]["detections"][0]["track_id"]

    assert first_track_id == second_track_id

    for frame in data["frames"]:
        assert frame["annotated_frame_filename"].endswith(".jpg")
        assert frame["annotated_frame_file_url"] == f"/media/outputs/{frame['annotated_frame_filename']}"

        annotated_path = test_output_dir / frame["annotated_frame_filename"]
        assert annotated_path.exists()


def test_track_sampled_video_objects_file_not_found():
    response = client.post(
        "/video/track-sampled/missing.mp4",
        json={
            "start_seconds": 0,
            "end_seconds": 2,
            "interval_seconds": 1,
            "confidence_threshold": 0.3,
            "class_filter": None,
            "max_distance_pixels": 80,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded video not found"
    }


def test_track_sampled_video_objects_invalid_interval(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_video_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)

    video_path = test_video_dir / "sample.mp4"
    video_path.write_bytes(b"fake video content")

    response = client.post(
        "/video/track-sampled/sample.mp4",
        json={
            "start_seconds": 0,
            "end_seconds": 2,
            "interval_seconds": 0,
            "confidence_threshold": 0.3,
            "class_filter": None,
            "max_distance_pixels": 80,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Interval must be greater than 0"
    }
