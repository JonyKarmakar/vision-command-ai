/**
 * Frontend API and response types used by the VisionCommand AI app.
 *
 * Extracted from App.tsx so the main application component can focus on
 * state, handlers, and UI composition.
 */

export type UploadResponse = {
  message: string
  original_filename: string
  stored_filename: string
  content_type: string
  width: number
  height: number
  storage_path: string
  file_url: string
}

export type VideoUploadResponse = {
  message: string
  original_filename: string
  stored_filename: string
  content_type: string
  file_size_bytes: number
  storage_path: string
  file_url: string
  metadata: {
    is_readable: boolean
    width: number | null
    height: number | null
    fps: number | null
    frame_count: number | null
    duration_seconds: number | null
  }
}

export type VideoTrimResponse = {
  filename: string
  trimmed_filename: string
  trimmed_file_url: string
  start_seconds: number
  end_seconds: number
  duration_seconds: number
  metadata: {
    is_readable: boolean
    width: number | null
    height: number | null
    fps: number | null
    frame_count: number | null
    duration_seconds: number | null
  }
}

export type VideoFrameExtractResponse = {
  filename: string
  frame_filename: string
  frame_file_url: string
  timestamp_seconds: number
  frame_index: number
  fps: number
  video_duration_seconds: number
}

export type VideoFrameDetectionResponse = {
  frame_filename: string
  confidence_threshold: number
  class_filter: string | null
  detections: Detection[]
  detection_count: number
  annotated_frame_filename: string
  annotated_frame_file_url: string
}

export type VideoMultiFrame = {
  frame_filename: string
  frame_file_url: string
  timestamp_seconds: number
  frame_index: number
}

export type VideoMultiFrameExtractResponse = {
  filename: string
  start_seconds: number
  end_seconds: number
  interval_seconds: number
  fps: number
  video_duration_seconds: number
  frame_count: number
  frames: VideoMultiFrame[]
}

