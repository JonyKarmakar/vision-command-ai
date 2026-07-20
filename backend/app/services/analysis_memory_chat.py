"""Grounded analysis memory chat helpers for Milestone F."""

from __future__ import annotations

from collections import Counter
from typing import Any, Dict, Iterable, List, Optional

from fastapi import HTTPException

from app.services.analysis_memory import (
    ANALYSIS_MEMORY_RETRIEVAL_MODE,
    ANALYSIS_MEMORY_RETRIEVAL_VERSION,
    retrieve_analysis_memory_from_database,
)


ANALYSIS_MEMORY_CHAT_PROMPT_VERSION = "analysis-memory-chat-prompt-v1"
ANALYSIS_MEMORY_CHAT_RESPONDER_TYPE = "rule_based_analysis_memory"


def _safe_text(value: Any) -> str:
    if value is None:
        return ""

    return str(value).strip()


def _normalize_text(value: Any) -> str:
    return " ".join(_safe_text(value).lower().replace("_", " ").split())


def _contains_any_phrase(normalized_question: str, phrases: Iterable[str]) -> bool:
    return any(phrase in normalized_question for phrase in phrases)


def _safe_limit(value: Any) -> int:
    try:
        return max(1, min(int(value), 50))
    except (TypeError, ValueError):
        return 20


