from app.services.analysis_memory_grounding_evaluation import (
    ANALYSIS_MEMORY_GROUNDING_EVALUATION_CASES,
    ANALYSIS_MEMORY_GROUNDING_EVALUATION_VERSION,
    REQUIRED_RETRIEVED_SOURCE_FIELDS,
    evaluate_analysis_memory_grounding,
)


def test_analysis_memory_grounding_cases_cover_f5_requirements():
    case_types = {
        case["case_type"]
        for case in ANALYSIS_MEMORY_GROUNDING_EVALUATION_CASES
    }

    assert {
        "relevant_retrieval",
        "no_result",
        "privacy_behavior",
        "identity_safety",
        "emotion_safety",
        "location_safety",
        "not_configured_fallback",
        "source_card_presence",
    }.issubset(case_types)


def test_analysis_memory_grounding_cases_define_expected_and_forbidden_fragments():
    for case in ANALYSIS_MEMORY_GROUNDING_EVALUATION_CASES:
        assert case["question"].strip()
        assert case["expected_answer_fragments"]
        assert "forbidden_answer_fragments" in case
        assert "expected_retrieved_item_count" in case
        assert "expected_source_ids" in case


def test_evaluate_analysis_memory_grounding_returns_passing_summary():
    result = evaluate_analysis_memory_grounding()

    assert result["evaluation_type"] == "analysis_memory_grounding"
    assert (
        result["evaluation_version"]
        == ANALYSIS_MEMORY_GROUNDING_EVALUATION_VERSION
    )
    assert result["responder_type"] == "rule_based_analysis_memory"
    assert result["prompt_version"] == "analysis-memory-chat-prompt-v1"
    assert result["total_cases"] == len(ANALYSIS_MEMORY_GROUNDING_EVALUATION_CASES)
    assert result["passed_cases"] == result["total_cases"]
    assert result["failed_cases"] == 0
    assert result["accuracy"] == 1


def test_analysis_memory_grounding_records_source_card_fields():
    result = evaluate_analysis_memory_grounding()

    source_card_case = next(
        case
        for case in result["cases"]
        if case["case_type"] == "source_card_presence"
    )

    assert source_card_case["passed"]
    assert source_card_case["retrieved_item_count"] == 1

    source_card = source_card_case["retrieved_sources"][0]

    for field in REQUIRED_RETRIEVED_SOURCE_FIELDS:
        assert field in source_card

    field_checks = [
        check
        for check in source_card_case["checks"]
        if check["name"] == "retrieved_source_required_fields"
    ]

    assert field_checks
    assert all(check["passed"] for check in field_checks)


def test_analysis_memory_grounding_safety_cases_decline_unsupported_inferences():
    result = evaluate_analysis_memory_grounding()
    safety_cases = [
        case
        for case in result["cases"]
        if case["case_type"]
        in {"identity_safety", "emotion_safety", "location_safety"}
    ]

    assert len(safety_cases) == 3
    assert all(case["passed"] for case in safety_cases)

    identity_answer = next(
        case["answer"]
        for case in safety_cases
        if case["case_type"] == "identity_safety"
    ).lower()
    emotion_answer = next(
        case["answer"]
        for case in safety_cases
        if case["case_type"] == "emotion_safety"
    ).lower()
    location_answer = next(
        case["answer"]
        for case in safety_cases
        if case["case_type"] == "location_safety"
    ).lower()

    assert "cannot identify" in identity_answer
    assert "cannot infer emotions" in emotion_answer
    assert "cannot infer where" in location_answer


def test_analysis_memory_grounding_documents_no_result_and_fallback_behavior():
    result = evaluate_analysis_memory_grounding()
    cases_by_type = {
        case["case_type"]: case
        for case in result["cases"]
    }

    no_result_answer = cases_by_type["no_result"]["answer"].lower()
    fallback_answer = cases_by_type["not_configured_fallback"]["answer"].lower()

    assert "could not find matching analysis memory" in no_result_answer
    assert cases_by_type["no_result"]["retrieved_item_count"] == 0
    assert "persisted analysis memory is not available" in fallback_answer
    assert "generated output history" in fallback_answer
    assert cases_by_type["not_configured_fallback"]["retrieval_status"] == "not_configured"
