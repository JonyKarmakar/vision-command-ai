import cv2
import numpy as np
from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def create_test_video(path, width=64, height=48, fps=5, frame_count=15):
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(path), fourcc, fps, (width, height))

    for index in range(frame_count):
        frame = np.full((height, width, 3), index * 10, dtype=np.uint8)
        writer.write(frame)

    writer.release()


def test_extract_video_frames_success(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_output_dir = tmp_path / "outputs"

    test_video_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    video_path = test_video_dir / "sample.mp4"
    create_test_video(video_path, fps=5, frame_count=15)

    response = client.post(
        "/video/extract-frames/sample.mp4",
        json={
            "start_seconds": 0,
            "end_seconds": 2,
            "interval_seconds": 1,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.mp4"
    assert data["frame_count"] >= 2
    assert len(data["frames"]) == data["frame_count"]

    for frame in data["frames"]:
        frame_path = test_output_dir / frame["frame_filename"]
        assert frame_path.exists()
        assert frame["frame_file_url"] == f"/media/outputs/{frame['frame_filename']}"


def test_extract_video_frames_file_not_found():
    response = client.post(
        "/video/extract-frames/missing.mp4",
        json={
            "start_seconds": 0,
            "end_seconds": 2,
            "interval_seconds": 1,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded video not found"
    }


def test_extract_video_frames_invalid_interval(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_video_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)

    video_path = test_video_dir / "sample.mp4"
    create_test_video(video_path)

    response = client.post(
        "/video/extract-frames/sample.mp4",
        json={
            "start_seconds": 0,
            "end_seconds": 2,
            "interval_seconds": 0,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Interval must be greater than 0"
    }
