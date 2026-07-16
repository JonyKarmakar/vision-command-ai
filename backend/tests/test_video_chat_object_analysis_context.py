from app.services.video_chat import answer_video_chat


def _video_context_with_object_detection():
    return {
        "videoUploadResult": {
            "metadata": {
                "width": 854,
                "height": 480,
                "fps": 30,
                "frame_count": 90,
                "duration_seconds": 3,
                "is_readable": True,
            }
        },
        "videoObjectDetectionResult": {
            "video_metadata": {
                "width": 854,
                "height": 480,
                "fps": 30,
                "frame_count": 90,
                "duration_seconds": 3,
                "is_readable": True,
            },
            "processed_frame_count": 3,
            "detection_count": 5,
            "annotated_video_file_url": "/media/outputs/annotated.mp4",
            "class_summary": [
                {
                    "class_name": "person",
                    "frame_count": 3,
                    "detection_count": 3,
                    "highest_confidence": 0.95,
                },
                {
                    "class_name": "sports ball",
                    "frame_count": 2,
                    "detection_count": 2,
                    "highest_confidence": 0.91,
                },
            ],
            "frames": [
                {
                    "timestamp_seconds": 0,
                    "detection_count": 2,
                    "detections": [
                        {"class_name": "person", "confidence": 0.9},
                        {"class_name": "sports ball", "confidence": 0.84},
                    ],
                },
                {
                    "timestamp_seconds": 1,
                    "detection_count": 2,
                    "detections": [
                        {"class_name": "person", "confidence": 0.95},
                        {"class_name": "sports ball", "confidence": 0.91},
                    ],
                },
                {
                    "timestamp_seconds": 2,
                    "detection_count": 1,
                    "detections": [
                        {"class_name": "person", "confidence": 0.93},
                    ],
                },
            ],
        },
    }


def test_video_chat_uses_object_detection_context_for_summary():
    response = answer_video_chat(
        question="Summarize this video analysis",
        video_context=_video_context_with_object_detection(),
        response_mode="rule_based",
    )

    assert response["responder_type"] == "rule_based"
    assert response["context_summary"]["video_object_analysis"]["available"] is True
    assert "people and a sports ball" in response["answer"]
    assert "structured video analysis" in response["answer"]
    assert "identity recognition" in response["answer"]


def test_video_chat_answers_privacy_from_object_analysis_context():
    response = answer_video_chat(
        question="What should I review for privacy?",
        video_context=_video_context_with_object_detection(),
        response_mode="rule_based",
    )

    assert "Privacy review" in response["answer"]
    assert "Review before sharing" in response["answer"]
    assert "does not identify people" in response["answer"]


def test_video_chat_answers_tracking_readiness_without_claiming_tracking_ids():
    response = answer_video_chat(
        question="Is this ready for real tracking?",
        video_context=_video_context_with_object_detection(),
        response_mode="rule_based",
    )

    assert "Tracking readiness is class-level only" in response["answer"]
    assert "Stable object IDs are not assigned" in response["answer"]
    assert "Option B remains future work" in response["answer"]


def test_video_chat_answers_object_timing_separately_from_key_moments():
    response = answer_video_chat(
        question="What objects appear and when?",
        video_context=_video_context_with_object_detection(),
        response_mode="rule_based",
    )

    assert "Object timing" in response["answer"]
    assert "person from 0s to 2s" in response["answer"]
    assert "sports ball from 0s to 1s" in response["answer"]
    assert "Key moments from the structured video analysis" not in response["answer"]
