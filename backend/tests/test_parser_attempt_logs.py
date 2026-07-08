import json

from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_parse_command_logs_success(tmp_path, monkeypatch):
    test_log_dir = tmp_path / "logs"
    test_parser_log_file = test_log_dir / "parser_attempt_logs.jsonl"

    monkeypatch.setattr(main, "LOG_DIR", test_log_dir)
    monkeypatch.setattr(main, "PARSER_LOG_FILE", test_parser_log_file)

    response = client.post(
        "/commands/parse",
        json={
            "command": "crop person",
            "parser_mode": "rule_based",
        },
    )

    assert response.status_code == 200
    assert test_parser_log_file.exists()

    log_entry = json.loads(test_parser_log_file.read_text().strip())

    assert log_entry["command"] == "crop person"
    assert log_entry["parser_mode"] == "rule_based"
    assert log_entry["parser_type"] == "rule_based"
    assert log_entry["parser_version"] == "v1"
    assert log_entry["success"] is True
    assert log_entry["parsed_command"]["action"] == "crop_by_class"
    assert log_entry["error"] is None
    assert log_entry["latency_ms"] >= 0


def test_parse_command_logs_failure(tmp_path, monkeypatch):
    test_log_dir = tmp_path / "logs"
    test_parser_log_file = test_log_dir / "parser_attempt_logs.jsonl"

    monkeypatch.setattr(main, "LOG_DIR", test_log_dir)
    monkeypatch.setattr(main, "PARSER_LOG_FILE", test_parser_log_file)

    response = client.post(
        "/commands/parse",
        json={
            "command": "make it beautiful",
            "parser_mode": "rule_based",
        },
    )

    assert response.status_code == 400
    assert test_parser_log_file.exists()

    log_entry = json.loads(test_parser_log_file.read_text().strip())

    assert log_entry["command"] == "make it beautiful"
    assert log_entry["parser_mode"] == "rule_based"
    assert log_entry["success"] is False
    assert log_entry["parsed_command"] is None
    assert "I could not map this command to a supported VisionCommand action yet" in log_entry["error"]
    assert log_entry["latency_ms"] >= 0


def test_get_parser_attempt_logs_empty(tmp_path, monkeypatch):
    test_log_dir = tmp_path / "logs"
    test_parser_log_file = test_log_dir / "parser_attempt_logs.jsonl"

    monkeypatch.setattr(main, "LOG_DIR", test_log_dir)
    monkeypatch.setattr(main, "PARSER_LOG_FILE", test_parser_log_file)

    response = client.get("/commands/parse/logs")

    assert response.status_code == 200
    assert response.json() == {
        "count": 0,
        "logs": [],
    }


def test_get_parser_attempt_logs_success(tmp_path, monkeypatch):
    test_log_dir = tmp_path / "logs"
    test_parser_log_file = test_log_dir / "parser_attempt_logs.jsonl"

    test_log_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(main, "LOG_DIR", test_log_dir)
    monkeypatch.setattr(main, "PARSER_LOG_FILE", test_parser_log_file)

    entries = [
        {
            "timestamp": "2026-01-01T10:00:00+00:00",
            "command": "crop person",
            "parser_mode": "rule_based",
            "parser_type": "rule_based",
            "parser_version": "v1",
            "success": True,
            "latency_ms": 1.25,
            "parsed_command": {
                "action": "crop_by_class",
                "class_name": "person",
            },
            "error": None,
        }
    ]

    with test_parser_log_file.open("w", encoding="utf-8") as log_file:
        for entry in entries:
            log_file.write(json.dumps(entry) + "\n")

    response = client.get("/commands/parse/logs")

    assert response.status_code == 200

    data = response.json()
    assert data["count"] == 1
    assert data["logs"][0]["command"] == "crop person"
    assert data["logs"][0]["success"] is True
