from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_execute_track_video_command_success(monkeypatch):
    def fake_track_sampled_video_objects(filename, request):
        assert filename == "sample.mp4"
        assert request.start_seconds == 0
        assert request.end_seconds == 3
        assert request.interval_seconds == 1.0
        assert request.confidence_threshold == 0.3
        assert request.class_filter is None

        return {
            "filename": filename,
            "video_metadata": {
                "is_readable": True,
                "width": 640,
                "height": 360,
                "fps": 30,
                "frame_count": 90,
                "duration_seconds": 3,
            },
            "start_seconds": request.start_seconds,
            "end_seconds": request.end_seconds,
            "interval_seconds": request.interval_seconds,
            "confidence_threshold": request.confidence_threshold,
            "class_filter": request.class_filter,
            "max_distance_pixels": request.max_distance_pixels,
            "frame_count": 2,
            "track_count": 1,
            "tracks": [
                {
                    "track_id": 1,
                    "class_name": "person",
                    "observation_count": 2,
                    "first_timestamp_seconds": 0,
                    "last_timestamp_seconds": 1,
                    "max_confidence": 0.95,
                }
            ],
            "frames": [],
        }

    monkeypatch.setattr(main, "track_sampled_video_objects", fake_track_sampled_video_objects)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "track video from 0 to 3 seconds",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "track_video"
    assert data["parsed_command"]["class_name"] is None
    assert data["parsed_command"]["start_seconds"] == 0
    assert data["parsed_command"]["end_seconds"] == 3
    assert data["result_type"] == "track_video"
    assert data["result"]["track_count"] == 1


def test_execute_track_class_command_success(monkeypatch):
    def fake_track_sampled_video_objects(filename, request):
        assert filename == "sample.mp4"
        assert request.class_filter == "person"

        return {
            "filename": filename,
            "video_metadata": {
                "is_readable": True,
                "width": 640,
                "height": 360,
                "fps": 30,
                "frame_count": 90,
                "duration_seconds": 3,
            },
            "start_seconds": request.start_seconds,
            "end_seconds": request.end_seconds,
            "interval_seconds": request.interval_seconds,
            "confidence_threshold": request.confidence_threshold,
            "class_filter": request.class_filter,
            "max_distance_pixels": request.max_distance_pixels,
            "frame_count": 2,
            "track_count": 1,
            "tracks": [],
            "frames": [],
        }

    monkeypatch.setattr(main, "track_sampled_video_objects", fake_track_sampled_video_objects)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "track person from 0 to 3 seconds",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "track_video"
    assert data["parsed_command"]["class_name"] == "person"
    assert data["result_type"] == "track_video"


def test_execute_track_video_command_without_range_fails():
    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.mp4",
            "command": "track video",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Please specify a start and end time, for example: track video from 0 to 3 seconds"
    }
