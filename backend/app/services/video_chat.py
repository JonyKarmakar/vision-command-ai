import json
import os
from collections import Counter
from urllib import error as url_error
from urllib import request as url_request

from fastapi import HTTPException

from app.services.llm_provider import get_llm_provider_status


VIDEO_CHAT_PROMPT_VERSION = "video-chat-prompt-v3"


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
        "videoObjectDetectionResult",
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


def _extract_video_object_detection(context):
    result = context.get("videoObjectDetectionResult") or context.get(
        "video_object_detection_result"
    )

    if isinstance(result, dict):
        return result

    return {}


def _build_video_object_analysis_summary(video_object_detection):
    if not isinstance(video_object_detection, dict) or not video_object_detection:
        return {"available": False}

    frames = video_object_detection.get("frames", [])
    class_summary = video_object_detection.get("class_summary", [])
    processed_frame_count = video_object_detection.get("processed_frame_count") or 0
    detection_count = video_object_detection.get("detection_count") or 0

    if not isinstance(frames, list) or not isinstance(class_summary, list):
        return {"available": False}

    timeline_by_class = {}

    for frame in frames:
        if not isinstance(frame, dict):
            continue

        timestamp = frame.get("timestamp_seconds")
        if not isinstance(timestamp, (int, float)):
            timestamp = 0

        classes_in_frame = set()

        for detection in frame.get("detections", []):
            if not isinstance(detection, dict):
                continue

            class_name = detection.get("class_name")
            if not class_name:
                continue

            existing = timeline_by_class.setdefault(
                class_name,
                {
                    "class_name": class_name,
                    "first_seen_seconds": timestamp,
                    "last_seen_seconds": timestamp,
                    "frame_count": 0,
                    "detection_count": 0,
                    "highest_confidence": 0,
                },
            )

            existing["first_seen_seconds"] = min(
                existing["first_seen_seconds"],
                timestamp,
            )
            existing["last_seen_seconds"] = max(
                existing["last_seen_seconds"],
                timestamp,
            )
            existing["detection_count"] += 1
            existing["highest_confidence"] = max(
                existing["highest_confidence"],
                detection.get("confidence") or 0,
            )
            classes_in_frame.add(class_name)

        for class_name in classes_in_frame:
            timeline_by_class[class_name]["frame_count"] += 1

    object_timeline = sorted(
        timeline_by_class.values(),
        key=lambda item: (
            item["first_seen_seconds"],
            -item["detection_count"],
        ),
    )

    moment_by_second = {}
    for frame in frames:
        if not isinstance(frame, dict) or not frame.get("detections"):
            continue

        timestamp = frame.get("timestamp_seconds")
        if not isinstance(timestamp, (int, float)):
            timestamp = 0

        second = int(timestamp)
        existing_moment = moment_by_second.setdefault(
            second,
            {
                "second": second,
                "detection_count": 0,
                "class_names": set(),
                "highest_confidence": 0,
            },
        )

        for detection in frame.get("detections", []):
            if not isinstance(detection, dict):
                continue

            class_name = detection.get("class_name")
            if class_name:
                existing_moment["class_names"].add(class_name)

            existing_moment["detection_count"] += 1
            existing_moment["highest_confidence"] = max(
                existing_moment["highest_confidence"],
                detection.get("confidence") or 0,
            )

    key_moments = []
    for moment in sorted(moment_by_second.values(), key=lambda item: item["second"])[:8]:
        key_moments.append(
            {
                "second": moment["second"],
                "detection_count": moment["detection_count"],
                "class_names": sorted(moment["class_names"]),
                "highest_confidence": moment["highest_confidence"],
            }
        )

    sorted_class_summary = sorted(
        class_summary,
        key=lambda item: (
            -(item.get("frame_count") or 0),
            -(item.get("detection_count") or 0),
        )
        if isinstance(item, dict)
        else (0, 0),
    )

    top_class_names = [
        item.get("class_name")
        for item in sorted_class_summary[:4]
        if isinstance(item, dict) and item.get("class_name")
    ]

    has_person = any(item.get("class_name") == "person" for item in object_timeline)
    has_sports_ball = any(
        item.get("class_name") == "sports ball" for item in object_timeline
    )

    detected_class_text = ", ".join(top_class_names) or "no detected object classes"

    if has_person and has_sports_ball:
        activity_headline = (
            "The video appears to show people and a sports ball across the scene, "
            "based on detected object classes and timestamps."
        )
    elif has_person:
        activity_headline = (
            "The video appears to focus mainly on people, based on detected object "
            "classes and timestamps."
        )
    else:
        activity_headline = (
            f"The video appears to contain {detected_class_text}, based on detected "
            "object classes and timestamps."
        )

    tracking_candidates = []
    for item in sorted(
        object_timeline,
        key=lambda entry: (
            -entry["frame_count"],
            -entry["detection_count"],
        ),
    )[:6]:
        coverage_percent = (
            round((item["frame_count"] / processed_frame_count) * 100)
            if processed_frame_count
            else 0
        )

        if coverage_percent >= 60:
            readiness_level = "Strong class-level tracking candidate"
        elif coverage_percent >= 20:
            readiness_level = "Moderate class-level tracking candidate"
        else:
            readiness_level = "Limited tracking evidence"

        tracking_candidates.append(
            {
                "class_name": item["class_name"],
                "coverage_percent": coverage_percent,
                "frame_count": item["frame_count"],
                "detection_count": item["detection_count"],
                "readiness_level": readiness_level,
            }
        )

    metadata = video_object_detection.get("video_metadata") or {}
    duration_seconds = metadata.get("duration_seconds")

    if not isinstance(duration_seconds, (int, float)):
        frame_timestamps = [
            frame.get("timestamp_seconds")
            for frame in frames
            if isinstance(frame, dict)
            and isinstance(frame.get("timestamp_seconds"), (int, float))
        ]
        duration_seconds = max(frame_timestamps) if frame_timestamps else 1

    duration_seconds = max(duration_seconds or 1, 1)

    segment_specs = [
        ("Beginning", 0, duration_seconds / 3),
        ("Middle", duration_seconds / 3, (duration_seconds * 2) / 3),
        ("End", (duration_seconds * 2) / 3, duration_seconds),
    ]

    segment_summaries = []
    for label, start_seconds, end_seconds in segment_specs:
        class_names = set()
        segment_detection_count = 0

        for frame in frames:
            if not isinstance(frame, dict):
                continue

            timestamp = frame.get("timestamp_seconds")
            if not isinstance(timestamp, (int, float)):
                continue

            if start_seconds <= timestamp <= end_seconds:
                for detection in frame.get("detections", []):
                    if not isinstance(detection, dict):
                        continue

                    class_name = detection.get("class_name")
                    if class_name:
                        class_names.add(class_name)
                    segment_detection_count += 1

        segment_summaries.append(
            {
                "label": label,
                "start_seconds": start_seconds,
                "end_seconds": end_seconds,
                "class_names": sorted(class_names),
                "detection_count": segment_detection_count,
            }
        )

    return {
        "available": True,
        "processed_frame_count": processed_frame_count,
        "detection_count": detection_count,
        "annotated_video_available": bool(
            video_object_detection.get("annotated_video_file_url")
        ),
        "class_summary": sorted_class_summary,
        "object_timeline": object_timeline,
        "key_moments": key_moments,
        "activity_summary": {
            "headline": activity_headline,
            "top_class_names": top_class_names,
        },
        "privacy_review": {
            "review_level": "Review before sharing"
            if has_person
            else "Check context before sharing",
            "people_detected": has_person,
            "note": "People are visible in the detected video frames, so review the video before external sharing."
            if has_person
            else "No person class was detected in the processed frames, but the original video should still be reviewed before sharing.",
        },
        "motion_change_summary": {
            "segment_summaries": segment_summaries,
            "note": "This compares detected object classes across video segments. It does not perform optical flow, speed estimation, or persistent tracking.",
        },
        "tracking_readiness_summary": {
            "candidates": tracking_candidates,
            "note": "This is class-level tracking readiness only. Stable tracking IDs are not assigned. Option B remains future backend work.",
        },
        "limitations": [
            "Does not identify people.",
            "Does not detect faces.",
            "Does not infer emotions, intent, location, or private activities.",
            "Does not assign persistent tracking IDs.",
        ],
    }


