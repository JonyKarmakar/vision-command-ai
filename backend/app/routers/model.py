from fastapi import APIRouter

from app.config import APP_VERSION, MODEL_NAME
from app.services.model_classes import (
    get_class_aliases,
    get_supported_model_classes,
)

router = APIRouter(prefix="/model", tags=["model"])


@router.get("/info")
def get_model_info():
    return {
        "model_name": MODEL_NAME,
        "task": "object_detection",
        "framework": "Ultralytics YOLO",
        "backend": "FastAPI",
        "version": APP_VERSION,
        "supported_actions": [
            "detect",
            "annotate",
            "crop",
            "crop_by_class",
            "blur",
            "blur_by_class",
            "blur_all_by_class",
            "command_execution",
        ],
    }



@router.get("/classes")
def get_model_classes():
    supported_classes = get_supported_model_classes()

    return {
        "model_name": MODEL_NAME,
        "class_count": len(supported_classes),
        "classes": supported_classes,
        "aliases": get_class_aliases(),
    }
