from fastapi.testclient import TestClient
from PIL import Image

import app.main as main


client = TestClient(main.app)


def _write_sample_image(path, color=(80, 100, 120)):
    image = Image.new("RGB", (32, 24), color=color)
    image.save(path)


def _fake_detections():
    return [
        {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.91,
            "bbox": {
                "x1": 8,
                "y1": 6,
                "x2": 22,
                "y2": 18,
            },
        }
    ]


def test_background_blur_uploaded_image_creates_output(monkeypatch, tmp_path):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"
    test_upload_dir.mkdir()
    test_output_dir.mkdir()

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "run_yolo_detection", lambda **kwargs: _fake_detections())

    filename = "sample.png"
    _write_sample_image(test_upload_dir / filename)

    response = client.post(
        f"/vision/background-blur/{filename}",
        json={
            "class_name": None,
            "confidence_threshold": 0.25,
            "padding_ratio": 0.04,
            "blur_radius": 18,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == filename
    assert data["source"] == "uploads"
    assert data["background_blurred_filename"].startswith("background_blur_sample_")
    assert data["background_blurred_file_url"] == f"/media/outputs/{data['background_blurred_filename']}"
    assert data["detection_count"] == 1
    assert data["preserved_detections"][0]["class_name"] == "person"
    assert data["method"] == "detection_box_background_blur"

    output_path = test_output_dir / data["background_blurred_filename"]
    assert output_path.exists()

    with Image.open(output_path) as image:
        assert image.size == (32, 24)


def test_background_blur_generated_output_image_creates_output(monkeypatch, tmp_path):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir()

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "run_yolo_detection", lambda **kwargs: _fake_detections())

    filename = "generated.png"
    _write_sample_image(test_output_dir / filename)

    response = client.post(
        f"/vision/background-blur-output/{filename}",
        json={
            "class_name": "person",
            "confidence_threshold": 0.3,
            "padding_ratio": 0.08,
            "blur_radius": 24,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == filename
    assert data["source"] == "outputs"
    assert data["class_name"] == "person"
    assert data["confidence_threshold"] == 0.3
    assert data["padding_ratio"] == 0.08
    assert data["blur_radius"] == 24
    assert data["background_blurred_filename"].startswith("background_blur_generated_")

    output_path = test_output_dir / data["background_blurred_filename"]
    assert output_path.exists()


def test_background_blur_returns_404_when_no_detections(monkeypatch, tmp_path):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"
    test_upload_dir.mkdir()
    test_output_dir.mkdir()

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "run_yolo_detection", lambda **kwargs: [])

    filename = "empty.png"
    _write_sample_image(test_upload_dir / filename)

    response = client.post(
        f"/vision/background-blur/{filename}",
        json={
            "class_name": None,
            "confidence_threshold": 0.25,
            "padding_ratio": 0.04,
            "blur_radius": 18,
        },
    )

    assert response.status_code == 404
    assert "No foreground objects found" in response.json()["detail"]
