from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_video_chat_answers_privacy_question_from_sampled_detections():
    response = client.post(
        "/assistant/video-chat",
        json={
            "question": "What should I blur for privacy?",
            "response_mode": "rule_based",
            "video_context": {
                "videoSampledDetectionResult": {
                    "filename": "sample.mp4",
                    "video_metadata": {
                        "is_readable": True,
                        "width": 640,
                        "height": 360,
                        "fps": 30,
                        "frame_count": 120,
                        "duration_seconds": 4.0,
                    },
                    "detection": {
                        "frame_count": 2,
                        "frames": [
                            {
                                "frame_filename": "frame_0.jpg",
                                "detections": [
                                    {
                                        "class_id": 0,
                                        "class_name": "person",
                                        "confidence": 0.91,
                                        "bbox": {},
                                    }
                                ],
                                "detection_count": 1,
                            },
                            {
                                "frame_filename": "frame_1.jpg",
                                "detections": [
                                    {
                                        "class_id": 2,
                                        "class_name": "car",
                                        "confidence": 0.82,
                                        "bbox": {},
                                    }
                                ],
                                "detection_count": 1,
                            },
                        ],
                    },
                }
            },
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["responder_type"] == "rule_based"
    assert data["prompt_version"] == "video-chat-prompt-v3"
    assert "privacy" in data["answer"].lower()
    assert "person" in data["answer"].lower() or "people" in data["answer"].lower()
    assert data["context_summary"]["detected_classes"]["person"] == 1
    assert data["context_summary"]["detected_classes"]["car"] == 1


def test_video_chat_summarizes_sampled_video_context():
    response = client.post(
        "/assistant/video-chat",
        json={
            "question": "What happens in this video?",
            "response_mode": "rule_based",
            "video_context": {
                "videoUploadResult": {
                    "metadata": {
                        "is_readable": True,
                        "width": 640,
                        "height": 360,
                        "fps": 30,
                        "frame_count": 120,
                        "duration_seconds": 4.0,
                    }
                },
                "videoMultiFrameDetectionResult": {
                    "frame_count": 2,
                    "frames": [
                        {
                            "frame_filename": "frame_0.jpg",
                            "detections": [
                                {"class_name": "person", "confidence": 0.91, "bbox": {}},
                                {"class_name": "dog", "confidence": 0.72, "bbox": {}},
                            ],
                            "detection_count": 2,
                        },
                        {
                            "frame_filename": "frame_1.jpg",
                            "detections": [
                                {"class_name": "person", "confidence": 0.88, "bbox": {}},
                            ],
                            "detection_count": 1,
                        },
                    ],
                },
            },
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "person (2)" in data["answer"]
    assert "dog (1)" in data["answer"]
    assert data["context_summary"]["detection_count"] == 3
    assert data["context_summary"]["sampled_frame_count"] == 2


def test_video_chat_explains_tracking_missing_for_frame_change_question():
    response = client.post(
        "/assistant/video-chat",
        json={
            "question": "What changed between frames?",
            "response_mode": "rule_based",
            "video_context": {
                "videoMultiFrameDetectionResult": {
                    "frame_count": 1,
                    "frames": [
                        {
                            "frame_filename": "frame_0.jpg",
                            "detections": [
                                {"class_name": "person", "confidence": 0.91, "bbox": {}},
                            ],
                            "detection_count": 1,
                        }
                    ],
                }
            },
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "tracking" in data["answer"].lower()
    assert "run sampled video tracking" in data["answer"].lower()


def test_video_chat_rejects_empty_question():
    response = client.post(
        "/assistant/video-chat",
        json={
            "question": "   ",
            "response_mode": "rule_based",
            "video_context": {},
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Video chat question cannot be empty."


def test_video_chat_rejects_unknown_response_mode():
    response = client.post(
        "/assistant/video-chat",
        json={
            "question": "What happens in this video?",
            "response_mode": "unknown",
            "video_context": {},
        },
    )

    assert response.status_code == 422