def _summarize_context(video_context):
    context = _safe_context(video_context)
    detections = _collect_detections(context)
    frames = _collect_frames(context)
    tracks = _collect_tracks(context)
    generated_outputs = _collect_generated_outputs(context)
    metadata = _extract_video_metadata(context)
    video_object_detection = _extract_video_object_detection(context)
    video_object_analysis = _build_video_object_analysis_summary(
        video_object_detection
    )

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
        "video_object_analysis": video_object_analysis,
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


def _contains_any_phrase(normalized_question, phrases):
    return any(phrase in normalized_question for phrase in phrases)


def _build_unsupported_video_question_answer(question, context_summary):
    normalized_question = question.lower().strip()
    class_summary = _format_class_counts(context_summary["detected_classes"])

    if _contains_any_phrase(
        normalized_question,
        ["identify", "who is", "who are", "name this person", "recognize"],
    ):
        return (
            "I can report detected object classes from the sampled video context, "
            "but I cannot identify who a person is. "
            f"The current video context contains detections for {class_summary}. "
            "This project does not perform face recognition or identity lookup."
        )

    if _contains_any_phrase(
        normalized_question,
        ["where", "location", "city", "country", "place", "recorded", "filmed"],
    ):
        return (
            "I cannot infer where this video was recorded from sampled detections alone. "
            f"The current video context contains detections for {class_summary}. "
            "Location would require explicit metadata or user-provided context."
        )

    if _contains_any_phrase(
        normalized_question,
        ["happy", "sad", "angry", "emotion", "feeling", "mood"],
    ):
        return (
            "I cannot determine a person's emotion, mood, or intent from sampled detection context. "
            f"The current video context contains detections for {class_summary}. "
            "A more grounded question would be about detected objects, privacy review, or tracking results."
        )

    if _contains_any_phrase(
        normalized_question,
        ["what is happening", "what's happening", "activity", "doing", "intent"],
    ):
        if (
            context_summary.get("sampled_frame_count", 0) > 0
            and context_summary.get("detection_count", 0) > 0
            and context_summary.get("track_count", 0) == 0
        ):
            return _build_safe_sampled_detection_answer(context_summary)

    return None


def _is_summary_question(question):
    normalized_question = question.lower().strip()
    return any(
        phrase in normalized_question
        for phrase in ["what happens", "what is happening", "what's happening", "summarize", "summary", "what do you see"]
    )


def _format_timestamps(timestamps):
    if not timestamps:
        return ""

    formatted = []
    for timestamp in timestamps[:5]:
        if isinstance(timestamp, int):
            formatted.append(f"{timestamp}s")
        elif isinstance(timestamp, float):
            formatted.append(f"{timestamp:g}s")

    if not formatted:
        return ""

    if len(formatted) == 1:
        return f" at {formatted[0]}"

    return f" at {', '.join(formatted[:-1])} and {formatted[-1]}"


def _build_safe_sampled_detection_answer(context_summary):
    class_summary = _format_class_counts(context_summary["detected_classes"])
    timestamp_summary = _format_timestamps(
        context_summary.get("sampled_timestamps_seconds", [])
    )

    no_tracking_sentence = ""
    if context_summary.get("track_count", 0) == 0:
        no_tracking_sentence = " No tracking result is available."

    return (
        f"Based on sampled frames{timestamp_summary}, the structured video context "
        f"contains detections for {class_summary}. "
        "I cannot describe the full activity, scene, location, or intent from this "
        "sampled detection context alone."
        f"{no_tracking_sentence} "
        "This is based on sampled video/workflow context, not raw video-level understanding."
    )


def _should_guard_real_llm_answer(question, answer, context_summary):
    if not _is_summary_question(question):
        return False

    if context_summary.get("video_object_analysis", {}).get("available"):
        return False

    has_sampled_detection_context = (
        context_summary.get("sampled_frame_count", 0) > 0
        and context_summary.get("detection_count", 0) > 0
    )
    has_tracking_context = context_summary.get("track_count", 0) > 0

    if not has_sampled_detection_context or has_tracking_context:
        return False

    # For summary questions, sampled detections without tracking are not enough
    # to safely describe activity, movement, intent, or scene details. Small
    # local models often over-infer from class labels, so use a deterministic
    # sampled-context answer instead.
    return True


