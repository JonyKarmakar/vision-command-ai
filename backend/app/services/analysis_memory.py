"""Analysis memory retrieval helpers for Milestone F.

This module turns existing generated output records into retrieval-friendly
analysis memory items. It intentionally starts with deterministic keyword
retrieval instead of embeddings or a vector database.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


ANALYSIS_MEMORY_RETRIEVAL_VERSION = "f2-analysis-memory-retrieval-v1"
ANALYSIS_MEMORY_RETRIEVAL_MODE = "deterministic_keyword_v1"


IMAGE_EXTENSIONS = {
    ".bmp",
    ".gif",
    ".jpeg",
    ".jpg",
    ".png",
    ".tif",
    ".tiff",
    ".webp",
}

VIDEO_EXTENSIONS = {
    ".avi",
    ".m4v",
    ".mkv",
    ".mov",
    ".mp4",
    ".mpeg",
    ".mpg",
    ".webm",
}

COMMON_DETECTION_CLASSES = {
    "person",
    "people",
    "car",
    "cars",
    "dog",
    "dogs",
    "cat",
    "cats",
    "bottle",
    "bottles",
    "chair",
    "chairs",
    "laptop",
    "laptops",
    "phone",
    "phones",
    "cell phone",
    "sports ball",
    "ball",
    "bicycle",
    "bike",
    "motorcycle",
    "bus",
    "truck",
    "traffic light",
    "backpack",
    "handbag",
    "book",
    "tv",
    "screen",
}

CLASS_ALIASES = {
    "people": "person",
    "cars": "car",
    "dogs": "dog",
    "cats": "cat",
    "bottles": "bottle",
    "chairs": "chair",
    "laptops": "laptop",
    "phones": "cell phone",
    "phone": "cell phone",
    "ball": "sports ball",
    "bike": "bicycle",
    "screen": "tv",
}


def _safe_text(value: Any) -> str:
    if value is None:
        return ""

    return str(value).strip()


def _normalize_text(value: Any) -> str:
    return " ".join(_safe_text(value).lower().replace("_", " ").split())


def _text_parts(*values: Any) -> List[str]:
    return [part for part in (_safe_text(value) for value in values) if part]


def _filename_extension(filename: Any) -> str:
    text = _safe_text(filename)
    if not text:
        return ""

    return Path(text).suffix.lower()


def infer_analysis_memory_media_type(generated_output: Dict[str, Any]) -> str:
    """Infer media type from generated output metadata."""

    searchable_text = _normalize_text(
        " ".join(
            _text_parts(
                generated_output.get("action"),
                generated_output.get("label"),
                generated_output.get("filename"),
                generated_output.get("file_url"),
                generated_output.get("source_filename"),
                generated_output.get("result_type"),
                generated_output.get("command_text"),
            )
        )
    )

    filename_extension = _filename_extension(generated_output.get("filename"))
    source_extension = _filename_extension(generated_output.get("source_filename"))

    if filename_extension in VIDEO_EXTENSIONS or source_extension in VIDEO_EXTENSIONS:
        return "video"

    if filename_extension in IMAGE_EXTENSIONS or source_extension in IMAGE_EXTENSIONS:
        return "image"

    if "video" in searchable_text:
        return "video"

    if "image" in searchable_text or "crop" in searchable_text or "blur" in searchable_text:
        return "image"

    return "unknown"


def infer_analysis_memory_detected_classes(
    generated_output: Dict[str, Any],
) -> List[str]:
    """Infer lightweight class hints from generated output metadata.

    This is intentionally conservative because generated output rows do not
    store full detection JSON yet.
    """

    searchable_text = _normalize_text(
        " ".join(
            _text_parts(
                generated_output.get("action"),
                generated_output.get("label"),
                generated_output.get("filename"),
                generated_output.get("source_filename"),
                generated_output.get("command_text"),
                generated_output.get("result_type"),
            )
        )
    )

    detected_classes = set()

    for class_name in COMMON_DETECTION_CLASSES:
        normalized_class = _normalize_text(class_name)
        if normalized_class and normalized_class in searchable_text:
            detected_classes.add(CLASS_ALIASES.get(normalized_class, normalized_class))

    return sorted(detected_classes)


def infer_analysis_memory_privacy_signals(
    generated_output: Dict[str, Any],
    detected_classes: Iterable[str],
) -> List[str]:
    searchable_text = _normalize_text(
        " ".join(
            _text_parts(
                generated_output.get("action"),
                generated_output.get("label"),
                generated_output.get("filename"),
                generated_output.get("source_filename"),
                generated_output.get("command_text"),
                generated_output.get("result_type"),
            )
        )
    )

    class_set = set(detected_classes)
    signals = set()

    if "person" in class_set:
        signals.add("person_present")

    if any(
        phrase in searchable_text
        for phrase in (
            "privacy",
            "private",
            "blur",
            "hide",
            "anonym",
            "redact",
        )
    ):
        signals.add("manual_privacy_check_recommended")

    if not signals:
        signals.add("unknown")

    return sorted(signals)


def build_analysis_memory_workflow_signals(
    generated_output: Dict[str, Any],
) -> List[str]:
    signals = set()

    created_by = _normalize_text(generated_output.get("created_by"))
    source = _normalize_text(generated_output.get("source"))

    if "command" in created_by or generated_output.get("command_text"):
        signals.add("created_by_command")

    if "generated output" in created_by or source == "outputs":
        signals.add("created_from_generated_output")

    if generated_output.get("source_filename"):
        signals.add("has_source_filename")

    if generated_output.get("file_url"):
        signals.add("has_file_url")

    if generated_output.get("parser_mode") or generated_output.get("parser_type"):
        signals.add("has_parser_metadata")

    if generated_output.get("planner_mode"):
        signals.add("has_planner_metadata")

    if not signals:
        signals.add("metadata_only")

    return sorted(signals)


def build_analysis_memory_summary_text(
    generated_output: Dict[str, Any],
    media_type: str,
    detected_classes: Iterable[str],
) -> str:
    label = _safe_text(generated_output.get("label")) or "Generated output"
    action = _safe_text(generated_output.get("action")) or "unknown action"
    source_filename = _safe_text(generated_output.get("source_filename"))
    output_filename = _safe_text(generated_output.get("filename"))
    command_text = _safe_text(generated_output.get("command_text"))
    class_text = ", ".join(detected_classes)

    parts = [f"{label} was created as a {media_type} analysis memory item."]

    if source_filename:
        parts.append(f"Source file: {source_filename}.")

    if output_filename:
        parts.append(f"Output file: {output_filename}.")

    parts.append(f"Action: {action}.")

    if command_text:
        parts.append(f"Command: {command_text}.")

    if class_text:
        parts.append(f"Class hints: {class_text}.")

    return " ".join(parts)


def build_analysis_memory_search_text(memory_item: Dict[str, Any]) -> str:
    searchable_values = [
        memory_item.get("label"),
        memory_item.get("action"),
        memory_item.get("result_type"),
        memory_item.get("command_text"),
        memory_item.get("source_filename"),
        memory_item.get("output_filename"),
        memory_item.get("created_by"),
        memory_item.get("summary_text"),
        " ".join(memory_item.get("detected_classes") or []),
        " ".join(memory_item.get("privacy_signals") or []),
        " ".join(memory_item.get("workflow_signals") or []),
    ]

    return _normalize_text(" ".join(_text_parts(*searchable_values)))


def build_analysis_memory_item(
    generated_output: Dict[str, Any],
) -> Dict[str, Any]:
    """Convert one generated output record into an analysis memory item."""

    media_type = infer_analysis_memory_media_type(generated_output)
    detected_classes = infer_analysis_memory_detected_classes(generated_output)
    privacy_signals = infer_analysis_memory_privacy_signals(
        generated_output,
        detected_classes,
    )
    workflow_signals = build_analysis_memory_workflow_signals(generated_output)
    summary_text = build_analysis_memory_summary_text(
        generated_output,
        media_type,
        detected_classes,
    )

    memory_item = {
        "memory_id": generated_output.get("id"),
        "source_record_id": generated_output.get("id"),
        "source_record_type": "generated_output",
        "media_type": media_type,
        "source_filename": generated_output.get("source_filename"),
        "output_filename": generated_output.get("filename"),
        "file_url": generated_output.get("file_url"),
        "label": generated_output.get("label") or "",
        "action": generated_output.get("action") or "",
        "result_type": generated_output.get("result_type"),
        "command_text": generated_output.get("command_text"),
        "created_by": generated_output.get("created_by"),
        "created_at": generated_output.get("created_at"),
        "summary_text": summary_text,
        "detected_classes": detected_classes,
        "privacy_signals": privacy_signals,
        "workflow_signals": workflow_signals,
        "llm_metadata": {
            "execution_mode": generated_output.get("execution_mode"),
            "parser_mode": generated_output.get("parser_mode"),
            "parser_type": generated_output.get("parser_type"),
            "planner_mode": generated_output.get("planner_mode"),
        },
        "limitations": [
            "This memory item is based on stored generated output metadata.",
            "Detected classes are lightweight metadata hints unless richer analysis results are stored.",
            "Privacy signals are conservative and require manual review.",
        ],
    }
    memory_item["search_text"] = build_analysis_memory_search_text(memory_item)

    return memory_item


def build_analysis_memory_items(
    generated_outputs: Iterable[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    return [
        build_analysis_memory_item(output)
        for output in generated_outputs
        if isinstance(output, dict)
    ]


def _parse_datetime(value: Any) -> datetime:
    text = _safe_text(value)

    if not text:
        return datetime.min.replace(tzinfo=timezone.utc)

    normalized_text = text.replace("Z", "+00:00")

    try:
        parsed = datetime.fromisoformat(normalized_text)
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def _query_terms(query: str) -> List[str]:
    return [
        term
        for term in _normalize_text(query).split()
        if term and len(term) > 1
    ]


def score_analysis_memory_item(memory_item: Dict[str, Any], query: str) -> int:
    normalized_query = _normalize_text(query)

    if not normalized_query:
        return 1

    search_text = memory_item.get("search_text") or ""
    score = 0

    if normalized_query in search_text:
        score += 10

    source_filename = _normalize_text(memory_item.get("source_filename"))
    output_filename = _normalize_text(memory_item.get("output_filename"))
    action = _normalize_text(memory_item.get("action"))
    result_type = _normalize_text(memory_item.get("result_type"))

    if normalized_query and normalized_query == source_filename:
        score += 8

    if normalized_query and normalized_query == output_filename:
        score += 8

    if normalized_query and normalized_query == action:
        score += 5

    if normalized_query and normalized_query == result_type:
        score += 5

    for term in _query_terms(query):
        if term in search_text:
            score += 1

    return score


def _matches_optional_filter(value: Any, expected: Optional[str]) -> bool:
    if not expected:
        return True

    return _normalize_text(value) == _normalize_text(expected)


def retrieve_analysis_memory_from_generated_outputs(
    generated_outputs: Iterable[Dict[str, Any]],
    query: str = "",
    limit: int = 20,
    media_type: Optional[str] = None,
    source_filename: Optional[str] = None,
    result_type: Optional[str] = None,
    action: Optional[str] = None,
) -> Dict[str, Any]:
    """Retrieve analysis memory from generated output records."""

    safe_limit = max(1, min(int(limit or 20), 100))
    memory_items = build_analysis_memory_items(generated_outputs)
    scored_items = []

    for item in memory_items:
        if not _matches_optional_filter(item.get("media_type"), media_type):
            continue

        if not _matches_optional_filter(item.get("source_filename"), source_filename):
            continue

        if not _matches_optional_filter(item.get("result_type"), result_type):
            continue

        if not _matches_optional_filter(item.get("action"), action):
            continue

        score = score_analysis_memory_item(item, query)

        if _normalize_text(query) and score <= 0:
            continue

        scored_item = {
            **item,
            "retrieval_score": score,
        }
        scored_items.append(scored_item)

    scored_items.sort(
        key=lambda item: (
            item["retrieval_score"],
            _parse_datetime(item.get("created_at")),
        ),
        reverse=True,
    )

    items = scored_items[:safe_limit]
    limitations = [
        "Retrieval uses deterministic metadata matching, not semantic vector search.",
        "Retrieved items are based on stored generated output metadata.",
    ]

    if not items:
        if _normalize_text(query):
            limitations.append(
                "No matching analysis memory items were found for the query.",
            )
        else:
            limitations.append(
                "No analysis memory items were available for the selected filters.",
            )

    return {
        "status": "healthy",
        "query": query,
        "count": len(items),
        "items": items,
        "filters": {
            "media_type": media_type,
            "source_filename": source_filename,
            "result_type": result_type,
            "action": action,
            "limit": safe_limit,
        },
        "retrieval_mode": ANALYSIS_MEMORY_RETRIEVAL_MODE,
        "retrieval_version": ANALYSIS_MEMORY_RETRIEVAL_VERSION,
        "limitations": limitations,
    }


def retrieve_analysis_memory_from_database(
    query: str = "",
    limit: int = 20,
    media_type: Optional[str] = None,
    source_filename: Optional[str] = None,
    result_type: Optional[str] = None,
    action: Optional[str] = None,
    source_limit: int = 500,
) -> Dict[str, Any]:
    """Retrieve analysis memory using persisted generated output records."""

    from app.services import database_service

    payload = database_service.get_database_generated_outputs(limit=source_limit)

    if payload.get("status") != "healthy":
        return {
            "status": payload.get("status", "unknown"),
            "query": query,
            "count": 0,
            "items": [],
            "filters": {
                "media_type": media_type,
                "source_filename": source_filename,
                "result_type": result_type,
                "action": action,
                "limit": max(1, min(int(limit or 20), 100)),
            },
            "retrieval_mode": ANALYSIS_MEMORY_RETRIEVAL_MODE,
            "retrieval_version": ANALYSIS_MEMORY_RETRIEVAL_VERSION,
            "limitations": [
                "Persisted analysis memory is unavailable because generated output history is not healthy or not configured.",
            ],
        }

    return retrieve_analysis_memory_from_generated_outputs(
        payload.get("generated_outputs", []),
        query=query,
        limit=limit,
        media_type=media_type,
        source_filename=source_filename,
        result_type=result_type,
        action=action,
    )
