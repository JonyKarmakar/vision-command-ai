import json

from app import main
from app.schemas import CommandRequest


def test_log_command_execution_includes_parser_metadata(tmp_path, monkeypatch):
    test_log_file = tmp_path / "command_logs.jsonl"
    captured_database_entries = []

    monkeypatch.setattr(main, "LOG_DIR", tmp_path)
    monkeypatch.setattr(main, "COMMAND_LOG_FILE", test_log_file)
    monkeypatch.setattr(
        main,
        "save_command_log_to_database",
        lambda log_entry: captured_database_entries.append(log_entry) or True,
    )

    request = CommandRequest(
        filename="sample.jpg",
        command="detect objects",
        confidence_threshold=0.25,
        parser_mode="llm_mock",
    )

    parse_result = {
        "parser_type": "llm_mock",
        "parser_version": "mock-v1",
    }

    main.log_command_execution(
        request=request,
        parsed_command={
            "action": "detect",
            "class_name": None,
        },
        result_type="annotated_detection",
        parse_result=parse_result,
    )

    log_line = test_log_file.read_text(encoding="utf-8").strip()
    local_log = json.loads(log_line)

    assert local_log["parser_mode"] == "llm_mock"
    assert local_log["parser_type"] == "llm_mock"
    assert local_log["parser_version"] == "mock-v1"

    assert captured_database_entries[0]["parser_mode"] == "llm_mock"
    assert captured_database_entries[0]["parser_type"] == "llm_mock"
    assert captured_database_entries[0]["parser_version"] == "mock-v1"
