from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_execute_extract_frame_command_success(monkeypatch):
    def fake_extract_video_frame(filename, request):
        assert filename == "sample.mp4"
        assert request.timestamp_seconds == 1.5

        return {
            "filename": filename,
            "frame_filename": "frame_sample.jpg",
            "frame_file_url": "/media/outputs/frame_sample.jpg",
            "timestamp_seconds": request.timestamp_seconds,
            "frame_index": 15,
            "fps": 10,
            "video_duration_seconds": 5,
        }

    monkeypatch.setattr(main, "extract_video_frame", fake_extract_video_frame)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "extract frame at 1.5 seconds",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "extract_frame"
    assert data["parsed_command"]["timestamp_seconds"] == 1.5
    assert data["result_type"] == "extract_frame"
    assert data["result"]["frame_filename"] == "frame_sample.jpg"


def test_execute_trim_video_command_success(monkeypatch):
    def fake_trim_uploaded_video(filename, trim):
        assert filename == "sample.mp4"
        assert trim.start_seconds == 0
        assert trim.end_seconds == 2

        return {
            "filename": filename,
            "trimmed_filename": "trim_sample.mp4",
            "trimmed_file_url": "/media/outputs/trim_sample.mp4",
            "start_seconds": trim.start_seconds,
            "end_seconds": trim.end_seconds,
            "duration_seconds": 2,
            "metadata": {
                "is_readable": True,
                "width": 640,
                "height": 360,
                "fps": 25,
                "frame_count": 50,
                "duration_seconds": 2,
            },
        }

    monkeypatch.setattr(main, "trim_uploaded_video", fake_trim_uploaded_video)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "trim video from 0 to 2 seconds",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "trim_video"
    assert data["parsed_command"]["start_seconds"] == 0
    assert data["parsed_command"]["end_seconds"] == 2
    assert data["result_type"] == "trim_video"
    assert data["result"]["trimmed_filename"] == "trim_sample.mp4"


def test_execute_extract_frame_command_without_timestamp_fails():
    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "extract frame",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Please specify a timestamp, for example: extract frame at 1 second"
    }


def test_execute_trim_video_command_without_range_fails():
    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "trim video",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Please specify a start and end time, for example: trim video from 0 to 2 seconds"
    }
