from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

app = FastAPI(
    title="VisionCommand AI Backend",
    description="Backend API for the VisionCommand AI project",
    version="0.1.0",
)

UPLOAD_DIR = Path("storage/uploads")


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
    }
