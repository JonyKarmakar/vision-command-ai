from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app import main


client = TestClient(main.app)


def create_test_image_bytes(width=100, height=50, image_format="PNG"):
    image = Image.new("RGB", (width, height), color="white")
    image_bytes = BytesIO()
    image.save(image_bytes, format=image_format)
    image_bytes.seek(0)
    return image_bytes


def test_upload_image_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)

    image_bytes = create_test_image_bytes(width=100, height=50)

    files = {
        "file": ("test-image.png", image_bytes, "image/png")
    }

    response = client.post("/media/upload", files=files)

    assert response.status_code == 200

    data = response.json()
    assert data["message"] == "Image uploaded successfully"
    assert data["original_filename"] == "test-image.png"
    assert data["content_type"] == "image/png"
    assert data["stored_filename"].endswith(".png")
    assert data["width"] == 100
    assert data["height"] == 50

    saved_file_path = test_upload_dir / data["stored_filename"]
    assert saved_file_path.exists()


def test_upload_rejects_non_image_file():
    files = {
        "file": ("notes.txt", b"this is not an image", "text/plain")
    }

    response = client.post("/media/upload", files=files)

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Only image uploads are supported in this step"
    }
