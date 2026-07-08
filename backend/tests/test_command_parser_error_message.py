import pytest
from fastapi import HTTPException

from app.services.command_parser import parse_command


def test_unsupported_command_error_message_is_clean():
    with pytest.raises(HTTPException) as error:
        parse_command("make it beautiful")

    detail = error.value.detail

    assert detail.startswith("I could not map this command to a supported VisionCommand action yet.")
    assert "secondscrop" not in detail
    assert detail.count("crop bottle") == 1
    assert detail.count("trim video from 0 to 2 seconds") == 1

    expected_examples = [
        "detect objects",
        "crop person",
        "crop bottle",
        "blur all people",
        "zoom into the biggest person",
        "find cars",
        "show frames with people from 0 to 3 seconds",
        "track person from 0 to 3 seconds",
        "trim video from 0 to 2 seconds",
    ]

    for example in expected_examples:
        assert example in detail


def test_incomplete_crop_command_has_professional_clarification():
    with pytest.raises(HTTPException) as error:
        parse_command("crop")

    detail = error.value.detail

    assert "I understood this as a crop command" in detail
    assert "I need an object class" in detail
    assert "crop person" in detail
    assert "crop bottle" in detail


def test_incomplete_blur_command_has_professional_clarification():
    with pytest.raises(HTTPException) as error:
        parse_command("blur")

    detail = error.value.detail

    assert "I understood this as a blur command" in detail
    assert "I need an object class" in detail
    assert "blur all people" in detail


def test_incomplete_zoom_command_has_professional_clarification():
    with pytest.raises(HTTPException) as error:
        parse_command("zoom")

    detail = error.value.detail

    assert "I understood this as a zoom command" in detail
    assert "I need an object class" in detail
    assert "zoom into the biggest person" in detail


def test_incomplete_find_command_requires_object_class():
    with pytest.raises(HTTPException) as error:
        parse_command("find")

    detail = error.value.detail

    assert "I understood this as a find command" in detail
    assert "I need an object class" in detail
    assert "find cars" in detail


def test_incomplete_show_frames_command_has_professional_clarification():
    with pytest.raises(HTTPException) as error:
        parse_command("show frames with people")

    detail = error.value.detail

    assert "I understood this as a frame search command" in detail
    assert "I need a start and end time" in detail
    assert "show frames with people from 0 to 3 seconds" in detail