def _format_analysis_class_summary(class_summary):
    if not isinstance(class_summary, list) or not class_summary:
        return "no detected object classes"

    formatted = []
    for item in class_summary[:6]:
        if not isinstance(item, dict):
            continue

        class_name = item.get("class_name") or item.get("className")
        frame_count = item.get("frame_count") or item.get("frameCount")
        detection_count = item.get("detection_count") or item.get("detectionCount")

        if class_name:
            formatted.append(
                f"{class_name} in {frame_count} frame(s), {detection_count} box(es)"
            )

    return ", ".join(formatted) if formatted else "no detected object classes"


def _format_key_moments(key_moments):
    if not isinstance(key_moments, list) or not key_moments:
        return "no key moments are available"

    formatted = []
    for moment in key_moments[:4]:
        if not isinstance(moment, dict):
            continue

        second = moment.get("second")
        class_names = moment.get("class_names") or moment.get("classNames") or []
        detection_count = moment.get("detection_count") or moment.get("detectionCount")

        if isinstance(class_names, list):
            classes = ", ".join(str(class_name) for class_name in class_names[:5])
        else:
            classes = "detected classes"

        formatted.append(f"{second}s: {classes} ({detection_count} box(es))")

    return "; ".join(formatted) if formatted else "no key moments are available"


def _format_object_timeline(object_timeline):
    if not isinstance(object_timeline, list) or not object_timeline:
        return "no object timing is available"

    formatted = []
    for item in object_timeline[:6]:
        if not isinstance(item, dict):
            continue

        class_name = item.get("class_name") or item.get("className")
        first_seen = (
            item.get("first_seen_seconds")
            if item.get("first_seen_seconds") is not None
            else item.get("firstSeenSeconds")
        )
        last_seen = (
            item.get("last_seen_seconds")
            if item.get("last_seen_seconds") is not None
            else item.get("lastSeenSeconds")
        )
        frame_count = (
            item.get("frame_count")
            if item.get("frame_count") is not None
            else item.get("frameCount")
        )
        detection_count = (
            item.get("detection_count")
            if item.get("detection_count") is not None
            else item.get("detectionCount")
        )

        if class_name is None:
            continue

        first_seen_text = f"{first_seen:g}s" if isinstance(first_seen, (int, float)) else "unknown time"
        last_seen_text = f"{last_seen:g}s" if isinstance(last_seen, (int, float)) else "unknown time"

        formatted.append(
            f"{class_name} from {first_seen_text} to {last_seen_text} "
            f"({frame_count} frame(s), {detection_count} box(es))"
        )

    return "; ".join(formatted) if formatted else "no object timing is available"


