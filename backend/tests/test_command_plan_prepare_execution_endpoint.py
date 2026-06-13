from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_prepare_execution_ready_for_blur_all_by_class_plan():
    response = client.post(
        "/commands/plan/prepare-execution",
        json={
            "plan": {
                "media_type": "image",
                "action": "blur_all_by_class",
                "target_class": "person",
                "target_scope": "all",
                "requires_detection": True,
                "requires_tracking": False,
                "parameters": {},
                "confidence": 0.9,
                "needs_clarification": False,
                "clarification_question": None,
            }
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "ready"
    assert data["executable"] is True
    assert data["prepared_command"] == {
        "action": "blur_all_by_class",
        "class_name": "person",
    }
    assert data["warnings"] == []


def test_prepare_execution_blocks_clarification_plan():
    response = client.post(
        "/commands/plan/prepare-execution",
        json={
            "plan": {
                "media_type": "unknown",
                "action": "unknown",
                "target_class": None,
                "target_scope": "unknown",
                "requires_detection": False,
                "requires_tracking": False,
                "parameters": {},
                "confidence": 0.1,
                "needs_clarification": True,
                "clarification_question": "What would you like me to do?",
            }
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "blocked"
    assert data["executable"] is False
    assert data["prepared_command"] is None
    assert data["warnings"] == ["What would you like me to do?"]


def test_prepare_execution_blocks_missing_target_class():
    response = client.post(
        "/commands/plan/prepare-execution",
        json={
            "plan": {
                "media_type": "image",
                "action": "crop_by_class",
                "target_class": None,
                "target_scope": "largest",
                "requires_detection": True,
                "requires_tracking": False,
                "parameters": {},
                "confidence": 0.5,
                "needs_clarification": False,
                "clarification_question": None,
            }
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "blocked"
    assert data["executable"] is False
    assert data["prepared_command"] is None
    assert data["warnings"] == ["crop_by_class requires target_class before execution."]


def test_prepare_execution_maps_track_to_track_video_when_temporal_parameters_exist():
    response = client.post(
        "/commands/plan/prepare-execution",
        json={
            "plan": {
                "media_type": "video",
                "action": "track",
                "target_class": "person",
                "target_scope": "all",
                "requires_detection": True,
                "requires_tracking": True,
                "parameters": {
                    "start_seconds": 0,
                    "end_seconds": 3,
                    "interval_seconds": 1,
                },
                "confidence": 0.8,
                "needs_clarification": False,
                "clarification_question": None,
            }
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "ready"
    assert data["executable"] is True
    assert data["prepared_command"] == {
        "action": "track_video",
        "start_seconds": 0,
        "end_seconds": 3,
        "interval_seconds": 1,
        "class_name": "person",
    }
    assert data["warnings"] == []
