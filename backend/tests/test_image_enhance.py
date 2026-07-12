from fastapi.testclient import TestClient
from PIL import Image

import app.main as main


client = TestClient(main.app)


def _write_sample_image(path, color=(80, 100, 120)):
    image = Image.new("RGB", (24, 20), color=color)
    image.save(path)


def test_enhance_uploaded_image_creates_generated_output(monkeypatch, tmp_path):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"
    test_upload_dir.mkdir()
    test_output_dir.mkdir()

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    filename = "sample.png"
    _write_sample_image(test_upload_dir / filename)

    response = client.post(
        f"/vision/enhance/{filename}",
        json={
            "brightness": 1.2,
            "contrast": 1.1,
            "saturation": 1.05,
            "sharpness": 1.3,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == filename
    assert data["source"] == "uploads"
    assert data["enhanced_filename"].startswith("enhanced_sample_")
    assert data["enhanced_file_url"] == f"/media/outputs/{data['enhanced_filename']}"
    assert data["adjustments"] == {
        "brightness": 1.2,
        "contrast": 1.1,
        "saturation": 1.05,
        "sharpness": 1.3,
    }

    output_path = test_output_dir / data["enhanced_filename"]
    assert output_path.exists()

    with Image.open(output_path) as image:
        assert image.size == (24, 20)


def test_enhance_generated_output_image_creates_generated_output(monkeypatch, tmp_path):
    test_output_dir = tmp_path / "outputs"
    test_output_dir.mkdir()

    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    filename = "generated.png"
    _write_sample_image(test_output_dir / filename)

    response = client.post(
        f"/vision/enhance-output/{filename}",
        json={
            "brightness": 1.0,
            "contrast": 1.2,
            "saturation": 1.1,
            "sharpness": 1.4,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["filename"] == filename
    assert data["source"] == "outputs"
    assert data["enhanced_filename"].startswith("enhanced_generated_")
    assert data["enhanced_file_url"] == f"/media/outputs/{data['enhanced_filename']}"
    assert data["adjustments"]["contrast"] == 1.2
    assert data["adjustments"]["saturation"] == 1.1
    assert data["adjustments"]["sharpness"] == 1.4

    output_path = test_output_dir / data["enhanced_filename"]
    assert output_path.exists()

    with Image.open(output_path) as image:
        assert image.size == (24, 20)


def test_enhance_rejects_out_of_range_adjustment():
    response = client.post(
        "/vision/enhance/sample.png",
        json={
            "brightness": 3.5,
            "contrast": 1.0,
            "saturation": 1.0,
            "sharpness": 1.0,
        },
    )

    assert response.status_code == 422
