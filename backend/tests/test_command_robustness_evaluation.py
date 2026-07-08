from app.services.command_evaluation import (
    COMMAND_ROBUSTNESS_EVALUATION_CASES,
    evaluate_command_parser_robustness,
)


def test_command_robustness_cases_include_current_pass_expected_error_and_future_targets():
    case_types = {case["case_type"] for case in COMMAND_ROBUSTNESS_EVALUATION_CASES}

    assert "current_pass" in case_types
    assert "expected_error" in case_types
    assert "future_target" in case_types


def test_command_robustness_cases_cover_natural_aliases_and_future_parser_gaps():
    cases = {
        case["command"]: case
        for case in COMMAND_ROBUSTNESS_EVALUATION_CASES
    }

    assert cases["blur the people"]["expected"] == {
        "action": "blur_by_class",
        "class_name": "person",
    }

    assert cases["crop the vehicles"]["case_type"] == "expected_error"
    assert "'vehicles' is a broad object category" in cases["crop the vehicles"][
        "expected_error_contains"
    ]

    assert cases["zoom into the biggest person"]["case_type"] == "future_target"
    assert cases["zoom into the biggest person"]["future_expected"] == {
        "action": "zoom_by_class",
        "class_name": "person",
        "target_scope": "largest",
    }

    assert cases["find cars"]["case_type"] == "future_target"
    assert cases["show frames with people"]["case_type"] == "expected_error"
    assert cases["show frames with people from 0 to 3 seconds"]["case_type"] == "future_target"


def test_rule_based_command_robustness_evaluation_documents_current_behavior():
    result = evaluate_command_parser_robustness("rule_based")

    assert result["parser_type"] == "rule_based"
    assert result["total_cases"] == len(COMMAND_ROBUSTNESS_EVALUATION_CASES)
    assert result["current_pass_cases"] >= 5
    assert result["expected_error_cases"] >= 2
    assert result["future_target_cases"] >= 3
    assert result["undocumented_behavior_cases"] == 0
    assert result["future_target_gap"] == 0


def test_rule_based_command_robustness_records_expected_errors():
    result = evaluate_command_parser_robustness("rule_based")
    results_by_command = {
        case_result["command"]: case_result
        for case_result in result["results"]
    }

    vehicle_result = results_by_command["crop the vehicles"]
    assert vehicle_result["current_behavior_passed"] is True
    assert vehicle_result["actual"] is None
    assert "'vehicles' is a broad object category" in vehicle_result["error"]

    helmet_result = results_by_command["blur the helmet"]
    assert helmet_result["current_behavior_passed"] is True
    assert helmet_result["actual"] is None
    assert "Unsupported object class 'helmet'" in helmet_result["error"]


def test_rule_based_command_robustness_records_future_targets_as_met():
    result = evaluate_command_parser_robustness("rule_based")
    results_by_command = {
        case_result["command"]: case_result
        for case_result in result["results"]
    }

    zoom_result = results_by_command["zoom into the biggest person"]
    assert zoom_result["case_type"] == "future_target"
    assert zoom_result["future_target_met"] is True
    assert zoom_result["current_behavior_passed"] is True
    assert zoom_result["error"] is None
    assert zoom_result["actual"] == {
        "action": "zoom_by_class",
        "class_name": "person",
        "target_scope": "largest",
    }

    find_result = results_by_command["find cars"]
    assert find_result["case_type"] == "future_target"
    assert find_result["future_target_met"] is True
    assert find_result["current_behavior_passed"] is True
    assert find_result["error"] is None
    assert find_result["actual"] == {
        "action": "detect",
        "class_name": "car",
    }

    show_frames_result = results_by_command["show frames with people from 0 to 3 seconds"]
    assert show_frames_result["case_type"] == "future_target"
    assert show_frames_result["future_target_met"] is True
    assert show_frames_result["current_behavior_passed"] is True
    assert show_frames_result["error"] is None
    assert show_frames_result["actual"] == {
        "action": "detect_frames",
        "class_name": "person",
        "start_seconds": 0.0,
        "end_seconds": 3.0,
        "interval_seconds": 1.0,
    }

    missing_time_result = results_by_command["show frames with people"]
    assert missing_time_result["case_type"] == "expected_error"
    assert missing_time_result["current_behavior_passed"] is True
    assert missing_time_result["actual"] is None
    assert "I understood this as a frame search command" in missing_time_result["error"]
    assert "I need a start and end time" in missing_time_result["error"]
