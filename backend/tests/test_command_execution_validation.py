from pathlib import Path

from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_execute_command_validates_and_normalizes_parsed_class(monkeypatch, tmp_path):
    image_path = tmp_path / "sample.jpg"
    image_path.write_bytes(b"fake-image")

    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)
    monkeypatch.setattr(
        main,
        "parse_command",
        lambda command: {
            "action": "crop_by_class",
            "class_name": "bike",
        },
    )

    captured_class_filter = {}

    def fake_crop_best_object_by_class(
        filename: str,
        request,
    ):
        class_filter = request.class_name
        confidence_threshold = request.confidence_threshold
        captured_class_filter["class_filter"] = class_filter
        return {
            "filename": filename,
            "class_name": class_filter,
            "confidence_threshold": confidence_threshold,
            "selected_detection": {
                "class_id": 1,
                "class_name": class_filter,
                "confidence": 0.9,
                "bbox": {
                    "x1": 1,
                    "y1": 2,
                    "x2": 3,
                    "y2": 4,
                },
            },
            "cropped_filename": "crop.jpg",
            "cropped_file_url": "/media/outputs/crop.jpg",
            "crop_box": {
                "x1": 1,
                "y1": 2,
                "x2": 3,
                "y2": 4,
            },
        }

    monkeypatch.setattr(main, "crop_best_object_by_class", fake_crop_best_object_by_class)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.jpg",
            "command": "crop bike",
            "confidence_threshold": 0.25,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["parsed_command"]["class_name"] == "bicycle"
    assert captured_class_filter["class_filter"] == "bicycle"


def test_execute_command_rejects_invalid_parsed_class_before_execution(monkeypatch, tmp_path):
    image_path = tmp_path / "sample.jpg"
    image_path.write_bytes(b"fake-image")

    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)
    monkeypatch.setattr(
        main,
        "parse_command",
        lambda command: {
            "action": "crop_by_class",
            "class_name": "wallet",
        },
    )

    def fail_if_called(*args, **kwargs):
        raise AssertionError("Execution should not run for unsupported class")

    monkeypatch.setattr(main, "crop_best_object_by_class", fail_if_called)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.jpg",
            "command": "crop wallet",
            "confidence_threshold": 0.25,
        },
    )

    assert response.status_code == 400
    assert "Unsupported object class 'wallet'" in response.json()["detail"]
