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
from app.services.command_evaluation import (
    evaluate_command_parser,
    evaluate_command_planner,
)
from app.services.llm_parser import parse_command_with_mode
from app.services.llm_provider import get_llm_provider_status
from app.services.image_chat import answer_image_chat
from app.services.video_chat import answer_video_chat
from app.services.llm_prompt_builder import (
    build_command_parser_prompt,
    build_command_planner_prompt,
)
from app.services.command_validation import validate_parsed_command
from app.services.command_parser import normalize_requested_class_name, parse_command
from app.services.command_planner import plan_command_with_mode
from app.services.command_plan_execution import prepare_command_plan_for_execution
from app.services.storage_service import storage_service
from app.services.database_service import (
    clear_database_generated_outputs,
    delete_database_generated_output,
    get_database_generated_outputs,
    get_database_command_logs,
    get_database_command_log_summary,
    get_database_detection_results,
    get_database_detection_summary,
    get_database_inference_logs,
    get_database_inference_summary,
    get_database_media_files,
    get_database_stats,
    get_database_url,
    initialize_command_logs_table,
    initialize_detection_results_table,
    initialize_media_files_table,
    initialize_model_inference_logs_table,
    save_command_log_to_database,
    save_generated_output_to_database,
    save_detections_to_database,
    save_inference_log_to_database,
    save_media_file_to_database,
    get_database_parser_attempt_logs,
    initialize_parser_attempt_logs_table,
    save_parser_attempt_to_database,
    get_database_parser_attempt_summary,
    get_database_generated_output_lineage,
    get_database_generated_output_workflows,
    get_database_generated_outputs_by_source,
)
from app.schemas import (
    BlurAllByClassRequest,
    BlurByClassRequest,
    CommandRequest,
    GeneratedOutputHistoryItemRequest,
    PreparedCommandExecutionRequest,
    CommandParseRequest,
    CommandPlanRequest,
    CommandPlanExecutionPrepareRequest,
    CommandPlanExecutionPrepareResponse,
    ParsedCommandValidationRequest,
    CropByClassRequest,
    ZoomByClassRequest,
    CropRequest,
    VideoTrimRequest,
    VideoFrameExtractRequest,
    VideoFrameDetectionBatchRequest,
    VideoMultiFrameExtractRequest,
    VideoSampledDetectionRequest,
    VideoTrackingRequest,
    ImageChatRequest,
    VideoChatRequest,
)

from app.config import (
    APP_DESCRIPTION,
    APP_TITLE,
    APP_VERSION,
    COMMAND_LOG_FILE,
    LOG_DIR,
    MODEL_NAME,
    OUTPUT_DIR,
    PARSER_LOG_FILE,
    UPLOAD_DIR,
    VIDEO_DIR,
)

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
)

app.include_router(health.router)
app.include_router(model.router)


def sync_storage_service_directories():
    storage_service.directories.update(
        {
            "uploads": UPLOAD_DIR,
            "outputs": OUTPUT_DIR,
            "videos": VIDEO_DIR,
            "logs": LOG_DIR,
        }
    )


def ensure_runtime_directories():
    sync_storage_service_directories()
    storage_service.ensure_directories()


ensure_runtime_directories()




@app.post("/media/upload")
def upload_media(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image uploads are supported in this step",
        )

    sync_storage_service_directories()

    original_filename = file.filename or "uploaded_image"
    stored_filename = storage_service.make_unique_filename(original_filename)
    storage_path = storage_service.save_stream("uploads", stored_filename, file.file)

    try:
        with Image.open(storage_path) as image:
            width, height = image.size
    except UnidentifiedImageError:
        storage_service.delete_file("uploads", stored_filename, missing_ok=True)
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
        "file_url": storage_service.url_for("uploads", stored_filename),
    }

    try:
        save_media_file_to_database(response_data, datetime.now(timezone.utc).isoformat())
    except Exception:
        # Database metadata logging should not break image upload.
        pass

    return response_data


@app.get("/media/uploads/{filename}")
def get_uploaded_media(filename: str):
    sync_storage_service_directories()

    try:
        file_path = storage_service.path_for("uploads", filename)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid uploaded filename",
        )

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found",
        )

    return FileResponse(file_path)


@app.get("/media/outputs/{filename}")
def get_output_media(filename: str):
    sync_storage_service_directories()

    try:
        file_path = storage_service.path_for("outputs", filename)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid output filename",
        )

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



@app.post("/vision/detect-output/{filename}")
def detect_generated_output(
    filename: str,
    confidence_threshold: float = Query(0.25, ge=0.0, le=1.0),
    class_filter: Optional[str] = Query(None),
):
    image_path = OUTPUT_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Generated output image not found",
        )

    detections = run_yolo_detection_with_inference_logging(
        filename=filename,
        image_path=image_path,
        confidence_threshold=confidence_threshold,
        class_filter=class_filter,
        source_endpoint="output_detection",
    )

    try:
        save_detections_to_database(
            filename=filename,
            detections=detections,
            confidence_threshold=confidence_threshold,
            class_filter=class_filter,
            source_endpoint="output_detection",
        )
    except Exception:
        pass

    return {
        "filename": filename,
        "source": "outputs",
        "confidence_threshold": confidence_threshold,
        "class_filter": class_filter,
        "detections": detections,
        "detection_count": len(detections),
    }


@app.post("/vision/detect-output/{filename}/annotated")
def detect_generated_output_with_annotation(
    filename: str,
    confidence_threshold: float = Query(0.25, ge=0.0, le=1.0),
    class_filter: Optional[str] = Query(None),
):
    image_path = OUTPUT_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Generated output image not found",
        )

    detections = run_yolo_detection_with_inference_logging(
        filename=filename,
        image_path=image_path,
        confidence_threshold=confidence_threshold,
        class_filter=class_filter,
        source_endpoint="output_annotated_detection",
    )

    try:
        save_detections_to_database(
            filename=filename,
            detections=detections,
            confidence_threshold=confidence_threshold,
            class_filter=class_filter,
            source_endpoint="output_annotated_detection",
        )
    except Exception:
        pass

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    file_extension = image_path.suffix or ".png"
    annotated_filename = f"annotated_output_{image_path.stem}_{uuid4().hex}{file_extension}"
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
        "source": "outputs",
        "confidence_threshold": confidence_threshold,
        "class_filter": class_filter,
        "detections": detections,
        "detection_count": len(detections),
        "annotated_filename": annotated_filename,
        "annotated_file_url": f"/media/outputs/{annotated_filename}",
    }



@app.post("/vision/crop-output/{filename}")
def crop_generated_output_image(filename: str, crop: CropRequest):
    image_path = OUTPUT_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Generated output image not found")

    with Image.open(image_path) as image:
        image = image.convert("RGB")
        width, height = image.size

        left = max(0, int(crop.x1))
        top = max(0, int(crop.y1))
        right = min(width, int(crop.x2))
        bottom = min(height, int(crop.y2))

        if right <= left or bottom <= top:
            raise HTTPException(status_code=400, detail="Crop box is invalid")

        cropped_image = image.crop((left, top, right, bottom))
        cropped_filename = f"crop_output_{image_path.stem}_{uuid4().hex}{image_path.suffix or '.png'}"
        cropped_path = OUTPUT_DIR / cropped_filename
        cropped_image.save(cropped_path)

    return {
        "filename": filename,
        "source": "outputs",
        "cropped_filename": cropped_filename,
        "cropped_file_url": f"/media/outputs/{cropped_filename}",
        "crop_box": {
            "x1": left,
            "y1": top,
            "x2": right,
            "y2": bottom,
        },
    }


