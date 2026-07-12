from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class CropRequest(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class CropByClassRequest(BaseModel):
    class_name: str
    confidence_threshold: float = 0.25


class ZoomByClassRequest(BaseModel):
    class_name: str
    confidence_threshold: float = 0.25
    padding_ratio: float = 0.25
    zoom_factor: float = 2.0
    target_scope: Literal["best", "largest", "left", "right", "center", "single"] = "best"


class BlurByClassRequest(BaseModel):
    class_name: str
    confidence_threshold: float = 0.25


class BlurAllByClassRequest(BaseModel):
    class_name: str
    confidence_threshold: float = 0.25


class ImageEnhanceRequest(BaseModel):
    brightness: float = Field(1.0, ge=0.0, le=3.0)
    contrast: float = Field(1.0, ge=0.0, le=3.0)
    saturation: float = Field(1.0, ge=0.0, le=3.0)
    sharpness: float = Field(1.0, ge=0.0, le=3.0)


class CommandRequest(BaseModel):
    filename: str
    command: str
    confidence_threshold: float = 0.25
    parser_mode: str = "rule_based"
    media_source: Literal["uploads", "outputs"] = "uploads"


class PreparedCommandExecutionRequest(BaseModel):
    filename: str
    prepared_command: dict[str, Any]
    confidence_threshold: float = 0.25
    command: str = "prepared_command"
    media_source: Literal["uploads", "outputs"] = "uploads"


class GeneratedOutputHistoryItemRequest(BaseModel):
    id: str
    action: Literal["annotated_detection", "zoom", "crop", "blur", "enhance"]
    label: str
    filename: str
    file_url: str
    source: Optional[Literal["uploads", "outputs"]] = None
    source_filename: Optional[str] = None
    created_by: Optional[str] = None
    command_text: Optional[str] = None
    result_type: Optional[str] = None
    execution_mode: Optional[str] = None
    parser_mode: Optional[str] = None
    parser_type: Optional[str] = None
    planner_mode: Optional[str] = None
    created_at: str


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
    parser_mode: str = "rule_based"


class ParsedCommandValidationRequest(BaseModel):
    parsed_command: dict


class CommandPlanRequest(BaseModel):
    command: str
    planner_mode: str = "rule_based"


class CommandPlan(BaseModel):
    media_type: Literal["image", "video", "unknown"] = "unknown"
    action: Literal[
        "detect",
        "annotate",
        "crop_by_class",
        "blur_by_class",
        "blur_all_by_class",
        "zoom",
        "track",
        "extract_frames",
        "summarize",
        "unknown",
    ] = "unknown"
    target_class: Optional[str] = None
    target_scope: Literal[
        "single",
        "all",
        "largest",
        "smallest",
        "left",
        "right",
        "top",
        "bottom",
        "center",
        "unknown",
    ] = "unknown"
    requires_detection: bool = False
    requires_tracking: bool = False
    parameters: dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.0
    needs_clarification: bool = False
    clarification_question: Optional[str] = None


class CommandPlanExecutionPrepareRequest(BaseModel):
    plan: CommandPlan


class CommandPlanExecutionPrepareResponse(BaseModel):
    status: Literal["ready", "blocked"]
    executable: bool
    prepared_command: Optional[dict[str, Any]] = None
    warnings: list[str] = Field(default_factory=list)

class ImageChatRequest(BaseModel):
    question: str
    image_context: Optional[dict] = None
    response_mode: Literal["auto", "rule_based", "real_llm"] = "auto"


class ImageChatResponse(BaseModel):
    question: str
    answer: str
    response_mode: str
    responder_type: str
    prompt_version: str
    provider_status: dict
    used_context_keys: list
    context_summary: dict

class VideoChatRequest(BaseModel):
    question: str
    video_context: Optional[dict] = None
    response_mode: Literal["auto", "rule_based", "real_llm"] = "auto"


class VideoChatResponse(BaseModel):
    question: str
    answer: str
    response_mode: str
    responder_type: str
    prompt_version: str
    provider_status: dict
    used_context_keys: list
    context_summary: dict
