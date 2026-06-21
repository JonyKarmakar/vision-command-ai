from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_database_generated_outputs_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/generated-outputs")

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "count": 0,
        "generated_outputs": [],
    }


def test_save_database_generated_output_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    payload = {
        "id": "zoom-output-1",
        "action": "zoom",
        "label": "Zoomed person",
        "filename": "zoomed_person.jpg",
        "file_url": "/media/outputs/zoomed_person.jpg",
        "source": "uploads",
        "source_filename": "input.jpg",
        "created_by": "Run Command",
        "command_text": "zoom into the person",
        "result_type": "zoom_by_class",
        "execution_mode": "run_command",
        "parser_mode": "rule_based",
        "parser_type": "rule_based",
        "planner_mode": "rule_based",
        "created_at": "2026-06-20T12:00:00.000Z",
    }

    response = client.post("/db/generated-outputs", json=payload)

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "saved": False,
        "generated_output": payload,
    }


def test_clear_database_generated_outputs_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.delete("/db/generated-outputs")

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "deleted_count": 0,
    }


def test_delete_database_generated_output_not_configured(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.delete("/db/generated-outputs/zoom-output-1")

    assert response.status_code == 200
    assert response.json() == {
        "status": "not_configured",
        "deleted": False,
        "id": "zoom-output-1",
    }
