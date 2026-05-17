from typing import Optional

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


class VideoFrameExtractRequest(BaseModel):
    timestamp_seconds: float


class VideoMultiFrameExtractRequest(BaseModel):
    start_seconds: float
    end_seconds: float
    interval_seconds: float = 1.0



class VideoFrameDetectionBatchRequest(BaseModel):
    frame_filenames: list[str]
    confidence_threshold: float = 0.25
    class_filter: Optional[str] = None


class VideoSampledDetectionRequest(BaseModel):
    interval_seconds: float = 1.0
    confidence_threshold: float = 0.25
    class_filter: Optional[str] = None



class VideoTrackingRequest(BaseModel):
    start_seconds: float = 0
    end_seconds: Optional[float] = None
    interval_seconds: float = 1.0
    confidence_threshold: float = 0.25
    class_filter: Optional[str] = None
    max_distance_pixels: float = 80.0


class CommandParseRequest(BaseModel):
    command: str
