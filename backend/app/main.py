from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError

app = FastAPI(
    title="VisionCommand AI Backend",
    description="Backend API for the VisionCommand AI project",
    version="0.1.0",
)

UPLOAD_DIR = Path("storage/uploads")
MODEL_NAME = "yolo26n.pt"


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


def get_yolo_model():
    from ultralytics import YOLO

    return YOLO(MODEL_NAME)


@app.post("/vision/detect/{filename}")
def detect_objects(filename: str):
    image_path = UPLOAD_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded image not found",
        )

    model = get_yolo_model()
    results = model(str(image_path))

    detections = []

    if not results:
        return {
            "filename": filename,
            "detections": detections,
            "detection_count": 0,
        }

    result = results[0]

    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        x1, y1, x2, y2 = [float(value) for value in box.xyxy[0].tolist()]

        detections.append(
            {
                "class_id": class_id,
                "class_name": result.names[class_id],
                "confidence": round(confidence, 4),
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2),
                },
            }
        )

    return {
        "filename": filename,
        "detections": detections,
        "detection_count": len(detections),
    }
