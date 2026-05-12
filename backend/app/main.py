from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4
import json
import shutil

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, ImageDraw, UnidentifiedImageError

from app.routers import health, model
from app.services.command_parser import normalize_requested_class_name, parse_command
from app.schemas import (
    BlurAllByClassRequest,
    BlurByClassRequest,
    CommandRequest,
    CropByClassRequest,
    CropRequest,
)

from app.config import (
    APP_DESCRIPTION,
    APP_TITLE,
    APP_VERSION,
    COMMAND_LOG_FILE,
    LOG_DIR,
    MODEL_NAME,
    OUTPUT_DIR,
    UPLOAD_DIR,
)

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
)

app.include_router(health.router)
app.include_router(model.router)




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

    response_data = {
        "message": "Image uploaded successfully",
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "content_type": file.content_type,
        "width": width,
        "height": height,
        "storage_path": str(storage_path),
        "file_url": f"/media/uploads/{stored_filename}",
    }

    try:
        save_media_file_to_database(response_data)
    except Exception:
        # Database metadata logging should not break image upload.
        pass

    return response_data


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

    detections = run_yolo_detection_with_inference_logging(
        filename=filename,
        image_path=image_path,
        confidence_threshold=confidence_threshold,
        class_filter=class_filter,
        source_endpoint="detect",
    )

    try:
        save_detections_to_database(
            filename=filename,
            detections=detections,
            confidence_threshold=confidence_threshold,
            class_filter=class_filter,
            source_endpoint="detect",
        )
    except Exception:
        # Database logging should not break detection.
        pass

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

    detections = run_yolo_detection_with_inference_logging(
        filename=filename,
        image_path=image_path,
        confidence_threshold=confidence_threshold,
        class_filter=class_filter,
        source_endpoint="annotated_detection",
    )

    try:
        save_detections_to_database(
            filename=filename,
            detections=detections,
            confidence_threshold=confidence_threshold,
            class_filter=class_filter,
            source_endpoint="annotated_detection",
        )
    except Exception:
        # Database logging should not break annotated detection.
        pass

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



    aliases = {
        "people": "person",
        "persons": "person",
    }

    if normalized in aliases:
        return aliases[normalized]

    if normalized.endswith("s") and len(normalized) > 1:
        return normalized[:-1]

    return normalized


    if "detect" in normalized_command:
        return {
            "action": "detect",
            "class_name": None,
        }

    if "crop" in normalized_command:
        ignored_words = {"crop", "the", "a", "an", "object", "objects", "best", "detected"}

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
            "class_name": normalize_requested_class_name(" ".join(class_words)),
        }

    if "blur" in normalized_command:
        blur_all = "all" in words

        ignored_words = {"blur", "the", "a", "an", "object", "objects", "best", "detected", "all"}

        class_words = [
            word for word in words
            if word not in ignored_words
        ]

        if not class_words:
            raise HTTPException(
                status_code=400,
                detail="Please specify which class to blur, for example: blur person",
            )

        return {
            "action": "blur_all_by_class" if blur_all else "blur_by_class",
            "class_name": normalize_requested_class_name(" ".join(class_words)),
        }

    raise HTTPException(
        status_code=400,
        detail="Unsupported command. Try commands like: detect objects, crop person, crop bottle, blur person",
    )




def get_database_url():
    import os

    return os.getenv("DATABASE_URL")



