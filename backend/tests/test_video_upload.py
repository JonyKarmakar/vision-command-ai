from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_upload_video_success(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)

    files = {
        "file": ("sample-video.mp4", b"fake video content", "video/mp4")
    }

    response = client.post("/media/upload-video", files=files)

    assert response.status_code == 200

    data = response.json()
    assert data["message"] == "Video uploaded successfully"
    assert data["original_filename"] == "sample-video.mp4"
    assert data["content_type"] == "video/mp4"
    assert data["stored_filename"].endswith(".mp4")
    assert data["file_size_bytes"] > 0
    assert data["file_url"] == f"/media/videos/{data['stored_filename']}"

    saved_video_path = test_video_dir / data["stored_filename"]
    assert saved_video_path.exists()


def test_upload_video_rejects_non_video_file():
    files = {
        "file": ("notes.txt", b"not a video", "text/plain")
    }

    response = client.post("/media/upload-video", files=files)

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Only video uploads are supported by this endpoint"
    }


def test_get_uploaded_video_success(tmp_path, monkeypatch):
    test_video_dir = tmp_path / "videos"
    test_video_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(main, "VIDEO_DIR", test_video_dir)

    video_path = test_video_dir / "sample.mp4"
    video_path.write_bytes(b"fake video content")

    response = client.get("/media/videos/sample.mp4")

    assert response.status_code == 200
    assert len(response.content) > 0


def test_get_uploaded_video_not_found():
    response = client.get("/media/videos/missing.mp4")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded video not found"
    }


def test_extract_video_metadata_handles_unreadable_video(tmp_path):
    video_path = tmp_path / "invalid-video.mp4"
    video_path.write_bytes(b"this is not a real video")

    metadata = main.extract_video_metadata(video_path)

    assert metadata == {
        "is_readable": False,
        "width": None,
        "height": None,
        "fps": None,
        "frame_count": None,
        "duration_seconds": None,
    }
