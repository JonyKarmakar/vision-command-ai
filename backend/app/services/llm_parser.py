from fastapi import HTTPException

from app.services.command_parser import parse_command
from app.services.command_validation import validate_parsed_command


SUPPORTED_PARSER_MODES = {"rule_based", "llm_mock"}


def get_parser_metadata(parser_mode: str):
    if parser_mode == "rule_based":
        return {
            "parser_mode": "rule_based",
            "parser_type": "rule_based",
            "parser_version": "v1",
        }

    if parser_mode == "llm_mock":
        return {
            "parser_mode": "llm_mock",
            "parser_type": "llm_mock",
            "parser_version": "mock-v1",
        }

    raise HTTPException(
        status_code=400,
        detail="Supported parser modes are: rule_based, llm_mock",
    )


def parse_command_with_mode(command: str, parser_mode: str = "rule_based"):
    parser_metadata = get_parser_metadata(parser_mode)

    # For now, llm_mock reuses the rule-based parser internally.
    # Later, this is where a real LLM parser can be plugged in.
    parsed_command = parse_command(command)
    validated_command = validate_parsed_command(parsed_command)

    return {
        **parser_metadata,
        "parsed_command": validated_command,
    }
