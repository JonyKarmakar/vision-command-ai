from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_execute_command_uses_requested_parser_mode(monkeypatch, tmp_path):
    image_path = tmp_path / "sample.jpg"
    image_path.write_bytes(b"fake-image")

    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)

    captured_parser_mode = {}

    def fake_parse_command_with_mode(command: str, parser_mode: str):
        captured_parser_mode["parser_mode"] = parser_mode

        return {
            "parser_type": parser_mode,
            "parser_version": "test",
            "parsed_command": {
                "action": "detect",
                "class_name": None,
            },
        }

    def fake_detect_objects_with_annotation(
        filename: str,
        confidence_threshold: float,
        class_filter,
    ):
        return {
            "filename": filename,
            "confidence_threshold": confidence_threshold,
            "class_filter": class_filter,
            "detections": [],
            "detection_count": 0,
            "annotated_filename": "annotated.jpg",
            "annotated_file_url": "/media/outputs/annotated.jpg",
        }

    monkeypatch.setattr(main, "parse_command_with_mode", fake_parse_command_with_mode)
    monkeypatch.setattr(main, "detect_objects_with_annotation", fake_detect_objects_with_annotation)
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

    assert captured_parser_mode["parser_mode"] == "llm_mock"
    assert data["parsed_command"]["action"] == "detect"
