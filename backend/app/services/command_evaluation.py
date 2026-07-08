from fastapi import HTTPException

from app.services.llm_parser import get_parser_metadata, parse_command_with_mode
from app.services.llm_provider import get_llm_provider_status
from app.services.command_planner import get_planner_metadata, plan_command_with_mode



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
        "command": "crop bike",
        "expected": {
            "action": "crop_by_class",
            "class_name": "bicycle",
        },
    },
    {
        "command": "blur phone",
        "expected": {
            "action": "blur_by_class",
            "class_name": "cell phone",
        },
    },
    {
        "command": "crop sofa",
        "expected": {
            "action": "crop_by_class",
            "class_name": "couch",
        },
    },
    {
        "command": "track motorbike from 0 to 3 seconds",
        "expected": {
            "action": "track_video",
            "class_name": "motorcycle",
            "start_seconds": 0.0,
            "end_seconds": 3.0,
            "interval_seconds": 1.0,
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




COMMAND_ROBUSTNESS_EVALUATION_CASES = [
    {
        "command": "blur the people",
        "case_type": "current_pass",
        "expected": {
            "action": "blur_by_class",
            "class_name": "person",
        },
        "notes": "Natural plural alias should normalize to the supported person class.",
    },
    {
        "command": "blur all humans",
        "case_type": "current_pass",
        "expected": {
            "action": "blur_all_by_class",
            "class_name": "person",
        },
        "notes": "Human/humans should normalize to person.",
    },
    {
        "command": "crop the children",
        "case_type": "current_pass",
        "expected": {
            "action": "crop_by_class",
            "class_name": "person",
        },
        "notes": "Children should normalize to person for the current detector.",
    },
    {
        "command": "track humans from 0 to 3 seconds",
        "case_type": "current_pass",
        "expected": {
            "action": "track_video",
            "class_name": "person",
            "start_seconds": 0.0,
            "end_seconds": 3.0,
            "interval_seconds": 1.0,
        },
        "notes": "Video tracking should also use shared class alias normalization.",
    },
    {
        "command": "detect people in the image",
        "case_type": "current_pass",
        "expected": {
            "action": "detect",
            "class_name": None,
        },
        "notes": "Current parser supports general detection but not class-filtered detect commands yet.",
    },
    {
        "command": "crop the vehicles",
        "case_type": "expected_error",
        "expected_error_contains": [
            "'vehicles' is a broad object category",
            "specific supported classes",
            "car",
            "truck",
            "motorcycle",
        ],
        "notes": "Broad categories should not be silently mapped to a single detector class.",
    },
    {
        "command": "blur the helmet",
        "case_type": "expected_error",
        "expected_error_contains": [
            "Unsupported object class 'helmet'",
            "current model cannot detect this class",
            "open-vocabulary detection model",
        ],
        "notes": "Unsupported arbitrary objects should explain the model limitation clearly.",
    },
    {
        "command": "zoom into the biggest person",
        "case_type": "future_target",
        "current_error_contains": [
            "Unsupported object class 'biggest person'",
        ],
        "future_expected": {
            "action": "zoom_by_class",
            "class_name": "person",
            "target_scope": "largest",
        },
        "notes": "Future parser should separate scope words like biggest/largest from the target class.",
    },
    {
        "command": "find cars",
        "case_type": "future_target",
        "current_error_contains": [
            "Unsupported command",
        ],
        "future_expected": {
            "action": "detect",
            "class_name": "car",
        },
        "notes": "Future parser should treat find as a detection intent and preserve class filters.",
    },
    {
        "command": "show frames with people",
        "case_type": "expected_error",
        "expected_error_contains": [
            "I understood this as a frame search command",
            "I need a start and end time",
            "show frames with people from 0 to 3 seconds",
        ],
        "notes": "Frame-search commands need a time range before they can become executable.",
    },
    {
        "command": "show frames with people from 0 to 3 seconds",
        "case_type": "future_target",
        "current_error_contains": [
            "Unsupported command",
        ],
        "future_expected": {
            "action": "detect_frames",
            "class_name": "person",
            "start_seconds": 0.0,
            "end_seconds": 3.0,
            "interval_seconds": 1.0,
        },
        "notes": "Video parser should understand frame-search phrasing with people/person aliases and an explicit time range.",
    },
]


COMMAND_PLANNER_EVALUATION_CASES = [
    {
        "command": "Detect all objects in this image",
        "expected": {
            "media_type": "image",
            "action": "detect",
            "target_class": None,
            "target_scope": "all",
            "requires_detection": True,
            "requires_tracking": False,
            "needs_clarification": False,
        },
    },
    {
        "command": "Blur all people",
        "expected": {
            "media_type": "image",
            "action": "blur_all_by_class",
            "target_class": "person",
            "target_scope": "all",
            "requires_detection": True,
            "requires_tracking": False,
            "needs_clarification": False,
        },
    },
    {
        "command": "Crop the largest car",
        "expected": {
            "media_type": "image",
            "action": "crop_by_class",
            "target_class": "car",
            "target_scope": "largest",
            "requires_detection": True,
            "requires_tracking": False,
            "needs_clarification": False,
        },
    },
    {
        "command": "Track the person in the video",
        "expected": {
            "media_type": "video",
            "action": "track",
            "target_class": "person",
            "target_scope": "single",
            "requires_detection": True,
            "requires_tracking": True,
            "needs_clarification": False,
        },
    },
    {
        "command": "Zoom into the object on the left",
        "expected": {
            "media_type": "image",
            "action": "zoom",
            "target_class": None,
            "target_scope": "left",
            "requires_detection": True,
            "requires_tracking": False,
            "needs_clarification": False,
        },
    },
    {
        "command": "Crop the bike",
        "expected": {
            "media_type": "image",
            "action": "crop_by_class",
            "target_class": "bicycle",
            "target_scope": "single",
            "requires_detection": True,
            "requires_tracking": False,
            "needs_clarification": False,
        },
    },
    {
        "command": "Blur the phone",
        "expected": {
            "media_type": "image",
            "action": "blur_by_class",
            "target_class": "cell phone",
            "target_scope": "single",
            "requires_detection": True,
            "requires_tracking": False,
            "needs_clarification": False,
        },
    },
    {
        "command": "Crop the object",
        "expected": {
            "media_type": "image",
            "action": "crop_by_class",
            "target_class": None,
            "target_scope": "single",
            "requires_detection": True,
            "requires_tracking": False,
            "needs_clarification": True,
        },
    },
]


def evaluate_command_planner(planner_mode: str = "rule_based"):
    planner_metadata = get_planner_metadata(planner_mode)

    if planner_mode == "real_llm":
        provider_status = get_llm_provider_status()

        if not provider_status["real_llm_available"]:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Real LLM planner evaluation requires a configured provider. "
                    "Set LLM_PROVIDER=ollama or LLM_PROVIDER=openai and configure the required model settings."
                ),
            )

    results = []

    for case in COMMAND_PLANNER_EVALUATION_CASES:
        command = case["command"]
        expected = case["expected"]

        try:
            plan_result = plan_command_with_mode(
                command=command,
                planner_mode=planner_mode,
            )
            plan = plan_result["plan"]
            actual = plan.model_dump() if hasattr(plan, "model_dump") else plan.dict()
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
        "planner_mode": planner_metadata["planner_mode"],
        "planner_type": planner_metadata["planner_type"],
        "planner_version": planner_metadata["planner_version"],
        "total_cases": total_cases,
        "passed_cases": passed_cases,
        "failed_cases": failed_cases,
        "accuracy": round(accuracy, 4),
        "results": results,
    }