@app.post("/vision/blur-output/{filename}")
def blur_generated_output_image(filename: str, blur: CropRequest):
    image_path = OUTPUT_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Generated output image not found")

    with Image.open(image_path) as image:
        image = image.convert("RGB")
        width, height = image.size

        left = max(0, int(blur.x1))
        top = max(0, int(blur.y1))
        right = min(width, int(blur.x2))
        bottom = min(height, int(blur.y2))

        if right <= left or bottom <= top:
            raise HTTPException(status_code=400, detail="Blur box is invalid")

        blurred_image = image.copy()
        region = blurred_image.crop((left, top, right, bottom))
        region = region.resize((max(1, region.width // 12), max(1, region.height // 12)))
        region = region.resize((right - left, bottom - top))
        blurred_image.paste(region, (left, top))

        blurred_filename = f"blur_output_{image_path.stem}_{uuid4().hex}{image_path.suffix or '.png'}"
        blurred_path = OUTPUT_DIR / blurred_filename
        blurred_image.save(blurred_path)

    return {
        "filename": filename,
        "source": "outputs",
        "blurred_filename": blurred_filename,
        "blurred_file_url": f"/media/outputs/{blurred_filename}",
        "blur_box": {
            "x1": left,
            "y1": top,
            "x2": right,
            "y2": bottom,
        },
    }



def crop_best_generated_output_object_by_class(filename: str, request: CropByClassRequest):
    image_path = OUTPUT_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Generated output image not found")

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

    best_detection = max(detections, key=lambda detection: detection["confidence"])
    crop_response = crop_generated_output_image(
        filename,
        CropRequest(**best_detection["bbox"]),
    )

    return {
        "filename": filename,
        "source": "outputs",
        "class_name": request.class_name,
        "confidence_threshold": request.confidence_threshold,
        "selected_detection": best_detection,
        **crop_response,
    }


def blur_best_generated_output_object_by_class(filename: str, request: BlurByClassRequest):
    image_path = OUTPUT_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Generated output image not found")

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

    best_detection = max(detections, key=lambda detection: detection["confidence"])
    blur_response = blur_generated_output_image(
        filename,
        CropRequest(**best_detection["bbox"]),
    )

    return {
        "filename": filename,
        "source": "outputs",
        "class_name": request.class_name,
        "confidence_threshold": request.confidence_threshold,
        "selected_detection": best_detection,
        **blur_response,
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
                    result_type TEXT NOT NULL,
                    parser_mode TEXT,
                    parser_type TEXT,
                    parser_version TEXT
                );
                """
            )
            cursor.execute("ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS parser_mode TEXT;")
            cursor.execute("ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS parser_type TEXT;")
            cursor.execute("ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS parser_version TEXT;")
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
                    result_type,
                    parser_mode,
                    parser_type,
                    parser_version
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    log_entry["timestamp"],
                    log_entry["filename"],
                    log_entry["command"],
                    log_entry["confidence_threshold"],
                    log_entry["parsed_action"],
                    log_entry["parsed_class"],
                    log_entry["result_type"],
                    log_entry.get("parser_mode"),
                    log_entry.get("parser_type"),
                    log_entry.get("parser_version"),
                ),
            )
        connection.commit()

    return True


def get_database_command_logs(limit: int = 20, parser_mode=None, result_type=None):
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
            query_params = []
            where_clauses = []

            if parser_mode:
                where_clauses.append("parser_mode = %s")
                query_params.append(parser_mode)

            if result_type:
                where_clauses.append("result_type = %s")
                query_params.append(result_type)

            filter_clause = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

            query_params.append(limit)

            cursor.execute(
                f"""
                SELECT
                    timestamp,
                    filename,
                    command,
                    confidence_threshold,
                    parsed_action,
                    parsed_class,
                    result_type,
                    parser_mode,
                    parser_type,
                    parser_version
                FROM command_logs
                {filter_clause}
                ORDER BY id DESC
                LIMIT %s;
                """,
                tuple(query_params),
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
            "parser_mode": row[7],
            "parser_type": row[8],
            "parser_version": row[9],
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
    parse_result=None,
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
        "parser_mode": request.parser_mode,
        "parser_type": parse_result.get("parser_type") if isinstance(parse_result, dict) else None,
        "parser_version": parse_result.get("parser_version") if isinstance(parse_result, dict) else None,
    }

    with COMMAND_LOG_FILE.open("a", encoding="utf-8") as log_file:
        log_file.write(json.dumps(log_entry) + "\n")

    try:
        save_command_log_to_database(log_entry)
    except Exception:
        # Database logging should not break command execution.
        pass


def build_command_execution_response(
    request: CommandRequest,
    parse_result: dict,
    parsed_command: dict,
    result_type: str,
    result,
):
    return {
        "command": request.command,
        "parser_mode": request.parser_mode,
        "parser_type": parse_result.get("parser_type"),
        "parser_version": parse_result.get("parser_version"),
        "parsed_command": parsed_command,
        "result_type": result_type,
        "result": result,
    }


def _validate_command_confidence_threshold(confidence_threshold: float):
    if confidence_threshold < 0 or confidence_threshold > 1:
        raise HTTPException(
            status_code=400,
            detail="confidence_threshold must be between 0 and 1",
        )


def _is_generated_output_command(request: CommandRequest) -> bool:
    return getattr(request, "media_source", "uploads") == "outputs"


def execute_validated_parsed_command(
    request: CommandRequest,
    parse_result: dict,
    parsed_command: dict,
):
    if parsed_command["action"] == "detect":
        result = (
            detect_generated_output_with_annotation(
                filename=request.filename,
                confidence_threshold=request.confidence_threshold,
                class_filter=None,
            )
            if _is_generated_output_command(request)
            else detect_objects_with_annotation(
                filename=request.filename,
                confidence_threshold=request.confidence_threshold,
                class_filter=None,
            )
        )

        result_type = "annotated_detection"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result=result,
        )

    if parsed_command["action"] == "crop_by_class":
        class_name = parsed_command["class_name"]

        result = (
            crop_best_generated_output_object_by_class(
                filename=request.filename,
                request=CropByClassRequest(
                    class_name=class_name,
                    confidence_threshold=request.confidence_threshold,
                ),
            )
            if _is_generated_output_command(request)
            else crop_best_object_by_class(
                filename=request.filename,
                request=CropByClassRequest(
                    class_name=class_name,
                    confidence_threshold=request.confidence_threshold,
                ),
            )
        )

        result_type = "crop_by_class"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result=result,
        )

    if parsed_command["action"] == "blur_by_class":
        class_name = parsed_command["class_name"]

        result = (
            blur_best_generated_output_object_by_class(
                filename=request.filename,
                request=BlurByClassRequest(
                    class_name=class_name,
                    confidence_threshold=request.confidence_threshold,
                ),
            )
            if _is_generated_output_command(request)
            else blur_best_object_by_class(
                filename=request.filename,
                request=BlurByClassRequest(
                    class_name=class_name,
                    confidence_threshold=request.confidence_threshold,
                ),
            )
        )

        result_type = "blur_by_class"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result=result,
        )

    if parsed_command["action"] == "zoom_by_class":
        class_name = parsed_command["class_name"]

        result = (
            zoom_best_generated_output_object_by_class(
                filename=request.filename,
                request=ZoomByClassRequest(
                    class_name=class_name,
                    confidence_threshold=request.confidence_threshold,
                    target_scope=parsed_command.get("target_scope", "best"),
                ),
            )
            if _is_generated_output_command(request)
            else zoom_best_object_by_class(
                filename=request.filename,
                request=ZoomByClassRequest(
                    class_name=class_name,
                    confidence_threshold=request.confidence_threshold,
                    target_scope=parsed_command.get("target_scope", "best"),
                ),
            )
        )

        result_type = "zoom_by_class"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result=result,
        )

    if parsed_command["action"] == "blur_all_by_class":
        class_name = parsed_command["class_name"]

        result = (
            blur_all_generated_output_objects_by_class(
                filename=request.filename,
                request=BlurAllByClassRequest(
                    class_name=class_name,
                    confidence_threshold=request.confidence_threshold,
                ),
            )
            if _is_generated_output_command(request)
            else blur_all_objects_by_class(
                filename=request.filename,
                request=BlurAllByClassRequest(
                    class_name=class_name,
                    confidence_threshold=request.confidence_threshold,
                ),
            )
        )

        result_type = "blur_all_by_class"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result=result,
        )

    if parsed_command["action"] == "extract_frame":
        result = extract_video_frame(
            filename=request.filename,
            request=VideoFrameExtractRequest(
                timestamp_seconds=parsed_command["timestamp_seconds"],
            ),
        )

        result_type = "extract_frame"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result=result,
        )

    if parsed_command["action"] == "detect_frames":
        extracted_frames_result = extract_video_frames(
            filename=request.filename,
            request=VideoMultiFrameExtractRequest(
                start_seconds=parsed_command["start_seconds"],
                end_seconds=parsed_command["end_seconds"],
                interval_seconds=parsed_command["interval_seconds"],
            ),
        )

        frame_filenames = [
            frame["frame_filename"]
            for frame in extracted_frames_result["frames"]
        ]

        detection_result = detect_objects_on_multiple_extracted_frames(
            request=VideoFrameDetectionBatchRequest(
                frame_filenames=frame_filenames,
                confidence_threshold=request.confidence_threshold,
                class_filter=None,
            ),
        )

        result_type = "detect_frames"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result={
                "extracted_frames": extracted_frames_result,
                "detection": detection_result,
            },
        )

    if parsed_command["action"] == "track_video":
        result = track_sampled_video_objects(
            filename=request.filename,
            request=VideoTrackingRequest(
                start_seconds=parsed_command["start_seconds"],
                end_seconds=parsed_command["end_seconds"],
                interval_seconds=parsed_command["interval_seconds"],
                confidence_threshold=request.confidence_threshold,
                class_filter=parsed_command["class_name"],
                max_distance_pixels=80,
            ),
        )

        result_type = "track_video"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result=result,
        )

    if parsed_command["action"] == "trim_video":
        result = trim_uploaded_video(
            filename=request.filename,
            trim=VideoTrimRequest(
                start_seconds=parsed_command["start_seconds"],
                end_seconds=parsed_command["end_seconds"],
            ),
        )

        result_type = "trim_video"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result=result,
        )

    if parsed_command["action"] == "extract_frames":
        result = extract_video_frames(
            filename=request.filename,
            request=VideoMultiFrameExtractRequest(
                start_seconds=parsed_command["start_seconds"],
                end_seconds=parsed_command["end_seconds"],
                interval_seconds=parsed_command["interval_seconds"],
            ),
        )

        result_type = "extract_frames"
        log_command_execution(request, parsed_command, result_type, parse_result)

        return build_command_execution_response(
            request=request,
            parse_result=parse_result,
            parsed_command=parsed_command,
            result_type=result_type,
            result=result,
        )

    raise HTTPException(
        status_code=400,
        detail="Unsupported command action",
    )


@app.post("/commands/execute")
def execute_command(request: CommandRequest):
    _validate_command_confidence_threshold(request.confidence_threshold)

    parse_result = parse_command_with_mode(
        command=request.command,
        parser_mode=request.parser_mode,
    )
    parsed_command = validate_parsed_command(parse_result["parsed_command"])

    return execute_validated_parsed_command(
        request=request,
        parse_result=parse_result,
        parsed_command=parsed_command,
    )


@app.post("/commands/execute-prepared")
def execute_prepared_command(request: PreparedCommandExecutionRequest):
    _validate_command_confidence_threshold(request.confidence_threshold)

    parsed_command = validate_parsed_command(request.prepared_command)

    command_request = CommandRequest(
        filename=request.filename,
        command=request.command,
        confidence_threshold=request.confidence_threshold,
        parser_mode="prepared",
        media_source=request.media_source,
    )

    parse_result = {
        "parser_type": "prepared_command",
        "parser_version": "prepared-command-v1",
    }

    return execute_validated_parsed_command(
        request=command_request,
        parse_result=parse_result,
        parsed_command=parsed_command,
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






def _detection_center_x(detection: dict) -> float:
    bbox = detection["bbox"]
    return (float(bbox["x1"]) + float(bbox["x2"])) / 2


def _detection_area(detection: dict) -> float:
    bbox = detection["bbox"]
    width = float(bbox["x2"]) - float(bbox["x1"])
    height = float(bbox["y2"]) - float(bbox["y1"])
    return width * height


def _select_zoom_detection(detections: list[dict], target_scope: str, image_width: int) -> dict:
    if target_scope == "largest":
        return max(detections, key=_detection_area)

    if target_scope == "left":
        return min(detections, key=_detection_center_x)

    if target_scope == "right":
        return max(detections, key=_detection_center_x)

    if target_scope == "center":
        image_center_x = image_width / 2
        return min(
            detections,
            key=lambda detection: abs(_detection_center_x(detection) - image_center_x),
        )

    return max(detections, key=lambda detection: detection["confidence"])


@app.post("/vision/zoom-by-class/{filename}")
def zoom_best_object_by_class(filename: str, request: ZoomByClassRequest):
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

    if request.padding_ratio < 0:
        raise HTTPException(
            status_code=400,
            detail="padding_ratio must be greater than or equal to 0",
        )

    if request.zoom_factor < 1:
        raise HTTPException(
            status_code=400,
            detail="zoom_factor must be greater than or equal to 1",
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

    with Image.open(image_path) as image:
        image = image.convert("RGB")
        width, height = image.size

        best_detection = _select_zoom_detection(
            detections=detections,
            target_scope=request.target_scope,
            image_width=width,
        )
        bbox = best_detection["bbox"]

        x1 = float(bbox["x1"])
        y1 = float(bbox["y1"])
        x2 = float(bbox["x2"])
        y2 = float(bbox["y2"])

        box_width = x2 - x1
        box_height = y2 - y1

        if box_width <= 0 or box_height <= 0:
            raise HTTPException(
                status_code=400,
                detail="Detected object bounding box is invalid",
            )

        target_aspect_ratio = width / height

        crop_width = width / request.zoom_factor
        crop_height = crop_width / target_aspect_ratio

        if crop_height > height:
            crop_height = height / request.zoom_factor
            crop_width = crop_height * target_aspect_ratio

        padded_width = box_width * (1 + request.padding_ratio * 2)
        padded_height = box_height * (1 + request.padding_ratio * 2)

        crop_width = max(crop_width, min(padded_width, width / request.zoom_factor))
        crop_height = max(crop_height, min(padded_height, height / request.zoom_factor))

        crop_aspect_ratio = crop_width / crop_height
        if crop_aspect_ratio < target_aspect_ratio:
            crop_width = crop_height * target_aspect_ratio
        elif crop_aspect_ratio > target_aspect_ratio:
            crop_height = crop_width / target_aspect_ratio

        crop_width = min(crop_width, width)
        crop_height = min(crop_height, height)

        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        left = int(round(center_x - crop_width / 2))
        top = int(round(center_y - crop_height / 2))
        right = int(round(left + crop_width))
        bottom = int(round(top + crop_height))

        if left < 0:
            right -= left
            left = 0

        if top < 0:
            bottom -= top
            top = 0

        if right > width:
            left -= right - width
            right = width

        if bottom > height:
            top -= bottom - height
            bottom = height

        left = max(0, left)
        top = max(0, top)
        right = min(width, right)
        bottom = min(height, bottom)

        if right <= left or bottom <= top:
            raise HTTPException(
                status_code=400,
                detail="Zoom crop box is invalid",
            )

        zoomed_region = image.crop((left, top, right, bottom))
        zoomed_image = zoomed_region.resize((width, height), Image.Resampling.LANCZOS)

        file_extension = image_path.suffix or ".png"
        zoomed_filename = f"zoom_{request.class_name}_{image_path.stem}_{uuid4().hex}{file_extension}"
        zoomed_path = OUTPUT_DIR / zoomed_filename

        zoomed_image.save(zoomed_path)

    return {
        "filename": filename,
        "class_name": request.class_name,
        "confidence_threshold": request.confidence_threshold,
        "padding_ratio": request.padding_ratio,
        "zoom_factor": request.zoom_factor,
        "target_scope": request.target_scope,
        "selected_detection": best_detection,
        "zoomed_filename": zoomed_filename,
        "zoomed_file_url": f"/media/outputs/{zoomed_filename}",
        "zoom_box": {
            "x1": left,
            "y1": top,
            "x2": right,
            "y2": bottom,
        },
        "output_size": {
            "width": width,
            "height": height,
        },
    }



def blur_all_generated_output_objects_by_class(filename: str, request: BlurAllByClassRequest):
    image_path = OUTPUT_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Generated output image not found")

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
        blurred_filename = f"blur_all_output_{class_name}_{image_path.stem}_{uuid4().hex}{file_extension}"
        blurred_path = OUTPUT_DIR / blurred_filename
        image.save(blurred_path)

    return {
        "filename": filename,
        "source": "outputs",
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



def zoom_best_generated_output_object_by_class(filename: str, request: ZoomByClassRequest):
    image_path = OUTPUT_DIR / filename

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Generated output image not found")

    if request.confidence_threshold < 0 or request.confidence_threshold > 1:
        raise HTTPException(
            status_code=400,
            detail="confidence_threshold must be between 0 and 1",
        )

    if request.padding_ratio < 0:
        raise HTTPException(
            status_code=400,
            detail="padding_ratio must be greater than or equal to 0",
        )

    if request.zoom_factor < 1:
        raise HTTPException(
            status_code=400,
            detail="zoom_factor must be greater than or equal to 1",
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

    with Image.open(image_path) as image:
        image = image.convert("RGB")
        width, height = image.size
        best_detection = _select_zoom_detection(
            detections=detections,
            target_scope=request.target_scope,
            image_width=width,
        )
        bbox = best_detection["bbox"]

        x1 = float(bbox["x1"])
        y1 = float(bbox["y1"])
        x2 = float(bbox["x2"])
        y2 = float(bbox["y2"])

        box_width = x2 - x1
        box_height = y2 - y1

        if box_width <= 0 or box_height <= 0:
            raise HTTPException(status_code=400, detail="Detected object bounding box is invalid")

        target_aspect_ratio = width / height
        crop_width = width / request.zoom_factor
        crop_height = crop_width / target_aspect_ratio

        if crop_height > height:
            crop_height = height / request.zoom_factor
            crop_width = crop_height * target_aspect_ratio

        padded_width = box_width * (1 + request.padding_ratio * 2)
        padded_height = box_height * (1 + request.padding_ratio * 2)

        crop_width = max(crop_width, min(padded_width, width / request.zoom_factor))
        crop_height = max(crop_height, min(padded_height, height / request.zoom_factor))

        crop_aspect_ratio = crop_width / crop_height

        if crop_aspect_ratio < target_aspect_ratio:
            crop_width = crop_height * target_aspect_ratio
        elif crop_aspect_ratio > target_aspect_ratio:
            crop_height = crop_width / target_aspect_ratio

        crop_width = min(crop_width, width)
        crop_height = min(crop_height, height)

        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        left = int(round(center_x - crop_width / 2))
        top = int(round(center_y - crop_height / 2))
        right = int(round(left + crop_width))
        bottom = int(round(top + crop_height))

        if left < 0:
            right -= left
            left = 0

        if top < 0:
            bottom -= top
            top = 0

        if right > width:
            left -= right - width
            right = width

        if bottom > height:
            top -= bottom - height
            bottom = height

        left = max(0, left)
        top = max(0, top)
        right = min(width, right)
        bottom = min(height, bottom)

        if right <= left or bottom <= top:
            raise HTTPException(status_code=400, detail="Zoom crop box is invalid")

        zoomed_region = image.crop((left, top, right, bottom))
        zoomed_image = zoomed_region.resize((width, height), Image.Resampling.LANCZOS)

        file_extension = image_path.suffix or ".png"
        zoomed_filename = f"zoom_output_{request.class_name}_{image_path.stem}_{uuid4().hex}{file_extension}"
        zoomed_path = OUTPUT_DIR / zoomed_filename
        zoomed_image.save(zoomed_path)

    return {
        "filename": filename,
        "source": "outputs",
        "class_name": request.class_name,
        "confidence_threshold": request.confidence_threshold,
        "padding_ratio": request.padding_ratio,
        "zoom_factor": request.zoom_factor,
        "target_scope": request.target_scope,
        "selected_detection": best_detection,
        "zoomed_filename": zoomed_filename,
        "zoomed_file_url": f"/media/outputs/{zoomed_filename}",
        "zoom_box": {
            "x1": left,
            "y1": top,
            "x2": right,
            "y2": bottom,
        },
        "output_size": {
            "width": width,
            "height": height,
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



SUPPORTED_COMMAND_RESULT_TYPES = {
    "annotated_detection",
    "crop_by_class",
    "blur_by_class",
    "blur_all_by_class",
    "zoom_by_class",
    "extract_frame",
    "extract_frames",
    "detect_frames",
    "track_video",
    "trim_video",
}


def normalize_command_log_filters(parser_mode=None, result_type=None):
    supported_parser_modes = {"rule_based", "llm_mock", "real_llm"}

    if parser_mode == "all":
        parser_mode = None

    if result_type == "all":
        result_type = None

    if parser_mode and parser_mode not in supported_parser_modes:
        raise HTTPException(
            status_code=400,
            detail="Supported parser modes are: rule_based, llm_mock, real_llm",
        )

    if result_type and result_type not in SUPPORTED_COMMAND_RESULT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Supported result types are: annotated_detection, crop_by_class, blur_by_class, blur_all_by_class, zoom_by_class, extract_frame, extract_frames, detect_frames, track_video, trim_video",
        )

    return parser_mode, result_type


@app.get("/db/command-logs")
def get_postgres_command_logs(
    limit: int = Query(20, ge=1, le=100),
    parser_mode: Optional[str] = Query(None),
    result_type: Optional[str] = Query(None),
):
    parser_mode, result_type = normalize_command_log_filters(
        parser_mode=parser_mode,
        result_type=result_type,
    )

    return get_database_command_logs(
        limit,
        parser_mode=parser_mode,
        result_type=result_type,
    )


@app.get("/db/command-log-summary")
def get_postgres_command_log_summary(
    parser_mode: Optional[str] = Query(None),
    result_type: Optional[str] = Query(None),
):
    parser_mode, result_type = normalize_command_log_filters(
        parser_mode=parser_mode,
        result_type=result_type,
    )

    return get_database_command_log_summary(
        parser_mode=parser_mode,
        result_type=result_type,
    )


@app.get("/db/command-logs/export")
def export_postgres_command_logs(
    limit: int = Query(100, ge=1, le=500),
    parser_mode: Optional[str] = Query(None),
    result_type: Optional[str] = Query(None),
):
    import csv
    import io

    from fastapi.responses import Response

    parser_mode, result_type = normalize_command_log_filters(
        parser_mode=parser_mode,
        result_type=result_type,
    )

    result = get_database_command_logs(
        limit=limit,
        parser_mode=parser_mode,
        result_type=result_type,
    )

    output = io.StringIO()

    fieldnames = [
        "timestamp",
        "filename",
        "command",
        "confidence_threshold",
        "parsed_action",
        "parsed_class",
        "result_type",
        "parser_mode",
        "parser_type",
        "parser_version",
    ]

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for log in result.get("logs", []):
        writer.writerow(
            {
                "timestamp": log.get("timestamp"),
                "filename": log.get("filename"),
                "command": log.get("command"),
                "confidence_threshold": log.get("confidence_threshold"),
                "parsed_action": log.get("parsed_action"),
                "parsed_class": log.get("parsed_class"),
                "result_type": log.get("result_type"),
                "parser_mode": log.get("parser_mode"),
                "parser_type": log.get("parser_type"),
                "parser_version": log.get("parser_version"),
            }
        )

    filename = "command_logs.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Command-Logs-Status": result.get("status", "unknown"),
            "X-Command-Logs-Count": str(result.get("count", 0)),
        },
    )



@app.get("/db/media-files")
def get_postgres_media_files(limit: int = Query(20, ge=1, le=100)):
    return get_database_media_files(limit)


@app.get("/db/generated-outputs")
def get_postgres_generated_outputs(limit: int = Query(100, ge=1, le=500)):
    return get_database_generated_outputs(limit)


@app.get("/db/generated-outputs/workflows")
def get_postgres_generated_output_workflows(limit: int = Query(500, ge=1, le=500)):
    return get_database_generated_output_workflows(limit)


@app.get("/db/generated-outputs/source/{source_filename}")
def get_postgres_generated_outputs_by_source(
    source_filename: str,
    limit: int = Query(100, ge=1, le=500),
):
    return get_database_generated_outputs_by_source(source_filename, limit)


@app.get("/db/generated-outputs/{output_id}/lineage")
def get_postgres_generated_output_lineage(output_id: str):
    return get_database_generated_output_lineage(output_id)


@app.post("/db/generated-outputs")
def save_postgres_generated_output(item: GeneratedOutputHistoryItemRequest):
    item_data = item.model_dump() if hasattr(item, "model_dump") else item.dict()
    return save_generated_output_to_database(item_data)


@app.delete("/db/generated-outputs")
def clear_postgres_generated_outputs():
    return clear_database_generated_outputs()


@app.delete("/db/generated-outputs/{output_id}")
def delete_postgres_generated_output(output_id: str):
    return delete_database_generated_output(output_id)



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
            model_name=MODEL_NAME,
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




@app.get("/db/stats")
def get_postgres_stats():
    return get_database_stats()



@app.get("/db/detections")
def get_postgres_detection_results(limit: int = Query(20, ge=1, le=100)):
    return get_database_detection_results(limit)


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




@app.get("/db/inference-summary")
def get_postgres_inference_summary():
    return get_database_inference_summary()






def extract_video_metadata(video_path: Path):
    import cv2

    video_capture = cv2.VideoCapture(str(video_path))

    if not video_capture.isOpened():
        video_capture.release()
        return {
            "is_readable": False,
            "width": None,
            "height": None,
            "fps": None,
            "frame_count": None,
            "duration_seconds": None,
        }

    fps = video_capture.get(cv2.CAP_PROP_FPS)
    frame_count = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(video_capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video_capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

    duration_seconds = None

    if fps and fps > 0:
        duration_seconds = round(frame_count / fps, 2)

    video_capture.release()

    return {
        "is_readable": True,
        "width": width,
        "height": height,
        "fps": round(float(fps), 2) if fps else None,
        "frame_count": frame_count,
        "duration_seconds": duration_seconds,
    }


@app.post("/media/upload-video")
def upload_video(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=400,
            detail="Only video uploads are supported by this endpoint",
        )

    VIDEO_DIR.mkdir(parents=True, exist_ok=True)

    original_filename = file.filename or "uploaded_video"
    file_extension = Path(original_filename).suffix or ".mp4"
    stored_filename = f"{uuid4().hex}{file_extension}"
    storage_path = VIDEO_DIR / stored_filename

    with storage_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size_bytes = storage_path.stat().st_size
    video_metadata = extract_video_metadata(storage_path)

    return {
        "message": "Video uploaded successfully",
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "content_type": file.content_type,
        "file_size_bytes": file_size_bytes,
        "storage_path": str(storage_path),
        "file_url": f"/media/videos/{stored_filename}",
        "metadata": video_metadata,
    }


@app.get("/media/videos/{filename}")
def get_uploaded_video(filename: str):
    sync_storage_service_directories()

    try:
        file_path = storage_service.path_for("videos", filename)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid video filename",
        )

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded video not found",
        )

    return FileResponse(file_path)


@app.post("/video/trim/{filename}")
def trim_uploaded_video(filename: str, trim: VideoTrimRequest):
    video_path = VIDEO_DIR / filename

    if not video_path.exists() or not video_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded video not found",
        )

    if trim.start_seconds < 0 or trim.end_seconds <= trim.start_seconds:
        raise HTTPException(
            status_code=400,
            detail="Invalid trim time range",
        )

    video_metadata = extract_video_metadata(video_path)

    if not video_metadata["is_readable"]:
        raise HTTPException(
            status_code=400,
            detail="Uploaded video is not readable",
        )

    duration_seconds = video_metadata["duration_seconds"]

    if duration_seconds is not None and trim.start_seconds >= duration_seconds:
        raise HTTPException(
            status_code=400,
            detail="Trim start time is beyond video duration",
        )

    end_seconds = trim.end_seconds

    if duration_seconds is not None:
        end_seconds = min(trim.end_seconds, duration_seconds)

    trim_duration = end_seconds - trim.start_seconds

    if trim_duration <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid trim duration",
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    trimmed_filename = f"trim_{video_path.stem}_{uuid4().hex}.mp4"
    trimmed_path = OUTPUT_DIR / trimmed_filename

    import subprocess
    import imageio_ffmpeg

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    command = [
        ffmpeg_exe,
        "-y",
        "-ss",
        str(trim.start_seconds),
        "-i",
        str(video_path),
        "-t",
        str(trim_duration),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        "-an",
        str(trimmed_path),
    ]

    completed_process = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    if completed_process.returncode != 0 or not trimmed_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Video trim failed: {completed_process.stderr[-500:]}",
        )

    trimmed_metadata = extract_video_metadata(trimmed_path)

    return {
        "filename": filename,
        "trimmed_filename": trimmed_filename,
        "trimmed_file_url": f"/media/outputs/{trimmed_filename}",
        "start_seconds": trim.start_seconds,
        "end_seconds": round(end_seconds, 2),
        "duration_seconds": round(trim_duration, 2),
        "metadata": trimmed_metadata,
    }


@app.post("/video/extract-frame/{filename}")
def extract_video_frame(filename: str, request: VideoFrameExtractRequest):
    video_path = VIDEO_DIR / filename

    if not video_path.exists() or not video_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded video not found",
        )

    if request.timestamp_seconds < 0:
        raise HTTPException(
            status_code=400,
            detail="Timestamp must be greater than or equal to 0",
        )

    import cv2

    video_capture = cv2.VideoCapture(str(video_path))

    if not video_capture.isOpened():
        video_capture.release()
        raise HTTPException(
            status_code=400,
            detail="Uploaded video is not readable",
        )

    fps = video_capture.get(cv2.CAP_PROP_FPS)
    frame_count = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))

    if not fps or fps <= 0:
        video_capture.release()
        raise HTTPException(
            status_code=400,
            detail="Could not read video FPS",
        )

    duration_seconds = frame_count / fps

    if request.timestamp_seconds > duration_seconds:
        video_capture.release()
        raise HTTPException(
            status_code=400,
            detail="Timestamp is beyond video duration",
        )

    target_frame_index = int(request.timestamp_seconds * fps)
    video_capture.set(cv2.CAP_PROP_POS_FRAMES, target_frame_index)

    success, frame = video_capture.read()
    video_capture.release()

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Could not extract frame at requested timestamp",
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    frame_filename = f"frame_{video_path.stem}_{target_frame_index}_{uuid4().hex}.jpg"
    frame_path = OUTPUT_DIR / frame_filename

    success = cv2.imwrite(str(frame_path), frame)

    if not success or not frame_path.exists():
        raise HTTPException(
            status_code=500,
            detail="Failed to save extracted frame",
        )

    return {
        "filename": filename,
        "frame_filename": frame_filename,
        "frame_file_url": f"/media/outputs/{frame_filename}",
        "timestamp_seconds": request.timestamp_seconds,
        "frame_index": target_frame_index,
        "fps": round(float(fps), 2),
        "video_duration_seconds": round(duration_seconds, 2),
    }


@app.post("/video/detect-frame/{frame_filename}/annotated")
def detect_objects_on_extracted_frame(
    frame_filename: str,
    confidence_threshold: float = Query(0.25, ge=0.0, le=1.0),
    class_filter: Optional[str] = Query(None),
):
    frame_path = OUTPUT_DIR / frame_filename

    if not frame_path.exists() or not frame_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Extracted frame not found",
        )

    detections = run_yolo_detection_with_inference_logging(
        filename=frame_filename,
        image_path=frame_path,
        confidence_threshold=confidence_threshold,
        class_filter=class_filter,
        source_endpoint="video_frame_detection",
    )

    try:
        save_detections_to_database(
            filename=frame_filename,
            detections=detections,
            confidence_threshold=confidence_threshold,
            class_filter=class_filter,
            source_endpoint="video_frame_detection",
        )
    except Exception:
        # Database logging should not break frame detection.
        pass

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    file_extension = frame_path.suffix or ".jpg"
    annotated_frame_filename = f"annotated_frame_{frame_path.stem}_{uuid4().hex}{file_extension}"
    annotated_frame_path = OUTPUT_DIR / annotated_frame_filename

    with Image.open(frame_path).convert("RGB") as image:
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

        image.save(annotated_frame_path)

    return {
        "frame_filename": frame_filename,
        "confidence_threshold": confidence_threshold,
        "class_filter": class_filter,
        "detections": detections,
        "detection_count": len(detections),
        "annotated_frame_filename": annotated_frame_filename,
        "annotated_frame_file_url": f"/media/outputs/{annotated_frame_filename}",
    }


@app.post("/video/extract-frames/{filename}")
def extract_video_frames(filename: str, request: VideoMultiFrameExtractRequest):
    video_path = VIDEO_DIR / filename

    if not video_path.exists() or not video_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded video not found",
        )

    if request.start_seconds < 0:
        raise HTTPException(
            status_code=400,
            detail="Start time must be greater than or equal to 0",
        )

    if request.end_seconds <= request.start_seconds:
        raise HTTPException(
            status_code=400,
            detail="End time must be greater than start time",
        )

    if request.interval_seconds <= 0:
        raise HTTPException(
            status_code=400,
            detail="Interval must be greater than 0",
        )

    import cv2

    video_capture = cv2.VideoCapture(str(video_path))

    if not video_capture.isOpened():
        video_capture.release()
        raise HTTPException(
            status_code=400,
            detail="Uploaded video is not readable",
        )

    fps = video_capture.get(cv2.CAP_PROP_FPS)
    frame_count = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))

    if not fps or fps <= 0:
        video_capture.release()
        raise HTTPException(
            status_code=400,
            detail="Could not read video FPS",
        )

    duration_seconds = frame_count / fps

    if request.start_seconds > duration_seconds:
        video_capture.release()
        raise HTTPException(
            status_code=400,
            detail="Start time is beyond video duration",
        )

    end_seconds = min(request.end_seconds, duration_seconds)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    extracted_frames = []
    current_timestamp = request.start_seconds

    while current_timestamp <= end_seconds:
        frame_index = int(current_timestamp * fps)
        video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)

        success, frame = video_capture.read()

        if not success:
            break

        frame_filename = f"frame_{video_path.stem}_{frame_index}_{uuid4().hex}.jpg"
        frame_path = OUTPUT_DIR / frame_filename

        saved = cv2.imwrite(str(frame_path), frame)

        if saved and frame_path.exists():
            extracted_frames.append(
                {
                    "frame_filename": frame_filename,
                    "frame_file_url": f"/media/outputs/{frame_filename}",
                    "timestamp_seconds": round(current_timestamp, 2),
                    "frame_index": frame_index,
                }
            )

        current_timestamp += request.interval_seconds

    video_capture.release()

    if not extracted_frames:
        raise HTTPException(
            status_code=400,
            detail="No frames were extracted",
        )

    return {
        "filename": filename,
        "start_seconds": request.start_seconds,
        "end_seconds": round(end_seconds, 2),
        "interval_seconds": request.interval_seconds,
        "fps": round(float(fps), 2),
        "video_duration_seconds": round(duration_seconds, 2),
        "frame_count": len(extracted_frames),
        "frames": extracted_frames,
    }


@app.post("/video/detect-frames/annotated")
def detect_objects_on_multiple_extracted_frames(
    request: VideoFrameDetectionBatchRequest,
):
    if not request.frame_filenames:
        raise HTTPException(
            status_code=400,
            detail="At least one frame filename is required",
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    frame_results = []

    for frame_filename in request.frame_filenames:
        frame_path = OUTPUT_DIR / frame_filename

        if not frame_path.exists() or not frame_path.is_file():
            raise HTTPException(
                status_code=404,
                detail=f"Extracted frame not found: {frame_filename}",
            )

        detections = run_yolo_detection_with_inference_logging(
            filename=frame_filename,
            image_path=frame_path,
            confidence_threshold=request.confidence_threshold,
            class_filter=request.class_filter,
            source_endpoint="video_frame_batch_detection",
        )

        try:
            save_detections_to_database(
                filename=frame_filename,
                detections=detections,
                confidence_threshold=request.confidence_threshold,
                class_filter=request.class_filter,
                source_endpoint="video_frame_batch_detection",
            )
        except Exception:
            # Database logging should not break frame detection.
            pass

        file_extension = frame_path.suffix or ".jpg"
        annotated_frame_filename = f"annotated_frame_{frame_path.stem}_{uuid4().hex}{file_extension}"
        annotated_frame_path = OUTPUT_DIR / annotated_frame_filename

        with Image.open(frame_path).convert("RGB") as image:
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

            image.save(annotated_frame_path)

        frame_results.append(
            {
                "frame_filename": frame_filename,
                "detections": detections,
                "detection_count": len(detections),
                "annotated_frame_filename": annotated_frame_filename,
                "annotated_frame_file_url": f"/media/outputs/{annotated_frame_filename}",
            }
        )

    return {
        "frame_count": len(frame_results),
        "confidence_threshold": request.confidence_threshold,
        "class_filter": request.class_filter,
        "frames": frame_results,
    }


@app.post("/video/detect-sampled/{filename}")
def detect_sampled_video_frames(filename: str, request: VideoSampledDetectionRequest):
    video_path = VIDEO_DIR / filename

    if not video_path.exists() or not video_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded video not found",
        )

    if request.interval_seconds <= 0:
        raise HTTPException(
            status_code=400,
            detail="Interval must be greater than 0",
        )

    if request.confidence_threshold < 0 or request.confidence_threshold > 1:
        raise HTTPException(
            status_code=400,
            detail="confidence_threshold must be between 0 and 1",
        )

    video_metadata = extract_video_metadata(video_path)

    if not video_metadata["is_readable"]:
        raise HTTPException(
            status_code=400,
            detail="Uploaded video is not readable",
        )

    duration_seconds = video_metadata["duration_seconds"]

    if duration_seconds is None or duration_seconds <= 0:
        raise HTTPException(
            status_code=400,
            detail="Could not determine video duration",
        )

    extracted_frames_result = extract_video_frames(
        filename=filename,
        request=VideoMultiFrameExtractRequest(
            start_seconds=0,
            end_seconds=duration_seconds,
            interval_seconds=request.interval_seconds,
        ),
    )

    frame_filenames = [
        frame["frame_filename"]
        for frame in extracted_frames_result["frames"]
    ]

    detection_result = detect_objects_on_multiple_extracted_frames(
        request=VideoFrameDetectionBatchRequest(
            frame_filenames=frame_filenames,
            confidence_threshold=request.confidence_threshold,
            class_filter=request.class_filter,
        ),
    )

    return {
        "filename": filename,
        "video_metadata": video_metadata,
        "interval_seconds": request.interval_seconds,
        "confidence_threshold": request.confidence_threshold,
        "class_filter": request.class_filter,
        "extracted_frames": extracted_frames_result,
        "detection": detection_result,
    }


def calculate_bbox_center(bbox: dict):
    return {
        "x": round((bbox["x1"] + bbox["x2"]) / 2, 2),
        "y": round((bbox["y1"] + bbox["y2"]) / 2, 2),
    }


def calculate_center_distance(center_a: dict, center_b: dict):
    return (
        (center_a["x"] - center_b["x"]) ** 2
        + (center_a["y"] - center_b["y"]) ** 2
    ) ** 0.5


@app.post("/video/track-sampled/{filename}")
def track_sampled_video_objects(filename: str, request: VideoTrackingRequest):
    video_path = VIDEO_DIR / filename

    if not video_path.exists() or not video_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded video not found",
        )

    if request.start_seconds < 0:
        raise HTTPException(
            status_code=400,
            detail="Start time must be greater than or equal to 0",
        )

    if request.interval_seconds <= 0:
        raise HTTPException(
            status_code=400,
            detail="Interval must be greater than 0",
        )

    if request.confidence_threshold < 0 or request.confidence_threshold > 1:
        raise HTTPException(
            status_code=400,
            detail="confidence_threshold must be between 0 and 1",
        )

    if request.max_distance_pixels <= 0:
        raise HTTPException(
            status_code=400,
            detail="max_distance_pixels must be greater than 0",
        )

    video_metadata = extract_video_metadata(video_path)

    if not video_metadata["is_readable"]:
        raise HTTPException(
            status_code=400,
            detail="Uploaded video is not readable",
        )

    duration_seconds = video_metadata["duration_seconds"]

    if duration_seconds is None or duration_seconds <= 0:
        raise HTTPException(
            status_code=400,
            detail="Could not determine video duration",
        )

    end_seconds = request.end_seconds if request.end_seconds is not None else duration_seconds

    if end_seconds <= request.start_seconds:
        raise HTTPException(
            status_code=400,
            detail="End time must be greater than start time",
        )

    end_seconds = min(end_seconds, duration_seconds)

    extracted_frames_result = extract_video_frames(
        filename=filename,
        request=VideoMultiFrameExtractRequest(
            start_seconds=request.start_seconds,
            end_seconds=end_seconds,
            interval_seconds=request.interval_seconds,
        ),
    )

    active_tracks = {}
    track_summaries = {}
    next_track_id = 1
    frame_results = []

    for frame in extracted_frames_result["frames"]:
        frame_filename = frame["frame_filename"]
        frame_path = OUTPUT_DIR / frame_filename

        detections = run_yolo_detection_with_inference_logging(
            filename=frame_filename,
            image_path=frame_path,
            confidence_threshold=request.confidence_threshold,
            class_filter=request.class_filter,
            source_endpoint="video_tracking",
        )

        try:
            save_detections_to_database(
                filename=frame_filename,
                detections=detections,
                confidence_threshold=request.confidence_threshold,
                class_filter=request.class_filter,
                source_endpoint="video_tracking",
            )
        except Exception:
            # Database logging should not break video tracking.
            pass

        tracked_detections = []

        for detection in detections:
            bbox = detection["bbox"]
            center = calculate_bbox_center(bbox)
            class_name = detection["class_name"]

            best_track_id = None
            best_distance = None

            for track_id, track in active_tracks.items():
                if track["class_name"] != class_name:
                    continue

                distance = calculate_center_distance(center, track["center"])

                if distance <= request.max_distance_pixels and (
                    best_distance is None or distance < best_distance
                ):
                    best_distance = distance
                    best_track_id = track_id

            if best_track_id is None:
                best_track_id = next_track_id
                next_track_id += 1

                track_summaries[best_track_id] = {
                    "track_id": best_track_id,
                    "class_name": class_name,
                    "observation_count": 0,
                    "first_timestamp_seconds": frame["timestamp_seconds"],
                    "last_timestamp_seconds": frame["timestamp_seconds"],
                    "max_confidence": detection["confidence"],
                }

            active_tracks[best_track_id] = {
                "class_name": class_name,
                "center": center,
            }

            track_summary = track_summaries[best_track_id]
            track_summary["observation_count"] += 1
            track_summary["last_timestamp_seconds"] = frame["timestamp_seconds"]
            track_summary["max_confidence"] = max(
                track_summary["max_confidence"],
                detection["confidence"],
            )

            tracked_detections.append(
                {
                    "track_id": best_track_id,
                    "class_id": detection["class_id"],
                    "class_name": class_name,
                    "confidence": detection["confidence"],
                    "bbox": bbox,
                    "center": center,
                }
            )

        annotated_tracking_filename = f"tracked_{frame_path.stem}_{uuid4().hex}{frame_path.suffix or '.jpg'}"
        annotated_tracking_path = OUTPUT_DIR / annotated_tracking_filename

        with Image.open(frame_path).convert("RGB") as image:
            draw = ImageDraw.Draw(image)

            for detection in tracked_detections:
                bbox = detection["bbox"]
                x1 = bbox["x1"]
                y1 = bbox["y1"]
                x2 = bbox["x2"]
                y2 = bbox["y2"]

                label = (
                    f"Track {detection['track_id']}: "
                    f"{detection['class_name']} {detection['confidence']:.2f}"
                )

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

            image.save(annotated_tracking_path)

        frame_results.append(
            {
                "frame_filename": frame_filename,
                "frame_file_url": frame["frame_file_url"],
                "timestamp_seconds": frame["timestamp_seconds"],
                "frame_index": frame["frame_index"],
                "detections": tracked_detections,
                "detection_count": len(tracked_detections),
                "annotated_frame_filename": annotated_tracking_filename,
                "annotated_frame_file_url": f"/media/outputs/{annotated_tracking_filename}",
            }
        )

    tracks = sorted(
        track_summaries.values(),
        key=lambda track: track["track_id"],
    )

    return {
        "filename": filename,
        "video_metadata": video_metadata,
        "start_seconds": request.start_seconds,
        "end_seconds": round(end_seconds, 2),
        "interval_seconds": request.interval_seconds,
        "confidence_threshold": request.confidence_threshold,
        "class_filter": request.class_filter,
        "max_distance_pixels": request.max_distance_pixels,
        "frame_count": len(frame_results),
        "track_count": len(tracks),
        "tracks": tracks,
        "frames": frame_results,
    }



@app.post("/commands/plan")
def plan_text_command(request: CommandPlanRequest):
    plan_result = plan_command_with_mode(
        command=request.command,
        planner_mode=request.planner_mode,
    )

    return plan_result["plan"]


@app.post(
    "/commands/plan/prepare-execution",
    response_model=CommandPlanExecutionPrepareResponse,
)
def prepare_command_plan_execution(request: CommandPlanExecutionPrepareRequest):
    return prepare_command_plan_for_execution(request.plan)


@app.post("/commands/parse")
def parse_text_command(request: CommandParseRequest):
    from time import perf_counter

    start_time = perf_counter()

    try:
        parse_result = parse_command_with_mode(
            command=request.command,
            parser_mode=request.parser_mode,
        )

        latency_ms = round((perf_counter() - start_time) * 1000, 2)

        log_parser_attempt(
            command=request.command,
            parser_mode=request.parser_mode,
            parser_type=parse_result.get("parser_type"),
            parser_version=parse_result.get("parser_version"),
            success=True,
            latency_ms=latency_ms,
            parsed_command=parse_result.get("parsed_command"),
            error=None,
        )

        return {
            "command": request.command,
            **parse_result,
        }

    except HTTPException as error:
        latency_ms = round((perf_counter() - start_time) * 1000, 2)

        log_parser_attempt(
            command=request.command,
            parser_mode=request.parser_mode,
            parser_type=request.parser_mode,
            parser_version=None,
            success=False,
            latency_ms=latency_ms,
            parsed_command=None,
            error=error.detail,
        )

        raise error



@app.get("/commands/plan/evaluate")
def evaluate_text_command_planner(
    planner_mode: str = Query("rule_based"),
):
    return evaluate_command_planner(planner_mode)





@app.get("/commands/plan/evaluate/compare")
def compare_text_command_planners(
    include_real_llm: bool = Query(False),
):
    planner_modes = ["rule_based", "llm_mock"]
    evaluations = [
        evaluate_command_planner(planner_mode)
        for planner_mode in planner_modes
    ]
    skipped_evaluations = []

    if include_real_llm:
        planner_modes.append("real_llm")
        provider_status = get_llm_provider_status()

        if provider_status.get("real_llm_available"):
            evaluations.append(evaluate_command_planner("real_llm"))
        else:
            skipped_evaluations.append(
                {
                    "planner_mode": "real_llm",
                    "reason": "Real LLM provider is not available. Configure Ollama/OpenAI before evaluating real_llm.",
                }
            )

    return {
        "planner_modes": planner_modes,
        "evaluations": evaluations,
        "skipped_evaluations": skipped_evaluations,
    }


@app.get("/commands/evaluate")
def evaluate_text_command_parser(
    parser_mode: str = Query("rule_based"),
):
    return evaluate_command_parser(parser_mode)


@app.get("/commands/evaluate/compare")
def compare_text_command_parsers(
    include_real_llm: bool = Query(False),
):
    parser_modes = ["rule_based", "llm_mock"]
    evaluations = [
        evaluate_command_parser(parser_mode)
        for parser_mode in parser_modes
    ]
    skipped_evaluations = []

    if include_real_llm:
        parser_modes.append("real_llm")
        provider_status = get_llm_provider_status()

        if provider_status.get("real_llm_available"):
            evaluations.append(evaluate_command_parser("real_llm"))
        else:
            skipped_evaluations.append(
                {
                    "parser_mode": "real_llm",
                    "reason": "Real LLM provider is not available. Configure Ollama/OpenAI before evaluating real_llm.",
                }
            )

    return {
        "parser_modes": parser_modes,
        "evaluations": evaluations,
        "skipped_evaluations": skipped_evaluations,
    }




@app.post("/commands/plan/prompt-preview")
def preview_command_planner_prompt(request: CommandPlanRequest):
    prompt_preview = build_command_planner_prompt(request.command)

    return {
        "command": request.command,
        **prompt_preview,
    }


@app.post("/commands/parse/prompt-preview")
def preview_command_parser_prompt(request: CommandParseRequest):
    prompt_preview = build_command_parser_prompt(request.command)

    return {
        "command": request.command,
        "parser_mode": request.parser_mode,
        **prompt_preview,
    }


@app.post("/commands/validate-parsed")
def validate_parsed_text_command(request: ParsedCommandValidationRequest):
    validated_command = validate_parsed_command(request.parsed_command)

    return {
        "status": "valid",
        "validated_command": validated_command,
    }


def log_parser_attempt(
    command: str,
    parser_mode: str,
    parser_type: str,
    parser_version,
    success: bool,
    latency_ms: float,
    parsed_command=None,
    error=None,
):
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "command": command,
        "parser_mode": parser_mode,
        "parser_type": parser_type,
        "parser_version": parser_version,
        "success": success,
        "latency_ms": latency_ms,
        "parsed_command": parsed_command,
        "error": error,
    }

    with PARSER_LOG_FILE.open("a", encoding="utf-8") as log_file:
        log_file.write(json.dumps(log_entry) + "\n")

    try:
        save_parser_attempt_to_database(log_entry)
    except Exception:
        # Database logging should not break command parsing.
        pass

    return log_entry


@app.get("/commands/parse/logs")
def get_parser_attempt_logs(limit: int = Query(20, ge=1, le=100)):
    if not PARSER_LOG_FILE.exists():
        return {
            "count": 0,
            "logs": [],
        }

    logs = []

    with PARSER_LOG_FILE.open("r", encoding="utf-8") as log_file:
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





@app.post("/assistant/video-chat")
def answer_video_chat_endpoint(request: VideoChatRequest):
    return answer_video_chat(
        question=request.question,
        video_context=request.video_context,
        response_mode=request.response_mode,
    )


@app.post("/assistant/image-chat")
def answer_image_chat_endpoint(request: ImageChatRequest):
    return answer_image_chat(
        question=request.question,
        image_context=request.image_context,
        response_mode=request.response_mode,
    )


@app.get("/llm/provider/status")
def get_llm_provider_status_endpoint():
    return get_llm_provider_status()


@app.get("/db/parser-attempt-logs")
def get_postgres_parser_attempt_logs(
    limit: int = Query(20, ge=1, le=100),
    parser_mode: str = Query(None),
    success: bool = Query(None),
):
    return get_database_parser_attempt_logs(
        limit=limit,
        parser_mode=parser_mode,
        success=success,
    )


@app.get("/db/parser-attempt-summary")
def get_postgres_parser_attempt_summary(
    parser_mode: str = Query(None),
    success: bool = Query(None),
):
    return get_database_parser_attempt_summary(
        parser_mode=parser_mode,
        success=success,
    )


@app.get("/llmops/dashboard")
def get_llmops_dashboard(
    limit: int = Query(10, ge=1, le=50),
    parser_mode: str = Query(None),
    success: bool = Query(None),
    include_real_llm: bool = Query(False),
):
    provider_status = get_llm_provider_status()

    parser_evaluation_results = [
        evaluate_command_parser("rule_based"),
        evaluate_command_parser("llm_mock"),
    ]

    skipped_evaluations = []

    if include_real_llm:
        if provider_status["real_llm_available"]:
            parser_evaluation_results.append(
                evaluate_command_parser("real_llm")
            )
        else:
            skipped_evaluations.append(
                {
                    "parser_mode": "real_llm",
                    "reason": "Real LLM provider is not configured or available.",
                }
            )

    parser_evaluation_summary = {
        "include_real_llm": include_real_llm,
        "evaluations": [
            {
                "parser_type": result["parser_type"],
                "parser_version": result["parser_version"],
                "total_cases": result["total_cases"],
                "passed_cases": result["passed_cases"],
                "failed_cases": result["failed_cases"],
                "accuracy": result["accuracy"],
            }
            for result in parser_evaluation_results
        ],
        "skipped_evaluations": skipped_evaluations,
    }

    planner_evaluation_results = [
        evaluate_command_planner("rule_based"),
        evaluate_command_planner("llm_mock"),
    ]

    planner_skipped_evaluations = []

    if include_real_llm:
        if provider_status["real_llm_available"]:
            planner_evaluation_results.append(
                evaluate_command_planner("real_llm")
            )
        else:
            planner_skipped_evaluations.append(
                {
                    "planner_mode": "real_llm",
                    "reason": "Real LLM provider is not configured or available.",
                }
            )

    planner_evaluation_summary = {
        "include_real_llm": include_real_llm,
        "evaluations": [
            {
                "planner_mode": result["planner_mode"],
                "planner_type": result["planner_type"],
                "planner_version": result["planner_version"],
                "total_cases": result["total_cases"],
                "passed_cases": result["passed_cases"],
                "failed_cases": result["failed_cases"],
                "accuracy": result["accuracy"],
            }
            for result in planner_evaluation_results
        ],
        "skipped_evaluations": planner_skipped_evaluations,
    }

    return {
        "provider_status": provider_status,
        "parser_attempt_summary": get_database_parser_attempt_summary(
            parser_mode=parser_mode,
            success=success,
        ),
        "recent_parser_attempt_logs": get_database_parser_attempt_logs(
            limit=limit,
            parser_mode=parser_mode,
            success=success,
        ),
        "command_log_summary": get_database_command_log_summary(parser_mode=parser_mode),
        "parser_evaluation": parser_evaluation_summary,
        "planner_evaluation": planner_evaluation_summary,
    }


@app.get("/db/parser-attempt-logs/export")
def export_postgres_parser_attempt_logs(
    limit: int = Query(100, ge=1, le=500),
    parser_mode: str = Query(None),
    success: bool = Query(None),
):
    import csv
    import io
    import json

    from fastapi.responses import Response

    result = get_database_parser_attempt_logs(
        limit=limit,
        parser_mode=parser_mode,
        success=success,
    )

    output = io.StringIO()

    fieldnames = [
        "timestamp",
        "command",
        "parser_mode",
        "parser_type",
        "parser_version",
        "success",
        "latency_ms",
        "parsed_command",
        "error",
    ]

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for log in result.get("logs", []):
        writer.writerow(
            {
                "timestamp": log.get("timestamp"),
                "command": log.get("command"),
                "parser_mode": log.get("parser_mode"),
                "parser_type": log.get("parser_type"),
                "parser_version": log.get("parser_version"),
                "success": log.get("success"),
                "latency_ms": log.get("latency_ms"),
                "parsed_command": json.dumps(log.get("parsed_command")),
                "error": log.get("error"),
            }
        )

    filename = "parser_attempt_logs.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Parser-Logs-Status": result.get("status", "unknown"),
            "X-Parser-Logs-Count": str(result.get("count", 0)),
        },
    )
