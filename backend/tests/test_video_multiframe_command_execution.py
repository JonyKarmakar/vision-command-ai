from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_execute_extract_frames_command_success(monkeypatch):
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
            "frame_count": 4,
            "frames": [
                {
                    "frame_filename": "frame_0.jpg",
                    "frame_file_url": "/media/outputs/frame_0.jpg",
                    "timestamp_seconds": 0,
                    "frame_index": 0,
                }
            ],
        }

    monkeypatch.setattr(main, "extract_video_frames", fake_extract_video_frames)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "extract frames from 0 to 3 seconds",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "extract_frames"
    assert data["parsed_command"]["start_seconds"] == 0
    assert data["parsed_command"]["end_seconds"] == 3
    assert data["parsed_command"]["interval_seconds"] == 1.0
    assert data["result_type"] == "extract_frames"
    assert data["result"]["frame_count"] == 4


def test_execute_extract_frames_command_with_interval_success(monkeypatch):
    def fake_extract_video_frames(filename, request):
        assert filename == "sample.mp4"
        assert request.start_seconds == 0
        assert request.end_seconds == 4
        assert request.interval_seconds == 2

        return {
            "filename": filename,
            "start_seconds": request.start_seconds,
            "end_seconds": request.end_seconds,
            "interval_seconds": request.interval_seconds,
            "fps": 30,
            "video_duration_seconds": 4,
            "frame_count": 3,
            "frames": [],
        }

    monkeypatch.setattr(main, "extract_video_frames", fake_extract_video_frames)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "extract frames from 0 to 4 every 2 seconds",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "extract_frames"
    assert data["parsed_command"]["interval_seconds"] == 2
    assert data["result_type"] == "extract_frames"


def test_execute_extract_frames_command_without_range_fails():
    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "extract frames",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "I understood this as a multi-frame extraction command" in detail
    assert "I need a start and end time" in detail
    assert "extract frames from 0 to 3 seconds" in detail
