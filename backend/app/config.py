import os
from pathlib import Path

APP_TITLE = "VisionCommand AI Backend"
APP_DESCRIPTION = "Backend API for the VisionCommand AI project"
APP_VERSION = "0.3.0"

STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", "storage"))

UPLOAD_DIR = STORAGE_ROOT / "uploads"
OUTPUT_DIR = STORAGE_ROOT / "outputs"
VIDEO_DIR = STORAGE_ROOT / "videos"
LOG_DIR = STORAGE_ROOT / "logs"

COMMAND_LOG_FILE = LOG_DIR / "command_logs.jsonl"
PARSER_LOG_FILE = LOG_DIR / "parser_attempt_logs.jsonl"

MODEL_NAME = os.getenv("MODEL_NAME", "yolo26n.pt")
