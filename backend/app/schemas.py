from pydantic import BaseModel


class CropRequest(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class CropByClassRequest(BaseModel):
    class_name: str
    confidence_threshold: float = 0.25


class BlurByClassRequest(BaseModel):
    class_name: str
    confidence_threshold: float = 0.25


class BlurAllByClassRequest(BaseModel):
    class_name: str
    confidence_threshold: float = 0.25


class CommandRequest(BaseModel):
    filename: str
    command: str
    confidence_threshold: float = 0.25


class VideoTrimRequest(BaseModel):
    start_seconds: float
    end_seconds: float
