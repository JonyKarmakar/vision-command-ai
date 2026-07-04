import json
import os
from collections import Counter
from urllib import error as url_error
from urllib import request as url_request

from fastapi import HTTPException

from app.services.llm_provider import get_llm_provider_status


IMAGE_CHAT_PROMPT_VERSION = "image-chat-prompt-v1"


def _safe_context(image_context):
    if isinstance(image_context, dict):
        return image_context

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


def _summarize_context(image_context):
    context = _safe_context(image_context)
    detections = _collect_detections(context)
    generated_outputs = _collect_generated_outputs(context)

    class_counts = Counter(
        str(detection.get("class_name"))
        for detection in detections
        if detection.get("class_name")
    )

    return {
        "context_keys": sorted(context.keys()),
        "detection_count": len(detections),
        "detected_classes": dict(sorted(class_counts.items())),
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


def _format_detected_classes(detected_classes):
    if not detected_classes:
        return "no detected objects"

    return ", ".join(
        f"{class_name} ({count})"
        for class_name, count in detected_classes.items()
    )


def _build_rule_based_answer(question, context_summary):
    normalized_question = question.lower().strip()
    detected_classes = context_summary["detected_classes"]
    detection_count = context_summary["detection_count"]
    generated_output_count = context_summary["generated_output_count"]
    class_summary = _format_detected_classes(detected_classes)

    if detection_count == 0:
        return (
            "I do not have detected-object context for the current image yet. "
            "Run detection first, then ask again for a more grounded image summary."
        )

    if any(word in normalized_question for word in ["privacy", "private", "blur", "hide", "anonym"]):
        if "person" in detected_classes:
            return (
                "For privacy, I recommend blurring people first because the current "
                f"image context includes person detections. I found {class_summary}. "
                "The detector may not catch sensitive text, screens, documents, "
                "faces, or license plates, so those should still be checked manually."
            )

        return (
            "I do not see people in the current detection context. "
            f"The detected objects are {class_summary}. For privacy, still check "
            "for text, documents, screens, faces, and license plates manually."
        )

    if any(phrase in normalized_question for phrase in ["what do you see", "summarize", "summary", "detected", "objects"]):
        return (
            f"The current image context contains {detection_count} detected object"
            f"{'' if detection_count == 1 else 's'}: {class_summary}. "
            "This answer is based on structured detection results, not raw pixel-level "
            "vision-language analysis."
        )

    if any(phrase in normalized_question for phrase in ["what did i do", "history", "so far", "workflow"]):
        if generated_output_count == 0:
            return (
                "I do not see generated-output history for this image yet. "
                "After you run commands such as zoom, crop, blur, or detection, "
                "I can summarize the workflow history."
            )

        return (
            f"I can see {generated_output_count} generated output"
            f"{'' if generated_output_count == 1 else 's'} in the current workflow context. "
            "These outputs represent previous assistant actions such as detection, "
            "zoom, crop, or blur."
        )

    return (
        f"Based on the current structured image context, I found {detection_count} "
        f"detected object{'' if detection_count == 1 else 's'}: {class_summary}. "
        "Ask a more specific question such as what should I blur for privacy, "
        "what objects are detected, or what did I do to this image so far."
    )


def build_image_chat_prompt(question, image_context):
    context_summary = _summarize_context(image_context)
    compact_context = json.dumps(context_summary, indent=2, sort_keys=True)

    system_prompt = (
        "You are VisionCommand AI, a helpful image workflow assistant. "
        "Answer questions using only the structured image context provided. "
        "Do not claim to see raw pixels. Be honest about limitations. "
        "Do not say faces were detected unless the structured context includes a face class. "
        "If the context includes person detections, refer to them as people or persons, not faces. "
        "Do not discuss object detection model accuracy unless the user asks about model performance. "
        "When privacy is mentioned, recommend practical privacy checks such as people, screens, documents, text, license plates, and sensitive objects."
    )

    user_prompt = f"""
Question:
{question}

Structured image context summary:
{compact_context}

Answer in 2 to 5 concise sentences.
Use plain product language for a normal user.
Ground the answer in the detected classes and workflow context.
Do not invent visual details that are not in the structured context.
If privacy is discussed and person is detected, recommend blurring people or persons, not faces.
Mention that screens, documents, text, license plates, and other sensitive details may need manual review because this answer is based on detection/workflow context rather than raw pixel-level vision-language analysis.
""".strip()

    return {
        "prompt_version": IMAGE_CHAT_PROMPT_VERSION,
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
            detail="OLLAMA_MODEL is not configured for image chat.",
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
            detail=f"Ollama image chat request failed: {exc}",
        ) from exc

    answer = (
        data.get("message", {}).get("content")
        or data.get("response")
        or ""
    ).strip()

    if not answer:
        raise HTTPException(
            status_code=502,
            detail="Ollama returned an empty image chat answer.",
        )

    return answer


def answer_image_chat(question, image_context=None, response_mode="auto"):
    if not question or not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Image chat question cannot be empty.",
        )

    if response_mode not in {"auto", "rule_based", "real_llm"}:
        raise HTTPException(
            status_code=400,
            detail="response_mode must be one of: auto, rule_based, real_llm",
        )

    prompt_preview = build_image_chat_prompt(
        question=question.strip(),
        image_context=image_context or {},
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
                detail="Real LLM provider is not available for image chat.",
            )

        if provider_status.get("provider_name") != "ollama":
            raise HTTPException(
                status_code=503,
                detail="Image chat currently supports local Ollama for real_llm mode.",
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
