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
    assert cases["show frames with people"]["case_type"] == "future_target"


def test_rule_based_command_robustness_evaluation_documents_current_behavior():
    result = evaluate_command_parser_robustness("rule_based")

    assert result["parser_type"] == "rule_based"
    assert result["total_cases"] == len(COMMAND_ROBUSTNESS_EVALUATION_CASES)
    assert result["current_pass_cases"] >= 5
    assert result["expected_error_cases"] >= 2
    assert result["future_target_cases"] >= 3
    assert result["undocumented_behavior_cases"] == 0
    assert result["future_target_gap"] >= 1


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


def test_rule_based_command_robustness_records_future_targets_without_failing_dataset():
    result = evaluate_command_parser_robustness("rule_based")
    results_by_command = {
        case_result["command"]: case_result
        for case_result in result["results"]
    }

    zoom_result = results_by_command["zoom into the biggest person"]
    assert zoom_result["case_type"] == "future_target"
    assert zoom_result["future_target_met"] is False
    assert zoom_result["current_behavior_passed"] is True
    assert "Unsupported object class 'biggest person'" in zoom_result["error"]

    find_result = results_by_command["find cars"]
    assert find_result["case_type"] == "future_target"
    assert find_result["future_target_met"] is False
    assert find_result["current_behavior_passed"] is True
    assert "Unsupported command" in find_result["error"]
