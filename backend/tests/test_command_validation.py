import pytest
from fastapi import HTTPException

from app.services.command_validation import validate_parsed_command


def test_validate_detect_command():
    parsed = {
        "action": "detect",
        "class_name": None,
    }

    assert validate_parsed_command(parsed) == parsed


def test_validate_crop_by_class_command():
    parsed = {
        "action": "crop_by_class",
        "class_name": "person",
    }

    assert validate_parsed_command(parsed) == parsed


def test_validate_crop_by_class_requires_class_name():
    with pytest.raises(HTTPException) as error:
        validate_parsed_command({
            "action": "crop_by_class",
        })

    assert error.value.status_code == 400
    assert "class_name" in error.value.detail


def test_validate_extract_frame_requires_timestamp():
    with pytest.raises(HTTPException) as error:
        validate_parsed_command({
            "action": "extract_frame",
        })

    assert error.value.status_code == 400
    assert "timestamp_seconds" in error.value.detail


def test_validate_video_range_command():
    parsed = {
        "action": "detect_frames",
        "class_name": None,
        "start_seconds": 0,
        "end_seconds": 3,
        "interval_seconds": 1,
    }

    assert validate_parsed_command(parsed) == parsed


def test_validate_video_range_rejects_invalid_range():
    with pytest.raises(HTTPException) as error:
        validate_parsed_command({
            "action": "trim_video",
            "class_name": None,
            "start_seconds": 3,
            "end_seconds": 0,
        })

    assert error.value.status_code == 400
    assert "end_seconds" in error.value.detail


def test_validate_multiframe_requires_positive_interval():
    with pytest.raises(HTTPException) as error:
        validate_parsed_command({
            "action": "extract_frames",
            "class_name": None,
            "start_seconds": 0,
            "end_seconds": 3,
            "interval_seconds": 0,
        })

    assert error.value.status_code == 400
    assert "interval_seconds" in error.value.detail


def test_validate_rejects_unsupported_action():
    with pytest.raises(HTTPException) as error:
        validate_parsed_command({
            "action": "make_beautiful",
        })

    assert error.value.status_code == 400
    assert "Unsupported parsed action" in error.value.detail
