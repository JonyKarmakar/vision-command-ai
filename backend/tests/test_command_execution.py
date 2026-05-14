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


def test_execute_detect_command_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"
    test_log_dir = tmp_path / "logs"
    test_log_file = test_log_dir / "command_logs.jsonl"

    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "LOG_DIR", test_log_dir)
    monkeypatch.setattr(main, "COMMAND_LOG_FILE", test_log_file)
    monkeypatch.setattr(
        main,
        "run_yolo_detection",
        lambda image_path, confidence_threshold=0.25, class_filter=None: [],
    )

    image_bytes = create_test_image_bytes()
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.png",
            "command": "detect objects",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["command"] == "detect objects"
    assert data["parsed_command"]["action"] == "detect"
    assert data["result_type"] == "annotated_detection"
    assert data["result"]["filename"] == "sample.png"
    assert data["result"]["confidence_threshold"] == 0.3

    assert test_log_file.exists()
    log_content = test_log_file.read_text()
    assert "detect objects" in log_content
    assert "annotated_detection" in log_content


def test_execute_crop_command_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"
    test_log_dir = tmp_path / "logs"
    test_log_file = test_log_dir / "command_logs.jsonl"

    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "LOG_DIR", test_log_dir)
    monkeypatch.setattr(main, "COMMAND_LOG_FILE", test_log_file)

    fake_detections = [
        {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.95,
            "bbox": {
                "x1": 10,
                "y1": 10,
                "x2": 70,
                "y2": 60,
            },
        }
    ]

    monkeypatch.setattr(
        main,
        "run_yolo_detection",
        lambda image_path, confidence_threshold=0.25, class_filter=None: fake_detections,
    )

    image_bytes = create_test_image_bytes()
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.png",
            "command": "crop person",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["command"] == "crop person"
    assert data["parsed_command"]["action"] == "crop_by_class"
    assert data["parsed_command"]["class_name"] == "person"
    assert data["result_type"] == "crop_by_class"
    assert data["result"]["class_name"] == "person"
    assert data["result"]["cropped_filename"].endswith(".png")

    assert test_log_file.exists()
    log_content = test_log_file.read_text()
    assert "crop person" in log_content
    assert "crop_by_class" in log_content


def test_execute_crop_command_without_class_fails():
    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.png",
            "command": "crop",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Please specify which class to crop, for example: crop person"
    }


def test_execute_unsupported_command_fails():
    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.png",
            "command": "make it beautiful",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Unsupported command. Try commands like: detect objects, crop person, crop bottle, blur person, extract frame at 1 second, trim video from 0 to 2 seconds"
    }



def test_execute_blur_command_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"
    test_log_dir = tmp_path / "logs"
    test_log_file = test_log_dir / "command_logs.jsonl"

    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "LOG_DIR", test_log_dir)
    monkeypatch.setattr(main, "COMMAND_LOG_FILE", test_log_file)

    fake_detections = [
        {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.95,
            "bbox": {
                "x1": 10,
                "y1": 10,
                "x2": 70,
                "y2": 60,
            },
        }
    ]

    monkeypatch.setattr(
        main,
        "run_yolo_detection",
        lambda image_path, confidence_threshold=0.25, class_filter=None: fake_detections,
    )

    image_bytes = create_test_image_bytes()
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.png",
            "command": "blur person",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["command"] == "blur person"
    assert data["parsed_command"]["action"] == "blur_by_class"
    assert data["parsed_command"]["class_name"] == "person"
    assert data["result_type"] == "blur_by_class"
    assert data["result"]["class_name"] == "person"
    assert data["result"]["blurred_filename"].endswith(".png")

    assert test_log_file.exists()
    log_content = test_log_file.read_text()
    assert "blur person" in log_content
    assert "blur_by_class" in log_content


def test_execute_blur_command_without_class_fails():
    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.png",
            "command": "blur",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Please specify which class to blur, for example: blur person"
    }



def test_execute_blur_all_command_success(tmp_path, monkeypatch):
    test_upload_dir = tmp_path / "uploads"
    test_output_dir = tmp_path / "outputs"
    test_log_dir = tmp_path / "logs"
    test_log_file = test_log_dir / "command_logs.jsonl"

    test_upload_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "UPLOAD_DIR", test_upload_dir)
    monkeypatch.setattr(main, "OUTPUT_DIR", test_output_dir)
    monkeypatch.setattr(main, "LOG_DIR", test_log_dir)
    monkeypatch.setattr(main, "COMMAND_LOG_FILE", test_log_file)

    fake_detections = [
        {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.95,
            "bbox": {
                "x1": 10,
                "y1": 10,
                "x2": 70,
                "y2": 60,
            },
        }
    ]

    monkeypatch.setattr(
        main,
        "run_yolo_detection",
        lambda image_path, confidence_threshold=0.25, class_filter=None: fake_detections,
    )

    image_bytes = create_test_image_bytes()
    image_path = test_upload_dir / "sample.png"

    with image_path.open("wb") as file:
        file.write(image_bytes.getvalue())

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.png",
            "command": "blur all persons",
            "confidence_threshold": 0.3,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["command"] == "blur all persons"
    assert data["parsed_command"]["action"] == "blur_all_by_class"
    assert data["parsed_command"]["class_name"] == "person"
    assert data["result_type"] == "blur_all_by_class"
    assert data["result"]["class_name"] == "person"
    assert data["result"]["blurred_filename"].endswith(".png")

    assert test_log_file.exists()
    log_content = test_log_file.read_text()
    assert "blur all persons" in log_content
    assert "blur_all_by_class" in log_content
