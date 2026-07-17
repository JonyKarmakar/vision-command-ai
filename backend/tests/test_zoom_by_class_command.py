from fastapi.testclient import TestClient
from PIL import Image

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

    assert result["status"] == "ready"
    assert result["executable"] is True
    assert result["prepared_command"] == {
        "action": "zoom_by_class",
        "class_name": "person",
        "target_scope": "single",
    }
    assert result["warnings"] == []
    assert result["command_skill"]["id"] == "zoom_by_class"
    assert result["command_skill"]["execution_status"] == "implemented_command"

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

    assert result["status"] == "blocked"
    assert result["executable"] is False
    assert result["prepared_command"] is None
    assert result["warnings"] == ["zoom requires target_class before execution."]
    assert result["command_skill"]["id"] == "zoom_by_class"
    assert result["command_skill"]["execution_status"] == "implemented_command"


def test_execute_prepared_zoom_by_class_success(monkeypatch):
    def fake_zoom_best_object_by_class(filename, request):
        assert filename == "sample.jpg"
        assert request.class_name == "person"
        assert request.confidence_threshold == 0.3
        assert request.target_scope == "single"

        return {
            "filename": filename,
            "class_name": request.class_name,
            "confidence_threshold": request.confidence_threshold,
            "padding_ratio": request.padding_ratio,
            "zoom_factor": request.zoom_factor,
            "target_scope": request.target_scope,
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
                "target_scope": "single",
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
        "target_scope": "single",
    }
    assert data["result_type"] == "zoom_by_class"
    assert data["result"]["zoomed_file_url"] == "/media/outputs/zoom_person_sample.jpg"