export type Detection = {
  class_id: number
  class_name: string
  confidence: number
  bbox: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

export type DetectionResponse = {
  filename: string
  source?: 'uploads' | 'outputs'
  confidence_threshold: number
  class_filter: string | null
  detections: Detection[]
  detection_count: number
  annotated_filename: string
  annotated_file_url: string
}

export type VideoMultiFrameDetectionFrame = {
  frame_filename: string
  detections: Detection[]
  detection_count: number
  annotated_frame_filename: string
  annotated_frame_file_url: string
}

export type VideoMultiFrameDetectionResponse = {
  frame_count: number
  confidence_threshold: number
  class_filter: string | null
  frames: VideoMultiFrameDetectionFrame[]
}

export type CropResponse = {
  filename: string
  source?: 'uploads' | 'outputs'
  class_name?: string
  confidence_threshold?: number
  selected_detection?: Detection
  cropped_filename: string
  cropped_file_url: string
  crop_box: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

export type ZoomResponse = {
  filename: string
  class_name: string
  confidence_threshold: number
  padding_ratio: number
  zoom_factor?: number
  target_scope?: string
  source?: 'uploads' | 'outputs'
  selected_detection: Detection
  zoomed_filename: string
  zoomed_file_url: string
  zoom_box: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  output_size: {
    width: number
    height: number
  }
}

export type BlurResponse = {
  filename: string
  source?: 'uploads' | 'outputs'
  blurred_filename: string
  blurred_file_url: string
  blur_box: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

export type VideoDetectFramesCommandResponse = {
  extracted_frames: VideoMultiFrameExtractResponse
  detection: VideoMultiFrameDetectionResponse
}

export type VideoSampledDetectionResponse = {
  filename: string
  video_metadata: {
    is_readable: boolean
    width: number | null
    height: number | null
    fps: number | null
    frame_count: number | null
    duration_seconds: number | null
  }
  interval_seconds: number
  confidence_threshold: number
  class_filter: string | null
  extracted_frames: VideoMultiFrameExtractResponse
  detection: VideoMultiFrameDetectionResponse
}

export type VideoTrackSummary = {
  track_id: number
  class_name: string
  observation_count: number
  first_timestamp_seconds: number
  last_timestamp_seconds: number
  max_confidence: number
}

export type VideoTrackedDetection = Detection & {
  track_id: number
  center: {
    x: number
    y: number
  }
}

export type VideoTrackingFrame = {
  frame_filename: string
  frame_file_url: string
  timestamp_seconds: number
  frame_index: number
  detections: VideoTrackedDetection[]
  detection_count: number
  annotated_frame_filename?: string
  annotated_frame_file_url?: string
}

export type VideoTrackingResponse = {
  filename: string
  video_metadata: {
    is_readable: boolean
    width: number | null
    height: number | null
    fps: number | null
    frame_count: number | null
    duration_seconds: number | null
  }
  start_seconds: number
  end_seconds: number
  interval_seconds: number
  confidence_threshold: number
  class_filter: string | null
  max_distance_pixels: number
  frame_count: number
  track_count: number
  tracks: VideoTrackSummary[]
  frames: VideoTrackingFrame[]
}

export type ParsedCommand = Record<string, string | number | null | undefined>

export type CommandParseResponse = {
  command: string
  parser_mode?: string
  parser_type?: string
  parser_version?: string
  parsed_command: ParsedCommand
}

export type CommandEvaluationCaseResult = {
  command: string
  expected: ParsedCommand
  actual: ParsedCommand | null
  passed: boolean
  error: string | null
}

export type CommandEvaluationResponse = {
  parser_type: string
  parser_version: string
  total_cases: number
  passed_cases: number
  failed_cases: number
  accuracy: number
  results: CommandEvaluationCaseResult[]
}

export type ParserComparisonResponse = {
  parser_modes: string[]
  evaluations: CommandEvaluationResponse[]
  skipped_evaluations?: SkippedParserEvaluation[]
}

export type PlannerMode = 'rule_based' | 'llm_mock' | 'real_llm'

export type CommandPlanResponse = {
  media_type: 'image' | 'video' | 'unknown'
  action:
    | 'detect'
    | 'annotate'
    | 'crop_by_class'
    | 'blur_by_class'
    | 'blur_all_by_class'
    | 'zoom'
    | 'track'
    | 'extract_frames'
    | 'summarize'
    | 'unknown'
  target_class: string | null
  target_scope:
    | 'single'
    | 'all'
    | 'largest'
    | 'smallest'
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'center'
    | 'unknown'
  requires_detection: boolean
  requires_tracking: boolean
  parameters: Record<string, unknown>
  confidence: number
  needs_clarification: boolean
  clarification_question: string | null
}

export type CommandPlanExecutionPrepareResponse = {
  status: 'ready' | 'blocked'
  executable: boolean
  prepared_command: Record<string, unknown> | null
  warnings: string[]
}

export type CommandPlanEvaluationSummaryEntry = {
  planner_mode: string
  planner_type: string
  planner_version: string
  total_cases: number
  passed_cases: number
  failed_cases: number
  accuracy: number
}

export type SkippedPlannerEvaluation = {
  planner_mode: string
  reason: string
}

export type PlannerComparisonResponse = {
  planner_modes: string[]
  evaluations: CommandPlanEvaluationSummaryEntry[]
  skipped_evaluations?: SkippedPlannerEvaluation[]
}

export type PlannerEvaluationSummaryResponse = {
  include_real_llm: boolean
  evaluations: CommandPlanEvaluationSummaryEntry[]
  skipped_evaluations: SkippedPlannerEvaluation[]
}

export type CommandPromptPreviewResponse = {
  command: string
  parser_mode: string
  prompt_version: string
  system_prompt: string
  user_prompt: string
  expected_json_schema: Record<string, unknown>
}

export type CommandPlannerPromptPreviewResponse = {
  command: string
  prompt_version: string
  system_prompt: string
  user_prompt: string
  expected_json_schema: Record<string, unknown>
}

export type ParsedCommandValidationResponse = {
  status: string
  validated_command: ParsedCommand
}

export type ParserAttemptLogEntry = {
  timestamp: string
  command: string
  parser_mode: string
  parser_type: string | null
  parser_version: string | null
  success: boolean
  latency_ms: number
  parsed_command: ParsedCommand | null
  error: string | null
}

export type DatabaseParserAttemptLog = {
  timestamp: string
  command: string
  parser_mode: string
  parser_type: string | null
  parser_version: string | null
  success: boolean
  latency_ms: number
  parsed_command: Record<string, unknown> | null
  error: string | null
}

export type ParserAttemptBreakdown = {
  parser_mode?: string
  parser_type?: string
  attempts: number
  successful_attempts: number
  failed_attempts: number
  average_latency_ms: number
}

export type ParserAttemptErrorBreakdown = {
  error: string
  attempts: number
  average_latency_ms: number
}

export type DatabaseParserAttemptSummaryResponse = {
  status: string
  total_attempts: number
  successful_attempts: number
  failed_attempts: number
  success_rate: number
  average_latency_ms: number
  by_parser_mode: ParserAttemptBreakdown[]
  by_parser_type: ParserAttemptBreakdown[]
  by_error: ParserAttemptErrorBreakdown[]
}

export type ParserEvaluationSummaryEntry = {
  parser_type: string
  parser_version: string
  total_cases: number
  passed_cases: number
  failed_cases: number
  accuracy: number
}

export type SkippedParserEvaluation = {
  parser_mode: string
  reason: string
}

export type ParserEvaluationSummaryResponse = {
  include_real_llm: boolean
  evaluations: ParserEvaluationSummaryEntry[]
  skipped_evaluations: SkippedParserEvaluation[]
}

export type LLMOpsDashboardResponse = {
  provider_status: LLMProviderStatusResponse
  parser_attempt_summary: DatabaseParserAttemptSummaryResponse
  recent_parser_attempt_logs: DatabaseParserAttemptLogsResponse
  command_log_summary: CommandLogSummaryResponse
  parser_evaluation: ParserEvaluationSummaryResponse
  planner_evaluation: PlannerEvaluationSummaryResponse
}

export type DatabaseParserAttemptLogsResponse = {
  status: string
  count: number
  logs: DatabaseParserAttemptLog[]
}

export type ParserAttemptLogsResponse = {
  count: number
  logs: ParserAttemptLogEntry[]
}

export type LLMProviderStatusResponse = {
  provider_name: string
  provider_model: string | null
  is_supported: boolean
  is_configured: boolean
  real_llm_available: boolean
  supported_llm_providers: string[]
  supported_parser_modes: string[]
  supported_planner_modes?: string[]
}

export type ImageChatResponse = {
  question: string
  answer: string
  response_mode: string
  responder_type: string
  prompt_version: string
  provider_status: LLMProviderStatusResponse
  used_context_keys: string[]
  context_summary: Record<string, unknown>
}

export type VideoChatResponse = {
  question: string
  answer: string
  response_mode: string
  responder_type: string
  prompt_version: string
  provider_status: LLMProviderStatusResponse
  used_context_keys: string[]
  context_summary: Record<string, unknown>
}

export type CommandResponse = {
  command: string
  parser_mode: string
  parser_type: string | null
  parser_version: string | null
  parsed_command: {
    action: string
    class_name: string | null
  }
  result_type: 'annotated_detection' | 'crop_by_class' | 'blur_by_class' | 'blur_all_by_class' | 'zoom_by_class' | 'extract_frame' | 'extract_frames' | 'trim_video' | 'detect_frames' | 'track_video'
  result: DetectionResponse | CropResponse | BlurResponse | ZoomResponse | VideoFrameExtractResponse | VideoMultiFrameExtractResponse | VideoTrimResponse | VideoDetectFramesCommandResponse | VideoTrackingResponse
}

export type CommandLog = {
  timestamp: string
  filename: string
  command: string
  confidence_threshold: number
  parsed_action: string
  parsed_class: string | null
  result_type: string
  parser_mode?: string | null
  parser_type?: string | null
  parser_version?: string | null
}

export type CommandLogSummaryItem = {
  name: string
  count: number
}

export type CommandLogSummaryResponse = {
  status: string
  total_commands: number
  by_parser_mode: CommandLogSummaryItem[]
  by_result_type: CommandLogSummaryItem[]
  by_parsed_action: CommandLogSummaryItem[]
}

export type MediaFileLog = {
  original_filename: string
  stored_filename: string
  content_type: string
  width: number
  height: number
  storage_path: string
  file_url: string
  created_at: string
}

export type DatabaseStats = {
  status: string
  media_files_count: number
  command_logs_count: number
  generated_outputs_count: number
}

export type DetectionSummaryClass = {
  class_name: string
  count: number
  average_confidence: number
  max_confidence: number
}

export type DetectionSummary = {
  status: string
  total_detections: number
  classes: DetectionSummaryClass[]
}

export type DetectionLog = {
  filename: string
  class_id: number
  class_name: string
  confidence: number
  bbox: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  confidence_threshold: number
  class_filter: string | null
  source_endpoint: string
  created_at: string
}

export type InferenceSummaryByEndpoint = {
  source_endpoint: string
  run_count: number
  average_inference_time_ms: number
  max_inference_time_ms: number
  total_detections: number
}

export type InferenceSummary = {
  status: string
  total_inferences: number
  average_inference_time_ms: number
  max_inference_time_ms: number
  total_detections: number
  average_detections_per_run: number
  by_endpoint: InferenceSummaryByEndpoint[]
}

export type InferenceLog = {
  filename: string
  model_name: string
  source_endpoint: string
  confidence_threshold: number
  class_filter: string | null
  detection_count: number
  inference_time_ms: number
  created_at: string
}

export type ModelInfo = {
  model_name: string
  task: string
  framework: string
  backend: string
  version: string
  supported_actions: string[]
}

export type ModelClassesResponse = {
  model_name: string
  class_count: number
  classes: string[]
  aliases: Record<string, string>
}

export type SpeechRecognitionEventLike = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

export type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike
