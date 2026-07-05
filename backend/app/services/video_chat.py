import json
import os
from collections import Counter
from urllib import error as url_error
from urllib import request as url_request

from fastapi import HTTPException

from app.services.llm_provider import get_llm_provider_status


VIDEO_CHAT_PROMPT_VERSION = "video-chat-prompt-v1"


def _safe_context(video_context):
    if isinstance(video_context, dict):
        return video_context

    return {}


def _collect_detections(value):
    detections = []

    if isinstance(value, dict):
        if isinstance(value.get("detections"), list):
            for detection in value["detections"]:
                if isinstance(detection, dict) and detection.get("class_name"):
                    detections.append(detection)

        for nested_value in value.values():
            detections.extend(_collect_detections(nested_value))

    if isinstance(value, list):
        for item in value:
            detections.extend(_collect_detections(item))

    return detections


def _collect_frames(value):
    frames = []

    if isinstance(value, dict):
        for key in ("frames", "extracted_frames"):
            if isinstance(value.get(key), list):
                frames.extend(item for item in value[key] if isinstance(item, dict))

        for nested_value in value.values():
            frames.extend(_collect_frames(nested_value))

    if isinstance(value, list):
        for item in value:
            frames.extend(_collect_frames(item))

    return frames


def _collect_tracks(value):
    tracks = []

    if isinstance(value, dict):
        if isinstance(value.get("tracks"), list):
            tracks.extend(item for item in value["tracks"] if isinstance(item, dict))

        for nested_value in value.values():
            tracks.extend(_collect_tracks(nested_value))

    if isinstance(value, list):
        for item in value:
            tracks.extend(_collect_tracks(item))

    return tracks


def _collect_generated_outputs(value):
    outputs = []

    if isinstance(value, dict):
        for key in (
            "generated_outputs",
            "generatedOutputHistory",
            "generated_output_history",
        ):
            if isinstance(value.get(key), list):
                outputs.extend(
                    item for item in value[key] if isinstance(item, dict)
                )

        for nested_value in value.values():
            outputs.extend(_collect_generated_outputs(nested_value))

    if isinstance(value, list):
        for item in value:
            outputs.extend(_collect_generated_outputs(item))

    return outputs


def _extract_video_metadata(context):
    for key in ("videoUploadResult", "video_upload_result", "video_upload"):
        result = context.get(key)
        if isinstance(result, dict) and isinstance(result.get("metadata"), dict):
            return result["metadata"]

    for key in (
        "videoSampledDetectionResult",
        "videoTrackingResult",
        "videoTrimResult",
    ):
        result = context.get(key)
        if isinstance(result, dict):
            if isinstance(result.get("video_metadata"), dict):
                return result["video_metadata"]
            if isinstance(result.get("metadata"), dict):
                return result["metadata"]

    return {}


def _summarize_context(video_context):
    context = _safe_context(video_context)
    detections = _collect_detections(context)
    frames = _collect_frames(context)
    tracks = _collect_tracks(context)
    generated_outputs = _collect_generated_outputs(context)
    metadata = _extract_video_metadata(context)

    class_counts = Counter(
        str(detection.get("class_name"))
        for detection in detections
        if detection.get("class_name")
    )

    frame_timestamps = []
    for frame in frames:
        timestamp = frame.get("timestamp_seconds")
        if isinstance(timestamp, (int, float)):
            frame_timestamps.append(timestamp)

    return {
        "context_keys": sorted(context.keys()),
        "video_metadata": {
            "width": metadata.get("width"),
            "height": metadata.get("height"),
            "fps": metadata.get("fps"),
            "frame_count": metadata.get("frame_count"),
            "duration_seconds": metadata.get("duration_seconds"),
            "is_readable": metadata.get("is_readable"),
        },
        "detection_count": len(detections),
        "detected_classes": dict(sorted(class_counts.items())),
        "sampled_frame_count": len(frames),
        "sampled_timestamps_seconds": sorted(set(frame_timestamps))[:20],
        "track_count": len(tracks),
        "track_classes": dict(
            sorted(
                Counter(
                    str(track.get("class_name"))
                    for track in tracks
                    if track.get("class_name")
                ).items()
            )
        ),
        "generated_output_count": len(generated_outputs),
        "recent_generated_outputs": [
            {
                "label": output.get("label"),
                "action": output.get("action"),
                "result_type": output.get("result_type"),
                "command_text": output.get("command_text"),
                "filename": output.get("filename"),
            }
            for output in generated_outputs[:5]
        ],
    }


def _format_class_counts(class_counts):
    if not class_counts:
        return "no detected objects"

    return ", ".join(
        f"{class_name} ({count})"
        for class_name, count in class_counts.items()
    )


def _format_duration(duration_seconds):
    if not isinstance(duration_seconds, (int, float)):
        return "unknown duration"

    return f"{duration_seconds:.1f} seconds"


def _build_rule_based_answer(question, context_summary):
    normalized_question = question.lower().strip()
    detected_classes = context_summary["detected_classes"]
    detection_count = context_summary["detection_count"]
    sampled_frame_count = context_summary["sampled_frame_count"]
    generated_output_count = context_summary["generated_output_count"]
    track_count = context_summary["track_count"]
    class_summary = _format_class_counts(detected_classes)
    duration = _format_duration(
        context_summary.get("video_metadata", {}).get("duration_seconds")
    )

    if detection_count == 0 and sampled_frame_count == 0:
        return (
            "I do not have sampled-frame or detection context for the current video yet. "
            "Upload a video and run frame extraction, sampled detection, or tracking first, "
            "then ask again for a more grounded video summary."
        )

    if any(word in normalized_question for word in ["privacy", "private", "blur", "hide", "anonym"]):
        if "person" in detected_classes:
            return (
                "For privacy, I recommend reviewing the sampled frames with detected people first. "
                f"The current video context includes {class_summary}. "
                "This answer is based on sampled detection and workflow context, so manually check "
                "for faces, screens, documents, text, license plates, and other sensitive details "
                "before sharing the video."
            )

        return (
            "I do not see people in the current sampled detection context. "
            f"The detected objects are {class_summary}. Still manually review the video for "
            "faces, screens, documents, text, license plates, and other sensitive details."
        )

    if any(phrase in normalized_question for phrase in ["what happens", "summarize", "summary", "what do you see"]):
        return (
            f"The current video context covers {sampled_frame_count} sampled frame"
            f"{'' if sampled_frame_count == 1 else 's'} from a video with {duration}. "
            f"It includes {detection_count} detected object"
            f"{'' if detection_count == 1 else 's'}: {class_summary}. "
            "This is based on structured sampled-frame and workflow context, not raw video-level understanding."
        )

    if any(phrase in normalized_question for phrase in ["objects", "appear", "detected", "person"]):
        return (
            f"The sampled video context includes {detection_count} detected object"
            f"{'' if detection_count == 1 else 's'} across the available frames: {class_summary}."
        )

    if any(phrase in normalized_question for phrase in ["changed", "between frames", "tracking", "track"]):
        if track_count > 0:
            return (
                f"The tracking context includes {track_count} track"
                f"{'' if track_count == 1 else 's'} across sampled frames. "
                f"Tracked classes include {_format_class_counts(context_summary['track_classes'])}. "
                "Use this as a structured movement summary rather than full video understanding."
            )

        return (
            "I do not see tracking results in the current video context yet. "
            "Run sampled video tracking first to answer what changed between frames more reliably."
        )

    if any(phrase in normalized_question for phrase in ["what did i do", "history", "so far", "workflow"]):
        if generated_output_count == 0:
            return (
                "I do not see generated-output history for this video yet. "
                "After you run trim, frame extraction, sampled detection, or tracking, "
                "I can summarize the workflow history."
            )

        return (
            f"I can see {generated_output_count} generated output"
            f"{'' if generated_output_count == 1 else 's'} in the current workflow context. "
            "These outputs may include trim, frame extraction, sampled detection, tracking, or other assistant actions."
        )

    return (
        f"Based on the current structured video context, I found {detection_count} "
        f"detected object{'' if detection_count == 1 else 's'} across sampled frames: {class_summary}. "
        "Ask a more specific question such as what objects appear, what should I review for privacy, "
        "or what changed between frames."
    )


