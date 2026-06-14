from fastapi.testclient import TestClient

import app.main as main
from app.main import app
from app.schemas import CommandPlan
from app.services.command_plan_execution import prepare_command_plan_for_execution
from app.services.command_validation import validate_parsed_command


client = TestClient(app)


def test_validate_zoom_by_class_requires_class_name():
    response = client.post(
        "/commands/validate-parsed",
        json={
            "parsed_command": {
                "action": "zoom_by_class",
            },
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Parsed command is missing required field: class_name"
    }


def test_validate_zoom_by_class_normalizes_supported_alias():
    validated = validate_parsed_command({
        "action": "zoom_by_class",
        "class_name": "people",
    })

    assert validated == {
        "action": "zoom_by_class",
        "class_name": "person",
    }


def test_prepare_zoom_plan_returns_executable_zoom_by_class():
    result = prepare_command_plan_for_execution(
        CommandPlan(
            media_type="image",
            action="zoom",
            target_class="person",
            target_scope="single",
            requires_detection=True,
            requires_tracking=False,
            parameters={},
            confidence=0.9,
            needs_clarification=False,
            clarification_question=None,
        )
    )

    assert result == {
        "status": "ready",
        "executable": True,
        "prepared_command": {
            "action": "zoom_by_class",
            "class_name": "person",
        },
        "warnings": [],
    }


def test_prepare_zoom_plan_blocks_without_target_class():
    result = prepare_command_plan_for_execution(
        CommandPlan(
            media_type="image",
            action="zoom",
            target_class=None,
            target_scope="unknown",
            requires_detection=True,
            requires_tracking=False,
            parameters={},
            confidence=0.6,
            needs_clarification=False,
            clarification_question=None,
        )
    )

    assert result == {
        "status": "blocked",
        "executable": False,
        "prepared_command": None,
        "warnings": ["zoom requires target_class before execution."],
    }


def test_execute_prepared_zoom_by_class_success(monkeypatch):
    def fake_zoom_best_object_by_class(filename, request):
        assert filename == "sample.jpg"
        assert request.class_name == "person"
        assert request.confidence_threshold == 0.3

        return {
            "filename": filename,
            "class_name": request.class_name,
            "confidence_threshold": request.confidence_threshold,
            "padding_ratio": request.padding_ratio,
            "selected_detection": {
                "class_name": request.class_name,
                "confidence": 0.91,
                "bbox": {
                    "x1": 10,
                    "y1": 20,
                    "x2": 100,
                    "y2": 180,
                },
            },
            "zoomed_filename": "zoom_person_sample.jpg",
            "zoomed_file_url": "/media/outputs/zoom_person_sample.jpg",
            "zoom_box": {
                "x1": 0,
                "y1": 0,
                "x2": 120,
                "y2": 200,
            },
            "output_size": {
                "width": 300,
                "height": 300,
            },
        }

    monkeypatch.setattr(main, "zoom_best_object_by_class", fake_zoom_best_object_by_class)
    monkeypatch.setattr(main, "log_command_execution", lambda *args, **kwargs: None)

    response = client.post(
        "/commands/execute-prepared",
        json={
            "filename": "sample.jpg",
            "command": "zoom into the person",
            "confidence_threshold": 0.3,
            "prepared_command": {
                "action": "zoom_by_class",
                "class_name": "person",
            },
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["command"] == "zoom into the person"
    assert data["parser_mode"] == "prepared"
    assert data["parser_type"] == "prepared_command"
    assert data["parser_version"] == "prepared-command-v1"
    assert data["parsed_command"] == {
        "action": "zoom_by_class",
        "class_name": "person",
    }
    assert data["result_type"] == "zoom_by_class"
    assert data["result"]["zoomed_file_url"] == "/media/outputs/zoom_person_sample.jpg"
