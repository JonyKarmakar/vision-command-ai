from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_generated_output_workflows_fallback_without_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/generated-outputs/workflows")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "not_configured"
    assert payload["count"] == 0
    assert payload["workflows"] == []


def test_generated_outputs_by_source_fallback_without_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/generated-outputs/source/uploaded-image.png")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "not_configured"
    assert payload["source_filename"] == "uploaded-image.png"
    assert payload["count"] == 0
    assert payload["generated_outputs"] == []


def test_generated_output_lineage_fallback_without_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    response = client.get("/db/generated-outputs/output-123/lineage")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "not_configured"
    assert payload["output_id"] == "output-123"
    assert payload["found"] is False
    assert payload["generated_output"] is None
    assert payload["ancestors"] == []
    assert payload["descendants"] == []
    assert payload["lineage"] == []
    assert payload["lineage_depth"] == 0
    assert payload["root_source_filename"] is None


def _sample_generated_outputs():
    return [
        {
            "id": "output-1",
            "action": "zoom",
            "label": "Zoom person",
            "filename": "zoom-person.png",
            "file_url": "/media/outputs/zoom-person.png",
            "source": "uploads",
            "source_filename": "uploaded-image.png",
            "created_by": "Run Command",
            "command_text": "zoom into the person",
            "result_type": "zoom_by_class",
            "execution_mode": "run_command",
            "parser_mode": "rule_based",
            "parser_type": "rule_based",
            "planner_mode": "rule_based",
            "created_at": "2026-06-23T10:00:00",
        },
        {
            "id": "output-2",
            "action": "crop",
            "label": "Crop person",
            "filename": "crop-person.png",
            "file_url": "/media/outputs/crop-person.png",
            "source": "outputs",
            "source_filename": "zoom-person.png",
            "created_by": "Generated Output",
            "command_text": "crop this object",
            "result_type": "crop_object",
            "execution_mode": "generated_output_action",
            "parser_mode": None,
            "parser_type": None,
            "planner_mode": None,
            "created_at": "2026-06-23T10:05:00",
        },
        {
            "id": "output-3",
            "action": "blur",
            "label": "Blur crop",
            "filename": "blur-crop.png",
            "file_url": "/media/outputs/blur-crop.png",
            "source": "outputs",
            "source_filename": "crop-person.png",
            "created_by": "Generated Output",
            "command_text": "blur this object",
            "result_type": "blur_object",
            "execution_mode": "generated_output_action",
            "parser_mode": None,
            "parser_type": None,
            "planner_mode": None,
            "created_at": "2026-06-23T10:10:00",
        },
    ]


def test_generated_output_workflows_groups_outputs_by_root_source(monkeypatch):
    from app.services import database_service

    monkeypatch.setattr(database_service, "get_database_url", lambda: "postgresql://test")
    monkeypatch.setattr(
        database_service,
        "_get_all_generated_output_items",
        lambda limit=500: _sample_generated_outputs(),
    )

    payload = database_service.get_database_generated_output_workflows()

    assert payload["status"] == "healthy"
    assert payload["count"] == 1

    workflow = payload["workflows"][0]
    assert workflow["workflow_source_filename"] == "uploaded-image.png"
    assert workflow["output_count"] == 3
    assert workflow["actions"] == ["zoom", "crop", "blur"]
    assert workflow["first_created_at"] == "2026-06-23T10:00:00"
    assert workflow["latest_created_at"] == "2026-06-23T10:10:00"
    assert [output["id"] for output in workflow["outputs"]] == [
        "output-1",
        "output-2",
        "output-3",
    ]


def test_generated_output_lineage_returns_ancestors_target_and_descendants(monkeypatch):
    from app.services import database_service

    monkeypatch.setattr(database_service, "get_database_url", lambda: "postgresql://test")
    monkeypatch.setattr(
        database_service,
        "_get_all_generated_output_items",
        lambda limit=500: _sample_generated_outputs(),
    )

    payload = database_service.get_database_generated_output_lineage("output-2")

    assert payload["status"] == "healthy"
    assert payload["found"] is True
    assert payload["output_id"] == "output-2"
    assert payload["generated_output"]["id"] == "output-2"
    assert [ancestor["id"] for ancestor in payload["ancestors"]] == ["output-1"]
    assert [descendant["id"] for descendant in payload["descendants"]] == ["output-3"]
    assert [item["id"] for item in payload["lineage"]] == [
        "output-1",
        "output-2",
        "output-3",
    ]
    assert payload["lineage_depth"] == 1
    assert payload["root_source_filename"] == "uploaded-image.png"


def test_generated_output_lineage_returns_not_found_for_unknown_output(monkeypatch):
    from app.services import database_service

    monkeypatch.setattr(database_service, "get_database_url", lambda: "postgresql://test")
    monkeypatch.setattr(
        database_service,
        "_get_all_generated_output_items",
        lambda limit=500: _sample_generated_outputs(),
    )

    payload = database_service.get_database_generated_output_lineage("missing-output")

    assert payload["status"] == "healthy"
    assert payload["found"] is False
    assert payload["generated_output"] is None
    assert payload["ancestors"] == []
    assert payload["descendants"] == []
    assert payload["lineage"] == []
    assert payload["lineage_depth"] == 0
    assert payload["root_source_filename"] is None
