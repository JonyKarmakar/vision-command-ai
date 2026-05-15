from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_detect_sampled_video_frames_success(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_video_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)

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
        assert request.end_seconds == 3
        assert request.interval_seconds == 1

        return {
            "filename": filename,
            "start_seconds": 0,
            "end_seconds": 3,
            "interval_seconds": 1,
            "fps": 30,
            "video_duration_seconds": 3,
            "frame_count": 3,
            "frames": [
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
                {
                    "frame_filename": "frame_60.jpg",
                    "frame_file_url": "/media/outputs/frame_60.jpg",
                    "timestamp_seconds": 2,
                    "frame_index": 60,
                },
            ],
        }

    def fake_detect_objects_on_multiple_extracted_frames(request):
        assert request.frame_filenames == [
            "frame_0.jpg",
            "frame_30.jpg",
            "frame_60.jpg",
        ]
        assert request.confidence_threshold == 0.3
        assert request.class_filter is None

        return {
            "frame_count": 3,
            "confidence_threshold": request.confidence_threshold,
            "class_filter": request.class_filter,
            "frames": [
                {
                    "frame_filename": "frame_0.jpg",
                    "detections": [],
                    "detection_count": 0,
                    "annotated_frame_filename": "annotated_frame_0.jpg",
                    "annotated_frame_file_url": "/media/outputs/annotated_frame_0.jpg",
                }
            ],
        }

    monkeypatch.setattr(main, "extract_video_frames", fake_extract_video_frames)
    monkeypatch.setattr(
        main,
        "detect_objects_on_multiple_extracted_frames",
        fake_detect_objects_on_multiple_extracted_frames,
    )

    response = client.post(
        "/video/detect-sampled/sample.mp4",
        json={
            "interval_seconds": 1,
            "confidence_threshold": 0.3,
            "class_filter": None,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.mp4"
    assert data["interval_seconds"] == 1
    assert data["confidence_threshold"] == 0.3
    assert data["video_metadata"]["duration_seconds"] == 3
    assert data["extracted_frames"]["frame_count"] == 3
    assert data["detection"]["frame_count"] == 3


def test_detect_sampled_video_frames_file_not_found():
    response = client.post(
        "/video/detect-sampled/missing.mp4",
        json={
            "interval_seconds": 1,
            "confidence_threshold": 0.3,
            "class_filter": None,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded video not found"
    }


def test_detect_sampled_video_frames_invalid_interval(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_video_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)

    video_path = test_video_dir / "sample.mp4"
    video_path.write_bytes(b"fake video content")

    response = client.post(
        "/video/detect-sampled/sample.mp4",
        json={
            "interval_seconds": 0,
            "confidence_threshold": 0.3,
            "class_filter": None,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Interval must be greater than 0"
    }