def _build_retrieved_source_cards(items: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    cards = []

    for item in items:
        cards.append(
            {
                "memory_id": item.get("memory_id"),
                "source_record_id": item.get("source_record_id"),
                "source_record_type": item.get("source_record_type"),
                "media_type": item.get("media_type"),
                "source_filename": item.get("source_filename"),
                "output_filename": item.get("output_filename"),
                "file_url": item.get("file_url"),
                "label": item.get("label"),
                "action": item.get("action"),
                "result_type": item.get("result_type"),
                "created_at": item.get("created_at"),
                "summary_text": item.get("summary_text"),
                "detected_classes": item.get("detected_classes") or [],
                "privacy_signals": item.get("privacy_signals") or [],
                "workflow_signals": item.get("workflow_signals") or [],
                "retrieval_score": item.get("retrieval_score", 0),
            }
        )

    return cards


def _format_source_reference(item: Dict[str, Any]) -> str:
    label = _safe_text(item.get("label")) or "Stored output"
    output_filename = _safe_text(item.get("output_filename"))
    source_filename = _safe_text(item.get("source_filename"))
    media_type = _safe_text(item.get("media_type")) or "unknown media"

    if source_filename and output_filename:
        return f"{label} from {source_filename} to {output_filename} ({media_type})"

    if output_filename:
        return f"{label} in {output_filename} ({media_type})"

    if source_filename:
        return f"{label} from {source_filename} ({media_type})"

    return f"{label} ({media_type})"


def _summarize_media_types(items: Iterable[Dict[str, Any]]) -> str:
    counts = Counter(
        item.get("media_type") or "unknown"
        for item in items
    )

    if not counts:
        return "no stored media types"

    return ", ".join(
        f"{media_type} ({count})"
        for media_type, count in sorted(counts.items())
    )


def _summarize_detected_classes(items: Iterable[Dict[str, Any]]) -> str:
    counts = Counter()

    for item in items:
        for class_name in item.get("detected_classes") or []:
            counts[class_name] += 1

    if not counts:
        return "no class hints"

    return ", ".join(
        f"{class_name} ({count})"
        for class_name, count in counts.most_common(8)
    )


def _build_no_result_answer(retrieval_payload: Dict[str, Any]) -> str:
    status = retrieval_payload.get("status")

    if status != "healthy":
        return (
            "Persisted analysis memory is not available right now because generated "
            "output history is not configured or not healthy. Create or load generated "
            "output history first, then ask again."
        )

    return (
        "I could not find matching analysis memory in stored generated outputs. "
        "Try creating new analysis outputs, loading persisted generated output history, "
        "or asking with a source filename, object class, action, or result type."
    )


def _build_unsupported_question_answer(
    normalized_question: str,
    retrieved_sources: List[Dict[str, Any]],
) -> Optional[str]:
    source_count = len(retrieved_sources)

    if _contains_any_phrase(
        normalized_question,
        ["identify", "who is", "who are", "name this person", "recognize"],
    ):
        return (
            f"I found {source_count} retrieved analysis memory item"
            f"{'' if source_count == 1 else 's'}, but I cannot identify who a "
            "person is. Analysis memory is based on stored workflow metadata and "
            "does not perform face recognition or identity lookup."
        )

    if _contains_any_phrase(
        normalized_question,
        ["happy", "sad", "angry", "emotion", "feeling", "mood"],
    ):
        return (
            f"I found {source_count} retrieved analysis memory item"
            f"{'' if source_count == 1 else 's'}, but I cannot infer emotions, "
            "mood, or intent from stored analysis metadata."
        )

    if _contains_any_phrase(
        normalized_question,
        ["where was", "location", "city", "country", "place", "recorded", "taken"],
    ):
        return (
            f"I found {source_count} retrieved analysis memory item"
            f"{'' if source_count == 1 else 's'}, but I cannot infer where an "
            "image or video was captured unless explicit metadata or user-provided "
            "context is available."
        )

    return None


def _build_privacy_answer(retrieved_sources: List[Dict[str, Any]]) -> str:
    privacy_items = [
        item
        for item in retrieved_sources
        if any(
            signal in (item.get("privacy_signals") or [])
            for signal in (
                "person_present",
                "manual_privacy_check_recommended",
            )
        )
    ]

    if not privacy_items:
        return (
            f"I found {len(retrieved_sources)} retrieved analysis memory item"
            f"{'' if len(retrieved_sources) == 1 else 's'}, but none of the "
            "retrieved metadata has a strong privacy signal. You should still "
            "manually check for people, screens, documents, text, license plates, "
            "and sensitive objects."
        )

    source_text = "; ".join(
        _format_source_reference(item)
        for item in privacy_items[:3]
    )

    return (
        f"I found {len(privacy_items)} retrieved analysis memory item"
        f"{'' if len(privacy_items) == 1 else 's'} with privacy-related signals. "
        f"Relevant sources include: {source_text}. "
        "Because this is based on stored metadata, still manually review people, "
        "screens, documents, text, license plates, and other sensitive details."
    )


def _build_summary_answer(retrieved_sources: List[Dict[str, Any]]) -> str:
    source_text = "; ".join(
        _format_source_reference(item)
        for item in retrieved_sources[:3]
    )
    media_summary = _summarize_media_types(retrieved_sources)
    class_summary = _summarize_detected_classes(retrieved_sources)

    return (
        f"I found {len(retrieved_sources)} retrieved analysis memory item"
        f"{'' if len(retrieved_sources) == 1 else 's'}. "
        f"Media summary: {media_summary}. "
        f"Class hints: {class_summary}. "
        f"Most relevant sources: {source_text}."
    )


def _build_grounded_answer(
    question: str,
    retrieved_sources: List[Dict[str, Any]],
    retrieval_payload: Dict[str, Any],
) -> str:
    if not retrieved_sources:
        return _build_no_result_answer(retrieval_payload)

    normalized_question = _normalize_text(question)

    unsupported_answer = _build_unsupported_question_answer(
        normalized_question,
        retrieved_sources,
    )

    if unsupported_answer:
        return unsupported_answer

    if _contains_any_phrase(
        normalized_question,
        ["privacy", "private", "blur", "hide", "anonym", "redact"],
    ):
        return _build_privacy_answer(retrieved_sources)

    if _contains_any_phrase(
        normalized_question,
        ["what have i analyzed", "history", "so far", "summarize", "summary", "recent"],
    ):
        return _build_summary_answer(retrieved_sources)

    return _build_summary_answer(retrieved_sources)


def answer_analysis_memory_chat(
    question: str,
    response_mode: str = "rule_based",
    media_type: Optional[str] = None,
    source_filename: Optional[str] = None,
    result_type: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 20,
    current_workflow_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    question_text = _safe_text(question)

    if not question_text:
        raise HTTPException(
            status_code=400,
            detail="Analysis memory chat question cannot be empty.",
        )

    if response_mode != "rule_based":
        raise HTTPException(
            status_code=422,
            detail="Unsupported analysis memory chat response mode.",
        )

    retrieval_payload = retrieve_analysis_memory_from_database(
        query=question_text,
        limit=_safe_limit(limit),
        media_type=media_type,
        source_filename=source_filename,
        result_type=result_type,
        action=action,
    )
    retrieved_sources = _build_retrieved_source_cards(
        retrieval_payload.get("items", []),
    )
    answer = _build_grounded_answer(
        question_text,
        retrieved_sources,
        retrieval_payload,
    )

    grounding_notes = [
        "Answer is grounded in retrieved analysis memory items from stored generated output metadata.",
        "Retrieval uses deterministic metadata matching, not semantic vector search.",
        "This endpoint does not inspect raw image pixels or raw video frames.",
    ]

    if current_workflow_context:
        grounding_notes.append(
            "Current workflow context was received but is not merged with persisted retrieval in this first endpoint version.",
        )

    limitations = list(retrieval_payload.get("limitations") or [])
    limitations.append(
        "Analysis memory chat does not identify people, infer emotions, infer capture location, or perform raw multimodal reasoning.",
    )

    return {
        "answer": answer,
        "responder_type": ANALYSIS_MEMORY_CHAT_RESPONDER_TYPE,
        "prompt_version": ANALYSIS_MEMORY_CHAT_PROMPT_VERSION,
        "retrieval_status": retrieval_payload.get("status"),
        "retrieval_mode": retrieval_payload.get(
            "retrieval_mode",
            ANALYSIS_MEMORY_RETRIEVAL_MODE,
        ),
        "retrieval_version": retrieval_payload.get(
            "retrieval_version",
            ANALYSIS_MEMORY_RETRIEVAL_VERSION,
        ),
        "retrieved_item_count": len(retrieved_sources),
        "retrieved_sources": retrieved_sources,
        "grounding_notes": grounding_notes,
        "limitations": limitations,
    }
