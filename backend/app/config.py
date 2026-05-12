from pathlib import Path

APP_TITLE = "VisionCommand AI Backend"
APP_DESCRIPTION = "Backend API for the VisionCommand AI project"
APP_VERSION = "0.1.0"

UPLOAD_DIR = Path("storage/uploads")
OUTPUT_DIR = Path("storage/outputs")
LOG_DIR = Path("storage/logs")
COMMAND_LOG_FILE = LOG_DIR / "command_logs.jsonl"

MODEL_NAME = "yolo26n.pt"
