from app.services import video_chat


PROVIDER_STATUS = {
    "provider_name": "ollama",
    "provider_model": "llama3.2:1b",
    "is_supported": True,
    "is_configured": True,
    "real_llm_available": True,
    "supported_llm_providers": ["disabled", "ollama", "openai"],
    "supported_parser_modes": ["rule_based", "llm_mock", "real_llm"],
    "supported_planner_modes": ["rule_based", "llm_mock", "real_llm"],
}


VIDEO_CONTEXT = {
    "videoUploadResult": {
        "metadata": {
            "is_readable": True,
            "width": 854,
            "height": 480,
            "fps": 30,
            "frame_count": 120,
            "duration_seconds": 4.0,
        }
    },
    "videoSampledDetectionResult": {
        "filename": "clip_2.mp4",
        "video_metadata": {
            "is_readable": True,
            "width": 854,
            "height": 480,
            "fps": 30,
            "frame_count": 120,
            "duration_seconds": 4.0,
        },
        "detection": {
            "frame_count": 2,
            "frames": [
                {
                    "frame_filename": "frame_0.jpg",
                    "timestamp_seconds": 0,
                    "detections": [
                        {
                            "class_name": "person",
                            "confidence": 0.91,
                            "bbox": {},
                        },
                        {
                            "class_name": "sports ball",
                            "confidence": 0.77,
                            "bbox": {},
                        },
                    ],
                    "detection_count": 2,
                },
                {
                    "frame_filename": "frame_1.jpg",
                    "timestamp_seconds": 1,
                    "detections": [
                        {
                            "class_name": "person",
                            "confidence": 0.88,
                            "bbox": {},
                        }
                    ],
                    "detection_count": 1,
                },
            ],
        },
    },
}


def test_real_llm_summary_without_tracking_uses_grounded_answer(monkeypatch):
    monkeypatch.setattr(
        video_chat,
        "get_llm_provider_status",
        lambda: PROVIDER_STATUS,
    )
    monkeypatch.setattr(
        video_chat,
        "_answer_with_ollama",
        lambda system_prompt, user_prompt: (
            "This video appears to show two people interacting with a sports ball."
        ),
    )

    result = video_chat.answer_video_chat(
        question="What happens in this video?",
        video_context=VIDEO_CONTEXT,
        response_mode="auto",
    )

    assert result["responder_type"] == "real_llm_guarded"
    assert result["prompt_version"] == "video-chat-prompt-v3"
    assert "person (2)" in result["answer"]
    assert "sports ball (1)" in result["answer"]
    assert "No tracking result is available." in result["answer"]
    assert "raw video-level understanding" in result["answer"]

    answer_lower = result["answer"].lower()
    assert "interacting" not in answer_lower
    assert "walking" not in answer_lower
    assert "running" not in answer_lower
    assert "hallway" not in answer_lower
    assert "in their hand" not in answer_lower