def test_zoom_by_class_preserves_output_aspect_ratio(monkeypatch):
    filename = "zoom_quality_test.jpg"
    image_path = main.UPLOAD_DIR / filename

    Image.new("RGB", (400, 300), color="white").save(image_path)

    def fake_run_yolo_detection(image_path, confidence_threshold, class_filter):
        assert confidence_threshold == 0.25
        assert class_filter == "person"

        return [
            {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.95,
                "bbox": {
                    "x1": 150,
                    "y1": 50,
                    "x2": 230,
                    "y2": 250,
                },
            }
        ]

    monkeypatch.setattr(main, "run_yolo_detection", fake_run_yolo_detection)

    response = client.post(
        f"/vision/zoom-by-class/{filename}",
        json={
            "class_name": "person",
            "confidence_threshold": 0.25,
            "padding_ratio": 0.1,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["output_size"] == {
        "width": 400,
        "height": 300,
    }

    zoom_box = data["zoom_box"]
    zoom_width = zoom_box["x2"] - zoom_box["x1"]
    zoom_height = zoom_box["y2"] - zoom_box["y1"]

    assert round(zoom_width / zoom_height, 2) == round(400 / 300, 2)

    zoomed_path = main.OUTPUT_DIR / data["zoomed_filename"]
    with Image.open(zoomed_path) as zoomed_image:
        assert zoomed_image.size == (400, 300)

    image_path.unlink(missing_ok=True)
    zoomed_path.unlink(missing_ok=True)


def test_zoom_by_class_uses_zoom_factor_for_stronger_crop(monkeypatch):
    filename = "zoom_strength_test.jpg"
    image_path = main.UPLOAD_DIR / filename

    Image.new("RGB", (400, 300), color="white").save(image_path)

    def fake_run_yolo_detection(image_path, confidence_threshold, class_filter):
        return [
            {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.95,
                "bbox": {
                    "x1": 120,
                    "y1": 80,
                    "x2": 220,
                    "y2": 180,
                },
            }
        ]

    monkeypatch.setattr(main, "run_yolo_detection", fake_run_yolo_detection)

    response = client.post(
        f"/vision/zoom-by-class/{filename}",
        json={
            "class_name": "person",
            "confidence_threshold": 0.25,
            "padding_ratio": 0.1,
            "zoom_factor": 2.0,
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["zoom_factor"] == 2.0

    zoom_box = data["zoom_box"]
    zoom_width = zoom_box["x2"] - zoom_box["x1"]
    zoom_height = zoom_box["y2"] - zoom_box["y1"]

    assert zoom_width < 400
    assert zoom_height < 300
    assert round(zoom_width / zoom_height, 2) == round(400 / 300, 2)

    zoomed_path = main.OUTPUT_DIR / data["zoomed_filename"]
    with Image.open(zoomed_path) as zoomed_image:
        assert zoomed_image.size == (400, 300)

    image_path.unlink(missing_ok=True)
    zoomed_path.unlink(missing_ok=True)


def test_zoom_by_class_rejects_invalid_zoom_factor():
    filename = "zoom_invalid_factor_test.jpg"
    image_path = main.UPLOAD_DIR / filename

    Image.new("RGB", (400, 300), color="white").save(image_path)

    response = client.post(
        f"/vision/zoom-by-class/{filename}",
        json={
            "class_name": "person",
            "confidence_threshold": 0.25,
            "padding_ratio": 0.1,
            "zoom_factor": 0.5,
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "zoom_factor must be greater than or equal to 1"
    }

    image_path.unlink(missing_ok=True)



def test_validate_zoom_by_class_preserves_target_scope():
    validated = validate_parsed_command({
        "action": "zoom_by_class",
        "class_name": "person",
        "target_scope": "CENTER",
    })

    assert validated == {
        "action": "zoom_by_class",
        "class_name": "person",
        "target_scope": "center",
    }


def test_prepare_zoom_plan_preserves_target_scope():
    result = prepare_command_plan_for_execution(
        CommandPlan(
            media_type="image",
            action="zoom",
            target_class="person",
            target_scope="center",
            requires_detection=True,
            requires_tracking=False,
            parameters={},
            confidence=0.9,
            needs_clarification=False,
            clarification_question=None,
        )
    )

    assert result["prepared_command"] == {
        "action": "zoom_by_class",
        "class_name": "person",
        "target_scope": "center",
    }


def test_zoom_by_class_selects_center_target_scope(monkeypatch):
    filename = "zoom_center_scope_test.jpg"
    image_path = main.UPLOAD_DIR / filename

    Image.new("RGB", (400, 300), color="white").save(image_path)

    def fake_run_yolo_detection(image_path, confidence_threshold, class_filter):
        return [
            {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.99,
                "bbox": {"x1": 10, "y1": 80, "x2": 70, "y2": 180},
            },
            {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.80,
                "bbox": {"x1": 170, "y1": 80, "x2": 230, "y2": 180},
            },
            {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.95,
                "bbox": {"x1": 320, "y1": 80, "x2": 380, "y2": 180},
            },
        ]

    monkeypatch.setattr(main, "run_yolo_detection", fake_run_yolo_detection)

    response = client.post(
        f"/vision/zoom-by-class/{filename}",
        json={
            "class_name": "person",
            "target_scope": "center",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["target_scope"] == "center"
    assert data["selected_detection"]["bbox"] == {
        "x1": 170,
        "y1": 80,
        "x2": 230,
        "y2": 180,
    }

    zoomed_path = main.OUTPUT_DIR / data["zoomed_filename"]
    image_path.unlink(missing_ok=True)
    zoomed_path.unlink(missing_ok=True)


def test_zoom_by_class_selects_left_and_right_target_scope(monkeypatch):
    filename = "zoom_left_right_scope_test.jpg"
    image_path = main.UPLOAD_DIR / filename

    Image.new("RGB", (400, 300), color="white").save(image_path)

    def fake_run_yolo_detection(image_path, confidence_threshold, class_filter):
        return [
            {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.70,
                "bbox": {"x1": 20, "y1": 80, "x2": 80, "y2": 180},
            },
            {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.99,
                "bbox": {"x1": 300, "y1": 80, "x2": 360, "y2": 180},
            },
        ]

    monkeypatch.setattr(main, "run_yolo_detection", fake_run_yolo_detection)

    left_response = client.post(
        f"/vision/zoom-by-class/{filename}",
        json={"class_name": "person", "target_scope": "left"},
    )

    assert left_response.status_code == 200
    left_data = left_response.json()
    assert left_data["selected_detection"]["bbox"] == {
        "x1": 20,
        "y1": 80,
        "x2": 80,
        "y2": 180,
    }

    right_response = client.post(
        f"/vision/zoom-by-class/{filename}",
        json={"class_name": "person", "target_scope": "right"},
    )

    assert right_response.status_code == 200
    right_data = right_response.json()
    assert right_data["selected_detection"]["bbox"] == {
        "x1": 300,
        "y1": 80,
        "x2": 360,
        "y2": 180,
    }

    image_path.unlink(missing_ok=True)
    (main.OUTPUT_DIR / left_data["zoomed_filename"]).unlink(missing_ok=True)
    (main.OUTPUT_DIR / right_data["zoomed_filename"]).unlink(missing_ok=True)
