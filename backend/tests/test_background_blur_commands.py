from fastapi.testclient import TestClient
from PIL import Image

import app.main as main

from app.services.command_parser import parse_command
from app.services.command_validation import validate_parsed_command


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


def test_parse_background_blur_command():
    parsed = parse_command("blur background")

    assert parsed == {
        "action": "background_blur",
        "class_name": None,
        "confidence_threshold": 0.25,
        "padding_ratio": 0.04,
        "blur_radius": 18.0,
    }


def test_parse_keep_people_sharp_command():
    parsed = parse_command("keep people sharp")

    assert parsed["action"] == "background_blur"
    assert parsed["class_name"] == "person"
    assert parsed["blur_radius"] == 18.0


def test_parse_stronger_background_blur_command():
    parsed = parse_command("stronger background blur")

    assert parsed["action"] == "background_blur"
    assert parsed["class_name"] is None
    assert parsed["blur_radius"] == 28.0


def test_validate_background_blur_command_accepts_adjustments():
    validated = validate_parsed_command(
        {
            "action": "background_blur",
            "class_name": "person",
            "confidence_threshold": 0.25,
            "padding_ratio": 0.04,
            "blur_radius": 18.0,
        }
    )

    assert validated["action"] == "background_blur"
    assert validated["class_name"] == "person"


def test_execute_background_blur_command_for_upload(monkeypatch, tmp_path):
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
        "/commands/execute",
        json={
            "filename": filename,
            "command": "blur background",
            "confidence_threshold": 0.25,
        },
    )

    assert response.status_code == 200

    data = response.json()
    result = data["result"]

    assert data["parsed_command"]["action"] == "background_blur"
    assert data["result_type"] == "background_blur"
    assert result["filename"] == filename
    assert result["source"] == "uploads"
    assert result["background_blurred_filename"].startswith("background_blur_sample_")
    assert result["background_blurred_file_url"] == f"/media/outputs/{result['background_blurred_filename']}"
    assert result["detection_count"] == 1

    assert (test_output_dir / result["background_blurred_filename"]).exists()


def test_execute_background_blur_command_for_generated_output(monkeypatch, tmp_path):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir()

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "run_yolo_detection", lambda **kwargs: _fake_detections())

    filename = "generated.png"
    _write_sample_image(test_output_dir / filename)

    response = client.post(
        "/commands/execute",
        json={
            "filename": filename,
            "command": "keep people sharp",
            "confidence_threshold": 0.25,
            "media_source": "outputs",
        },
    )

    assert response.status_code == 200

    data = response.json()
    result = data["result"]

    assert data["parsed_command"]["action"] == "background_blur"
    assert data["parsed_command"]["class_name"] == "person"
    assert data["result_type"] == "background_blur"
    assert result["filename"] == filename
    assert result["source"] == "outputs"
    assert result["class_name"] == "person"
    assert result["background_blurred_filename"].startswith("background_blur_generated_")

    assert (test_output_dir / result["background_blurred_filename"]).exists()
