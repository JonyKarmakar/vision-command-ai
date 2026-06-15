from fastapi import HTTPException

from app.schemas import CommandPlan
from app.services.command_validation import validate_parsed_command


def _blocked(warnings: list[str]):
    return {
        "status": "blocked",
        "executable": False,
        "prepared_command": None,
        "warnings": warnings,
    }


def _number_parameter(parameters: dict, key: str):
    value = parameters.get(key)

    if not isinstance(value, (int, float)):
        return None

    return value


def _prepare_temporal_command(plan: CommandPlan, action: str):
    parameters = plan.parameters or {}

    start_seconds = _number_parameter(parameters, "start_seconds")
    end_seconds = _number_parameter(parameters, "end_seconds")
    interval_seconds = _number_parameter(parameters, "interval_seconds")

    if start_seconds is None or end_seconds is None:
        return _blocked([
            f"{plan.action} plans require numeric start_seconds and end_seconds parameters before execution."
        ])

    if interval_seconds is None:
        interval_seconds = 1.0

    prepared_command = {
        "action": action,
        "start_seconds": start_seconds,
        "end_seconds": end_seconds,
        "interval_seconds": interval_seconds,
    }

    if plan.target_class:
        prepared_command["class_name"] = plan.target_class

    return _ready(prepared_command)


def _ready(prepared_command: dict):
    try:
        validated_command = validate_parsed_command(prepared_command)
    except HTTPException as error:
        detail = str(error.detail)
        return _blocked([detail])

    return {
        "status": "ready",
        "executable": True,
        "prepared_command": validated_command,
        "warnings": [],
    }


def prepare_command_plan_for_execution(plan: CommandPlan):
    if plan.needs_clarification:
        warning = plan.clarification_question or "This plan needs clarification before execution."
        return _blocked([warning])

    if plan.action == "unknown":
        return _blocked(["Unknown planner action cannot be prepared for execution."])

    if plan.action in {"crop_by_class", "blur_by_class", "blur_all_by_class"}:
        if not plan.target_class:
            return _blocked([f"{plan.action} requires target_class before execution."])

        return _ready({
            "action": plan.action,
            "class_name": plan.target_class,
        })

    if plan.action == "zoom":
        if not plan.target_class:
            return _blocked(["zoom requires target_class before execution."])

        prepared_command = {
            "action": "zoom_by_class",
            "class_name": plan.target_class,
        }

        if plan.target_scope:
            prepared_command["target_scope"] = plan.target_scope

        return _ready(prepared_command)

    if plan.action in {"detect", "annotate"}:
        prepared_command = {"action": "detect"}

        if plan.target_class:
            prepared_command["class_name"] = plan.target_class

        return _ready(prepared_command)

    if plan.action == "extract_frames":
        return _prepare_temporal_command(plan, "extract_frames")

    if plan.action == "track":
        return _prepare_temporal_command(plan, "track_video")

    return _blocked([
        f"Planner action '{plan.action}' is not connected to an executable command yet."
    ])
