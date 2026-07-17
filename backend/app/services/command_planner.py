import re
from typing import Optional

from fastapi import HTTPException
from pydantic import ValidationError

from app.schemas import CommandPlan
from app.services.command_skills_registry import get_command_skill_by_id
from app.services.llm_prompt_builder import build_command_planner_prompt
from app.services.llm_provider import plan_command_with_provider
from app.services.model_classes import (
    get_class_aliases,
    get_supported_model_classes,
    is_supported_model_class,
    normalize_model_class_name,
)


SUPPORTED_PLANNER_MODES = {"rule_based", "llm_mock", "real_llm"}


def get_planner_metadata(planner_mode: str):
    if planner_mode == "rule_based":
        return {
            "planner_mode": "rule_based",
            "planner_type": "rule_based",
            "planner_version": "v1",
        }

    if planner_mode == "llm_mock":
        return {
            "planner_mode": "llm_mock",
            "planner_type": "llm_mock",
            "planner_version": "mock-v1",
        }

    if planner_mode == "real_llm":
        return {
            "planner_mode": "real_llm",
            "planner_type": "real_llm",
            "planner_version": "not_configured",
        }

    raise HTTPException(
        status_code=400,
        detail="Supported planner modes are: rule_based, llm_mock, real_llm",
    )


def _normalize_command(command: str) -> str:
    return command.lower().strip()


def _contains_phrase(text: str, phrase: str) -> bool:
    pattern = r"\b" + re.escape(phrase).replace(r"\ ", r"\s+") + r"\b"
    return re.search(pattern, text) is not None


def _extract_target_scope(normalized_command: str) -> str:
    words = set(normalized_command.split())

    if words.intersection({"all", "every", "everyone", "everything"}):
        return "all"

    if words.intersection({"largest", "biggest", "main"}):
        return "largest"

    if words.intersection({"smallest", "small"}):
        return "smallest"

    if "left" in words:
        return "left"

    if "right" in words:
        return "right"

    if words.intersection({"top", "upper"}):
        return "top"

    if words.intersection({"bottom", "lower"}):
        return "bottom"

    if words.intersection({"center", "centre", "middle"}):
        return "center"

    return "unknown"


def _extract_target_class(normalized_command: str) -> Optional[str]:
    phrase_to_class = {}

    for class_name in get_supported_model_classes():
        phrase_to_class[class_name] = class_name

    for alias, class_name in get_class_aliases().items():
        phrase_to_class[alias] = class_name

    sorted_phrases = sorted(
        phrase_to_class.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    )

    for phrase, class_name in sorted_phrases:
        if _contains_phrase(normalized_command, phrase):
            normalized_class = normalize_model_class_name(class_name)

            if is_supported_model_class(normalized_class):
                return normalized_class

    return None


def _infer_action(normalized_command: str, target_scope: str) -> str:
    if "track" in normalized_command:
        return "track"

    if "extract" in normalized_command and "frame" in normalized_command:
        return "extract_frames"

    if "summarize" in normalized_command or "summary" in normalized_command:
        return "summarize"

    if "explain" in normalized_command or "describe" in normalized_command:
        return "summarize"

    if "zoom" in normalized_command:
        return "zoom"

    if "annotate" in normalized_command or "draw boxes" in normalized_command:
        return "annotate"

    if "crop" in normalized_command:
        return "crop_by_class"

    if "blur" in normalized_command:
        return "blur_all_by_class" if target_scope == "all" else "blur_by_class"

    if "detect" in normalized_command or "find" in normalized_command:
        return "detect"

    return "unknown"


def _infer_media_type(normalized_command: str, action: str) -> str:
    if "video" in normalized_command:
        return "video"

    if (
        "image" in normalized_command
        or "photo" in normalized_command
        or "picture" in normalized_command
    ):
        return "image"

    if action in {"track", "extract_frames"}:
        return "video"

    if action in {
        "detect",
        "annotate",
        "crop_by_class",
        "blur_by_class",
        "blur_all_by_class",
        "zoom",
    }:
        return "image"

    return "unknown"


def _compact_command_skill(skill: Optional[dict]) -> Optional[dict]:
    if not skill:
        return None

    return {
        "id": skill["id"],
        "title": skill["title"],
        "category": skill["category"],
        "execution_status": skill["execution_status"],
        "supported_media": skill["supported_media"],
        "mapped_actions": skill["mapped_actions"],
        "mapped_workflows": skill["mapped_workflows"],
        "required_context": skill["required_context"],
        "optional_context": skill["optional_context"],
        "outputs": skill["outputs"],
        "limitations": skill["limitations"],
    }


