from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_execute_command_response_includes_parser_metadata(monkeypatch, tmp_path):
    image_path = tmp_path / "sample.jpg"
    image_path.write_bytes(b"fake-image")

    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)

    monkeypatch.setattr(
        main,
        "parse_command_with_mode",
        lambda command, parser_mode: {
            "parser_type": "mock_parser",
            "parser_version": "mock-v1",
            "parsed_command": {
                "action": "detect",
                "class_name": None,
            },
        },
    )

    monkeypatch.setattr(
        main,
        "detect_objects_with_annotation",
        lambda filename, confidence_threshold, class_filter: {
            "filename": filename,
            "confidence_threshold": confidence_threshold,
            "class_filter": class_filter,
            "detections": [],
            "detection_count": 0,
            "annotated_filename": "annotated.jpg",
            "annotated_file_url": "/media/outputs/annotated.jpg",
        },
    )

    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute",
        json={
            "filename": "sample.jpg",
            "command": "detect objects",
            "confidence_threshold": 0.25,
            "parser_mode": "llm_mock",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["command"] == "detect objects"
    assert data["parser_mode"] == "llm_mock"
    assert data["parser_type"] == "mock_parser"
    assert data["parser_version"] == "mock-v1"
    assert data["parsed_command"]["action"] == "detect"
    assert data["result_type"] == "annotated_detection"
