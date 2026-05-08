from pathlib import Path
from typing import Optional
from uuid import uuid4
import shutil

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from fastapi.responses import FileResponse
from PIL import Image, ImageDraw, UnidentifiedImageError

app = FastAPI(
    title="VisionCommand AI Backend",
    description="Backend API for the VisionCommand AI project",
    version="0.1.0",
)

UPLOAD_DIR = Path("storage/uploads")
OUTPUT_DIR = Path("storage/outputs")
MODEL_NAME = "yolo26n.pt"


class CropRequest(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


@app.get("/")
def root():
    return {"message": "VisionCommand AI backend is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/media/upload")
def upload_media(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image uploads are supported in this step",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    original_filename = file.filename or "uploaded_image"
    file_extension = Path(original_filename).suffix
    stored_filename = f"{uuid4().hex}{file_extension}"
    storage_path = UPLOAD_DIR / stored_filename

    with storage_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        with Image.open(storage_path) as image:
            width, height = image.size
    except UnidentifiedImageError:
        storage_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image",
        )

    return {
        "message": "Image uploaded successfully",
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "content_type": file.content_type,
        "width": width,
        "height": height,
        "storage_path": str(storage_path),
        "file_url": f"/media/uploads/{stored_filename}",
    }


@app.get("/media/uploads/{filename}")
def get_uploaded_media(filename: str):
    file_path = UPLOAD_DIR / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found",
        )

    return FileResponse(file_path)


@app.get("/media/outputs/{filename}")
def get_output_media(filename: str):
    file_path = OUTPUT_DIR / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Output file not found",
        )

    return FileResponse(file_path)


def get_yolo_model():
    from ultralytics import YOLO

    return YOLO(MODEL_NAME)


def run_yolo_detection(
    image_path: Path,
    confidence_threshold: float = 0.25,
    class_filter: Optional[str] = None,
):
    model = get_yolo_model()
    results = model(str(image_path))

    detections = []

    if not results:
        return detections

    result = results[0]

    for box in result.boxes:
        class_id = int(box.cls[0])
        class_name = result.names[class_id]
        confidence = float(box.conf[0])

        if confidence < confidence_threshold:
            continue

        if class_filter and class_name != class_filter:
            continue

        x1, y1, x2, y2 = [float(value) for value in box.xyxy[0].tolist()]

        detections.append(
            {
                "class_id": class_id,
                "class_name": class_name,
                "confidence": round(confidence, 4),
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2),
                },
            }
        )

    return detections


@app.post("/vision/detect/{filename}")
def detect_objects(
    filename: str,
    confidence_threshold: float = Query(0.25, ge=0.0, le=1.0),
    class_filter: Optional[str] = Query(None),
):
    image_path = UPLOAD_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded image not found",
        )

    detections = run_yolo_detection(
        image_path=image_path,
        confidence_threshold=confidence_threshold,
        class_filter=class_filter,
    )

    return {
        "filename": filename,
        "confidence_threshold": confidence_threshold,
        "class_filter": class_filter,
        "detections": detections,
        "detection_count": len(detections),
    }