def initialize_media_files_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS media_files (
                    id SERIAL PRIMARY KEY,
                    original_filename TEXT NOT NULL,
                    stored_filename TEXT NOT NULL,
                    content_type TEXT NOT NULL,
                    width INTEGER NOT NULL,
                    height INTEGER NOT NULL,
                    storage_path TEXT NOT NULL,
                    file_url TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_media_file_to_database(media_data: dict):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_media_files_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO media_files (
                    original_filename,
                    stored_filename,
                    content_type,
                    width,
                    height,
                    storage_path,
                    file_url,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    media_data["original_filename"],
                    media_data["stored_filename"],
                    media_data["content_type"],
                    media_data["width"],
                    media_data["height"],
                    media_data["storage_path"],
                    media_data["file_url"],
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
        connection.commit()

    return True


def get_database_media_files(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "media_files": [],
        }

    initialize_media_files_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    original_filename,
                    stored_filename,
                    content_type,
                    width,
                    height,
                    storage_path,
                    file_url,
                    created_at
                FROM media_files
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    media_files = [
        {
            "original_filename": row[0],
            "stored_filename": row[1],
            "content_type": row[2],
            "width": row[3],
            "height": row[4],
            "storage_path": row[5],
            "file_url": row[6],
            "created_at": row[7],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(media_files),
        "media_files": media_files,
    }


def initialize_command_logs_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS command_logs (
                    id SERIAL PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    command TEXT NOT NULL,
                    confidence_threshold DOUBLE PRECISION NOT NULL,
                    parsed_action TEXT NOT NULL,
                    parsed_class TEXT,
                    result_type TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_command_log_to_database(log_entry: dict):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_command_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO command_logs (
                    timestamp,
                    filename,
                    command,
                    confidence_threshold,
                    parsed_action,
                    parsed_class,
                    result_type
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    log_entry["timestamp"],
                    log_entry["filename"],
                    log_entry["command"],
                    log_entry["confidence_threshold"],
                    log_entry["parsed_action"],
                    log_entry["parsed_class"],
                    log_entry["result_type"],
                ),
            )
        connection.commit()

    return True


def get_database_command_logs(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "logs": [],
        }

    initialize_command_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    timestamp,
                    filename,
                    command,
                    confidence_threshold,
                    parsed_action,
                    parsed_class,
                    result_type
                FROM command_logs
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    logs = [
        {
            "timestamp": row[0],
            "filename": row[1],
            "command": row[2],
            "confidence_threshold": row[3],
            "parsed_action": row[4],
            "parsed_class": row[5],
            "result_type": row[6],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(logs),
        "logs": logs,
    }


def log_command_execution(
    request: CommandRequest,
    parsed_command: dict,
    result_type: str,
):
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "filename": request.filename,
        "command": request.command,
        "confidence_threshold": request.confidence_threshold,
        "parsed_action": parsed_command.get("action"),
        "parsed_class": parsed_command.get("class_name"),
        "result_type": result_type,
    }

    with COMMAND_LOG_FILE.open("a", encoding="utf-8") as log_file:
        log_file.write(json.dumps(log_entry) + "\n")

    try:
        save_command_log_to_database(log_entry)
    except Exception:
        # Database logging should not break command execution.
        # JSONL logging remains as a local fallback.
        pass


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

        result_type = "annotated_detection"
        log_command_execution(request, parsed_command, result_type)

        return {
            "command": request.command,
            "parsed_command": parsed_command,
            "result_type": result_type,
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

        result_type = "crop_by_class"
        log_command_execution(request, parsed_command, result_type)

        return {
            "command": request.command,
            "parsed_command": parsed_command,
            "result_type": result_type,
            "result": result,
        }

    if parsed_command["action"] == "blur_by_class":
        class_name = parsed_command["class_name"]

        result = blur_best_object_by_class(
            filename=request.filename,
            request=BlurByClassRequest(
                class_name=class_name,
                confidence_threshold=request.confidence_threshold,
            ),
        )

        result_type = "blur_by_class"
        log_command_execution(request, parsed_command, result_type)

        return {
            "command": request.command,
            "parsed_command": parsed_command,
            "result_type": result_type,
            "result": result,
        }

    if parsed_command["action"] == "blur_all_by_class":
        class_name = parsed_command["class_name"]

        result = blur_all_objects_by_class(
            filename=request.filename,
            request=BlurAllByClassRequest(
                class_name=class_name,
                confidence_threshold=request.confidence_threshold,
            ),
        )

        result_type = "blur_all_by_class"
        log_command_execution(request, parsed_command, result_type)

        return {
            "command": request.command,
            "parsed_command": parsed_command,
            "result_type": result_type,
            "result": result,
        }

    raise HTTPException(
        status_code=400,
        detail="Unsupported command action",
    )


@app.get("/commands/logs")
def get_command_logs(limit: int = Query(20, ge=1, le=100)):
    if not COMMAND_LOG_FILE.exists():
        return {
            "count": 0,
            "logs": [],
        }

    logs = []

    with COMMAND_LOG_FILE.open("r", encoding="utf-8") as log_file:
        lines = log_file.readlines()

    for line in lines[-limit:]:
        line = line.strip()

        if not line:
            continue

        try:
            logs.append(json.loads(line))
        except json.JSONDecodeError:
            continue

    return {
        "count": len(logs),
        "logs": logs,
    }


@app.post("/vision/blur/{filename}")
def blur_uploaded_image_object(filename: str, crop: CropRequest):
    image_path = UPLOAD_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded image not found",
        )

    if crop.x2 <= crop.x1 or crop.y2 <= crop.y1:
        raise HTTPException(
            status_code=400,
            detail="Invalid blur coordinates",
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
                detail="Blur coordinates are outside the image bounds",
            )

        object_region = image.crop((left, top, right, bottom))

        from PIL import ImageFilter

        blurred_region = object_region.filter(ImageFilter.GaussianBlur(radius=18))
        image.paste(blurred_region, (left, top))

        file_extension = image_path.suffix or ".png"
        blurred_filename = f"blur_{image_path.stem}_{uuid4().hex}{file_extension}"
        blurred_path = OUTPUT_DIR / blurred_filename

        image.save(blurred_path)

    return {
        "filename": filename,
        "blurred_filename": blurred_filename,
        "blurred_file_url": f"/media/outputs/{blurred_filename}",
        "blur_box": {
            "x1": left,
            "y1": top,
            "x2": right,
            "y2": bottom,
        },
    }




@app.post("/vision/blur-by-class/{filename}")
def blur_best_object_by_class(filename: str, request: BlurByClassRequest):
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

    blur_response = blur_uploaded_image_object(
        filename,
        CropRequest(**best_detection["bbox"]),
    )

    return {
        "filename": filename,
        "class_name": request.class_name,
        "confidence_threshold": request.confidence_threshold,
        "selected_detection": best_detection,
        **blur_response,
    }




@app.post("/vision/blur-all-by-class/{filename}")
def blur_all_objects_by_class(filename: str, request: BlurAllByClassRequest):
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

    class_name = normalize_requested_class_name(request.class_name)

    detections = run_yolo_detection(
        image_path=image_path,
        confidence_threshold=request.confidence_threshold,
        class_filter=class_name,
    )

    if not detections:
        raise HTTPException(
            status_code=404,
            detail=f"No object found for class '{class_name}'",
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    from PIL import ImageFilter

    with Image.open(image_path).convert("RGB") as image:
        width, height = image.size

        union_left = width
        union_top = height
        union_right = 0
        union_bottom = 0

        for detection in detections:
            bbox = detection["bbox"]

            left = max(0, min(int(bbox["x1"]), width))
            top = max(0, min(int(bbox["y1"]), height))
            right = max(0, min(int(bbox["x2"]), width))
            bottom = max(0, min(int(bbox["y2"]), height))

            if right <= left or bottom <= top:
                continue

            object_region = image.crop((left, top, right, bottom))
            blurred_region = object_region.filter(ImageFilter.GaussianBlur(radius=18))
            image.paste(blurred_region, (left, top))

            union_left = min(union_left, left)
            union_top = min(union_top, top)
            union_right = max(union_right, right)
            union_bottom = max(union_bottom, bottom)

        file_extension = image_path.suffix or ".png"
        blurred_filename = f"blur_all_{class_name}_{image_path.stem}_{uuid4().hex}{file_extension}"
        blurred_path = OUTPUT_DIR / blurred_filename

        image.save(blurred_path)

    return {
        "filename": filename,
        "class_name": class_name,
        "confidence_threshold": request.confidence_threshold,
        "detection_count": len(detections),
        "blurred_detections": detections,
        "blurred_filename": blurred_filename,
        "blurred_file_url": f"/media/outputs/{blurred_filename}",
        "blur_box": {
            "x1": union_left,
            "y1": union_top,
            "x2": union_right,
            "y2": union_bottom,
        },
    }


@app.get("/db/health")
def database_health_check():
    import os
    import psycopg

    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        return {
            "status": "not_configured",
            "message": "DATABASE_URL environment variable is not set",
        }

    try:
        with psycopg.connect(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                result = cursor.fetchone()

        return {
            "status": "healthy",
            "database": "postgresql",
            "result": result[0],
        }

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(error)}",
        )



@app.get("/db/command-logs")
def get_postgres_command_logs(limit: int = Query(20, ge=1, le=100)):
    return get_database_command_logs(limit)



@app.get("/db/media-files")
def get_postgres_media_files(limit: int = Query(20, ge=1, le=100)):
    return get_database_media_files(limit)



def initialize_detection_results_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS detection_results (
                    id SERIAL PRIMARY KEY,
                    filename TEXT NOT NULL,
                    class_id INTEGER NOT NULL,
                    class_name TEXT NOT NULL,
                    confidence DOUBLE PRECISION NOT NULL,
                    bbox_x1 DOUBLE PRECISION NOT NULL,
                    bbox_y1 DOUBLE PRECISION NOT NULL,
                    bbox_x2 DOUBLE PRECISION NOT NULL,
                    bbox_y2 DOUBLE PRECISION NOT NULL,
                    confidence_threshold DOUBLE PRECISION NOT NULL,
                    class_filter TEXT,
                    source_endpoint TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_detections_to_database(
    filename: str,
    detections: list,
    confidence_threshold: float,
    class_filter: Optional[str],
    source_endpoint: str,
):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_detection_results_table()

    created_at = datetime.now(timezone.utc).isoformat()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            for detection in detections:
                bbox = detection["bbox"]

                cursor.execute(
                    """
                    INSERT INTO detection_results (
                        filename,
                        class_id,
                        class_name,
                        confidence,
                        bbox_x1,
                        bbox_y1,
                        bbox_x2,
                        bbox_y2,
                        confidence_threshold,
                        class_filter,
                        source_endpoint,
                        created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        filename,
                        detection["class_id"],
                        detection["class_name"],
                        detection["confidence"],
                        bbox["x1"],
                        bbox["y1"],
                        bbox["x2"],
                        bbox["y2"],
                        confidence_threshold,
                        class_filter,
                        source_endpoint,
                        created_at,
                    ),
                )
        connection.commit()

    return True


def get_database_detection_results(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "detections": [],
        }

    initialize_detection_results_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    filename,
                    class_id,
                    class_name,
                    confidence,
                    bbox_x1,
                    bbox_y1,
                    bbox_x2,
                    bbox_y2,
                    confidence_threshold,
                    class_filter,
                    source_endpoint,
                    created_at
                FROM detection_results
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    detections = [
        {
            "filename": row[0],
            "class_id": row[1],
            "class_name": row[2],
            "confidence": row[3],
            "bbox": {
                "x1": row[4],
                "y1": row[5],
                "x2": row[6],
                "y2": row[7],
            },
            "confidence_threshold": row[8],
            "class_filter": row[9],
            "source_endpoint": row[10],
            "created_at": row[11],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(detections),
        "detections": detections,
    }



def initialize_model_inference_logs_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS model_inference_logs (
                    id SERIAL PRIMARY KEY,
                    filename TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    source_endpoint TEXT NOT NULL,
                    confidence_threshold DOUBLE PRECISION NOT NULL,
                    class_filter TEXT,
                    detection_count INTEGER NOT NULL,
                    inference_time_ms DOUBLE PRECISION NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_inference_log_to_database(
    filename: str,
    source_endpoint: str,
    confidence_threshold: float,
    class_filter: Optional[str],
    detection_count: int,
    inference_time_ms: float,
):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_model_inference_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO model_inference_logs (
                    filename,
                    model_name,
                    source_endpoint,
                    confidence_threshold,
                    class_filter,
                    detection_count,
                    inference_time_ms,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    filename,
                    MODEL_NAME,
                    source_endpoint,
                    confidence_threshold,
                    class_filter,
                    detection_count,
                    inference_time_ms,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
        connection.commit()

    return True


def get_database_inference_logs(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "inference_logs": [],
        }

    initialize_model_inference_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    filename,
                    model_name,
                    source_endpoint,
                    confidence_threshold,
                    class_filter,
                    detection_count,
                    inference_time_ms,
                    created_at
                FROM model_inference_logs
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    inference_logs = [
        {
            "filename": row[0],
            "model_name": row[1],
            "source_endpoint": row[2],
            "confidence_threshold": row[3],
            "class_filter": row[4],
            "detection_count": row[5],
            "inference_time_ms": row[6],
            "created_at": row[7],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(inference_logs),
        "inference_logs": inference_logs,
    }


def run_yolo_detection_with_inference_logging(
    filename: str,
    image_path: Path,
    confidence_threshold: float,
    class_filter: Optional[str],
    source_endpoint: str,
):
    from time import perf_counter

    start_time = perf_counter()

    detections = run_yolo_detection(
        image_path=image_path,
        confidence_threshold=confidence_threshold,
        class_filter=class_filter,
    )

    inference_time_ms = round((perf_counter() - start_time) * 1000, 2)

    try:
        save_inference_log_to_database(
            filename=filename,
            source_endpoint=source_endpoint,
            confidence_threshold=confidence_threshold,
            class_filter=class_filter,
            detection_count=len(detections),
            inference_time_ms=inference_time_ms,
        )
    except Exception:
        # Inference logging should not break YOLO detection.
        pass

    return detections


def get_database_stats():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "media_files_count": 0,
            "command_logs_count": 0,
        }

    initialize_media_files_table()
    initialize_command_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM media_files;")
            media_files_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM command_logs;")
            command_logs_count = cursor.fetchone()[0]

    return {
        "status": "healthy",
        "media_files_count": media_files_count,
        "command_logs_count": command_logs_count,
    }


@app.get("/db/stats")
def get_postgres_stats():
    return get_database_stats()



@app.get("/db/detections")
def get_postgres_detection_results(limit: int = Query(20, ge=1, le=100)):
    return get_database_detection_results(limit)


def get_database_detection_summary():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "total_detections": 0,
            "classes": [],
        }

    initialize_detection_results_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM detection_results;")
            total_detections = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT
                    class_name,
                    COUNT(*) AS detection_count,
                    AVG(confidence) AS average_confidence,
                    MAX(confidence) AS max_confidence
                FROM detection_results
                GROUP BY class_name
                ORDER BY detection_count DESC, class_name ASC;
                """
            )
            rows = cursor.fetchall()

    classes = [
        {
            "class_name": row[0],
            "count": row[1],
            "average_confidence": round(float(row[2]), 4),
            "max_confidence": round(float(row[3]), 4),
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "total_detections": total_detections,
        "classes": classes,
    }


@app.get("/db/detection-summary")
def get_postgres_detection_summary():
    return get_database_detection_summary()



@app.get("/db/inference-logs")
def get_postgres_inference_logs(limit: int = Query(20, ge=1, le=100)):
    return get_database_inference_logs(limit)


def get_database_inference_summary():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "total_inferences": 0,
            "average_inference_time_ms": 0,
            "max_inference_time_ms": 0,
            "total_detections": 0,
            "average_detections_per_run": 0,
            "by_endpoint": [],
        }

    initialize_model_inference_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_inferences,
                    COALESCE(AVG(inference_time_ms), 0) AS average_inference_time_ms,
                    COALESCE(MAX(inference_time_ms), 0) AS max_inference_time_ms,
                    COALESCE(SUM(detection_count), 0) AS total_detections,
                    COALESCE(AVG(detection_count), 0) AS average_detections_per_run
                FROM model_inference_logs;
                """
            )
            summary_row = cursor.fetchone()

            cursor.execute(
                """
                SELECT
                    source_endpoint,
                    COUNT(*) AS run_count,
                    COALESCE(AVG(inference_time_ms), 0) AS average_inference_time_ms,
                    COALESCE(MAX(inference_time_ms), 0) AS max_inference_time_ms,
                    COALESCE(SUM(detection_count), 0) AS total_detections
                FROM model_inference_logs
                GROUP BY source_endpoint
                ORDER BY run_count DESC, source_endpoint ASC;
                """
            )
            endpoint_rows = cursor.fetchall()

    by_endpoint = [
        {
            "source_endpoint": row[0],
            "run_count": row[1],
            "average_inference_time_ms": round(float(row[2]), 2),
            "max_inference_time_ms": round(float(row[3]), 2),
            "total_detections": row[4],
        }
        for row in endpoint_rows
    ]

    return {
        "status": "healthy",
        "total_inferences": summary_row[0],
        "average_inference_time_ms": round(float(summary_row[1]), 2),
        "max_inference_time_ms": round(float(summary_row[2]), 2),
        "total_detections": summary_row[3],
        "average_detections_per_run": round(float(summary_row[4]), 2),
        "by_endpoint": by_endpoint,
    }


@app.get("/db/inference-summary")
def get_postgres_inference_summary():
    return get_database_inference_summary()