def build_video_chat_prompt(question, video_context):
    context_summary = _summarize_context(video_context)
    compact_context = json.dumps(context_summary, indent=2, sort_keys=True)

    system_prompt = (
        "You are VisionCommand AI, a helpful video workflow assistant. "
        "Answer questions using only the structured video context provided. "
        "Do not claim to watch raw video pixels. Be honest about limitations. "
        "If the context includes person detections, refer to them as people or persons, not faces unless a face class is present. "
        "Do not discuss model accuracy unless the user asks about model performance. "
        "When privacy is mentioned, recommend practical review of people, faces, screens, documents, text, license plates, and sensitive objects."
    )

    user_prompt = f"""
Question:
{question}

Structured video context summary:
{compact_context}

Answer in 2 to 5 concise sentences.
Use plain product language for a normal user.
Ground the answer in sampled-frame detections, video metadata, tracking, and workflow context.
Do not invent visual details that are not in the structured context.
Mention when the answer is based on sampled video/workflow context rather than raw video-level understanding.
""".strip()

    return {
        "prompt_version": VIDEO_CHAT_PROMPT_VERSION,
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
        "context_summary": context_summary,
    }


def _answer_with_ollama(system_prompt, user_prompt):
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip().rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "").strip()

    if not model:
        raise HTTPException(
            status_code=503,
            detail="OLLAMA_MODEL is not configured for video chat.",
        )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "options": {
            "temperature": 0.2,
        },
    }

    request = url_request.Request(
        f"{base_url}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with url_request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except url_error.URLError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama video chat request failed: {exc}",
        ) from exc

    answer = (
        data.get("message", {}).get("content")
        or data.get("response")
        or ""
    ).strip()

    if not answer:
        raise HTTPException(
            status_code=502,
            detail="Ollama returned an empty video chat answer.",
        )

    return answer


def answer_video_chat(question, video_context=None, response_mode="auto"):
    if not question or not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Video chat question cannot be empty.",
        )

    if response_mode not in {"auto", "rule_based", "real_llm"}:
        raise HTTPException(
            status_code=400,
            detail="response_mode must be one of: auto, rule_based, real_llm",
        )

    prompt_preview = build_video_chat_prompt(
        question=question.strip(),
        video_context=video_context or {},
    )
    provider_status = get_llm_provider_status()

    should_try_real_llm = (
        response_mode == "real_llm"
        or (
            response_mode == "auto"
            and provider_status.get("provider_name") == "ollama"
            and provider_status.get("real_llm_available")
        )
    )

    if should_try_real_llm:
        if not provider_status.get("real_llm_available"):
            raise HTTPException(
                status_code=503,
                detail="Real LLM provider is not available for video chat.",
            )

        if provider_status.get("provider_name") != "ollama":
            raise HTTPException(
                status_code=503,
                detail="Video chat currently supports local Ollama for real_llm mode.",
            )

        answer = _answer_with_ollama(
            system_prompt=prompt_preview["system_prompt"],
            user_prompt=prompt_preview["user_prompt"],
        )

        return {
            "question": question.strip(),
            "answer": answer,
            "response_mode": response_mode,
            "responder_type": "real_llm",
            "prompt_version": prompt_preview["prompt_version"],
            "provider_status": provider_status,
            "used_context_keys": prompt_preview["context_summary"]["context_keys"],
            "context_summary": prompt_preview["context_summary"],
        }

    answer = _build_rule_based_answer(
        question=question.strip(),
        context_summary=prompt_preview["context_summary"],
    )

    return {
        "question": question.strip(),
        "answer": answer,
        "response_mode": response_mode,
        "responder_type": "rule_based",
        "prompt_version": prompt_preview["prompt_version"],
        "provider_status": provider_status,
        "used_context_keys": prompt_preview["context_summary"]["context_keys"],
        "context_summary": prompt_preview["context_summary"],
    }
