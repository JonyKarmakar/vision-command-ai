import cv2
from pathlib import Path
from types import SimpleNamespace
import numpy as np
from fastapi.testclient import TestClient

import app.main as main


client = TestClient(main.app)


def create_test_video(path, width=64, height=48, fps=5, frame_count=11):
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(path), fourcc, fps, (width, height))

    for index in range(frame_count):
        frame = np.full((height, width, 3), 40 + index, dtype=np.uint8)
        writer.write(frame)

    writer.release()


def fake_ffmpeg_run(command, capture_output, text):
    output_path = Path(command[-1])
    input_path = Path(command[3])
    output_path.write_bytes(input_path.read_bytes())

    return SimpleNamespace(returncode=0, stderr="")


def fake_detections(**kwargs):
    assert kwargs["source_endpoint"] == "video_object_detection"
    assert kwargs["confidence_threshold"] == 0.3
    assert kwargs["class_filter"] is None

    return [
        {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.91,
            "bbox": {
                "x1": 5,
                "y1": 6,
                "x2": 30,
                "y2": 32,
            },
        }
    ]


def test_detect_video_objects_success(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_output_dir = tmp_path / "outputs"
    test_video_dir.mkdir(parents=True, exist_ok=True)
    test_output_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "run_yolo_detection_with_inference_logging", fake_detections)
    monkeypatch.setattr(main.subprocess, "run", fake_ffmpeg_run)

    video_path = test_video_dir / "sample.mp4"
    create_test_video(video_path)

    response = client.post(
        "/video/detect-objects/sample.mp4",
        json={
            "interval_seconds": 1,
            "confidence_threshold": 0.3,
            "class_filter": None,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == "sample.mp4"
    assert data["method"] == "video_object_detection"
    assert data["annotated_video_filename"].startswith("annotated_video_sample_")
    assert data["annotated_video_file_url"] == f"/media/outputs/{data['annotated_video_filename']}"
    assert data["sampling_strategy"] == "interval_seconds"
    assert data["interval_seconds"] == 1
    assert data["sample_interval_frames"] == 5
    assert data["processed_frame_count"] == 3
    assert data["detection_count"] == 3
    assert data["class_summary"] == [
        {
            "class_name": "person",
            "frame_count": 3,
            "detection_count": 3,
            "highest_confidence": 0.91,
        }
    ]

    assert [frame["frame_index"] for frame in data["frames"]] == [0, 5, 10]
    assert [frame["timestamp_seconds"] for frame in data["frames"]] == [0, 1, 2]

    assert (test_output_dir / data["annotated_video_filename"]).exists()

    for frame in data["frames"]:
        assert frame["frame_filename"].startswith("video_object_frame_sample_")
        assert frame["frame_file_url"] == f"/media/outputs/{frame['frame_filename']}"
        assert frame["detection_count"] == 1
        assert frame["detections"][0]["class_name"] == "person"
        assert (test_output_dir / frame["frame_filename"]).exists()


def test_detect_video_objects_file_not_found():
    response = client.post(
        "/video/detect-objects/missing.mp4",
        json={
            "interval_seconds": 1,
            "confidence_threshold": 0.25,
            "class_filter": None,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded video not found",
    }


def test_detect_video_objects_invalid_interval(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_video_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)

    video_path = test_video_dir / "sample.mp4"
    create_test_video(video_path)

    response = client.post(
        "/video/detect-objects/sample.mp4",
        json={
            "interval_seconds": 0,
            "confidence_threshold": 0.25,
            "class_filter": None,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Interval must be greater than 0",
    }


def test_detect_video_objects_invalid_confidence(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_video_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)

    video_path = test_video_dir / "sample.mp4"
    create_test_video(video_path)

    response = client.post(
        "/video/detect-objects/sample.mp4",
        json={
            "interval_seconds": 1,
            "confidence_threshold": 1.5,
            "class_filter": None,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "confidence_threshold must be between 0 and 1",
    }
