from app.services.command_evaluation import COMMAND_EVALUATION_CASES, evaluate_command_parser


def test_command_evaluation_cases_include_class_aliases():
    commands = {case["command"]: case["expected"] for case in COMMAND_EVALUATION_CASES}

    assert commands["crop bike"] == {
        "action": "crop_by_class",
        "class_name": "bicycle",
    }

    assert commands["blur phone"] == {
        "action": "blur_by_class",
        "class_name": "cell phone",
    }

    assert commands["crop sofa"] == {
        "action": "crop_by_class",
        "class_name": "couch",
    }

    assert commands["track motorbike from 0 to 3 seconds"] == {
        "action": "track_video",
        "class_name": "motorcycle",
        "start_seconds": 0.0,
        "end_seconds": 3.0,
        "interval_seconds": 1.0,
    }


def test_rule_based_evaluation_passes_class_alias_cases():
    result = evaluate_command_parser("rule_based")

    results_by_command = {
        case_result["command"]: case_result
        for case_result in result["results"]
    }

    assert results_by_command["crop bike"]["passed"] is True
    assert results_by_command["blur phone"]["passed"] is True
    assert results_by_command["crop sofa"]["passed"] is True
    assert results_by_command["track motorbike from 0 to 3 seconds"]["passed"] is True
