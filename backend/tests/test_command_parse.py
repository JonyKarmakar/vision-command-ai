from fastapi.testclient import TestClient

from app import main


client = TestClient(main.app)


def test_parse_detect_command():
    response = client.post(
        "/commands/parse",
        json={"command": "detect objects"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["command"] == "detect objects"
    assert data["parser_type"] == "rule_based"
    assert data["parsed_command"]["action"] == "detect"
    assert data["parsed_command"]["class_name"] is None


def test_parse_crop_command():
    response = client.post(
        "/commands/parse",
        json={"command": "crop person"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "crop_by_class"
    assert data["parsed_command"]["class_name"] == "person"


def test_parse_blur_all_command():
    response = client.post(
        "/commands/parse",
        json={"command": "blur all persons"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "blur_all_by_class"
    assert data["parsed_command"]["class_name"] == "person"


def test_parse_extract_frame_command():
    response = client.post(
        "/commands/parse",
        json={"command": "extract frame at 1 second"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "extract_frame"
    assert data["parsed_command"]["timestamp_seconds"] == 1


def test_parse_extract_frames_command():
    response = client.post(
        "/commands/parse",
        json={"command": "extract frames from 0 to 3 seconds"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "extract_frames"
    assert data["parsed_command"]["start_seconds"] == 0
    assert data["parsed_command"]["end_seconds"] == 3
    assert data["parsed_command"]["interval_seconds"] == 1.0


def test_parse_detect_frames_command():
    response = client.post(
        "/commands/parse",
        json={"command": "detect frames from 0 to 3 seconds"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "detect_frames"
    assert data["parsed_command"]["start_seconds"] == 0
    assert data["parsed_command"]["end_seconds"] == 3


def test_parse_track_video_command():
    response = client.post(
        "/commands/parse",
        json={"command": "track video from 0 to 3 seconds"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "track_video"
    assert data["parsed_command"]["class_name"] is None
    assert data["parsed_command"]["start_seconds"] == 0
    assert data["parsed_command"]["end_seconds"] == 3


def test_parse_track_class_command():
    response = client.post(
        "/commands/parse",
        json={"command": "track person from 0 to 3 seconds"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "track_video"
    assert data["parsed_command"]["class_name"] == "person"
    assert data["parsed_command"]["start_seconds"] == 0
    assert data["parsed_command"]["end_seconds"] == 3


def test_parse_trim_video_command():
    response = client.post(
        "/commands/parse",
        json={"command": "trim video from 0 to 2 seconds"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parsed_command"]["action"] == "trim_video"
    assert data["parsed_command"]["start_seconds"] == 0
    assert data["parsed_command"]["end_seconds"] == 2


def test_parse_unsupported_command_fails():
    response = client.post(
        "/commands/parse",
        json={"command": "make it beautiful"},
    )

    assert response.status_code == 400



def test_parse_command_with_explicit_rule_based_mode():
    response = client.post(
        "/commands/parse",
        json={
            "command": "crop person",
            "parser_mode": "rule_based",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parser_mode"] == "rule_based"
    assert data["parser_type"] == "rule_based"
    assert data["parser_version"] == "v1"
    assert data["parsed_command"]["action"] == "crop_by_class"
    assert data["parsed_command"]["class_name"] == "person"


def test_parse_command_rejects_unsupported_parser_mode():
    response = client.post(
        "/commands/parse",
        json={
            "command": "crop person",
            "parser_mode": "llm",
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Supported parser modes are: rule_based, llm_mock, real_llm"
    }



def test_parse_command_with_llm_mock_mode():
    response = client.post(
        "/commands/parse",
        json={
            "command": "crop person",
            "parser_mode": "llm_mock",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["parser_mode"] == "llm_mock"
    assert data["parser_type"] == "llm_mock"
    assert data["parser_version"] == "mock-v1"
    assert data["parsed_command"]["action"] == "crop_by_class"
    assert data["parsed_command"]["class_name"] == "person"



def test_parse_command_with_real_llm_mode_not_implemented():
    response = client.post(
        "/commands/parse",
        json={
            "command": "crop person",
            "parser_mode": "real_llm",
        },
    )

    assert response.status_code == 501
    assert "not implemented yet" in response.json()["detail"]
