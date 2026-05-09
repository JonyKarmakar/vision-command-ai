import json

from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_get_command_logs_empty(tmp_path, monkeypatch):
    test_log_dir = tmp_path / "logs"
    test_log_file = test_log_dir / "command_logs.jsonl"

    monkeypatch.setattr(main, "LOG_DIR", test_log_dir)
    monkeypatch.setattr(main, "COMMAND_LOG_FILE", test_log_file)

    response = client.get("/commands/logs")

    assert response.status_code == 200
    assert response.json() == {
        "count": 0,
        "logs": [],
    }


def test_get_command_logs_success(tmp_path, monkeypatch):
    test_log_dir = tmp_path / "logs"
    test_log_file = test_log_dir / "command_logs.jsonl"

    test_log_dir.mkdir(parents=True, exist_ok=True)

    log_entries = [
        {
            "timestamp": "2026-01-01T10:00:00+00:00",
            "filename": "image-one.png",
            "command": "detect objects",
            "confidence_threshold": 0.3,
            "parsed_action": "detect",
            "parsed_class": None,
            "result_type": "annotated_detection",
        },
        {
            "timestamp": "2026-01-01T10:05:00+00:00",
            "filename": "image-two.png",
            "command": "crop person",
            "confidence_threshold": 0.3,
            "parsed_action": "crop_by_class",
            "parsed_class": "person",
            "result_type": "crop_by_class",
        },
    ]

    with test_log_file.open("w", encoding="utf-8") as log_file:
        for entry in log_entries:
            log_file.write(json.dumps(entry) + "\n")

    response = client.get("/commands/logs?limit=1")

    assert response.status_code == 200

    data = response.json()
    assert data["count"] == 1
    assert data["logs"][0]["command"] == "crop person"
    assert data["logs"][0]["parsed_class"] == "person"
    assert data["logs"][0]["result_type"] == "crop_by_class"