@app.post("/vision/detect/{filename}/annotated")
def detect_objects_with_annotation(
    filename: str,
    confidence_threshold: float = Query(0.25, ge=0.0, le=1.0),
    class_filter: Optional[str] = Query(None),
):
    image_path = UPLOAD_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded image not found",
        )

    detections = run_yolo_detection(
        image_path=image_path,
        confidence_threshold=confidence_threshold,
        class_filter=class_filter,
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    file_extension = image_path.suffix or ".png"
    annotated_filename = f"annotated_{image_path.stem}_{uuid4().hex}{file_extension}"
    annotated_path = OUTPUT_DIR / annotated_filename

    with Image.open(image_path).convert("RGB") as image:
        draw = ImageDraw.Draw(image)

        for detection in detections:
            bbox = detection["bbox"]
            x1 = bbox["x1"]
            y1 = bbox["y1"]
            x2 = bbox["x2"]
            y2 = bbox["y2"]

            label = f"{detection['class_name']} {detection['confidence']:.2f}"

            draw.rectangle(
                [(x1, y1), (x2, y2)],
                outline="red",
                width=3,
            )

            text_y = y1 - 12 if y1 >= 12 else y1 + 4
            draw.text(
                (x1, text_y),
                label,
                fill="red",
            )

        image.save(annotated_path)

    return {
        "filename": filename,
        "confidence_threshold": confidence_threshold,
        "class_filter": class_filter,
        "detections": detections,
        "detection_count": len(detections),
        "annotated_filename": annotated_filename,
        "annotated_file_url": f"/media/outputs/{annotated_filename}",
    }


@app.post("/vision/crop/{filename}")
def crop_uploaded_image(filename: str, crop: CropRequest):
    image_path = UPLOAD_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded image not found",
        )

    if crop.x2 <= crop.x1 or crop.y2 <= crop.y1:
        raise HTTPException(
            status_code=400,
            detail="Invalid crop coordinates",
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with Image.open(image_path).convert("RGB") as image:
        width, height = image.size

        left = max(0, min(int(crop.x1), width))
        top = max(0, min(int(crop.y1), height))
        right = max(0, min(int(crop.x2), width))
        bottom = max(0, min(int(crop.y2), height))

        if right <= left or bottom <= top:
            raise HTTPException(
                status_code=400,
                detail="Crop coordinates are outside the image bounds",
            )

        cropped_image = image.crop((left, top, right, bottom))

        file_extension = image_path.suffix or ".png"
        cropped_filename = f"crop_{image_path.stem}_{uuid4().hex}{file_extension}"
        cropped_path = OUTPUT_DIR / cropped_filename

        cropped_image.save(cropped_path)

    return {
        "filename": filename,
        "cropped_filename": cropped_filename,
        "cropped_file_url": f"/media/outputs/{cropped_filename}",
        "crop_box": {
            "x1": left,
            "y1": top,
            "x2": right,
            "y2": bottom,
        },
    }


class CropByClassRequest(BaseModel):
    class_name: str
    confidence_threshold: float = 0.25


@app.post("/vision/crop-by-class/{filename}")
def crop_best_object_by_class(filename: str, request: CropByClassRequest):
    image_path = UPLOAD_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded image not found",
        )

    if request.confidence_threshold < 0 or request.confidence_threshold > 1:
        raise HTTPException(
            status_code=400,
            detail="confidence_threshold must be between 0 and 1",
        )

    detections = run_yolo_detection(
        image_path=image_path,
        confidence_threshold=request.confidence_threshold,
        class_filter=request.class_name,
    )

    if not detections:
        raise HTTPException(
            status_code=404,
            detail=f"No object found for class '{request.class_name}'",
        )

    best_detection = max(
        detections,
        key=lambda detection: detection["confidence"],
    )

    crop_response = crop_uploaded_image(
        filename,
        CropRequest(**best_detection["bbox"]),
    )

    return {
        "filename": filename,
        "class_name": request.class_name,
        "confidence_threshold": request.confidence_threshold,
        "selected_detection": best_detection,
        **crop_response,
    }


class CommandRequest(BaseModel):
    filename: str
    command: str
    confidence_threshold: float = 0.25


def parse_command(command: str):
    normalized_command = command.lower().strip()

    if "detect" in normalized_command:
        return {
            "action": "detect",
            "class_name": None,
        }

    if "crop" in normalized_command:
        words = normalized_command.split()
        ignored_words = {"crop", "the", "a", "an", "object", "best", "detected"}

        class_words = [
            word for word in words
            if word not in ignored_words
        ]

        if not class_words:
            raise HTTPException(
                status_code=400,
                detail="Please specify which class to crop, for example: crop person",
            )

        return {
            "action": "crop_by_class",
            "class_name": " ".join(class_words),
        }

    raise HTTPException(
        status_code=400,
        detail="Unsupported command. Try commands like: detect objects, crop person, crop bottle",
    )


@app.post("/commands/execute")
def execute_command(request: CommandRequest):
    if request.confidence_threshold < 0 or request.confidence_threshold > 1:
        raise HTTPException(
            status_code=400,
            detail="confidence_threshold must be between 0 and 1",
        )

    parsed_command = parse_command(request.command)

    if parsed_command["action"] == "detect":
        result = detect_objects_with_annotation(
            filename=request.filename,
            confidence_threshold=request.confidence_threshold,
            class_filter=None,
        )

        return {
            "command": request.command,
            "parsed_command": parsed_command,
            "result_type": "annotated_detection",
            "result": result,
        }

    if parsed_command["action"] == "crop_by_class":
        class_name = parsed_command["class_name"]

        result = crop_best_object_by_class(
            filename=request.filename,
            request=CropByClassRequest(
                class_name=class_name,
                confidence_threshold=request.confidence_threshold,
            ),
        )

        return {
            "command": request.command,
            "parsed_command": parsed_command,
            "result_type": "crop_by_class",
            "result": result,
        }

    raise HTTPException(
        status_code=400,
        detail="Unsupported command action",
    )
