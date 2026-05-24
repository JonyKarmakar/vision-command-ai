from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_validate_parsed_command_endpoint_success():
    response = client.post(
        "/commands/validate-parsed",
        json={
            "parsed_command": {
                "action": "crop_by_class",
                "class_name": "person",
            }
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "valid"
    assert data["validated_command"]["action"] == "crop_by_class"
    assert data["validated_command"]["class_name"] == "person"


def test_validate_parsed_command_endpoint_video_success():
    response = client.post(
        "/commands/validate-parsed",
        json={
            "parsed_command": {
                "action": "detect_frames",
                "class_name": None,
                "start_seconds": 0,
                "end_seconds": 3,
                "interval_seconds": 1,
            }
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "valid"
    assert data["validated_command"]["action"] == "detect_frames"
    assert data["validated_command"]["start_seconds"] == 0
    assert data["validated_command"]["end_seconds"] == 3
    assert data["validated_command"]["interval_seconds"] == 1


def test_validate_parsed_command_endpoint_rejects_missing_required_field():
    response = client.post(
        "/commands/validate-parsed",
        json={
            "parsed_command": {
                "action": "crop_by_class"
            }
        },
    )

    assert response.status_code == 400
    assert "class_name" in response.json()["detail"]


def test_validate_parsed_command_endpoint_rejects_unsupported_action():
    response = client.post(
        "/commands/validate-parsed",
        json={
            "parsed_command": {
                "action": "make_beautiful"
            }
        },
    )

    assert response.status_code == 400
    assert "Unsupported parsed action" in response.json()["detail"]


def test_validate_parsed_command_endpoint_normalizes_class_alias():
    response = client.post(
        "/commands/validate-parsed",
        json={
            "parsed_command": {
                "action": "crop_by_class",
                "class_name": "bike",
            }
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["validated_command"]["class_name"] == "bicycle"


def test_validate_parsed_command_endpoint_rejects_unsupported_class():
    response = client.post(
        "/commands/validate-parsed",
        json={
            "parsed_command": {
                "action": "crop_by_class",
                "class_name": "wallet",
            }
        },
    )

    assert response.status_code == 400
    assert "Unsupported object class 'wallet'" in response.json()["detail"]
