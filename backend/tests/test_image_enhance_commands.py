from fastapi.testclient import TestClient
from PIL import Image

import app.main as main

from app.services.command_parser import parse_command
from app.services.command_validation import validate_parsed_command


client = TestClient(main.app)


def _write_sample_image(path, color=(80, 100, 120)):
    image = Image.new("RGB", (24, 20), color=color)
    image.save(path)


def test_parse_auto_enhance_image_command():
    parsed = parse_command("auto enhance image")

    assert parsed == {
        "action": "enhance_image",
        "brightness": 1.1,
        "contrast": 1.12,
        "saturation": 1.08,
        "sharpness": 1.35,
    }


def test_parse_specific_image_enhancement_commands():
    assert parse_command("improve brightness")["brightness"] == 1.12
    assert parse_command("increase contrast")["contrast"] == 1.12
    assert parse_command("increase saturation")["saturation"] == 1.12
    assert parse_command("sharpen image")["sharpness"] == 1.45


def test_validate_enhance_image_command_accepts_adjustments():
    validated = validate_parsed_command(
        {
            "action": "enhance_image",
            "brightness": 1.1,
            "contrast": 1.12,
            "saturation": 1.08,
            "sharpness": 1.35,
        }
    )

    assert validated["action"] == "enhance_image"


def test_execute_enhance_image_command_for_upload(monkeypatch, tmp_path):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"
    test_upload_dir.mkdir()
    test_output_dir.mkdir()

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    filename = "sample.png"
    _write_sample_image(test_upload_dir / filename)

    response = client.post(
        "/commands/execute",
        json={
            "filename": filename,
            "command": "auto enhance image",
            "confidence_threshold": 0.25,
        },
    )

    assert response.status_code == 200

    data = response.json()
    result = data["result"]

    assert data["parsed_command"]["action"] == "enhance_image"
    assert data["result_type"] == "enhance_image"
    assert result["filename"] == filename
    assert result["source"] == "uploads"
    assert result["enhanced_filename"].startswith("enhanced_sample_")
    assert result["enhanced_file_url"] == f"/media/outputs/{result['enhanced_filename']}"

    assert (test_output_dir / result["enhanced_filename"]).exists()


def test_execute_enhance_image_command_for_generated_output(monkeypatch, tmp_path):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir()

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    filename = "generated.png"
    _write_sample_image(test_output_dir / filename)

    response = client.post(
        "/commands/execute",
        json={
            "filename": filename,
            "command": "sharpen image",
            "confidence_threshold": 0.25,
            "media_source": "outputs",
        },
    )

    assert response.status_code == 200

    data = response.json()
    result = data["result"]

    assert data["parsed_command"]["action"] == "enhance_image"
    assert data["result_type"] == "enhance_image"
    assert result["filename"] == filename
    assert result["source"] == "outputs"
    assert result["adjustments"]["sharpness"] == 1.45
    assert result["enhanced_filename"].startswith("enhanced_generated_")

    assert (test_output_dir / result["enhanced_filename"]).exists()