def _build_video_object_analysis_answer(question, context_summary):
    analysis = context_summary.get("video_object_analysis", {})
    if not isinstance(analysis, dict) or not analysis.get("available"):
        return None

    normalized_question = question.lower().strip()
    object_summary = _format_analysis_class_summary(
        analysis.get("class_summary", [])
    )
    object_timing = _format_object_timeline(analysis.get("object_timeline", []))
    key_moments = _format_key_moments(analysis.get("key_moments", []))
    activity_summary = analysis.get("activity_summary", {})
    privacy_review = analysis.get("privacy_review", {})
    tracking_readiness = analysis.get("tracking_readiness_summary", {})
    motion_change = analysis.get("motion_change_summary", {})

    if any(
        phrase in normalized_question
        for phrase in ["privacy", "private", "blur", "hide", "anonym"]
    ):
        review_level = privacy_review.get("review_level", "Review before sharing")
        note = privacy_review.get(
            "note",
            "Review the original and annotated video before sharing.",
        )
        return (
            f"Privacy review: {review_level}. {note} "
            "This is based on detected object classes and timestamps only. "
            "It does not identify people, detect faces, infer emotions, or make private activity claims."
        )

    if any(
        phrase in normalized_question
        for phrase in ["tracking", "track", "ready for real tracking", "stable id", "object id"]
    ):
        candidates = tracking_readiness.get("candidates", [])
        if isinstance(candidates, list) and candidates:
            candidate_summary = ", ".join(
                f"{candidate.get('class_name')} ({candidate.get('readiness_level')})"
                for candidate in candidates[:4]
                if isinstance(candidate, dict)
            )
        else:
            candidate_summary = "no strong tracking candidates"

        return (
            f"Tracking readiness is class-level only. Candidate summary: {candidate_summary}. "
            "Stable object IDs are not assigned, and multiple objects of the same class are not distinguished. "
            "Option B remains future work: a real backend tracker with persistent IDs and track-level summaries."
        )

    if any(
        phrase in normalized_question
        for phrase in ["changed", "change", "motion", "beginning", "middle", "end"]
    ):
        segment_summaries = motion_change.get("segment_summaries", [])
        if isinstance(segment_summaries, list) and segment_summaries:
            segments = []
            for segment in segment_summaries[:3]:
                if isinstance(segment, dict):
                    classes = segment.get("class_names", [])
                    class_text = ", ".join(classes) if isinstance(classes, list) else "detected classes"
                    segments.append(
                        f"{segment.get('label')}: {class_text} ({segment.get('detection_count')} box(es))"
                    )
            segment_text = "; ".join(segments)
        else:
            segment_text = "no segment summary is available"

        return (
            f"Detection-based change summary: {segment_text}. "
            "This compares detected object classes across processed frames. "
            "It does not perform optical flow, estimate speed or direction, or assign persistent tracking IDs."
        )

    if any(phrase in normalized_question for phrase in ["objects", "appear", "detected", "person"]):
        return (
            f"The structured video analysis detected {object_summary}. "
            f"Object timing: {object_timing}. "
            "This is based on processed-frame detections, not raw-video understanding."
        )

    if any(phrase in normalized_question for phrase in ["key moment", "key moments", "moment"]):
        return (
            f"Key moments from the structured video analysis are: {key_moments}. "
            "These moments are based on detected object classes and timestamps from processed frames."
        )

    if any(
        phrase in normalized_question
        for phrase in ["what happens", "what is happening", "what's happening", "summarize", "summary", "what do you see"]
    ):
        headline = activity_summary.get(
            "headline",
            "The video analysis is based on detected object classes and timestamps.",
        )
        return (
            f"{headline} The main detected object evidence is: {object_summary}. "
            f"Key moments include {key_moments}. "
            "This answer is grounded in structured video analysis, not identity recognition, face detection, emotion inference, or raw-video scene understanding."
        )

    return None


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

    unsupported_answer = _build_unsupported_video_question_answer(
        question,
        context_summary,
    )

    if unsupported_answer:
        return unsupported_answer

    video_object_analysis_answer = _build_video_object_analysis_answer(
        question,
        context_summary,
    )
    if video_object_analysis_answer:
        return video_object_analysis_answer

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
        "Do not infer the full activity, scene, sport, location, or intent from object classes alone. "
        "If the context only has sampled detections, say sampled frames contain those objects. "
        "Do not say tracked, tracking, movement, or changed between frames unless track_count is greater than 0 or tracking context is present. "
        "If track_count is 0, say no tracking result is available. "
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
Ground the answer only in structured video object analysis, sampled-frame detections, video metadata, tracking results if present, and workflow context.
Do not invent visual details that are not in the structured context.
Do not describe the video as sports-related, outdoor, indoor, a game, a scene, or an activity unless that is explicitly present in the structured context.
If track_count is 0, do not use the words tracked, tracking, movement, or changed except to say that no tracking result is available.
For summary questions, say what objects appear in sampled frames and mention the sampled timestamps when available.
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
        responder_type = "real_llm"

        if _should_guard_real_llm_answer(
            question=question.strip(),
            answer=answer,
            context_summary=prompt_preview["context_summary"],
        ):
            answer = _build_safe_sampled_detection_answer(
                prompt_preview["context_summary"]
            )
            responder_type = "real_llm_guarded"

        return {
            "question": question.strip(),
            "answer": answer,
            "response_mode": response_mode,
            "responder_type": responder_type,
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
