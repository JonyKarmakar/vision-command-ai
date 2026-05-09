from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app import main


client = TestClient(main.app)


def create_test_image_bytes(width=120, height=80, image_format="PNG"):
    image = Image.new("RGB", (width, height), color="white")
    image_bytes = BytesIO()
    image.save(image_bytes, format=image_format)
    image_bytes.seek(0)
    return image_bytes


def test_blur_uploaded_image_object_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"

    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)

    image_bytes = create_test_image_bytes(width=120, height=80)
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/blur/sample.png",
        json={
            "x1": 10,
            "y1": 20,
            "x2": 70,
            "y2": 60,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "sample.png"
    assert data["blurred_filename"].endswith(".png")
    assert data["blurred_file_url"] == f"/media/outputs/{data['blurred_filename']}"
    assert data["blur_box"] == {
        "x1": 10,
        "y1": 20,
        "x2": 70,
        "y2": 60,
    }

    blurred_path = test_output_dir / data["blurred_filename"]
    assert blurred_path.exists()


def test_blur_uploaded_image_file_not_found():
    response = client.post(
        "/vision/blur/missing.png",
        json={
            "x1": 10,
            "y1": 20,
            "x2": 70,
            "y2": 60,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Uploaded image not found"
    }


def test_blur_uploaded_image_invalid_coordinates(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)

    image_bytes = create_test_image_bytes(width=120, height=80)
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/vision/blur/sample.png",
        json={
            "x1": 70,
            "y1": 20,
            "x2": 10,
            "y2": 60,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Invalid blur coordinates"
    }
