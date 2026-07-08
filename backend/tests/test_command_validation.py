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


def test_validate_crop_by_class_normalizes_supported_alias():
    parsed = {
        "action": "crop_by_class",
        "class_name": "bike",
    }

    validated = validate_parsed_command(parsed)

    assert validated["class_name"] == "bicycle"


def test_validate_blur_by_class_rejects_unsupported_class():
    with pytest.raises(HTTPException) as error:
        validate_parsed_command({
            "action": "blur_by_class",
            "class_name": "wallet",
        })

    assert error.value.status_code == 400
    assert "Unsupported object class 'wallet'" in error.value.detail
    assert "current model cannot detect this class" in error.value.detail


def test_validate_track_video_normalizes_optional_class_name():
    parsed = {
        "action": "track_video",
        "class_name": "motorbike",
        "start_seconds": 0,
        "end_seconds": 3,
        "interval_seconds": 1,
    }

    validated = validate_parsed_command(parsed)

    assert validated["class_name"] == "motorcycle"


def test_validate_track_video_rejects_unsupported_optional_class_name():
    with pytest.raises(HTTPException) as error:
        validate_parsed_command({
            "action": "track_video",
            "class_name": "wallet",
            "start_seconds": 0,
            "end_seconds": 3,
            "interval_seconds": 1,
        })

    assert error.value.status_code == 400
    assert "Unsupported object class 'wallet'" in error.value.detail


def test_validate_blur_by_class_rejects_broad_category_with_specific_suggestions():
    with pytest.raises(HTTPException) as error:
        validate_parsed_command({
            "action": "blur_by_class",
            "class_name": "vehicles",
        })

    assert error.value.status_code == 400
    assert "'vehicles' is a broad object category" in error.value.detail
    assert "car" in error.value.detail
    assert "truck" in error.value.detail


def test_validate_blur_by_class_rejects_unsupported_class_with_future_guidance():
    with pytest.raises(HTTPException) as error:
        validate_parsed_command({
            "action": "blur_by_class",
            "class_name": "helmet",
        })

    assert error.value.status_code == 400
    assert "Unsupported object class 'helmet'" in error.value.detail
    assert "open-vocabulary detection model" in error.value.detail
