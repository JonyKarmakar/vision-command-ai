from fastapi import APIRouter

from app.config import APP_VERSION, MODEL_NAME

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