def _text_contains_all(value: str, expected_parts: list[str]) -> bool:
    return all(part in value for part in expected_parts)


def evaluate_command_parser_robustness(parser_mode: str = "rule_based"):
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
                    "Real LLM parser robustness evaluation requires a configured provider. "
                    "Set LLM_PROVIDER=ollama or LLM_PROVIDER=openai and configure the required model settings."
                ),
            )

    parser_metadata = get_parser_metadata(parser_mode)
    parser_type = parser_metadata["parser_type"]
    parser_version = parser_metadata["parser_version"]

    results = []

    for case in COMMAND_ROBUSTNESS_EVALUATION_CASES:
        command = case["command"]
        case_type = case["case_type"]

        try:
            parse_result = parse_command_with_mode(
                command=command,
                parser_mode=parser_mode,
            )
            parser_type = parse_result.get("parser_type", parser_type)
            parser_version = parse_result.get("parser_version", parser_version)
            actual = parse_result["parsed_command"]
            error = None
        except Exception as exception:
            actual = None
            error = str(exception)

        future_target_met = False

        if case_type == "current_pass":
            current_behavior_passed = (
                error is None and command_matches_expected(actual, case["expected"])
            )
        elif case_type == "expected_error":
            current_behavior_passed = (
                error is not None
                and _text_contains_all(error, case["expected_error_contains"])
            )
        elif case_type == "future_target":
            future_target_met = (
                error is None
                and command_matches_expected(actual, case["future_expected"])
            )
            current_behavior_passed = future_target_met or (
                error is not None
                and _text_contains_all(error, case["current_error_contains"])
            )
        else:
            current_behavior_passed = False

        results.append(
            {
                "command": command,
                "case_type": case_type,
                "expected": case.get("expected"),
                "expected_error_contains": case.get("expected_error_contains"),
                "current_error_contains": case.get("current_error_contains"),
                "future_expected": case.get("future_expected"),
                "actual": actual,
                "error": error,
                "current_behavior_passed": current_behavior_passed,
                "future_target_met": future_target_met,
                "notes": case.get("notes"),
            }
        )

    total_cases = len(results)
    current_behavior_passed_cases = sum(
        1 for result in results if result["current_behavior_passed"]
    )
    future_target_cases = sum(
        1 for result in results if result["case_type"] == "future_target"
    )
    future_targets_met = sum(1 for result in results if result["future_target_met"])

    return {
        "parser_type": parser_type,
        "parser_version": parser_version,
        "total_cases": total_cases,
        "current_pass_cases": sum(
            1 for result in results if result["case_type"] == "current_pass"
        ),
        "expected_error_cases": sum(
            1 for result in results if result["case_type"] == "expected_error"
        ),
        "future_target_cases": future_target_cases,
        "current_behavior_passed_cases": current_behavior_passed_cases,
        "undocumented_behavior_cases": total_cases - current_behavior_passed_cases,
        "future_targets_met": future_targets_met,
        "future_target_gap": future_target_cases - future_targets_met,
        "results": results,
    }


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