def _registry_skill_id_for_plan(plan: CommandPlan) -> Optional[str]:
    if plan.action == "detect" and plan.media_type == "image":
        return "detect_objects"

    if plan.action == "detect" and plan.media_type == "video":
        return "video_object_analysis_workflow"

    if plan.action == "annotate" and plan.media_type == "image":
        return "detect_objects"

    if plan.action == "crop_by_class":
        return "crop_by_class"

    if plan.action in {"blur_by_class", "blur_all_by_class"}:
        return "blur_by_class"

    if plan.action == "zoom":
        return "zoom_by_class"

    if plan.action == "extract_frames":
        return "detect_video_frames" if plan.target_class else "extract_video_frame"

    if plan.action == "track":
        return "tracking_readiness_summary"

    if plan.action == "summarize" and plan.media_type == "video":
        return "video_object_analysis_workflow"

    if plan.action == "summarize" and plan.media_type == "image":
        return "detect_objects"

    return None


def attach_command_skill_metadata(plan: CommandPlan) -> CommandPlan:
    skill_id = _registry_skill_id_for_plan(plan)

    if not skill_id:
        plan.command_skill = None
        return plan

    plan.command_skill = _compact_command_skill(get_command_skill_by_id(skill_id))
    return plan

def plan_command(command: str) -> CommandPlan:
    normalized_command = _normalize_command(command)

    target_scope = _extract_target_scope(normalized_command)
    target_class = _extract_target_class(normalized_command)
    action = _infer_action(normalized_command, target_scope)
    media_type = _infer_media_type(normalized_command, action)

    if action == "detect" and target_scope == "unknown":
        target_scope = "all"

    if action in {"crop_by_class", "blur_by_class", "track"} and target_scope == "unknown":
        target_scope = "single"

    if action == "zoom" and target_scope == "unknown":
        target_scope = "center"

    needs_clarification = False
    clarification_question = None

    if action == "unknown":
        needs_clarification = True
        clarification_question = "What would you like me to do with this image or video?"

    if action in {"crop_by_class", "blur_by_class", "blur_all_by_class"} and target_class is None:
        needs_clarification = True
        clarification_question = "Which object class should I use for this command?"

    return attach_command_skill_metadata(
        CommandPlan(
        media_type=media_type,
        action=action,
        target_class=target_class,
        target_scope=target_scope,
        requires_detection=action in {
            "detect",
            "annotate",
            "crop_by_class",
            "blur_by_class",
            "blur_all_by_class",
            "zoom",
            "track",
        },
        requires_tracking=action == "track",
        parameters={},
        confidence=0.35 if needs_clarification else 0.90,
        needs_clarification=needs_clarification,
        clarification_question=clarification_question,
    )


    )

def validate_command_plan(plan_data: dict) -> CommandPlan:
    if not isinstance(plan_data, dict):
        raise HTTPException(
            status_code=502,
            detail="LLM planner output must be a JSON object.",
        )

    required_fields = {
        "media_type",
        "action",
        "target_class",
        "target_scope",
        "requires_detection",
        "requires_tracking",
        "parameters",
        "confidence",
        "needs_clarification",
        "clarification_question",
    }
    missing_fields = sorted(required_fields.difference(plan_data.keys()))

    if missing_fields:
        raise HTTPException(
            status_code=502,
            detail=(
                "LLM planner output did not match the command plan schema: "
                f"missing required fields: {', '.join(missing_fields)}"
            ),
        )

    normalized_plan = dict(plan_data)

    target_class = normalized_plan.get("target_class")

    if target_class:
        normalized_class = normalize_model_class_name(str(target_class))

        if is_supported_model_class(normalized_class):
            normalized_plan["target_class"] = normalized_class
        else:
            normalized_plan["target_class"] = None
            normalized_plan["needs_clarification"] = True
            normalized_plan["clarification_question"] = (
                "Which supported object class should I use for this command?"
            )

    if normalized_plan.get("parameters") is None:
        normalized_plan["parameters"] = {}

    if normalized_plan.get("needs_clarification") is True and not normalized_plan.get(
        "clarification_question"
    ):
        normalized_plan["clarification_question"] = (
            "What would you like me to do with this image or video?"
        )

    if normalized_plan.get("needs_clarification") is False:
        normalized_plan["clarification_question"] = None

    try:
        return attach_command_skill_metadata(CommandPlan(**normalized_plan))
    except ValidationError as error:
        raise HTTPException(
            status_code=502,
            detail=f"LLM planner output did not match the command plan schema: {str(error)}",
        )


def plan_command_with_real_llm(command: str):
    prompt_preview = build_command_planner_prompt(command)

    planned_command = plan_command_with_provider(
        system_prompt=prompt_preview["system_prompt"],
        user_prompt=prompt_preview["user_prompt"],
    )

    validated_plan = validate_command_plan(planned_command)

    return {
        "planner_mode": "real_llm",
        "planner_type": "real_llm",
        "planner_version": prompt_preview["prompt_version"],
        "plan": validated_plan,
    }


def plan_command_with_mode(command: str, planner_mode: str = "rule_based"):
    planner_metadata = get_planner_metadata(planner_mode)

    if planner_mode == "real_llm":
        return plan_command_with_real_llm(command)

    # For now, llm_mock reuses the deterministic rule-based planner internally.
    # This creates a mode-aware baseline before connecting a real LLM planner.
    plan = plan_command(command)

    return {
        **planner_metadata,
        "plan": plan,
    }
