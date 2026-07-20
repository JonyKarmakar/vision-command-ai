from fastapi.testclient import TestClient

from app.main import app
from app.services import analysis_memory_chat


client = TestClient(app)


def _sample_memory_item(
    memory_id="output-1",
    label="Zoom person",
    media_type="image",
    source_filename="uploaded-image.png",
    output_filename="zoom-person.png",
    detected_classes=None,
    privacy_signals=None,
    retrieval_score=12,
):
    return {
        "memory_id": memory_id,
        "source_record_id": memory_id,
        "source_record_type": "generated_output",
        "media_type": media_type,
        "source_filename": source_filename,
        "output_filename": output_filename,
        "file_url": f"/media/outputs/{output_filename}",
        "label": label,
        "action": "zoom",
        "result_type": "zoom_by_class",
        "command_text": "zoom into the person",
        "created_by": "Run Command",
        "created_at": "2026-06-23T10:00:00",
        "summary_text": f"{label} created from {source_filename}.",
        "detected_classes": detected_classes or ["person"],
        "privacy_signals": privacy_signals or ["person_present"],
        "workflow_signals": ["created_by_command", "has_source_filename"],
        "retrieval_score": retrieval_score,
    }


def _healthy_retrieval_payload(items):
    return {
        "status": "healthy",
        "query": "person",
        "count": len(items),
        "items": items,
        "filters": {
            "media_type": None,
            "source_filename": None,
            "result_type": None,
            "action": None,
            "limit": 20,
        },
        "retrieval_mode": "deterministic_keyword_v1",
        "retrieval_version": "f2-analysis-memory-retrieval-v1",
        "limitations": [
            "Retrieval uses deterministic metadata matching, not semantic vector search.",
        ],
    }


def test_analysis_memory_chat_answers_with_retrieved_sources(monkeypatch):
    items = [
        _sample_memory_item(memory_id="output-2", label="Blur person"),
        _sample_memory_item(
            memory_id="output-1",
            label="Zoom person",
            retrieval_score=9,
        ),
    ]

    monkeypatch.setattr(
        analysis_memory_chat,
        "retrieve_analysis_memory_from_database",
        lambda **kwargs: _healthy_retrieval_payload(items),
    )

    response = client.post(
        "/assistant/analysis-memory-chat",
        json={
            "question": "Which outputs mention person?",
            "response_mode": "rule_based",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["responder_type"] == "rule_based_analysis_memory"
    assert data["prompt_version"] == "analysis-memory-chat-prompt-v1"
    assert data["retrieval_mode"] == "deterministic_keyword_v1"
    assert data["retrieved_item_count"] == 2
    assert [source["memory_id"] for source in data["retrieved_sources"]] == [
        "output-2",
        "output-1",
    ]
    assert "I found 2 retrieved analysis memory items" in data["answer"]
    assert "person" in data["answer"].lower()
    assert data["grounding_notes"]


def test_analysis_memory_chat_answers_privacy_question(monkeypatch):
    items = [
        _sample_memory_item(
            memory_id="output-3",
            label="Blur person",
            privacy_signals=[
                "manual_privacy_check_recommended",
                "person_present",
            ],
        )
    ]

    monkeypatch.setattr(
        analysis_memory_chat,
        "retrieve_analysis_memory_from_database",
        lambda **kwargs: _healthy_retrieval_payload(items),
    )

    response = client.post(
        "/assistant/analysis-memory-chat",
        json={
            "question": "Which results may need privacy review?",
            "response_mode": "rule_based",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert "privacy-related signals" in data["answer"]
    assert "manual" in data["answer"].lower()
    assert data["retrieved_item_count"] == 1


def test_analysis_memory_chat_returns_clear_no_result_answer(monkeypatch):
    monkeypatch.setattr(
        analysis_memory_chat,
        "retrieve_analysis_memory_from_database",
        lambda **kwargs: _healthy_retrieval_payload([]),
    )

    response = client.post(
        "/assistant/analysis-memory-chat",
        json={
            "question": "Find cat analysis",
            "response_mode": "rule_based",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["retrieved_item_count"] == 0
    assert data["retrieved_sources"] == []
    assert "could not find matching analysis memory" in data["answer"].lower()


def test_analysis_memory_chat_handles_not_configured_retrieval(monkeypatch):
    monkeypatch.setattr(
        analysis_memory_chat,
        "retrieve_analysis_memory_from_database",
        lambda **kwargs: {
            "status": "not_configured",
            "query": "person",
            "count": 0,
            "items": [],
            "filters": {},
            "retrieval_mode": "deterministic_keyword_v1",
            "retrieval_version": "f2-analysis-memory-retrieval-v1",
            "limitations": [
                "Persisted analysis memory is unavailable because generated output history is not healthy or not configured.",
            ],
        },
    )

    response = client.post(
        "/assistant/analysis-memory-chat",
        json={
            "question": "What have I analyzed so far?",
            "response_mode": "rule_based",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["retrieval_status"] == "not_configured"
    assert data["retrieved_item_count"] == 0
    assert "not available" in data["answer"].lower()
    assert "generated output history" in data["answer"].lower()


def test_analysis_memory_chat_declines_identity_question(monkeypatch):
    items = [_sample_memory_item(memory_id="output-4")]

    monkeypatch.setattr(
        analysis_memory_chat,
        "retrieve_analysis_memory_from_database",
        lambda **kwargs: _healthy_retrieval_payload(items),
    )

    response = client.post(
        "/assistant/analysis-memory-chat",
        json={
            "question": "Who is this person?",
            "response_mode": "rule_based",
        },
    )

    assert response.status_code == 200
    answer = response.json()["answer"].lower()

    assert "cannot identify" in answer
    assert "face recognition" in answer


def test_analysis_memory_chat_passes_filters_to_retrieval(monkeypatch):
    captured_kwargs = {}

    def fake_retrieve(**kwargs):
        captured_kwargs.update(kwargs)
        return _healthy_retrieval_payload([])

    monkeypatch.setattr(
        analysis_memory_chat,
        "retrieve_analysis_memory_from_database",
        fake_retrieve,
    )

    response = client.post(
        "/assistant/analysis-memory-chat",
        json={
            "question": "Find video reports",
            "response_mode": "rule_based",
            "media_type": "video",
            "source_filename": "clip.mp4",
            "result_type": "video_object_detection",
            "action": "video_object_detection",
            "limit": 7,
            "current_workflow_context": {"active_video": "clip.mp4"},
        },
    )

    assert response.status_code == 200
    assert captured_kwargs == {
        "query": "Find video reports",
        "limit": 7,
        "media_type": "video",
        "source_filename": "clip.mp4",
        "result_type": "video_object_detection",
        "action": "video_object_detection",
    }
    assert any(
        "Current workflow context was received" in note
        for note in response.json()["grounding_notes"]
    )


def test_analysis_memory_chat_rejects_empty_question():
    response = client.post(
        "/assistant/analysis-memory-chat",
        json={
            "question": "   ",
            "response_mode": "rule_based",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Analysis memory chat question cannot be empty."


def test_analysis_memory_chat_rejects_unknown_response_mode():
    response = client.post(
        "/assistant/analysis-memory-chat",
        json={
            "question": "What have I analyzed?",
            "response_mode": "real_llm",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Unsupported analysis memory chat response mode."
