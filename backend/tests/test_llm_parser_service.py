import pytest
from fastapi import HTTPException

from app.services.llm_parser import get_parser_metadata, parse_command_with_mode


def test_get_rule_based_parser_metadata():
    metadata = get_parser_metadata("rule_based")

    assert metadata == {
        "parser_mode": "rule_based",
        "parser_type": "rule_based",
        "parser_version": "v1",
    }


def test_get_llm_mock_parser_metadata():
    metadata = get_parser_metadata("llm_mock")

    assert metadata == {
        "parser_mode": "llm_mock",
        "parser_type": "llm_mock",
        "parser_version": "mock-v1",
    }


def test_get_parser_metadata_rejects_invalid_mode():
    with pytest.raises(HTTPException):
        get_parser_metadata("llm")


def test_parse_command_with_rule_based_mode():
    result = parse_command_with_mode(
        command="crop person",
        parser_mode="rule_based",
    )

    assert result["parser_mode"] == "rule_based"
    assert result["parser_type"] == "rule_based"
    assert result["parser_version"] == "v1"
    assert result["parsed_command"]["action"] == "crop_by_class"
    assert result["parsed_command"]["class_name"] == "person"


def test_parse_command_with_llm_mock_mode():
    result = parse_command_with_mode(
        command="crop person",
        parser_mode="llm_mock",
    )

    assert result["parser_mode"] == "llm_mock"
    assert result["parser_type"] == "llm_mock"
    assert result["parser_version"] == "mock-v1"
    assert result["parsed_command"]["action"] == "crop_by_class"
    assert result["parsed_command"]["class_name"] == "person"
