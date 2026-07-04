from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_image_chat_answers_privacy_question_from_detection_context():
    response = client.post(
        "/assistant/image-chat",
        json={
            "question": "What should I blur for privacy?",
            "response_mode": "rule_based",
            "image_context": {
                "detectionResult": {
                    "detection_count": 2,
                    "detections": [
                        {
                            "class_id": 0,
                            "class_name": "person",
                            "confidence": 0.91,
                            "bbox": {
                                "x1": 10,
                                "y1": 20,
                                "x2": 100,
                                "y2": 200,
                            },
                        },
                        {
                            "class_id": 2,
                            "class_name": "car",
                            "confidence": 0.82,
                            "bbox": {
                                "x1": 120,
                                "y1": 30,
                                "x2": 260,
                                "y2": 210,
                            },
                        },
                    ],
                }
            },
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["responder_type"] == "rule_based"
    assert data["prompt_version"] == "image-chat-prompt-v1"
    assert "person" in data["answer"].lower()
    assert "privacy" in data["answer"].lower()
    assert data["context_summary"]["detected_classes"]["person"] == 1
    assert data["context_summary"]["detected_classes"]["car"] == 1


def test_image_chat_summarizes_detected_objects():
    response = client.post(
        "/assistant/image-chat",
        json={
            "question": "What objects are detected?",
            "response_mode": "rule_based",
            "image_context": {
                "detectionResult": {
                    "detection_count": 3,
                    "detections": [
                        {"class_name": "person", "confidence": 0.91, "bbox": {}},
                        {"class_name": "person", "confidence": 0.88, "bbox": {}},
                        {"class_name": "dog", "confidence": 0.76, "bbox": {}},
                    ],
                }
            },
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "person (2)" in data["answer"]
    assert "dog (1)" in data["answer"]
    assert data["context_summary"]["detection_count"] == 3


def test_image_chat_rejects_empty_question():
    response = client.post(
        "/assistant/image-chat",
        json={
            "question": "   ",
            "response_mode": "rule_based",
            "image_context": {},
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Image chat question cannot be empty."


def test_image_chat_rejects_unknown_response_mode():
    response = client.post(
        "/assistant/image-chat",
        json={
            "question": "What do you see?",
            "response_mode": "unknown",
            "image_context": {},
        },
    )

    assert response.status_code == 422
