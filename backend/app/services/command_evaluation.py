from fastapi import HTTPException

from app.services.llm_parser import get_parser_metadata, parse_command_with_mode
from app.services.llm_provider import get_llm_provider_status



def command_matches_expected(actual: dict, expected: dict) -> bool:
    return all(
        actual.get(field_name) == expected_value
        for field_name, expected_value in expected.items()
    )


COMMAND_EVALUATION_CASES = [
    {
        "command": "detect objects",
        "expected": {
            "action": "detect",
            "class_name": None,
        },
    },
    {
        "command": "crop person",
        "expected": {
            "action": "crop_by_class",
            "class_name": "person",
        },
    },
    {
        "command": "blur all persons",
        "expected": {
            "action": "blur_all_by_class",
            "class_name": "person",
        },
    },
    {
        "command": "extract frame at 1 second",
        "expected": {
            "action": "extract_frame",
            "class_name": None,
            "timestamp_seconds": 1.0,
        },
    },
    {
        "command": "extract frames from 0 to 3 seconds",
        "expected": {
            "action": "extract_frames",
            "class_name": None,
            "start_seconds": 0.0,
            "end_seconds": 3.0,
            "interval_seconds": 1.0,
        },
    },
    {
        "command": "extract frames from 0 to 4 every 2 seconds",
        "expected": {
            "action": "extract_frames",
            "class_name": None,
            "start_seconds": 0.0,
            "end_seconds": 4.0,
            "interval_seconds": 2.0,
        },
    },
    {
        "command": "detect frames from 0 to 3 seconds",
        "expected": {
            "action": "detect_frames",
            "class_name": None,
            "start_seconds": 0.0,
            "end_seconds": 3.0,
            "interval_seconds": 1.0,
        },
    },
    {
        "command": "track video from 0 to 3 seconds",
        "expected": {
            "action": "track_video",
            "class_name": None,
            "start_seconds": 0.0,
            "end_seconds": 3.0,
            "interval_seconds": 1.0,
        },
    },
    {
        "command": "track person from 0 to 3 seconds",
        "expected": {
            "action": "track_video",
            "class_name": "person",
            "start_seconds": 0.0,
            "end_seconds": 3.0,
            "interval_seconds": 1.0,
        },
    },
    {
        "command": "trim video from 0 to 2 seconds",
        "expected": {
            "action": "trim_video",
            "class_name": None,
            "start_seconds": 0.0,
            "end_seconds": 2.0,
        },
    },
]


def evaluate_command_parser(parser_mode: str = "rule_based"):
    supported_parser_modes = {"rule_based", "llm_mock", "real_llm"}

    if parser_mode not in supported_parser_modes:
        raise HTTPException(
            status_code=400,
            detail="Supported parser modes are: rule_based, llm_mock, real_llm",
        )

    if parser_mode == "real_llm":
        provider_status = get_llm_provider_status()

        if not provider_status["real_llm_available"]:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Real LLM parser evaluation requires a configured provider. "
                    "Set LLM_PROVIDER=ollama or LLM_PROVIDER=openai and configure the required model settings."
                ),
            )

    parser_metadata = get_parser_metadata(parser_mode)
    parser_type = parser_metadata["parser_type"]
    parser_version = parser_metadata["parser_version"]

    results = []

    for case in COMMAND_EVALUATION_CASES:
        command = case["command"]
        expected = case["expected"]

        try:
            parse_result = parse_command_with_mode(
                command=command,
                parser_mode=parser_mode,
            )
            parser_type = parse_result.get("parser_type", parser_type)
            parser_version = parse_result.get("parser_version", parser_version)
            actual = parse_result["parsed_command"]
            passed = command_matches_expected(actual, expected)
            error = None
        except Exception as exception:
            actual = None
            passed = False
            error = str(exception)

        results.append(
            {
                "command": command,
                "expected": expected,
                "actual": actual,
                "passed": passed,
                "error": error,
            }
        )

    total_cases = len(results)
    passed_cases = sum(1 for result in results if result["passed"])
    failed_cases = total_cases - passed_cases

    accuracy = passed_cases / total_cases if total_cases > 0 else 0

    return {
        "parser_type": parser_type,
        "parser_version": parser_version,
        "total_cases": total_cases,
        "passed_cases": passed_cases,
        "failed_cases": failed_cases,
        "accuracy": round(accuracy, 4),
        "results": results,
    }
