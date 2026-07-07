import pytest
from fastapi import HTTPException

from app.services.command_parser import (
    normalize_requested_class_name,
    normalize_supported_requested_class_name,
    parse_command,
)


def test_normalize_requested_class_name_uses_model_aliases():
    assert normalize_requested_class_name("people") == "person"
    assert normalize_requested_class_name("bike") == "bicycle"
    assert normalize_requested_class_name("motorbike") == "motorcycle"
    assert normalize_requested_class_name("phone") == "cell phone"
    assert normalize_requested_class_name("sofa") == "couch"
    assert normalize_requested_class_name("television") == "tv"


def test_normalize_supported_requested_class_name_accepts_supported_alias():
    assert normalize_supported_requested_class_name("bike") == "bicycle"
    assert normalize_supported_requested_class_name("phone") == "cell phone"


def test_normalize_supported_requested_class_name_rejects_unsupported_class():
    with pytest.raises(HTTPException) as error:
        normalize_supported_requested_class_name("wallet")

    assert error.value.status_code == 400
    assert "Unsupported object class 'wallet'" in error.value.detail
    assert "current model cannot detect this class" in error.value.detail


def test_crop_command_uses_supported_class_alias():
    assert parse_command("crop bike") == {
        "action": "crop_by_class",
        "class_name": "bicycle",
    }


def test_blur_command_uses_supported_class_alias():
    assert parse_command("blur phone") == {
        "action": "blur_by_class",
        "class_name": "cell phone",
    }


def test_track_command_uses_supported_class_alias():
    assert parse_command("track motorbike from 0 to 3 seconds") == {
        "action": "track_video",
        "class_name": "motorcycle",
        "start_seconds": 0.0,
        "end_seconds": 3.0,
        "interval_seconds": 1.0,
    }


def test_crop_command_rejects_unsupported_class():
    with pytest.raises(HTTPException) as error:
        parse_command("crop wallet")

    assert error.value.status_code == 400
    assert "Unsupported object class 'wallet'" in error.value.detail


def test_crop_command_accepts_people_alias():
    assert parse_command("crop people") == {
        "action": "crop_by_class",
        "class_name": "person",
    }


def test_blur_command_accepts_children_alias():
    assert parse_command("blur children") == {
        "action": "blur_by_class",
        "class_name": "person",
    }


def test_crop_command_rejects_broad_vehicle_category_with_specific_suggestions():
    with pytest.raises(HTTPException) as error:
        parse_command("crop vehicles")

    assert error.value.status_code == 400
    assert "'vehicles' is a broad object category" in error.value.detail
    assert "car" in error.value.detail
    assert "truck" in error.value.detail
    assert "motorcycle" in error.value.detail


def test_blur_command_rejects_arbitrary_unsupported_object_with_future_guidance():
    with pytest.raises(HTTPException) as error:
        parse_command("blur helmet")

    assert error.value.status_code == 400
    assert "Unsupported object class 'helmet'" in error.value.detail
    assert "open-vocabulary detection model" in error.value.detail
