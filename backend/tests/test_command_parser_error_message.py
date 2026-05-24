import pytest
from fastapi import HTTPException

from app.services.command_parser import parse_command


def test_unsupported_command_error_message_is_clean():
    with pytest.raises(HTTPException) as error:
        parse_command("make it beautiful")

    detail = error.value.detail

    assert detail.startswith("Unsupported command. Try commands like:")
    assert "secondscrop" not in detail
    assert detail.count("crop bottle") == 1
    assert detail.count("trim video from 0 to 2 seconds") == 1

    expected_examples = [
        "detect objects",
        "crop person",
        "crop bottle",
        "blur person",
        "extract frame at 1 second",
        "extract frames from 0 to 3 seconds",
        "detect frames from 0 to 3 seconds",
        "track video from 0 to 3 seconds",
        "track person from 0 to 3 seconds",
        "trim video from 0 to 2 seconds",
    ]

    for example in expected_examples:
        assert example in detail
