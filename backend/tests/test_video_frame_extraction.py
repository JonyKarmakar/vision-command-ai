import cv2
import numpy as np
from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def create_test_video(path, width=64, height=48, fps=5, frame_count=10):
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(path), fourcc, fps, (width, height))

    for index in range(frame_count):
        frame = np.full((height, width, 3), index * 20, dtype=np.uint8)
        writer.write(frame)

    writer.release()


def test_extract_video_frame_success(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_output_dir = tmp_path / "outputs"

    test_video_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    video_path = test_video_dir / "sample.mp4"
    create_test_video(video_path, fps=5, frame_count=10)

    response = client.post(
        "/video/extract-frame/sample.mp4",
        json={
            "timestamp_seconds": 1,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.mp4"
    assert data["frame_filename"].endswith(".jpg")
    assert data["frame_file_url"] == f"/media/outputs/{data['frame_filename']}"
    assert data["timestamp_seconds"] == 1
    assert data["frame_index"] == 5

    frame_path = test_output_dir / data["frame_filename"]
    assert frame_path.exists()


def test_extract_video_frame_file_not_found():
    response = client.post(
        "/video/extract-frame/missing.mp4",
        json={
            "timestamp_seconds": 1,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded video not found"
    }


def test_extract_video_frame_invalid_timestamp(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_video_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)

    video_path = test_video_dir / "sample.mp4"
    create_test_video(video_path, fps=5, frame_count=10)

    response = client.post(
        "/video/extract-frame/sample.mp4",
        json={
            "timestamp_seconds": -1,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Timestamp must be greater than or equal to 0"
    }
