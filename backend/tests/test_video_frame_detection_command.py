from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_execute_detect_frames_command_success(monkeypatch):
    def fake_extract_video_frames(filename, request):
        assert filename == "sample.mp4"
        assert request.start_seconds == 0
        assert request.end_seconds == 3
        assert request.interval_seconds == 1.0

        return {
            "filename": filename,
            "start_seconds": request.start_seconds,
            "end_seconds": request.end_seconds,
            "interval_seconds": request.interval_seconds,
            "fps": 30,
            "video_duration_seconds": 4,
            "frame_count": 2,
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
            ],
        }

    def fake_detect_objects_on_multiple_extracted_frames(request):
        assert request.frame_filenames == ["frame_0.jpg", "frame_30.jpg"]
        assert request.confidence_threshold == 0.3
        assert request.class_filter is None

        return {
            "frame_count": 2,
            "confidence_threshold": request.confidence_threshold,
            "class_filter": request.class_filter,
            "frames": [
                {
                    "frame_filename": "frame_0.jpg",
                    "detections": [],
                    "detection_count": 0,
                    "annotated_frame_filename": "annotated_frame_0.jpg",
                    "annotated_frame_file_url": "/media/outputs/annotated_frame_0.jpg",
                },
                {
                    "frame_filename": "frame_30.jpg",
                    "detections": [],
                    "detection_count": 0,
                    "annotated_frame_filename": "annotated_frame_30.jpg",
                    "annotated_frame_file_url": "/media/outputs/annotated_frame_30.jpg",
                },
            ],
        }

    monkeypatch.setattr(main, "extract_video_frames", fake_extract_video_frames)
    monkeypatch.setattr(
        main,
        "detect_objects_on_multiple_extracted_frames",
        fake_detect_objects_on_multiple_extracted_frames,
    )
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "detect frames from 0 to 3 seconds",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "detect_frames"
    assert data["parsed_command"]["start_seconds"] == 0
    assert data["parsed_command"]["end_seconds"] == 3
    assert data["parsed_command"]["interval_seconds"] == 1.0
    assert data["result_type"] == "detect_frames"
    assert data["result"]["extracted_frames"]["frame_count"] == 2
    assert data["result"]["detection"]["frame_count"] == 2


def test_execute_detect_frames_command_without_range_fails():
    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "detect frames",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "I understood this as a frame detection command" in detail
    assert "I need a start and end time" in detail
    assert "detect frames from 0 to 3 seconds" in detail
