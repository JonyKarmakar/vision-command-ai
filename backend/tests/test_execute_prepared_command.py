from fastapi.testclient import TestClient

import app.main as main
from app.main import app


client = TestClient(app)


def test_execute_prepared_blur_all_by_class_success(monkeypatch):
    def fake_blur_all_objects_by_class(filename, request):
        assert filename == "sample.jpg"
        assert request.class_name == "person"
        assert request.confidence_threshold == 0.3

        return {
            "filename": filename,
            "blurred_filename": "blurred_sample.jpg",
            "blurred_file_url": "/media/outputs/blurred_sample.jpg",
            "class_name": request.class_name,
            "blurred_count": 2,
            "confidence_threshold": request.confidence_threshold,
        }

    monkeypatch.setattr(main, "blur_all_objects_by_class", fake_blur_all_objects_by_class)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute-prepared",
        json={
            "filename": "sample.jpg",
            "command": "blur all people",
            "confidence_threshold": 0.3,
            "prepared_command": {
                "action": "blur_all_by_class",
                "class_name": "person",
            },
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["command"] == "blur all people"
    assert data["parser_mode"] == "prepared"
    assert data["parser_type"] == "prepared_command"
    assert data["parser_version"] == "prepared-command-v1"
    assert data["parsed_command"] == {
        "action": "blur_all_by_class",
        "class_name": "person",
    }
    assert data["result_type"] == "blur_all_by_class"
    assert data["result"]["blurred_count"] == 2


def test_execute_prepared_rejects_invalid_confidence_threshold():
    response = client.post(
        "/commands/execute-prepared",
        json={
            "filename": "sample.jpg",
            "confidence_threshold": 1.5,
            "prepared_command": {
                "action": "detect",
            },
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "confidence_threshold must be between 0 and 1"
    }


def test_execute_prepared_rejects_invalid_prepared_command_before_execution(monkeypatch):
    def fail_if_called(*args, **kwargs):
        raise AssertionError("Execution should not run for invalid prepared commands.")

    monkeypatch.setattr(main, "blur_all_objects_by_class", fail_if_called)

    response = client.post(
        "/commands/execute-prepared",
        json={
            "filename": "sample.jpg",
            "confidence_threshold": 0.3,
            "prepared_command": {
                "action": "blur_all_by_class",
            },
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Parsed command is missing required field: class_name"
    }


def test_execute_prepared_extract_frames_success(monkeypatch):
    def fake_extract_video_frames(filename, request):
        assert filename == "sample.mp4"
        assert request.start_seconds == 0
        assert request.end_seconds == 3
        assert request.interval_seconds == 1

        return {
            "filename": filename,
            "start_seconds": request.start_seconds,
            "end_seconds": request.end_seconds,
            "interval_seconds": request.interval_seconds,
            "frame_count": 2,
            "frames": [
                {
                    "frame_filename": "frame_0.jpg",
                    "timestamp_seconds": 0,
                    "frame_file_url": "/media/outputs/frame_0.jpg",
                },
                {
                    "frame_filename": "frame_1.jpg",
                    "timestamp_seconds": 1,
                    "frame_file_url": "/media/outputs/frame_1.jpg",
                },
            ],
        }

    monkeypatch.setattr(main, "extract_video_frames", fake_extract_video_frames)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute-prepared",
        json={
            "filename": "sample.mp4",
            "command": "extract frames from 0 to 3 seconds",
            "confidence_threshold": 0.3,
            "prepared_command": {
                "action": "extract_frames",
                "start_seconds": 0,
                "end_seconds": 3,
                "interval_seconds": 1,
            },
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["parser_mode"] == "prepared"
    assert data["parser_type"] == "prepared_command"
    assert data["parser_version"] == "prepared-command-v1"
    assert data["parsed_command"]["action"] == "extract_frames"
    assert data["result_type"] == "extract_frames"
    assert data["result"]["frame_count"] == 2
