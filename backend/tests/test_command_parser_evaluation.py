import pytest
from fastapi import HTTPException

from app.services.command_parser import parse_command


@pytest.mark.parametrize(
    "command,expected",
    [
        (
            "detect objects",
            {
                "action": "detect",
                "class_name": None,
            },
        ),
        (
            "crop person",
            {
                "action": "crop_by_class",
                "class_name": "person",
            },
        ),
        (
            "crop bottle",
            {
                "action": "crop_by_class",
                "class_name": "bottle",
            },
        ),
        (
            "blur person",
            {
                "action": "blur_by_class",
                "class_name": "person",
            },
        ),
        (
            "blur all persons",
            {
                "action": "blur_all_by_class",
                "class_name": "person",
            },
        ),
        (
            "extract frame at 1 second",
            {
                "action": "extract_frame",
                "class_name": None,
                "timestamp_seconds": 1.0,
            },
        ),
        (
            "extract frames from 0 to 3 seconds",
            {
                "action": "extract_frames",
                "class_name": None,
                "start_seconds": 0.0,
                "end_seconds": 3.0,
                "interval_seconds": 1.0,
            },
        ),
        (
            "extract frames from 0 to 4 every 2 seconds",
            {
                "action": "extract_frames",
                "class_name": None,
                "start_seconds": 0.0,
                "end_seconds": 4.0,
                "interval_seconds": 2.0,
            },
        ),
        (
            "detect frames from 0 to 3 seconds",
            {
                "action": "detect_frames",
                "class_name": None,
                "start_seconds": 0.0,
                "end_seconds": 3.0,
                "interval_seconds": 1.0,
            },
        ),
        (
            "track video from 0 to 3 seconds",
            {
                "action": "track_video",
                "class_name": None,
                "start_seconds": 0.0,
                "end_seconds": 3.0,
                "interval_seconds": 1.0,
            },
        ),
        (
            "track person from 0 to 3 seconds",
            {
                "action": "track_video",
                "class_name": "person",
                "start_seconds": 0.0,
                "end_seconds": 3.0,
                "interval_seconds": 1.0,
            },
        ),
        (
            "trim video from 0 to 2 seconds",
            {
                "action": "trim_video",
                "class_name": None,
                "start_seconds": 0.0,
                "end_seconds": 2.0,
            },
        ),
    ],
)
def test_command_parser_expected_outputs(command, expected):
    assert parse_command(command) == expected


@pytest.mark.parametrize(
    "command",
    [
        "make it beautiful",
        "crop",
        "blur",
        "extract frame",
        "extract frames",
        "detect frames",
        "track video",
        "trim video",
    ],
)
def test_command_parser_rejects_incomplete_or_unsupported_commands(command):
    with pytest.raises(HTTPException):
        parse_command(command)
