import sys


from app.services import database_service


class FakeCursor:
    def __init__(self, calls):
        self.calls = calls

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def execute(self, query, params=None):
        self.calls.append((query, params))


class FakeConnection:
    def __init__(self, calls):
        self.calls = calls
        self.committed = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def cursor(self):
        return FakeCursor(self.calls)

    def commit(self):
        self.committed = True


class FakePsycopg:
    def __init__(self, calls):
        self.calls = calls

    def connect(self, database_url):
        assert database_url == "postgresql://example/test"
        return FakeConnection(self.calls)


def test_save_generated_output_insert_uses_one_placeholder_group(monkeypatch):
    calls = []

    monkeypatch.setitem(sys.modules, "psycopg", FakePsycopg(calls))
    monkeypatch.setattr(
        database_service,
        "get_database_url",
        lambda: "postgresql://example/test",
    )
    monkeypatch.setattr(
        database_service,
        "initialize_generated_outputs_table",
        lambda: True,
    )

    payload = {
        "id": "output-1",
        "action": "crop",
        "label": "Cropped output",
        "filename": "crop_output.png",
        "file_url": "/media/outputs/crop_output.png",
        "source": "image",
        "source_filename": "uploaded.png",
        "created_by": "command",
        "command_text": "crop person",
        "result_type": "image",
        "execution_mode": "prepared_execution",
        "parser_mode": "rule_based",
        "parser_type": "deterministic",
        "planner_mode": "registry",
        "created_at": "2026-07-23T01:00:00Z",
    }

    result = database_service.save_generated_output_to_database(payload)

    assert result["status"] == "healthy"
    assert result["saved"] is True

    insert_calls = [
        (query, params)
        for query, params in calls
        if "INSERT INTO generated_outputs" in query
    ]

    assert len(insert_calls) == 1

    query, params = insert_calls[0]

    assert query.count("VALUES") == 1
    assert query.count("ON CONFLICT") == 1
    assert query.count("%s") == len(params) == 15

    assert "filename = EXCLUDED.filename" in query
    assert "file_url = EXCLUDED.file_url" in query
    assert "source = EXCLUDED.source" in query
    assert "created_by = EXCLUDED.created_by" in query
    assert "command_text = EXCLUDED.command_text" in query
