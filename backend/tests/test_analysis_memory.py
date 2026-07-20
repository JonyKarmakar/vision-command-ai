from app.services.analysis_memory import (
    ANALYSIS_MEMORY_RETRIEVAL_MODE,
    ANALYSIS_MEMORY_RETRIEVAL_VERSION,
    build_analysis_memory_item,
    infer_analysis_memory_media_type,
    retrieve_analysis_memory_from_database,
    retrieve_analysis_memory_from_generated_outputs,
    score_analysis_memory_item,
)


def _sample_generated_outputs():
    return [
        {
            "id": "output-1",
            "action": "zoom",
            "label": "Zoom person",
            "filename": "zoom-person.png",
            "file_url": "/media/outputs/zoom-person.png",
            "source": "uploads",
            "source_filename": "uploaded-image.png",
            "created_by": "Run Command",
            "command_text": "zoom into the person",
            "result_type": "zoom_by_class",
            "execution_mode": "run_command",
            "parser_mode": "rule_based",
            "parser_type": "rule_based",
            "planner_mode": "rule_based",
            "created_at": "2026-06-23T10:00:00",
        },
        {
            "id": "output-2",
            "action": "blur",
            "label": "Blur person",
            "filename": "blur-person.png",
            "file_url": "/media/outputs/blur-person.png",
            "source": "outputs",
            "source_filename": "zoom-person.png",
            "created_by": "Generated Output",
            "command_text": "blur this person for privacy",
            "result_type": "blur_object",
            "execution_mode": "generated_output_action",
            "parser_mode": None,
            "parser_type": None,
            "planner_mode": None,
            "created_at": "2026-06-23T10:05:00",
        },
        {
            "id": "output-3",
            "action": "video_object_detection",
            "label": "Video object analysis",
            "filename": "annotated-video.mp4",
            "file_url": "/media/outputs/annotated-video.mp4",
            "source": "videos",
            "source_filename": "football-clip.mp4",
            "created_by": "Video Workflow",
            "command_text": "detect video objects",
            "result_type": "video_object_detection",
            "execution_mode": "manual_workflow",
            "parser_mode": None,
            "parser_type": None,
            "planner_mode": None,
            "created_at": "2026-06-23T10:10:00",
        },
    ]


def test_build_analysis_memory_item_maps_generated_output_metadata():
    item = build_analysis_memory_item(_sample_generated_outputs()[0])

    assert item["memory_id"] == "output-1"
    assert item["source_record_id"] == "output-1"
    assert item["source_record_type"] == "generated_output"
    assert item["media_type"] == "image"
    assert item["source_filename"] == "uploaded-image.png"
    assert item["output_filename"] == "zoom-person.png"
    assert item["file_url"] == "/media/outputs/zoom-person.png"
    assert item["label"] == "Zoom person"
    assert item["action"] == "zoom"
    assert item["result_type"] == "zoom_by_class"
    assert item["command_text"] == "zoom into the person"
    assert item["detected_classes"] == ["person"]
    assert "person_present" in item["privacy_signals"]
    assert "created_by_command" in item["workflow_signals"]
    assert "has_parser_metadata" in item["workflow_signals"]
    assert item["llm_metadata"]["parser_mode"] == "rule_based"
    assert "zoom person" in item["search_text"]


def test_infer_analysis_memory_media_type_detects_video_from_metadata():
    video_output = _sample_generated_outputs()[2]

    assert infer_analysis_memory_media_type(video_output) == "video"


def test_retrieve_analysis_memory_returns_recent_items_without_query():
    payload = retrieve_analysis_memory_from_generated_outputs(
        _sample_generated_outputs(),
        limit=2,
    )

    assert payload["status"] == "healthy"
    assert payload["retrieval_mode"] == ANALYSIS_MEMORY_RETRIEVAL_MODE
    assert payload["retrieval_version"] == ANALYSIS_MEMORY_RETRIEVAL_VERSION
    assert payload["count"] == 2
    assert [item["memory_id"] for item in payload["items"]] == [
        "output-3",
        "output-2",
    ]


def test_retrieve_analysis_memory_matches_keyword_and_privacy_context():
    payload = retrieve_analysis_memory_from_generated_outputs(
        _sample_generated_outputs(),
        query="privacy person",
    )

    assert payload["status"] == "healthy"
    assert payload["count"] == 2
    assert [item["memory_id"] for item in payload["items"]] == [
        "output-2",
        "output-1",
    ]
    assert payload["items"][0]["retrieval_score"] > payload["items"][1]["retrieval_score"]
    assert "manual_privacy_check_recommended" in payload["items"][0]["privacy_signals"]


def test_retrieve_analysis_memory_applies_filters():
    payload = retrieve_analysis_memory_from_generated_outputs(
        _sample_generated_outputs(),
        media_type="video",
        source_filename="football-clip.mp4",
    )

    assert payload["status"] == "healthy"
    assert payload["count"] == 1
    assert payload["items"][0]["memory_id"] == "output-3"
    assert payload["items"][0]["media_type"] == "video"


def test_retrieve_analysis_memory_returns_clear_no_result_limitation():
    payload = retrieve_analysis_memory_from_generated_outputs(
        _sample_generated_outputs(),
        query="cat",
    )

    assert payload["status"] == "healthy"
    assert payload["count"] == 0
    assert payload["items"] == []
    assert "No matching analysis memory items were found for the query." in payload["limitations"]


def test_score_analysis_memory_item_is_zero_for_unmatched_query():
    item = build_analysis_memory_item(_sample_generated_outputs()[0])

    assert score_analysis_memory_item(item, "zebra") == 0


def test_retrieve_analysis_memory_from_database_handles_not_configured(monkeypatch):
    from app.services import database_service

    monkeypatch.setattr(
        database_service,
        "get_database_generated_outputs",
        lambda limit=500: {
            "status": "not_configured",
            "count": 0,
            "generated_outputs": [],
        },
    )

    payload = retrieve_analysis_memory_from_database(query="person")

    assert payload["status"] == "not_configured"
    assert payload["count"] == 0
    assert payload["items"] == []
    assert payload["retrieval_mode"] == ANALYSIS_MEMORY_RETRIEVAL_MODE
    assert payload["retrieval_version"] == ANALYSIS_MEMORY_RETRIEVAL_VERSION
    assert "Persisted analysis memory is unavailable" in payload["limitations"][0]


def test_retrieve_analysis_memory_from_database_uses_generated_output_payload(monkeypatch):
    from app.services import database_service

    monkeypatch.setattr(
        database_service,
        "get_database_generated_outputs",
        lambda limit=500: {
            "status": "healthy",
            "count": len(_sample_generated_outputs()),
            "generated_outputs": _sample_generated_outputs(),
        },
    )

    payload = retrieve_analysis_memory_from_database(query="video")

    assert payload["status"] == "healthy"
    assert payload["count"] == 1
    assert payload["items"][0]["memory_id"] == "output-3"
