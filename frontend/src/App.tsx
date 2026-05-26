import { useState } from 'react'
import './App.css'

type UploadResponse = {
  message: string
  original_filename: string
  stored_filename: string
  content_type: string
  width: number
  height: number
  storage_path: string
  file_url: string
}

type VideoUploadResponse = {
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

type VideoTrimResponse = {
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

type VideoFrameExtractResponse = {
  filename: string
  frame_filename: string
  frame_file_url: string
  timestamp_seconds: number
  frame_index: number
  fps: number
  video_duration_seconds: number
}

type VideoFrameDetectionResponse = {
  frame_filename: string
  confidence_threshold: number
  class_filter: string | null
  detections: Detection[]
  detection_count: number
  annotated_frame_filename: string
  annotated_frame_file_url: string
}

type VideoMultiFrame = {
  frame_filename: string
  frame_file_url: string
  timestamp_seconds: number
  frame_index: number
}

type VideoMultiFrameExtractResponse = {
  filename: string
  start_seconds: number
  end_seconds: number
  interval_seconds: number
  fps: number
  video_duration_seconds: number
  frame_count: number
  frames: VideoMultiFrame[]
}

type Detection = {
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

type DetectionResponse = {
  filename: string
  confidence_threshold: number
  class_filter: string | null
  detections: Detection[]
  detection_count: number
  annotated_filename: string
  annotated_file_url: string
}

type VideoMultiFrameDetectionFrame = {
  frame_filename: string
  detections: Detection[]
  detection_count: number
  annotated_frame_filename: string
  annotated_frame_file_url: string
}

type VideoMultiFrameDetectionResponse = {
  frame_count: number
  confidence_threshold: number
  class_filter: string | null
  frames: VideoMultiFrameDetectionFrame[]
}

type CropResponse = {
  filename: string
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

type BlurResponse = {
  filename: string
  blurred_filename: string
  blurred_file_url: string
  blur_box: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

type VideoDetectFramesCommandResponse = {
  extracted_frames: VideoMultiFrameExtractResponse
  detection: VideoMultiFrameDetectionResponse
}

type VideoSampledDetectionResponse = {
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

type VideoTrackSummary = {
  track_id: number
  class_name: string
  observation_count: number
  first_timestamp_seconds: number
  last_timestamp_seconds: number
  max_confidence: number
}

type VideoTrackedDetection = Detection & {
  track_id: number
  center: {
    x: number
    y: number
  }
}

type VideoTrackingFrame = {
  frame_filename: string
  frame_file_url: string
  timestamp_seconds: number
  frame_index: number
  detections: VideoTrackedDetection[]
  detection_count: number
  annotated_frame_filename?: string
  annotated_frame_file_url?: string
}

type VideoTrackingResponse = {
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

type ParsedCommand = Record<string, string | number | null | undefined>

type CommandParseResponse = {
  command: string
  parser_mode?: string
  parser_type?: string
  parser_version?: string
  parsed_command: ParsedCommand
}

type CommandEvaluationCaseResult = {
  command: string
  expected: ParsedCommand
  actual: ParsedCommand | null
  passed: boolean
  error: string | null
}

type CommandEvaluationResponse = {
  parser_type: string
  parser_version: string
  total_cases: number
  passed_cases: number
  failed_cases: number
  accuracy: number
  results: CommandEvaluationCaseResult[]
}

type ParserComparisonResponse = {
  parser_modes: string[]
  evaluations: CommandEvaluationResponse[]
  skipped_evaluations?: SkippedParserEvaluation[]
}

type CommandPromptPreviewResponse = {
  command: string
  parser_mode: string
  prompt_version: string
  system_prompt: string
  user_prompt: string
  expected_json_schema: Record<string, unknown>
}

type ParsedCommandValidationResponse = {
  status: string
  validated_command: ParsedCommand
}

type ParserAttemptLogEntry = {
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

type DatabaseParserAttemptLog = {
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

type ParserAttemptBreakdown = {
  parser_mode?: string
  parser_type?: string
  attempts: number
  successful_attempts: number
  failed_attempts: number
  average_latency_ms: number
}

type ParserAttemptErrorBreakdown = {
  error: string
  attempts: number
  average_latency_ms: number
}

type DatabaseParserAttemptSummaryResponse = {
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

type ParserEvaluationSummaryEntry = {
  parser_type: string
  parser_version: string
  total_cases: number
  passed_cases: number
  failed_cases: number
  accuracy: number
}

type SkippedParserEvaluation = {
  parser_mode: string
  reason: string
}

type ParserEvaluationSummaryResponse = {
  include_real_llm: boolean
  evaluations: ParserEvaluationSummaryEntry[]
  skipped_evaluations: SkippedParserEvaluation[]
}

type LLMOpsDashboardResponse = {
  provider_status: LLMProviderStatusResponse
  parser_attempt_summary: DatabaseParserAttemptSummaryResponse
  recent_parser_attempt_logs: DatabaseParserAttemptLogsResponse
  command_log_summary: CommandLogSummaryResponse
  parser_evaluation: ParserEvaluationSummaryResponse
}

type DatabaseParserAttemptLogsResponse = {
  status: string
  count: number
  logs: DatabaseParserAttemptLog[]
}

type ParserAttemptLogsResponse = {
  count: number
  logs: ParserAttemptLogEntry[]
}

type LLMProviderStatusResponse = {
  provider_name: string
  provider_model: string | null
  is_supported: boolean
  is_configured: boolean
  real_llm_available: boolean
  supported_llm_providers: string[]
  supported_parser_modes: string[]
}

type CommandResponse = {
  command: string
  parser_mode: string
  parser_type: string | null
  parser_version: string | null
  parsed_command: {
    action: string
    class_name: string | null
  }
  result_type: 'annotated_detection' | 'crop_by_class' | 'blur_by_class' | 'blur_all_by_class' | 'extract_frame' | 'extract_frames' | 'trim_video' | 'detect_frames' | 'track_video'
  result: DetectionResponse | CropResponse | BlurResponse | VideoFrameExtractResponse | VideoMultiFrameExtractResponse | VideoTrimResponse | VideoDetectFramesCommandResponse | VideoTrackingResponse
}

type CommandLog = {
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


type CommandLogSummaryItem = {
  name: string
  count: number
}

type CommandLogSummaryResponse = {
  status: string
  total_commands: number
  by_parser_mode: CommandLogSummaryItem[]
  by_result_type: CommandLogSummaryItem[]
  by_parsed_action: CommandLogSummaryItem[]
}

type MediaFileLog = {
  original_filename: string
  stored_filename: string
  content_type: string
  width: number
  height: number
  storage_path: string
  file_url: string
  created_at: string
}

type DatabaseStats = {
  status: string
  media_files_count: number
  command_logs_count: number
}

type DetectionSummaryClass = {
  class_name: string
  count: number
  average_confidence: number
  max_confidence: number
}

type DetectionSummary = {
  status: string
  total_detections: number
  classes: DetectionSummaryClass[]
}

type DetectionLog = {
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

type InferenceSummaryByEndpoint = {
  source_endpoint: string
  run_count: number
  average_inference_time_ms: number
  max_inference_time_ms: number
  total_detections: number
}

type InferenceSummary = {
  status: string
  total_inferences: number
  average_inference_time_ms: number
  max_inference_time_ms: number
  total_detections: number
  average_detections_per_run: number
  by_endpoint: InferenceSummaryByEndpoint[]
}

type InferenceLog = {
  filename: string
  model_name: string
  source_endpoint: string
  confidence_threshold: number
  class_filter: string | null
  detection_count: number
  inference_time_ms: number
  created_at: string
}

type ModelInfo = {
  model_name: string
  task: string
  framework: string
  backend: string
  version: string
  supported_actions: string[]
}

type ModelClassesResponse = {
  model_name: string
  class_count: number
  classes: string[]
  aliases: Record<string, string>
}


type SpeechRecognitionEventLike = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const formatBackendErrorDetail = (detail: unknown, fallbackMessage: string): string => {
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (isRecord(item) && typeof item.msg === 'string') {
          return item.msg
        }

        return null
      })
      .filter(Boolean)

    if (messages.length > 0) {
      return messages.join(' ')
    }
  }

  if (isRecord(detail) && typeof detail.message === 'string') {
    return detail.message
  }

  return fallbackMessage
}

const getBackendErrorMessage = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  try {
    const errorData: unknown = await response.json()

    if (isRecord(errorData)) {
      return formatBackendErrorDetail(
        errorData.detail ?? errorData.message,
        fallbackMessage,
      )
    }

    return fallbackMessage
  } catch {
    return fallbackMessage
  }
}

const getErrorMessage = (error: unknown, fallbackMessage: string): string =>
  error instanceof Error && error.message ? error.message : fallbackMessage


function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [videoUploadResult, setVideoUploadResult] = useState<VideoUploadResponse | null>(null)
  const [videoTrimResult, setVideoTrimResult] = useState<VideoTrimResponse | null>(null)
  const [videoFrameResult, setVideoFrameResult] = useState<VideoFrameExtractResponse | null>(null)
  const [videoMultiFrameResult, setVideoMultiFrameResult] = useState<VideoMultiFrameExtractResponse | null>(null)
  const [videoMultiFrameDetectionResult, setVideoMultiFrameDetectionResult] = useState<VideoMultiFrameDetectionResponse | null>(null)
  const [videoSampledDetectionResult, setVideoSampledDetectionResult] = useState<VideoSampledDetectionResponse | null>(null)
  const [videoTrackingResult, setVideoTrackingResult] = useState<VideoTrackingResponse | null>(null)
  const [videoFrameDetectionResult, setVideoFrameDetectionResult] = useState<VideoFrameDetectionResponse | null>(null)
  const [trimStartSeconds, setTrimStartSeconds] = useState(0)
  const [trimEndSeconds, setTrimEndSeconds] = useState(2)
  const [frameTimestampSeconds, setFrameTimestampSeconds] = useState(1)
  const [multiFrameStartSeconds, setMultiFrameStartSeconds] = useState(0)
  const [multiFrameEndSeconds, setMultiFrameEndSeconds] = useState(3)
  const [multiFrameIntervalSeconds, setMultiFrameIntervalSeconds] = useState(1)
  const [sampledVideoIntervalSeconds, setSampledVideoIntervalSeconds] = useState(1)
  const [trackingStartSeconds, setTrackingStartSeconds] = useState(0)
  const [trackingEndSeconds, setTrackingEndSeconds] = useState(3)
  const [trackingIntervalSeconds, setTrackingIntervalSeconds] = useState(1)
  const [trackingMaxDistancePixels, setTrackingMaxDistancePixels] = useState(80)
  const [detectionResult, setDetectionResult] = useState<DetectionResponse | null>(null)
  const [cropResult, setCropResult] = useState<CropResponse | null>(null)
  const [blurResult, setBlurResult] = useState<BlurResponse | null>(null)

  const [confidenceThreshold, setConfidenceThreshold] = useState(30)
  const [selectedClass, setSelectedClass] = useState('all')
  const [classOptions, setClassOptions] = useState<string[]>([])

  const [commandText, setCommandText] = useState('')
  const [selectedParserMode, setSelectedParserMode] = useState<'rule_based' | 'llm_mock' | 'real_llm'>('rule_based')
  const [commandResult, setCommandResult] = useState<CommandResponse | null>(null)
  const [commandParseResult, setCommandParseResult] = useState<CommandParseResponse | null>(null)
  const [parsedCommandValidationResult, setParsedCommandValidationResult] = useState<ParsedCommandValidationResponse | null>(null)
  const [commandPromptPreviewResult, setCommandPromptPreviewResult] = useState<CommandPromptPreviewResponse | null>(null)
  const [commandEvaluationResult, setCommandEvaluationResult] = useState<CommandEvaluationResponse | null>(null)
  const [parserComparisonResult, setParserComparisonResult] = useState<ParserComparisonResponse | null>(null)
  const [parserAttemptLogsResult, setParserAttemptLogsResult] = useState<ParserAttemptLogsResponse | null>(null)
  const [databaseParserAttemptLogsResult, setDatabaseParserAttemptLogsResult] = useState<DatabaseParserAttemptLogsResponse | null>(null)
  const [databaseParserLogParserModeFilter, setDatabaseParserLogParserModeFilter] = useState('all')
  const [databaseParserLogSuccessFilter, setDatabaseParserLogSuccessFilter] = useState('all')
  const [databaseParserLogLimit, setDatabaseParserLogLimit] = useState('10')
  const [databaseParserAttemptSummaryResult, setDatabaseParserAttemptSummaryResult] = useState<DatabaseParserAttemptSummaryResponse | null>(null)
  const [llmProviderStatusResult, setLlmProviderStatusResult] = useState<LLMProviderStatusResponse | null>(null)
  const [llmOpsDashboardLoaded, setLlmOpsDashboardLoaded] = useState(false)
  const [llmOpsParserEvaluationResult, setLlmOpsParserEvaluationResult] = useState<ParserEvaluationSummaryResponse | null>(null)
  const [includeRealLlmEvaluationInDashboard, setIncludeRealLlmEvaluationInDashboard] = useState(false)
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([])
  const [commandLogSummary, setCommandLogSummary] = useState<CommandLogSummaryResponse | null>(null)
  const [isLoadingCommandLogSummary, setIsLoadingCommandLogSummary] = useState(false)
  const [hasLoadedCommandLogs, setHasLoadedCommandLogs] = useState(false)
  const [commandHistoryParserModeFilter, setCommandHistoryParserModeFilter] = useState('all')
  const [commandHistoryResultTypeFilter, setCommandHistoryResultTypeFilter] = useState('all')
  const [commandHistoryLimit, setCommandHistoryLimit] = useState('10')
  const [mediaFiles, setMediaFiles] = useState<MediaFileLog[]>([])
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [modelClasses, setModelClasses] = useState<ModelClassesResponse | null>(null)
  const [modelClassSearch, setModelClassSearch] = useState('')
  const [detectionLogs, setDetectionLogs] = useState<DetectionLog[]>([])
  const [detectionSummary, setDetectionSummary] = useState<DetectionSummary | null>(null)
  const [inferenceLogs, setInferenceLogs] = useState<InferenceLog[]>([])
  const [inferenceSummary, setInferenceSummary] = useState<InferenceSummary | null>(null)

  const [lastDetectionThreshold, setLastDetectionThreshold] = useState<number | null>(null)
  const [lastDetectionClass, setLastDetectionClass] = useState<string | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [isTrimmingVideo, setIsTrimmingVideo] = useState(false)
  const [isExtractingFrame, setIsExtractingFrame] = useState(false)
  const [isExtractingMultipleFrames, setIsExtractingMultipleFrames] = useState(false)
  const [isDetectingMultipleFrames, setIsDetectingMultipleFrames] = useState(false)
  const [isDetectingSampledVideo, setIsDetectingSampledVideo] = useState(false)
  const [isTrackingVideo, setIsTrackingVideo] = useState(false)
  const [isDetectingFrame, setIsDetectingFrame] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [isBlurring, setIsBlurring] = useState(false)
  const [isRunningCommand, setIsRunningCommand] = useState(false)
  const [isParsingCommand, setIsParsingCommand] = useState(false)
  const [isValidatingParsedCommand, setIsValidatingParsedCommand] = useState(false)
  const [isLoadingPromptPreview, setIsLoadingPromptPreview] = useState(false)
  const [isLoadingCommandEvaluation, setIsLoadingCommandEvaluation] = useState(false)
  const [isLoadingParserComparison, setIsLoadingParserComparison] = useState(false)
  const [isLoadingParserAttemptLogs, setIsLoadingParserAttemptLogs] = useState(false)
  const [isLoadingDatabaseParserAttemptLogs, setIsLoadingDatabaseParserAttemptLogs] = useState(false)
  const [isLoadingDatabaseParserAttemptSummary, setIsLoadingDatabaseParserAttemptSummary] = useState(false)
  const [isLoadingLlmProviderStatus, setIsLoadingLlmProviderStatus] = useState(false)
  const [isLoadingLlmOpsDashboard, setIsLoadingLlmOpsDashboard] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isLoadingMediaFiles, setIsLoadingMediaFiles] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isLoadingModelInfo, setIsLoadingModelInfo] = useState(false)
  const [isLoadingModelClasses, setIsLoadingModelClasses] = useState(false)
  const [isLoadingDetections, setIsLoadingDetections] = useState(false)
  const [isLoadingDetectionSummary, setIsLoadingDetectionSummary] = useState(false)
  const [isLoadingInferenceLogs, setIsLoadingInferenceLogs] = useState(false)
  const [isLoadingInferenceSummary, setIsLoadingInferenceSummary] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const [statusMessage, setStatusMessage] = useState<string>('Ready to upload an image.')
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setUploadResult(null)
    setDetectionResult(null)
    setCropResult(null)
    setBlurResult(null)
    setCommandResult(null)
    setSelectedClass('all')
    setClassOptions([])
    setLastDetectionThreshold(null)
    setLastDetectionClass(null)
    setError(null)
    setStatusMessage(file ? `Selected ${file.name}. Ready to upload.` : 'Ready to upload an image.')
  }

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedVideoFile(file)
    setVideoUploadResult(null)
    setVideoTrimResult(null)
    setVideoFrameResult(null)
    setVideoMultiFrameResult(null)
    setVideoFrameDetectionResult(null)
    setError(null)
    setStatusMessage(file ? `Selected video ${file.name}. Ready to upload.` : 'Ready to upload an image or video.')
  }

  const handleVideoUpload = async () => {
    if (!selectedVideoFile) {
      setError('Please choose a video first.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedVideoFile)

    try {
      setIsUploadingVideo(true)
      setError(null)
      setVideoTrimResult(null)
      setVideoFrameResult(null)
      setVideoMultiFrameResult(null)
      setVideoFrameDetectionResult(null)
      setStatusMessage('Uploading video to backend...')

      const response = await fetch('/api/media/upload-video', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Video upload failed')
      }

      const data: VideoUploadResponse = await response.json()
      setVideoUploadResult(data)
      setStatusMessage('Video upload complete. You can preview or download it.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Video upload failed.')
    } finally {
      setIsUploadingVideo(false)
    }
  }

  const handleVideoTrim = async () => {
    if (!videoUploadResult) {
      setError('Please upload a video first.')
      return
    }

    if (trimStartSeconds < 0 || trimEndSeconds <= trimStartSeconds) {
      setError('Please enter a valid trim range.')
      return
    }

    try {
      setIsTrimmingVideo(true)
      setError(null)
      setStatusMessage(`Trimming video from ${trimStartSeconds}s to ${trimEndSeconds}s...`)

      const response = await fetch(
        `/api/video/trim/${videoUploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_seconds: trimStartSeconds,
            end_seconds: trimEndSeconds,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Video trim failed')
      }

      const data: VideoTrimResponse = await response.json()
      setVideoTrimResult(data)
      setStatusMessage('Video trim complete. Trimmed video is ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Video trim failed.')
    } finally {
      setIsTrimmingVideo(false)
    }
  }

  const handleExtractVideoFrame = async () => {
    if (!videoUploadResult) {
      setError('Please upload a video first.')
      return
    }

    if (frameTimestampSeconds < 0) {
      setError('Timestamp must be greater than or equal to 0.')
      return
    }

    try {
      setIsExtractingFrame(true)
      setError(null)
      setStatusMessage(`Extracting frame at ${frameTimestampSeconds}s...`)

      const response = await fetch(
        `/api/video/extract-frame/${videoUploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp_seconds: frameTimestampSeconds,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Frame extraction failed')
      }

      const data: VideoFrameExtractResponse = await response.json()
      setVideoFrameResult(data)
      setVideoMultiFrameResult(null)
      setVideoFrameDetectionResult(null)
      setStatusMessage('Frame extraction complete. Extracted frame is ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Frame extraction failed.')
    } finally {
      setIsExtractingFrame(false)
    }
  }

  const handleDetectExtractedFrame = async () => {
    if (!videoFrameResult) {
      setError('Please extract a video frame first.')
      return
    }

    try {
      setIsDetectingFrame(true)
      setError(null)
      setStatusMessage('Running YOLO detection on extracted frame...')

      const response = await fetch(
        `/api/video/detect-frame/${videoFrameResult.frame_filename}/annotated?confidence_threshold=${confidenceThreshold / 100}`,
        {
          method: 'POST',
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Frame detection failed')
      }

      const data: VideoFrameDetectionResponse = await response.json()
      setVideoFrameDetectionResult(data)
      setStatusMessage(`Frame detection complete. Found ${data.detection_count} object(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Frame detection failed.')
    } finally {
      setIsDetectingFrame(false)
    }
  }

  const handleExtractMultipleVideoFrames = async () => {
    if (!videoUploadResult) {
      setError('Please upload a video first.')
      return
    }

    if (
      multiFrameStartSeconds < 0 ||
      multiFrameEndSeconds <= multiFrameStartSeconds ||
      multiFrameIntervalSeconds <= 0
    ) {
      setError('Please enter a valid start, end, and interval for multi-frame extraction.')
      return
    }

    try {
      setIsExtractingMultipleFrames(true)
      setError(null)
      setVideoFrameResult(null)
      setVideoFrameDetectionResult(null)
      setStatusMessage(
        `Extracting frames from ${multiFrameStartSeconds}s to ${multiFrameEndSeconds}s...`,
      )

      const response = await fetch(
        `/api/video/extract-frames/${videoUploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_seconds: multiFrameStartSeconds,
            end_seconds: multiFrameEndSeconds,
            interval_seconds: multiFrameIntervalSeconds,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Multi-frame extraction failed')
      }

      const data: VideoMultiFrameExtractResponse = await response.json()
      setVideoMultiFrameResult(data)
      setVideoMultiFrameDetectionResult(null)
      setStatusMessage(`Extracted ${data.frame_count} frame(s) from the video.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Multi-frame extraction failed.')
    } finally {
      setIsExtractingMultipleFrames(false)
    }
  }

  const handleDetectMultipleVideoFrames = async () => {
    if (!videoMultiFrameResult || videoMultiFrameResult.frames.length === 0) {
      setError('Please extract multiple frames first.')
      return
    }

    try {
      setIsDetectingMultipleFrames(true)
      setError(null)
      setStatusMessage('Running YOLO detection on extracted video frames...')

      const response = await fetch('/api/video/detect-frames/annotated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame_filenames: videoMultiFrameResult.frames.map((frame) => frame.frame_filename),
          confidence_threshold: confidenceThreshold / 100,
          class_filter: selectedClass === 'all' ? null : selectedClass,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Multi-frame detection failed')
      }

      const data: VideoMultiFrameDetectionResponse = await response.json()
      setVideoMultiFrameDetectionResult(data)
      setStatusMessage(`Detected objects on ${data.frame_count} extracted frame(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Multi-frame detection failed.')
    } finally {
      setIsDetectingMultipleFrames(false)
    }
  }

  const handleDetectSampledVideo = async () => {
    if (!videoUploadResult) {
      setError('Please upload a video first.')
      return
    }

    if (sampledVideoIntervalSeconds <= 0) {
      setError('Sampling interval must be greater than 0.')
      return
    }

    try {
      setIsDetectingSampledVideo(true)
      setError(null)
      setVideoFrameResult(null)
      setVideoFrameDetectionResult(null)
      setVideoMultiFrameResult(null)
      setVideoMultiFrameDetectionResult(null)
      setStatusMessage(`Running sampled video detection every ${sampledVideoIntervalSeconds}s...`)

      const response = await fetch(
        `/api/video/detect-sampled/${videoUploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            interval_seconds: sampledVideoIntervalSeconds,
            confidence_threshold: confidenceThreshold / 100,
            class_filter: selectedClass === 'all' ? null : selectedClass,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Sampled video detection failed')
      }

      const data: VideoSampledDetectionResponse = await response.json()

      setVideoSampledDetectionResult(data)
      setVideoTrackingResult(null)
      setVideoMultiFrameResult(data.extracted_frames)
      setVideoMultiFrameDetectionResult(data.detection)

      setStatusMessage(
        `Sampled video detection complete. Processed ${data.detection.frame_count} frame(s).`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Sampled video detection failed.')
    } finally {
      setIsDetectingSampledVideo(false)
    }
  }

  const handleTrackSampledVideo = async () => {
    if (!videoUploadResult) {
      setError('Please upload a video first.')
      return
    }

    if (
      trackingStartSeconds < 0 ||
      trackingEndSeconds <= trackingStartSeconds ||
      trackingIntervalSeconds <= 0 ||
      trackingMaxDistancePixels <= 0
    ) {
      setError('Please enter a valid tracking range, interval, and max distance.')
      return
    }

    try {
      setIsTrackingVideo(true)
      setError(null)
      setStatusMessage('Running sampled video tracking...')

      const response = await fetch(
        `/api/video/track-sampled/${videoUploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_seconds: trackingStartSeconds,
            end_seconds: trackingEndSeconds,
            interval_seconds: trackingIntervalSeconds,
            confidence_threshold: confidenceThreshold / 100,
            class_filter: selectedClass === 'all' ? null : selectedClass,
            max_distance_pixels: trackingMaxDistancePixels,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Video tracking failed')
      }

      const data: VideoTrackingResponse = await response.json()
      setVideoTrackingResult(data)
      setStatusMessage(`Video tracking complete. Found ${data.track_count} track(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Video tracking failed.')
    } finally {
      setIsTrackingVideo(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose an image first.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      setIsUploading(true)
      setError(null)
      setDetectionResult(null)
      setCropResult(null)
      setBlurResult(null)
      setCommandResult(null)
      setSelectedClass('all')
      setClassOptions([])
      setLastDetectionThreshold(null)
      setLastDetectionClass(null)
      setStatusMessage('Uploading image to backend...')

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const data: UploadResponse = await response.json()
      setUploadResult(data)
      setStatusMessage('Upload complete. You can now run YOLO detection or type a command.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDetection = async () => {
    if (!uploadResult) {
      setError('Please upload an image first.')
      return
    }

    try {
      setIsDetecting(true)
      setError(null)
      setCropResult(null)
      setBlurResult(null)
      setCommandResult(null)
      setStatusMessage('Running YOLO detection. This may take a few seconds...')

      const backendThreshold = confidenceThreshold / 100
      const queryParams = new URLSearchParams({
        confidence_threshold: String(backendThreshold),
      })

      if (selectedClass !== 'all') {
        queryParams.set('class_filter', selectedClass)
      }

      const response = await fetch(
        `/api/vision/detect/${uploadResult.stored_filename}/annotated?${queryParams.toString()}`,
        {
          method: 'POST',
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Detection failed')
      }

      const data: DetectionResponse = await response.json()
      setDetectionResult(data)
      setLastDetectionThreshold(confidenceThreshold)
      setLastDetectionClass(selectedClass)
      setClassOptions((previousClasses) =>
        Array.from(
          new Set([
            ...previousClasses,
            ...data.detections.map((detection) => detection.class_name),
          ]),
        ).sort(),
      )
      setStatusMessage(`Detection complete. Found ${data.detection_count} object(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Detection failed.')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleCrop = async (detection: Detection) => {
    if (!uploadResult) {
      setError('Please upload an image first.')
      return
    }

    try {
      setIsCropping(true)
      setError(null)
      setCommandResult(null)
      setStatusMessage(`Cropping selected ${detection.class_name}...`)

      const response = await fetch(
        `/api/vision/crop/${uploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(detection.bbox),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Crop failed')
      }

      const data: CropResponse = await response.json()
      setCropResult(data)
      setStatusMessage('Crop complete. Cropped output is ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Crop failed.')
    } finally {
      setIsCropping(false)
    }
  }

  const handleBlur = async (detection: Detection) => {
    if (!uploadResult) {
      setError('Please upload an image first.')
      return
    }

    try {
      setIsBlurring(true)
      setError(null)
      setCommandResult(null)
      setStatusMessage(`Blurring selected ${detection.class_name}...`)

      const response = await fetch(
        `/api/vision/blur/${uploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(detection.bbox),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Blur failed')
      }

      const data: BlurResponse = await response.json()
      setBlurResult(data)
      setStatusMessage('Blur complete. Blurred output is ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Blur failed.')
    } finally {
      setIsBlurring(false)
    }
  }

  const handleCropByClass = async () => {
    if (!uploadResult) {
      setError('Please upload an image first.')
      return
    }

    if (selectedClass === 'all') {
      setError('Please select a specific class before using crop by class.')
      return
    }

    try {
      setIsCropping(true)
      setError(null)
      setCommandResult(null)
      setStatusMessage(`Cropping best ${selectedClass} by class...`)

      const response = await fetch(
        `/api/vision/crop-by-class/${uploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            class_name: selectedClass,
            confidence_threshold: confidenceThreshold / 100,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Crop by class failed')
      }

      const data: CropResponse = await response.json()
      setCropResult(data)
      setStatusMessage(`Crop by class complete. Best ${selectedClass} crop is ready.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Crop by class failed.')
    } finally {
      setIsCropping(false)
    }
  }

  const handleUseMediaFile = (mediaFile: MediaFileLog) => {
    setSelectedFile(null)
    setUploadResult({
      message: 'Loaded image from media history',
      original_filename: mediaFile.original_filename,
      stored_filename: mediaFile.stored_filename,
      content_type: mediaFile.content_type,
      width: mediaFile.width,
      height: mediaFile.height,
      storage_path: mediaFile.storage_path,
      file_url: mediaFile.file_url,
    })
    setDetectionResult(null)
    setCropResult(null)
    setBlurResult(null)
    setCommandResult(null)
    setSelectedClass('all')
    setClassOptions([])
    setLastDetectionThreshold(null)
    setLastDetectionClass(null)
    setError(null)
    setStatusMessage(`Loaded ${mediaFile.original_filename} from media history. You can now run detection or commands.`)
  }

  const handleLoadModelInfo = async () => {
    try {
      setIsLoadingModelInfo(true)
      setError(null)
      setStatusMessage('Loading model information...')

      const response = await fetch('/api/model/info')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load model information')
      }

      const data: ModelInfo = await response.json()
      setModelInfo(data)
      setStatusMessage(`Loaded model information for ${data.model_name}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load model information.')
    } finally {
      setIsLoadingModelInfo(false)
    }
  }


  const handleLoadModelClasses = async () => {
    try {
      setIsLoadingModelClasses(true)
      setStatusMessage('Loading supported model classes...')

      const response = await fetch('/api/model/classes')

      if (!response.ok) {
        throw new Error('Could not load supported model classes')
      }

      const data: ModelClassesResponse = await response.json()
      setModelClasses(data)
      setStatusMessage(`Loaded ${data.class_count} supported object class(es) for ${data.model_name}.`)
    } catch (error) {
      console.error(error)
      setStatusMessage('Could not load supported model classes.')
    } finally {
      setIsLoadingModelClasses(false)
    }
  }


  const handleLoadDatabaseStats = async () => {
    try {
      setIsLoadingStats(true)
      setError(null)
      setStatusMessage('Loading database statistics...')

      const response = await fetch('/api/db/stats')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load database statistics')
      }

      const data: DatabaseStats = await response.json()
      setDatabaseStats(data)
      setStatusMessage('Database statistics loaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load database statistics.')
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleLoadInferenceSummary = async () => {
    try {
      setIsLoadingInferenceSummary(true)
      setError(null)
      setStatusMessage('Loading inference summary from PostgreSQL...')

      const response = await fetch('/api/db/inference-summary')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load inference summary')
      }

      const data: InferenceSummary = await response.json()
      setInferenceSummary(data)
      setStatusMessage(`Loaded inference summary with ${data.total_inferences} inference run(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load inference summary.')
    } finally {
      setIsLoadingInferenceSummary(false)
    }
  }

  const handleLoadInferenceLogs = async () => {
    try {
      setIsLoadingInferenceLogs(true)
      setError(null)
      setStatusMessage('Loading model inference logs from PostgreSQL...')

      const response = await fetch('/api/db/inference-logs?limit=10')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load model inference logs')
      }

      const data: { count: number; inference_logs: InferenceLog[] } = await response.json()
      setInferenceLogs(data.inference_logs)
      setStatusMessage(`Loaded ${data.count} recent inference log(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load model inference logs.')
    } finally {
      setIsLoadingInferenceLogs(false)
    }
  }

  const handleLoadDetectionSummary = async () => {
    try {
      setIsLoadingDetectionSummary(true)
      setError(null)
      setStatusMessage('Loading detection summary from PostgreSQL...')

      const response = await fetch('/api/db/detection-summary')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load detection summary')
      }

      const data: DetectionSummary = await response.json()
      setDetectionSummary(data)
      setStatusMessage(`Loaded detection summary with ${data.total_detections} stored detection(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load detection summary.')
    } finally {
      setIsLoadingDetectionSummary(false)
    }
  }

  const handleLoadDetectionLogs = async () => {
    try {
      setIsLoadingDetections(true)
      setError(null)
      setStatusMessage('Loading detection history from PostgreSQL...')

      const response = await fetch('/api/db/detections?limit=10')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load detection history')
      }

      const data: { count: number; detections: DetectionLog[] } = await response.json()
      setDetectionLogs(data.detections)
      setStatusMessage(`Loaded ${data.count} recent detection result(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load detection history.')
    } finally {
      setIsLoadingDetections(false)
    }
  }

  const handleLoadMediaFiles = async () => {
    try {
      setIsLoadingMediaFiles(true)
      setError(null)
      setStatusMessage('Loading uploaded media history...')

      const response = await fetch('/api/db/media-files?limit=10')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load uploaded media history')
      }

      const data: { count: number; media_files: MediaFileLog[] } = await response.json()
      setMediaFiles(data.media_files)
      setStatusMessage(`Loaded ${data.count} uploaded media file(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load uploaded media history.')
    } finally {
      setIsLoadingMediaFiles(false)
    }
  }

  const handleVoiceCommand = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('Voice command is not supported in this browser. Please type the command instead.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)
    setError(null)
    setStatusMessage('Listening for a voice command...')

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setCommandText(transcript)
      setStatusMessage(`Heard: "${transcript}". You can now run the command.`)
    }

    recognition.onerror = () => {
      setError('Could not recognize the voice command. Please try again or type the command.')
      setStatusMessage('Voice command failed.')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleLoadCommandLogs = async () => {
    try {
      setIsLoadingLogs(true)
      setError(null)
      setStatusMessage('Loading command history from PostgreSQL...')

      const queryParams = new URLSearchParams()
      queryParams.set('limit', commandHistoryLimit)

      if (commandHistoryParserModeFilter !== 'all') {
        queryParams.set('parser_mode', commandHistoryParserModeFilter)
      }

      if (commandHistoryResultTypeFilter !== 'all') {
        queryParams.set('result_type', commandHistoryResultTypeFilter)
      }

      const response = await fetch(`/api/db/command-logs?${queryParams.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load command history')
      }

      const data: { count: number; logs: CommandLog[] } = await response.json()
      setCommandLogs(data.logs)
      setHasLoadedCommandLogs(true)
      setStatusMessage(
        `Loaded ${data.count} recent command log(s) from PostgreSQL${
          commandHistoryParserModeFilter !== 'all'
            ? ` for ${commandHistoryParserModeFilter}`
            : ''
        }.`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load command history.')
      setHasLoadedCommandLogs(false)
    } finally {
      setIsLoadingLogs(false)
    }
  }


  const handleExportCommandLogs = async () => {
    try {
      setError(null)
      setStatusMessage('Exporting command history as CSV...')

      const queryParams = new URLSearchParams()
      queryParams.set('limit', commandHistoryLimit)

      if (commandHistoryParserModeFilter !== 'all') {
        queryParams.set('parser_mode', commandHistoryParserModeFilter)
      }

      if (commandHistoryResultTypeFilter !== 'all') {
        queryParams.set('result_type', commandHistoryResultTypeFilter)
      }

      const response = await fetch(`/api/db/command-logs/export?${queryParams.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not export command history')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = 'command_logs.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(downloadUrl)

      setStatusMessage(
        `Exported ${commandHistoryLimit} command history row(s) as CSV with parser=${commandHistoryParserModeFilter}, result=${commandHistoryResultTypeFilter}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not export command history.')
    }
  }

  const handleLoadCommandLogSummary = async () => {
    try {
      setIsLoadingCommandLogSummary(true)
      setError(null)
      setStatusMessage('Loading command history summary...')

      const queryParams = new URLSearchParams()

      if (commandHistoryParserModeFilter !== 'all') {
        queryParams.set('parser_mode', commandHistoryParserModeFilter)
      }

      if (commandHistoryResultTypeFilter !== 'all') {
        queryParams.set('result_type', commandHistoryResultTypeFilter)
      }

      const queryString = queryParams.toString()
      const response = await fetch(
        `/api/db/command-log-summary${queryString ? `?${queryString}` : ''}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load command history summary')
      }

      const data: CommandLogSummaryResponse = await response.json()
      setCommandLogSummary(data)
      setStatusMessage(
        `Loaded command history summary with ${data.total_commands} command(s)${
          commandHistoryParserModeFilter !== 'all'
            ? ` for ${commandHistoryParserModeFilter}`
            : ''
        }.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load command history summary.')
    } finally {
      setIsLoadingCommandLogSummary(false)
    }
  }


  const handleLoadPromptPreview = async () => {
    if (!commandText.trim()) {
      setError('Please type a command before previewing the LLM prompt.')
      return
    }

    try {
      setIsLoadingPromptPreview(true)
      setError(null)
      setCommandPromptPreviewResult(null)
      setStatusMessage(`Generating LLM prompt preview for: "${commandText}"...`)

      const response = await fetch('/api/commands/parse/prompt-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: commandText,
          parser_mode: selectedParserMode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Prompt preview failed')
      }

      const data: CommandPromptPreviewResponse = await response.json()
      setCommandPromptPreviewResult(data)
      setStatusMessage(`Loaded prompt preview: ${data.prompt_version}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Prompt preview failed.')
    } finally {
      setIsLoadingPromptPreview(false)
    }
  }

  const handleParseCommand = async () => {
    if (!commandText.trim()) {
      setError('Please type a command to parse.')
      return
    }

    try {
      setIsParsingCommand(true)
      setError(null)
      setCommandParseResult(null)
      setParsedCommandValidationResult(null)
      setStatusMessage(`Parsing command: "${commandText}"...`)

      const response = await fetch('/api/commands/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: commandText,
          parser_mode: selectedParserMode,
        }),
      })

      if (!response.ok) {
        throw new Error(await getBackendErrorMessage(response, 'Command parsing failed'))
      }

      const data: CommandParseResponse = await response.json()
      setCommandParseResult(data)
      setStatusMessage(`Command parsed as: ${data.parsed_command.action}.`)
    } catch (err) {
      const message = getErrorMessage(err, 'Command parsing failed.')
      setError(message)
      setStatusMessage(message)
    } finally {
      setIsParsingCommand(false)
    }
  }

  const handleLoadCommandEvaluation = async () => {
    try {
      setIsLoadingCommandEvaluation(true)
      setError(null)
      setStatusMessage(`Loading command parser evaluation for ${selectedParserMode}...`)

      const response = await fetch(
        `/api/commands/evaluate?parser_mode=${encodeURIComponent(selectedParserMode)}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load parser evaluation')
      }

      const data: CommandEvaluationResponse = await response.json()
      setCommandEvaluationResult(data)
      setStatusMessage(
        `Loaded parser evaluation: ${data.passed_cases}/${data.total_cases} cases passed.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load parser evaluation.')
    } finally {
      setIsLoadingCommandEvaluation(false)
    }
  }

  const handleLoadParserComparison = async () => {
    try {
      setIsLoadingParserComparison(true)
      setError(null)
      setStatusMessage('Loading parser comparison...')

      const queryParams = new URLSearchParams()

      if (includeRealLlmEvaluationInDashboard) {
        queryParams.set('include_real_llm', 'true')
      }

      const queryString = queryParams.toString()
      const response = await fetch(
        `/api/commands/evaluate/compare${queryString ? `?${queryString}` : ''}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load parser comparison')
      }

      const data: ParserComparisonResponse = await response.json()
      setParserComparisonResult(data)
      setStatusMessage(
        `Loaded parser comparison for ${data.parser_modes.length} parser mode(s).`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load parser comparison.')
    } finally {
      setIsLoadingParserComparison(false)
    }
  }

  const handleValidateParsedCommand = async () => {
    if (!commandParseResult) {
      setError('Please parse a command before validating it.')
      return
    }

    try {
      setIsValidatingParsedCommand(true)
      setError(null)
      setParsedCommandValidationResult(null)
      setStatusMessage('Validating parsed command JSON...')

      const response = await fetch('/api/commands/validate-parsed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parsed_command: commandParseResult.parsed_command,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Parsed command validation failed')
      }

      const data: ParsedCommandValidationResponse = await response.json()
      setParsedCommandValidationResult(data)
      setStatusMessage('Parsed command JSON is valid.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Parsed command validation failed.')
    } finally {
      setIsValidatingParsedCommand(false)
    }
  }

  const handleLoadParserAttemptLogs = async () => {
    try {
      setIsLoadingParserAttemptLogs(true)
      setError(null)
      setStatusMessage('Loading parser attempt logs...')

      const response = await fetch('/api/commands/parse/logs?limit=20')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load parser attempt logs')
      }

      const data: ParserAttemptLogsResponse = await response.json()
      setParserAttemptLogsResult(data)
      setStatusMessage(`Loaded ${data.count} parser attempt log(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load parser attempt logs.')
    } finally {
      setIsLoadingParserAttemptLogs(false)
    }
  }

  const handleLoadLlmProviderStatus = async () => {
    try {
      setIsLoadingLlmProviderStatus(true)
      setError(null)
      setStatusMessage('Loading LLM provider status...')

      const response = await fetch('/api/llm/provider/status')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load LLM provider status')
      }

      const data: LLMProviderStatusResponse = await response.json()
      setLlmProviderStatusResult(data)
      setStatusMessage(`Loaded LLM provider status: ${data.provider_name}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load LLM provider status.')
    } finally {
      setIsLoadingLlmProviderStatus(false)
    }
  }

  const handleResetParserFilters = () => {
    setDatabaseParserLogParserModeFilter('all')
    setDatabaseParserLogSuccessFilter('all')
    setDatabaseParserLogLimit('10')
    setStatusMessage('Parser filters reset.')
  }

  const handleExportDatabaseParserAttemptLogs = async () => {
    try {
      setError(null)
      setStatusMessage('Exporting PostgreSQL parser attempt logs...')

      const queryParams = new URLSearchParams()
      queryParams.set('limit', databaseParserLogLimit)

      if (databaseParserLogParserModeFilter !== 'all') {
        queryParams.set('parser_mode', databaseParserLogParserModeFilter)
      }

      if (databaseParserLogSuccessFilter === 'success') {
        queryParams.set('success', 'true')
      }

      if (databaseParserLogSuccessFilter === 'failed') {
        queryParams.set('success', 'false')
      }

      const response = await fetch(
        `/api/db/parser-attempt-logs/export?${queryParams.toString()}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not export PostgreSQL parser attempt logs')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = 'parser_attempt_logs.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(downloadUrl)

      setStatusMessage('Exported PostgreSQL parser attempt logs as CSV.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not export PostgreSQL parser attempt logs.')
    }
  }

  const handleLoadDatabaseParserAttemptLogs = async () => {
    try {
      setIsLoadingDatabaseParserAttemptLogs(true)
      setError(null)
      setStatusMessage('Loading PostgreSQL parser attempt logs...')

      const queryParams = new URLSearchParams()
      queryParams.set('limit', databaseParserLogLimit)

      if (databaseParserLogParserModeFilter !== 'all') {
        queryParams.set('parser_mode', databaseParserLogParserModeFilter)
      }

      if (databaseParserLogSuccessFilter === 'success') {
        queryParams.set('success', 'true')
      }

      if (databaseParserLogSuccessFilter === 'failed') {
        queryParams.set('success', 'false')
      }

      const queryString = queryParams.toString()
      const response = await fetch(
        `/api/db/parser-attempt-logs${queryString ? `?${queryString}` : ''}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load PostgreSQL parser attempt logs')
      }

      const data: DatabaseParserAttemptLogsResponse = await response.json()
      setDatabaseParserAttemptLogsResult(data)
      setStatusMessage(`Loaded ${data.count} PostgreSQL parser attempt log(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load PostgreSQL parser attempt logs.')
    } finally {
      setIsLoadingDatabaseParserAttemptLogs(false)
    }
  }

  const handleLoadDatabaseParserAttemptSummary = async () => {
    try {
      setIsLoadingDatabaseParserAttemptSummary(true)
      setError(null)
      setStatusMessage('Loading PostgreSQL parser attempt summary...')

      const queryParams = new URLSearchParams()

      if (databaseParserLogParserModeFilter !== 'all') {
        queryParams.set('parser_mode', databaseParserLogParserModeFilter)
      }

      if (databaseParserLogSuccessFilter === 'success') {
        queryParams.set('success', 'true')
      }

      if (databaseParserLogSuccessFilter === 'failed') {
        queryParams.set('success', 'false')
      }

      const queryString = queryParams.toString()
      const response = await fetch(
        `/api/db/parser-attempt-summary${queryString ? `?${queryString}` : ''}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load PostgreSQL parser attempt summary')
      }

      const data: DatabaseParserAttemptSummaryResponse = await response.json()
      setDatabaseParserAttemptSummaryResult(data)
      setStatusMessage(`Loaded PostgreSQL parser summary with ${data.total_attempts} total attempt(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load PostgreSQL parser attempt summary.')
    } finally {
      setIsLoadingDatabaseParserAttemptSummary(false)
    }
  }

  const handleLoadLlmOpsDashboard = async () => {
    try {
      setIsLoadingLlmOpsDashboard(true)
      setError(null)
      setLlmOpsDashboardLoaded(false)
      setLlmOpsParserEvaluationResult(null)
      setStatusMessage('Loading LLMOps dashboard...')

      const queryParams = new URLSearchParams()
      queryParams.set('limit', databaseParserLogLimit)

      if (includeRealLlmEvaluationInDashboard) {
        queryParams.set('include_real_llm', 'true')
      }

      if (databaseParserLogParserModeFilter !== 'all') {
        queryParams.set('parser_mode', databaseParserLogParserModeFilter)
      }

      if (databaseParserLogSuccessFilter === 'success') {
        queryParams.set('success', 'true')
      }

      if (databaseParserLogSuccessFilter === 'failed') {
        queryParams.set('success', 'false')
      }

      const response = await fetch(`/api/llmops/dashboard?${queryParams.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load LLMOps dashboard')
      }

      const data: LLMOpsDashboardResponse = await response.json()

      setLlmProviderStatusResult(data.provider_status)
      setDatabaseParserAttemptSummaryResult(data.parser_attempt_summary)
      setDatabaseParserAttemptLogsResult(data.recent_parser_attempt_logs)
      setCommandLogSummary(data.command_log_summary)
      setLlmOpsParserEvaluationResult(data.parser_evaluation)
      setLlmOpsDashboardLoaded(true)

      setStatusMessage(
        `Loaded LLMOps dashboard: ${data.parser_attempt_summary.total_attempts} parser attempt(s), ${data.command_log_summary.total_commands} command(s), provider ${data.provider_status.provider_name}.`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load LLMOps dashboard.')
    } finally {
      setIsLoadingLlmOpsDashboard(false)
    }
  }

  const handleCommand = async () => {
    const normalizedCommandText = commandText.toLowerCase().trim()
    const isVideoCommand =
      normalizedCommandText.includes('video') ||
      normalizedCommandText.includes('frame') ||
      normalizedCommandText.includes('track')

    const activeFilename = isVideoCommand
      ? videoUploadResult?.stored_filename
      : uploadResult?.stored_filename

    if (!activeFilename) {
      setError(
        isVideoCommand
          ? 'Please upload a video before running this command.'
          : 'Please upload an image before running this command.',
      )
      return
    }

    if (!commandText.trim()) {
      setError('Please type a command, for example: crop person or extract frame at 1 second.')
      return
    }

    try {
      setIsRunningCommand(true)
      setError(null)
      setStatusMessage(`Running command with ${selectedParserMode}: "${commandText}"...`)

      const response = await fetch('/api/commands/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: activeFilename,
          command: commandText,
          confidence_threshold: confidenceThreshold / 100,
          parser_mode: selectedParserMode,
        }),
      })

      if (!response.ok) {
        throw new Error(await getBackendErrorMessage(response, 'Command failed'))
      }

      const data: CommandResponse = await response.json()
      setCommandResult(data)

      if (data.result_type === 'annotated_detection') {
        const result = data.result as DetectionResponse
        setDetectionResult(result)
        setCropResult(null)
        setBlurResult(null)
        setSelectedClass('all')
        setLastDetectionThreshold(confidenceThreshold)
        setLastDetectionClass('all')
        setClassOptions((previousClasses) =>
          Array.from(
            new Set([
              ...previousClasses,
              ...result.detections.map((detection) => detection.class_name),
            ]),
          ).sort(),
        )
      }

      if (data.result_type === 'crop_by_class') {
        const result = data.result as CropResponse
        setCropResult(result)
        setBlurResult(null)
      }

      if (data.result_type === 'blur_by_class' || data.result_type === 'blur_all_by_class') {
        const result = data.result as BlurResponse
        setBlurResult(result)
        setCropResult(null)
      }

      if (data.result_type === 'extract_frame') {
        const result = data.result as VideoFrameExtractResponse
        setVideoFrameResult(result)
        setVideoFrameDetectionResult(null)
      }

      if (data.result_type === 'extract_frames') {
        const result = data.result as VideoMultiFrameExtractResponse
        setVideoMultiFrameResult(result)
        setVideoMultiFrameDetectionResult(null)
        setVideoFrameResult(null)
        setVideoFrameDetectionResult(null)
      }

      if (data.result_type === 'detect_frames') {
        const result = data.result as VideoDetectFramesCommandResponse
        setVideoMultiFrameResult(result.extracted_frames)
        setVideoMultiFrameDetectionResult(result.detection)
        setVideoFrameResult(null)
        setVideoFrameDetectionResult(null)
      }

      if (data.result_type === 'track_video') {
        const result = data.result as VideoTrackingResponse
        setVideoTrackingResult(result)
      }

      if (data.result_type === 'trim_video') {
        const result = data.result as VideoTrimResponse
        setVideoTrimResult(result)
      }

      setStatusMessage(`Command complete: "${commandText}".`)
    } catch (err) {
      const message = getErrorMessage(err, 'Command failed.')
      setError(message)
      setStatusMessage(message)
    } finally {
      setIsRunningCommand(false)
    }
  }

  const normalizedModelClassSearch = modelClassSearch.trim().toLowerCase()

  const visibleModelClasses = modelClasses
    ? modelClasses.classes.filter((className) => {
        if (!normalizedModelClassSearch) {
          return true
        }

        const aliasesForClass = Object.entries(modelClasses.aliases)
          .filter(([, targetClassName]) => targetClassName === className)
          .map(([alias]) => alias)

        return (
          className.toLowerCase().includes(normalizedModelClassSearch) ||
          aliasesForClass.some((alias) => alias.toLowerCase().includes(normalizedModelClassSearch))
        )
      })
    : []

  const visibleClassAliases = modelClasses
    ? Object.entries(modelClasses.aliases).filter(([alias, className]) => {
        if (!normalizedModelClassSearch) {
          return true
        }

        return (
          alias.toLowerCase().includes(normalizedModelClassSearch) ||
          className.toLowerCase().includes(normalizedModelClassSearch)
        )
      })
    : []

  const hasLegacyCommandParserMetadata = commandLogSummary
    ? commandLogSummary.by_parser_mode.some((item) => item.name === 'unknown')
    : false

  const hasLegacyParserAttemptMode = databaseParserAttemptSummaryResult
    ? databaseParserAttemptSummaryResult.by_parser_mode.some((item) => item.parser_mode === 'llm')
    : false

  const isRealLlmSelected = selectedParserMode === 'real_llm'

  const isRealLlmProviderStatusLoading =
    isRealLlmSelected && isLoadingLlmProviderStatus

  const isRealLlmProviderStatusUnknown =
    isRealLlmSelected && !llmProviderStatusResult && !isLoadingLlmProviderStatus

  const isRealLlmUnavailable =
    isRealLlmSelected &&
    llmProviderStatusResult !== null &&
    !llmProviderStatusResult.real_llm_available

  const isRealLlmActionBlocked =
    isRealLlmProviderStatusLoading || isRealLlmProviderStatusUnknown || isRealLlmUnavailable

  const uploadedImageUrl = uploadResult ? `/api${uploadResult.file_url}` : null

  const uploadedVideoUrl = videoUploadResult ? `/api${videoUploadResult.file_url}` : null

  const trimmedVideoUrl = videoTrimResult ? `/api${videoTrimResult.trimmed_file_url}` : null

  const extractedFrameUrl = videoFrameResult ? `/api${videoFrameResult.frame_file_url}` : null

  const annotatedFrameUrl = videoFrameDetectionResult
    ? `/api${videoFrameDetectionResult.annotated_frame_file_url}`
    : null

  const annotatedImageUrl = detectionResult
    ? `/api${detectionResult.annotated_file_url}`
    : null

  const croppedImageUrl = cropResult
    ? `/api${cropResult.cropped_file_url}`
    : null

  const blurredImageUrl = blurResult
    ? `/api${blurResult.blurred_file_url}`
    : null

  const availableClasses = classOptions

  const filteredDetections = detectionResult
    ? detectionResult.detections.filter(
        (detection) =>
          detection.confidence * 100 >= confidenceThreshold &&
          (selectedClass === 'all' || detection.class_name === selectedClass),
      )
    : []

  const isBusy =
    isUploading ||
    isUploadingVideo ||
    isTrimmingVideo ||
    isExtractingFrame ||
    isExtractingMultipleFrames ||
    isDetectingMultipleFrames ||
    isDetectingSampledVideo ||
    isTrackingVideo ||
    isDetectingFrame ||
    isDetecting ||
    isCropping ||
    isBlurring ||
    isRunningCommand ||
    isParsingCommand ||
    isValidatingParsedCommand ||
    isLoadingPromptPreview ||
    isLoadingCommandEvaluation ||
    isLoadingParserComparison ||
    isLoadingParserAttemptLogs ||
    isLoadingDatabaseParserAttemptLogs ||
    isLoadingDatabaseParserAttemptSummary ||
    isLoadingLlmProviderStatus ||
    isLoadingLlmOpsDashboard ||
    isLoadingLogs ||
    isLoadingMediaFiles ||
    isLoadingStats ||
    isLoadingModelInfo ||
    isLoadingModelClasses ||
    isLoadingDetections ||
    isLoadingDetectionSummary ||
    isLoadingInferenceLogs ||
    isLoadingInferenceSummary ||
    isListening

  const thresholdChangedAfterDetection =
    detectionResult !== null &&
    lastDetectionThreshold !== null &&
    confidenceThreshold !== lastDetectionThreshold

  const classChangedAfterDetection =
    detectionResult !== null &&
    lastDetectionClass !== null &&
    selectedClass !== lastDetectionClass

  const filtersChangedAfterDetection =
    thresholdChangedAfterDetection || classChangedAfterDetection

  const getFrameTimestamp = (frameFilename: string) => {
    return videoMultiFrameResult?.frames.find(
      (frame) => frame.frame_filename === frameFilename,
    )?.timestamp_seconds
  }

  const formatFrameTimestamp = (frameFilename: string) => {
    const timestamp = getFrameTimestamp(frameFilename)
    return timestamp !== undefined ? `${timestamp}s` : 'Unknown time'
  }

  const getFrameClassSummary = (detections: Detection[]) => {
    if (detections.length === 0) {
      return 'No detections'
    }

    const classCounts = detections.reduce<Record<string, number>>((counts, detection) => {
      counts[detection.class_name] = (counts[detection.class_name] || 0) + 1
      return counts
    }, {})

    return Object.entries(classCounts)
      .map(([className, count]) => `${className} (${count})`)
      .join(', ')
  }

  const generalCommandPresets = [
    {
      label: 'Detect objects',
      command: 'detect objects',
      target: 'image',
    },
    {
      label: 'Extract frame at 1s',
      command: 'extract frame at 1 second',
      target: 'video',
    },
    {
      label: 'Extract frames 0–3s',
      command: 'extract frames from 0 to 3 seconds',
      target: 'video',
    },
    {
      label: 'Detect frames 0–3s',
      command: 'detect frames from 0 to 3 seconds',
      target: 'video',
    },
    {
      label: 'Track video 0–3s',
      command: 'track video from 0 to 3 seconds',
      target: 'video',
    },
    {
      label: 'Trim video 0–2s',
      command: 'trim video from 0 to 2 seconds',
      target: 'video',
    },
  ]

  const detectedObjectCommandPresets = classOptions.flatMap((className) => [
    {
      label: `Crop ${className}`,
      command: `crop ${className}`,
    },
    {
      label: `Blur ${className}`,
      command: `blur ${className}`,
    },
    {
      label: `Blur all ${className}s`,
      command: `blur all ${className}s`,
    },
    {
      label: `Track ${className} 0–3s`,
      command: `track ${className} from 0 to 3 seconds`,
    },
  ])

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">VisionCommand AI</p>
        <h1>AI Vision Detection Studio</h1>
        <p className="subtitle">
          Upload an image, run YOLO object detection, crop or blur detected objects, and use text or voice commands.
        </p>
      </section>

      <section className="status-card">
        <span className={isBusy ? 'status-dot active' : 'status-dot'} />
        <p>{statusMessage}</p>
      </section>

      <section className="card database-dashboard">
        <div className="dashboard-header">
          <div>
            <h2>Database Dashboard</h2>
            <p className="small-note">
              View PostgreSQL-backed project statistics.
            </p>
          </div>

          <div className="dashboard-actions">
            <button
              className="secondary-button"
              onClick={handleLoadDatabaseStats}
              disabled={isBusy}
            >
              {isLoadingStats ? 'Loading stats...' : 'Load Database Stats'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadModelInfo}
              disabled={isBusy}
            >
              {isLoadingModelInfo ? 'Loading model...' : 'Load Model Info'}
            </button>

            <button
              type="button"
              onClick={handleLoadModelClasses}
              disabled={isLoadingModelClasses}
            >
              {isLoadingModelClasses ? 'Loading classes...' : 'Load Supported Classes'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadDetectionLogs}
              disabled={isBusy}
            >
              {isLoadingDetections ? 'Loading detections...' : 'Load Detection History'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadDetectionSummary}
              disabled={isBusy}
            >
              {isLoadingDetectionSummary ? 'Loading summary...' : 'Load Detection Summary'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadInferenceLogs}
              disabled={isBusy}
            >
              {isLoadingInferenceLogs ? 'Loading inference logs...' : 'Load Inference Logs'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadInferenceSummary}
              disabled={isBusy}
            >
              {isLoadingInferenceSummary ? 'Loading inference summary...' : 'Load Inference Summary'}
            </button>
          </div>
        </div>

        {modelInfo && (
          <div className="model-info-panel">
            <h3>Model Information</h3>

            <div className="model-info-grid">
              <div className="stat-item">
                <span>Model</span>
                <strong>{modelInfo.model_name}</strong>
              </div>

              <div className="stat-item">
                <span>Task</span>
                <strong>{modelInfo.task}</strong>
              </div>

              <div className="stat-item">
                <span>Framework</span>
                <strong>{modelInfo.framework}</strong>
              </div>

              <div className="stat-item">
                <span>Backend</span>
                <strong>{modelInfo.backend}</strong>
              </div>

              <div className="stat-item">
                <span>Version</span>
                <strong>{modelInfo.version}</strong>
              </div>
            </div>

            <div className="supported-actions">
              <h4>Supported Actions</h4>
              <div className="action-tags">
                {modelInfo.supported_actions.map((action) => (
                  <span key={action}>{action}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {modelClasses && (
          <section className="result-card model-classes-card">
            <div className="model-classes-header">
              <div>
                <h3>Supported Model Classes</h3>
                <p>
                  The current model can detect {modelClasses.class_count} object class(es).
                  Use these names in crop, blur, detect, and tracking commands.
                </p>
              </div>
              <span className="model-class-count">{modelClasses.class_count} classes</span>
            </div>

            <label className="model-class-search">
              Search classes or aliases
              <input
                type="search"
                value={modelClassSearch}
                onChange={(event) => setModelClassSearch(event.target.value)}
                placeholder="Try bike, phone, person, car..."
              />
            </label>

            <div className="model-class-list">
              {visibleModelClasses.length > 0 ? (
                visibleModelClasses.map((className) => (
                  <span key={className} className="model-class-pill">
                    {className}
                  </span>
                ))
              ) : (
                <p className="empty-state">No supported class matched your search.</p>
              )}
            </div>

            <div className="model-alias-section">
              <h4>Common aliases</h4>
              <p>
                These words are normalized to supported YOLO class names before detection.
              </p>

              <div className="model-alias-list">
                {visibleClassAliases.length > 0 ? (
                  visibleClassAliases.slice(0, 50).map(([alias, className]) => (
                    <span key={`${alias}-${className}`} className="model-alias-pill">
                      <code>{alias}</code>
                      <span>→</span>
                      <strong>{className}</strong>
                    </span>
                  ))
                ) : (
                  <p className="empty-state">No alias matched your search.</p>
                )}
              </div>

              {visibleClassAliases.length > 50 && (
                <p className="helper-text">
                  Showing first 50 alias matches. Refine the search to narrow the list.
                </p>
              )}
            </div>
          </section>
        )}

        {databaseStats && (
          <div className="stats-grid">
            <div className="stat-item">
              <span>Status</span>
              <strong>{databaseStats.status}</strong>
            </div>

            <div className="stat-item">
              <span>Uploaded media</span>
              <strong>{databaseStats.media_files_count}</strong>
            </div>

            <div className="stat-item">
              <span>Command logs</span>
              <strong>{databaseStats.command_logs_count}</strong>
            </div>
          </div>
        )}

        {detectionSummary && (
          <div className="detection-summary">
            <h3>Detection Summary</h3>

            <div className="summary-total">
              <span>Total stored detections</span>
              <strong>{detectionSummary.total_detections}</strong>
            </div>

            {detectionSummary.classes.length > 0 ? (
              <div className="summary-class-list">
                {detectionSummary.classes.map((item) => (
                  <div className="summary-class-item" key={item.class_name}>
                    <div>
                      <strong>{item.class_name}</strong>
                      <p>{item.count} detection(s)</p>
                    </div>

                    <div>
                      <span>Avg: {(item.average_confidence * 100).toFixed(1)}%</span>
                      <span>Max: {(item.max_confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No detection summary available yet. Run YOLO detection first.</p>
            )}
          </div>
        )}

        {inferenceSummary && (
          <div className="inference-summary">
            <h3>Inference Summary</h3>

            <div className="inference-summary-grid">
              <div className="stat-item">
                <span>Total runs</span>
                <strong>{inferenceSummary.total_inferences}</strong>
              </div>

              <div className="stat-item">
                <span>Avg time</span>
                <strong>{inferenceSummary.average_inference_time_ms.toFixed(2)} ms</strong>
              </div>

              <div className="stat-item">
                <span>Max time</span>
                <strong>{inferenceSummary.max_inference_time_ms.toFixed(2)} ms</strong>
              </div>

              <div className="stat-item">
                <span>Total detections</span>
                <strong>{inferenceSummary.total_detections}</strong>
              </div>

              <div className="stat-item">
                <span>Avg detections/run</span>
                <strong>{inferenceSummary.average_detections_per_run.toFixed(2)}</strong>
              </div>
            </div>

            {inferenceSummary.by_endpoint.length > 0 ? (
              <div className="summary-class-list">
                {inferenceSummary.by_endpoint.map((item) => (
                  <div className="summary-class-item" key={item.source_endpoint}>
                    <div>
                      <strong>{item.source_endpoint}</strong>
                      <p>{item.run_count} run(s)</p>
                    </div>

                    <div>
                      <span>Avg time: {item.average_inference_time_ms.toFixed(2)} ms</span>
                      <span>Max time: {item.max_inference_time_ms.toFixed(2)} ms</span>
                      <span>Total detections: {item.total_detections}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No inference summary available yet. Run YOLO detection first.</p>
            )}
          </div>
        )}

        {inferenceLogs.length > 0 && (
          <div className="inference-history">
            <h3>Recent Model Inference Logs</h3>

            {inferenceLogs.map((log, index) => (
              <div className="inference-log-item" key={`${log.filename}-${log.created_at}-${index}`}>
                <div>
                  <strong>{log.model_name}</strong>
                  <p>{new Date(log.created_at).toLocaleString()}</p>
                  <p>{log.filename}</p>
                </div>

                <div className="inference-log-meta">
                  <span>Endpoint: {log.source_endpoint}</span>
                  <span>Detections: {log.detection_count}</span>
                  <span>Inference time: {log.inference_time_ms.toFixed(2)} ms</span>
                  <span>Threshold: {(log.confidence_threshold * 100).toFixed(0)}%</span>
                  {log.class_filter && <span>Class filter: {log.class_filter}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {detectionLogs.length > 0 && (
          <div className="detection-history">
            <h3>Recent Detection History</h3>

            {detectionLogs.map((detection, index) => (
              <div className="detection-log-item" key={`${detection.filename}-${detection.created_at}-${index}`}>
                <div>
                  <strong>{detection.class_name}</strong>
                  <p>{new Date(detection.created_at).toLocaleString()}</p>
                  <p>{detection.filename}</p>
                </div>

                <div className="detection-log-meta">
                  <span>Confidence: {(detection.confidence * 100).toFixed(1)}%</span>
                  <span>Threshold: {(detection.confidence_threshold * 100).toFixed(0)}%</span>
                  <span>Source: {detection.source_endpoint}</span>
                  {detection.class_filter && <span>Filter: {detection.class_filter}</span>}
                  <span>
                    Box: x1 {detection.bbox.x1}, y1 {detection.bbox.y1}, x2 {detection.bbox.x2}, y2 {detection.bbox.y2}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>1. Upload Image</h2>

        <input
          className="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isBusy}
        />

        {selectedFile && (
          <p className="selected-file">
            Selected: <strong>{selectedFile.name}</strong>
          </p>
        )}

        <div className="button-row">
          <button onClick={handleUpload} disabled={isBusy || !selectedFile}>
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </button>

          <button
            className="secondary-button"
            onClick={handleDetection}
            disabled={!uploadResult || isBusy}
          >
            {isDetecting ? 'Detecting...' : 'Run YOLO Detection'}
          </button>
        </div>

        <div className="button-row media-history-actions">
          <button
            className="secondary-button"
            onClick={handleLoadMediaFiles}
            disabled={isBusy}
          >
            {isLoadingMediaFiles ? 'Loading media history...' : 'Load Uploaded Media History'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      {mediaFiles.length > 0 && (
        <section className="card media-history">
          <h2>Uploaded Media History</h2>

          {mediaFiles.map((mediaFile) => {
            const mediaUrl = `/api${mediaFile.file_url}`

            return (
              <div className="media-log-item" key={mediaFile.stored_filename}>
                <div>
                  <strong>{mediaFile.original_filename}</strong>
                  <p>{new Date(mediaFile.created_at).toLocaleString()}</p>
                  <p>
                    {mediaFile.width}px × {mediaFile.height}px · {mediaFile.content_type}
                  </p>
                  <p className="stored-name">{mediaFile.stored_filename}</p>
                </div>

                <div className="output-actions">
                  <button
                    className="history-use-button"
                    onClick={() => handleUseMediaFile(mediaFile)}
                    disabled={isBusy}
                  >
                    Use this image
                  </button>

                  <a href={mediaUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                  <a href={mediaUrl} download={mediaFile.original_filename}>
                    Download
                  </a>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {(uploadResult || videoUploadResult) && (
        <section className="card command-card">
          <h2>Command Box</h2>
          <p className="small-note">
            Use preset buttons or type commands manually. Object-specific presets appear after YOLO detects classes.
          </p>

          <div className="smart-command-presets">
            <div className="command-preset-group">
              <h3>General commands</h3>
              <p className="small-note">
                These commands work after uploading the required media type.
              </p>

              <div className="preset-button-grid">
                {generalCommandPresets.map((preset) => {
                  const requiresImage = preset.target === 'image'
                  const requiresVideo = preset.target === 'video'
                  const disabled =
                    isBusy ||
                    (requiresImage && !uploadResult) ||
                    (requiresVideo && !videoUploadResult)

                  return (
                    <button
                      key={preset.command}
                      className="preset-button"
                      type="button"
                      onClick={() => setCommandText(preset.command)}
                      disabled={disabled}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="command-preset-group">
              <h3>Detected object commands</h3>
              <p className="small-note">
                These presets are generated from detected object classes. Run detection first.
              </p>

              {detectedObjectCommandPresets.length > 0 ? (
                <div className="preset-button-grid">
                  {detectedObjectCommandPresets.map((preset) => (
                    <button
                      key={preset.command}
                      className="preset-button"
                      type="button"
                      onClick={() => setCommandText(preset.command)}
                      disabled={isBusy || !uploadResult}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="empty-preset-note">
                  No detected classes yet. Upload an image and run YOLO detection to generate object presets.
                </p>
              )}
            </div>
          </div>

          <div className="parser-mode-selector">
            <label htmlFor="parser-mode">
              Parser mode
            </label>

            <select
              id="parser-mode"
              value={selectedParserMode}
              onChange={(event) => {
                const nextParserMode = event.target.value as 'rule_based' | 'llm_mock' | 'real_llm'

                setSelectedParserMode(nextParserMode)

                if (
                  nextParserMode === 'real_llm' &&
                  !llmProviderStatusResult &&
                  !isLoadingLlmProviderStatus
                ) {
                  void handleLoadLlmProviderStatus()
                }
              }}
              disabled={isBusy}
            >
              <option value="rule_based">rule_based</option>
              <option value="llm_mock">llm_mock</option>
              <option value="real_llm">real_llm</option>
            </select>

            <div className="parser-provider-status-badge">
              <span>
                Provider:{' '}
                <strong>
                  {isLoadingLlmProviderStatus
                    ? 'checking...'
                    : llmProviderStatusResult?.provider_name ?? 'not loaded'}
                </strong>
              </span>

              <span>
                Real LLM:{' '}
                <strong>
                  {isLoadingLlmProviderStatus
                    ? 'checking...'
                    : llmProviderStatusResult
                      ? llmProviderStatusResult.real_llm_available
                        ? 'available'
                        : 'unavailable'
                      : 'unknown'}
                </strong>
              </span>
            </div>

            <p className="small-note">
              `llm_mock` uses the current rule-based parser internally, while `real_llm` uses the configured local Ollama/OpenAI provider.
              {isRealLlmProviderStatusLoading && (
                <div className="real-llm-warning">
                  <strong>Checking real LLM provider status</strong>
                  <p>
                    The app is checking whether a configured Ollama/OpenAI provider is available.
                  </p>
                </div>
              )}

              {isRealLlmProviderStatusUnknown && (
                <div className="real-llm-warning">
                  <strong>Real LLM provider status not loaded</strong>
                  <p>
                    <code>real_llm</code> is selected. Load LLM provider status or the LLMOps dashboard to check whether Ollama/OpenAI is available.
                  </p>
                </div>
              )}

              {isRealLlmUnavailable && (
                <div className="real-llm-warning">
                  <strong>Real LLM unavailable</strong>
                  <p>
                    <code>real_llm</code> is selected, but no configured Ollama/OpenAI provider is currently available.
                    Use <code>rule_based</code> or <code>llm_mock</code>, or configure a real LLM provider.
                  </p>
                </div>
              )}

              {selectedParserMode === 'real_llm' && (
                <span className="parser-mode-warning">
                  Real LLM evaluation requires a configured provider. Use local Ollama setup or OpenAI before evaluating this mode.
                </span>
              )}
            </p>
          </div>

          <div className="command-row">
            <input
              className="command-input"
              type="text"
              value={commandText}
              placeholder="Type a command, for example: crop person or extract frame at 1 second"
              onChange={(event) => {
                setCommandText(event.target.value)
                setCommandParseResult(null)
              }}
              disabled={isBusy}
            />

            <button
              className="secondary-button"
              onClick={handleParseCommand}
              disabled={isBusy || !commandText.trim() || isRealLlmActionBlocked}
            >
              {isParsingCommand ? 'Parsing...' : 'Parse Command'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadPromptPreview}
              disabled={isBusy || !commandText.trim()}
            >
              {isLoadingPromptPreview ? 'Loading prompt...' : 'Preview LLM Prompt'}
            </button>

            <button onClick={handleCommand} disabled={isBusy || !commandText.trim() || isRealLlmActionBlocked}>
              {isRunningCommand ? 'Running...' : 'Run Command'}
            </button>

            <button
              className="voice-button"
              onClick={handleVoiceCommand}
              disabled={isBusy}
            >
              {isListening ? 'Listening...' : 'Voice Command'}
            </button>
          </div>

          {isRealLlmActionBlocked && (
            <div className="real-llm-warning">
              <strong>Real LLM actions are disabled</strong>
              <p>
                Load provider status first. If no provider is available, use <code>rule_based</code> or <code>llm_mock</code>, or configure Ollama/OpenAI.
              </p>

              <div className="real-llm-warning-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSelectedParserMode('rule_based')}
                >
                  Use rule_based
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSelectedParserMode('llm_mock')}
                >
                  Use llm_mock
                </button>
              </div>
            </div>
          )}

          <div className="button-row command-history-actions">
            <label className="command-history-filter">
              Command history parser
              <select
                value={commandHistoryParserModeFilter}
                onChange={(event) => setCommandHistoryParserModeFilter(event.target.value)}
                disabled={isBusy}
              >
                <option value="all">all</option>
                <option value="rule_based">rule_based</option>
                <option value="llm_mock">llm_mock</option>
                <option value="real_llm">real_llm</option>
              </select>
            </label>

            <label className="command-history-filter">
              Command history result type
              <select
                value={commandHistoryResultTypeFilter}
                onChange={(event) => setCommandHistoryResultTypeFilter(event.target.value)}
                disabled={isBusy}
              >
                <option value="all">all</option>
                <option value="annotated_detection">annotated_detection</option>
                <option value="crop_by_class">crop_by_class</option>
                <option value="blur_by_class">blur_by_class</option>
                <option value="blur_all_by_class">blur_all_by_class</option>
                <option value="extract_frame">extract_frame</option>
                <option value="extract_frames">extract_frames</option>
                <option value="detect_frames">detect_frames</option>
                <option value="track_video">track_video</option>
                <option value="trim_video">trim_video</option>
              </select>
            </label>

            <label className="command-history-filter">
              Command history limit
              <select
                value={commandHistoryLimit}
                onChange={(event) => setCommandHistoryLimit(event.target.value)}
                disabled={isBusy}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>

            <button
              className="secondary-button"
              onClick={handleLoadCommandLogs}
              disabled={isBusy}
            >
              {isLoadingLogs ? 'Loading history...' : 'Load Command History'}
            </button>

            <button
              className="secondary-button"
              onClick={handleExportCommandLogs}
              disabled={isBusy}
            >
              Export Command History CSV
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadCommandLogSummary}
              disabled={isBusy || isLoadingCommandLogSummary}
            >
              {isLoadingCommandLogSummary ? 'Loading summary...' : 'Load Command Summary'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadCommandEvaluation}
              disabled={isBusy || isRealLlmActionBlocked}
            >
              {isLoadingCommandEvaluation ? 'Loading evaluation...' : 'Load Parser Evaluation'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadParserComparison}
              disabled={isBusy}
            >
              {isLoadingParserComparison ? 'Loading comparison...' : 'Load Parser Comparison'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadParserAttemptLogs}
              disabled={isBusy}
            >
              {isLoadingParserAttemptLogs ? 'Loading logs...' : 'Load Parser Attempt Logs'}
            </button>

            <div className="database-parser-log-filters">
              <label>
                Parser mode
                <select
                  value={databaseParserLogParserModeFilter}
                  onChange={(event) => setDatabaseParserLogParserModeFilter(event.target.value)}
                  disabled={isBusy}
                >
                  <option value="all">All</option>
                  <option value="rule_based">rule_based</option>
                  <option value="llm_mock">llm_mock</option>
                  <option value="real_llm">real_llm</option>
                </select>
              </label>

              <label>
                Result
                <select
                  value={databaseParserLogSuccessFilter}
                  onChange={(event) => setDatabaseParserLogSuccessFilter(event.target.value)}
                  disabled={isBusy}
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </label>

              <label>
                Recent logs
                <select
                  value={databaseParserLogLimit}
                  onChange={(event) => setDatabaseParserLogLimit(event.target.value)}
                  disabled={isBusy}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </label>

            <label className="llmops-real-llm-toggle">
              <input
                type="checkbox"
                checked={includeRealLlmEvaluationInDashboard}
                onChange={(event) => setIncludeRealLlmEvaluationInDashboard(event.target.checked)}
              />
              Include real LLM evaluation
            </label>

              <button
                className="secondary-button"
                onClick={handleResetParserFilters}
                disabled={isBusy}
              >
                Reset Parser Filters
              </button>
            </div>

            <button
              className="secondary-button"
              onClick={handleLoadDatabaseParserAttemptLogs}
              disabled={isBusy}
            >
              {isLoadingDatabaseParserAttemptLogs ? 'Loading DB logs...' : 'Load DB Parser Logs'}
            </button>

            <button
              className="secondary-button"
              onClick={handleExportDatabaseParserAttemptLogs}
              disabled={isBusy}
            >
              Export DB Parser Logs
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadDatabaseParserAttemptSummary}
              disabled={isBusy}
            >
              {isLoadingDatabaseParserAttemptSummary ? 'Loading DB summary...' : 'Load DB Parser Summary'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadLlmProviderStatus}
              disabled={isBusy}
            >
              {isLoadingLlmProviderStatus ? 'Loading provider...' : 'Load LLM Provider Status'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadLlmOpsDashboard}
              disabled={isBusy}
            >
              {isLoadingLlmOpsDashboard ? 'Loading LLMOps...' : 'Load LLMOps Dashboard'}
            </button>
          </div>

          <details className="local-ollama-help-panel">
            <summary>Local Ollama Setup for real_llm</summary>

            <div className="local-ollama-help-content">
              <p>
                Use this setup to run <code>parser_mode=real_llm</code> locally without a paid API key.
              </p>

              {llmProviderStatusResult && (
                <div className="local-ollama-status-grid">
                  <div>
                    <span>Current provider</span>
                    <strong>{llmProviderStatusResult.provider_name}</strong>
                  </div>
                  <div>
                    <span>Current model</span>
                    <strong>{llmProviderStatusResult.provider_model ?? 'none'}</strong>
                  </div>
                  <div>
                    <span>Real LLM available</span>
                    <strong>{llmProviderStatusResult.real_llm_available ? 'yes' : 'no'}</strong>
                  </div>
                </div>
              )}

              <div className="local-ollama-steps">
                <div>
                  <span>1. Start Ollama</span>
                  <code>ollama serve</code>
                </div>

                <div>
                  <span>2. Pull a lightweight model</span>
                  <code>ollama pull llama3.2:1b</code>
                </div>

                <div>
                  <span>3. Start backend with Ollama</span>
                  <pre>{`export LLM_PROVIDER=ollama
export OLLAMA_BASE_URL="http://localhost:11434"
export OLLAMA_MODEL="llama3.2:1b"
uvicorn app.main:app --reload`}</pre>
                </div>

                <div>
                  <span>4. Use real LLM parser mode</span>
                  <code>parser_mode=real_llm</code>
                </div>
              </div>

              <p className="small-note">
                Tip: click “Load LLM Provider Status” after starting the backend to verify that Ollama is configured and available.
              </p>
            </div>
          </details>

          {commandPromptPreviewResult && (
            <div className="llm-prompt-preview-panel">
              <h3>LLM Prompt Preview</h3>

              <div className="prompt-metadata-grid">
                <div>
                  <span>Parser mode</span>
                  <strong>{commandPromptPreviewResult.parser_mode}</strong>
                </div>
                <div>
                  <span>Prompt version</span>
                  <strong>{commandPromptPreviewResult.prompt_version}</strong>
                </div>
              </div>

              <div className="prompt-block">
                <h4>System Prompt</h4>
                <pre>{commandPromptPreviewResult.system_prompt}</pre>
              </div>

              <div className="prompt-block">
                <h4>User Prompt</h4>
                <pre>{commandPromptPreviewResult.user_prompt}</pre>
              </div>

              <div className="prompt-block">
                <h4>Expected JSON Schema</h4>
                <pre>{JSON.stringify(commandPromptPreviewResult.expected_json_schema, null, 2)}</pre>
              </div>
            </div>
          )}

          {commandParseResult && (
            <div className="command-parse-result">
              <h3>Parsed Command Preview</h3>
              <p><strong>Original command:</strong> {commandParseResult.command}</p>
              {commandParseResult.parser_mode && (
                <p><strong>Parser mode:</strong> {commandParseResult.parser_mode}</p>
              )}
              {commandParseResult.parser_type && (
                <p><strong>Parser type:</strong> {commandParseResult.parser_type}</p>
              )}
              {commandParseResult.parser_version && (
                <p><strong>Parser version:</strong> {commandParseResult.parser_version}</p>
              )}

              <div className="parse-field-list">
                {Object.entries(commandParseResult.parsed_command).map(([key, value]) => (
                  <div className="parse-field" key={key}>
                    <span>{key}</span>
                    <strong>{value === null || value === undefined ? 'null' : String(value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {commandParseResult && (
            <div className="parsed-command-validation-panel">
              <h3>Parsed Command Validation</h3>
              <p className="small-note">
                Validate the structured JSON before it is passed to the execution layer.
              </p>

              <button
                className="secondary-button"
                onClick={handleValidateParsedCommand}
                disabled={isBusy || !commandParseResult}
              >
                {isValidatingParsedCommand ? 'Validating...' : 'Validate Parsed Command'}
              </button>

              {parsedCommandValidationResult && (
                <div className="validation-result">
                  <p><strong>Status:</strong> {parsedCommandValidationResult.status}</p>

                  <div className="parse-field-list">
                    {Object.entries(parsedCommandValidationResult.validated_command).map(([key, value]) => (
                      <div className="parse-field" key={key}>
                        <span>{key}</span>
                        <strong>{value === null || value === undefined ? 'null' : String(value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {commandResult && (
            <div className="command-result">
              <p><strong>Parser mode:</strong> {commandResult.parser_mode}</p>
              {commandResult.parser_type && (
                <p><strong>Parser type:</strong> {commandResult.parser_type}</p>
              )}
              {commandResult.parser_version && (
                <p><strong>Parser version:</strong> {commandResult.parser_version}</p>
              )}
              <p><strong>Parsed action:</strong> {commandResult.parsed_command.action}</p>
              {commandResult.parsed_command.class_name && (
                <p><strong>Parsed class:</strong> {commandResult.parsed_command.class_name}</p>
              )}
              <p><strong>Result type:</strong> {commandResult.result_type}</p>
            </div>
          )}

          {llmOpsDashboardLoaded && (
            <div className="llmops-dashboard-panel">
              <h3>LLMOps Dashboard</h3>

              {(hasLegacyCommandParserMetadata || hasLegacyParserAttemptMode) && (
                <div className="legacy-metadata-note">
                  <strong>Legacy metadata note</strong>
                  <p>
                    Some older logs may appear as <code>unknown</code> or <code>llm</code>.
                    These entries were created before parser metadata was fully standardized.
                    New command executions use <code>rule_based</code>, <code>llm_mock</code>, or <code>real_llm</code>.
                  </p>
                </div>
              )}

              {commandLogSummary && (
                <div className="llmops-command-summary">
                  <h4>Command Execution Summary</h4>

                  <div className="summary-grid">
                    <div className="summary-card">
                      <span>Total commands</span>
                      <strong>{commandLogSummary.total_commands}</strong>
                    </div>

                    <div className="summary-card">
                      <span>Parser modes used</span>
                      <strong>{commandLogSummary.by_parser_mode.length}</strong>
                    </div>

                    <div className="summary-card">
                      <span>Result types</span>
                      <strong>{commandLogSummary.by_result_type.length}</strong>
                    </div>
                  </div>

                  <div className="summary-columns">
                    <div>
                      <h5>By parser mode</h5>
                      {commandLogSummary.by_parser_mode.map((item) => (
                        <p key={item.name}>
                          <strong>{item.name}</strong>: {item.count}
                        </p>
                      ))}
                    </div>

                    <div>
                      <h5>By result type</h5>
                      {commandLogSummary.by_result_type.map((item) => (
                        <p key={item.name}>
                          <strong>{item.name}</strong>: {item.count}
                        </p>
                      ))}
                    </div>

                    <div>
                      <h5>By parsed action</h5>
                      {commandLogSummary.by_parsed_action.map((item) => (
                        <p key={item.name}>
                          <strong>{item.name}</strong>: {item.count}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}


              <div className="llmops-dashboard-grid">
                <div>
                  <span>Provider</span>
                  <strong>{llmProviderStatusResult?.provider_name ?? 'not loaded'}</strong>
                </div>
                <div>
                  <span>Model</span>
                  <strong>{llmProviderStatusResult?.provider_model ?? 'none'}</strong>
                </div>
                <div>
                  <span>Real LLM available</span>
                  <strong>{String(llmProviderStatusResult?.real_llm_available ?? false)}</strong>
                </div>
                <div>
                  <span>Total parser attempts</span>
                  <strong>{databaseParserAttemptSummaryResult?.total_attempts ?? 0}</strong>
                </div>
                <div>
                  <span>Success rate</span>
                  <strong>
                    {databaseParserAttemptSummaryResult
                      ? `${(databaseParserAttemptSummaryResult.success_rate * 100).toFixed(1)}%`
                      : '0.0%'}
                  </strong>
                </div>
                <div>
                  <span>Average latency</span>
                  <strong>
                    {databaseParserAttemptSummaryResult
                      ? `${databaseParserAttemptSummaryResult.average_latency_ms.toFixed(2)} ms`
                      : '0.00 ms'}
                  </strong>
                </div>
              </div>

              <p className="small-note">
                <strong>LLMOps active filters:</strong> parser mode = {databaseParserLogParserModeFilter}, result = {databaseParserLogSuccessFilter}, limit = {databaseParserLogLimit}, command summary parser filter = {databaseParserLogParserModeFilter}, include real LLM evaluation = {includeRealLlmEvaluationInDashboard ? 'yes' : 'no'}
              </p>

              {llmOpsParserEvaluationResult && (
                <div className="llmops-parser-evaluation-panel">
                  <h4>Parser Evaluation Quality</h4>

                  {llmOpsParserEvaluationResult.evaluations.length === 0 ? (
                    <p className="small-note">No parser evaluation results available.</p>
                  ) : (
                    <div className="llmops-parser-evaluation-list">
                      {llmOpsParserEvaluationResult.evaluations.map((evaluation) => (
                        <div key={evaluation.parser_type} className="llmops-parser-evaluation-card">
                          <div>
                            <span>Parser</span>
                            <strong>{evaluation.parser_type}</strong>
                            <small>{evaluation.parser_version}</small>
                          </div>

                          <div>
                            <span>Accuracy</span>
                            <strong>{Math.round(evaluation.accuracy * 100)}%</strong>
                          </div>

                          <div>
                            <span>Total cases</span>
                            <strong>{evaluation.total_cases}</strong>
                          </div>

                          <div>
                            <span>Passed / Failed</span>
                            <strong>{evaluation.passed_cases} / {evaluation.failed_cases}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {llmOpsParserEvaluationResult.skipped_evaluations.length > 0 && (
                    <div className="llmops-skipped-evaluations">
                      <h5>Skipped parser evaluations</h5>
                      {llmOpsParserEvaluationResult.skipped_evaluations.map((skipped) => (
                        <div key={skipped.parser_mode} className="llmops-skipped-evaluation-card">
                          <strong>{skipped.parser_mode}</strong>
                          <span>{skipped.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="small-note">
                This dashboard combines provider status, PostgreSQL parser summary, and recent PostgreSQL parser logs.
              </p>
            </div>
          )}

          {llmProviderStatusResult && (
            <div className="llm-provider-status-panel">
              <h3>LLM Provider Status</h3>

              <div className="provider-status-grid">
                <div>
                  <span>provider_name</span>
                  <strong>{llmProviderStatusResult.provider_name}</strong>
                </div>
                <div>
                  <span>provider_model</span>
                  <strong>{llmProviderStatusResult.provider_model ?? 'none'}</strong>
                </div>
                <div>
                  <span>is_supported</span>
                  <strong>{String(llmProviderStatusResult.is_supported)}</strong>
                </div>
                <div>
                  <span>is_configured</span>
                  <strong>{String(llmProviderStatusResult.is_configured)}</strong>
                </div>
                <div>
                  <span>real_llm_available</span>
                  <strong>{String(llmProviderStatusResult.real_llm_available)}</strong>
                </div>
              </div>

              <div className="provider-mode-list">
                <span>Supported LLM providers</span>
                <div>
                  {llmProviderStatusResult.supported_llm_providers.map((provider) => (
                    <strong key={provider}>{provider}</strong>
                  ))}
                </div>
              </div>

              <div className="provider-mode-list">
                <span>Supported parser modes</span>
                <div>
                  {llmProviderStatusResult.supported_parser_modes.map((mode) => (
                    <strong key={mode}>{mode}</strong>
                  ))}
                </div>
              </div>

              {!llmProviderStatusResult.is_supported && (
                <p className="small-note">
                  The selected LLM provider is not supported by this backend yet.
                </p>
              )}

              {llmProviderStatusResult.is_supported && !llmProviderStatusResult.real_llm_available && (
                <p className="small-note">
                  Real LLM parsing is not configured yet. This is expected until an external provider is added.
                </p>
              )}
            </div>
          )}

          {databaseParserAttemptSummaryResult && (
            <div className="database-parser-attempt-summary-panel">
              <h3>PostgreSQL Parser Attempt Summary</h3>

              <div className="database-parser-summary-grid">
                <div>
                  <span>Status</span>
                  <strong>{databaseParserAttemptSummaryResult.status}</strong>
                </div>
                <div>
                  <span>Total attempts</span>
                  <strong>{databaseParserAttemptSummaryResult.total_attempts}</strong>
                </div>
                <div>
                  <span>Successful</span>
                  <strong>{databaseParserAttemptSummaryResult.successful_attempts}</strong>
                </div>
                <div>
                  <span>Failed</span>
                  <strong>{databaseParserAttemptSummaryResult.failed_attempts}</strong>
                </div>
                <div>
                  <span>Success rate</span>
                  <strong>{(databaseParserAttemptSummaryResult.success_rate * 100).toFixed(1)}%</strong>
                </div>
                <div>
                  <span>Average latency</span>
                  <strong>{databaseParserAttemptSummaryResult.average_latency_ms.toFixed(2)} ms</strong>
                </div>
              </div>

              <p className="small-note">
                <strong>Summary active filters:</strong> parser mode = {databaseParserLogParserModeFilter}, result = {databaseParserLogSuccessFilter}, limit = {databaseParserLogLimit}
              </p>

              <div className="database-parser-breakdown-section">
                <h4>By parser mode</h4>
                {databaseParserAttemptSummaryResult.by_parser_mode.length === 0 ? (
                  <p className="small-note">No parser mode summary available.</p>
                ) : (
                  <div className="database-parser-breakdown-list">
                    {databaseParserAttemptSummaryResult.by_parser_mode.map((item) => (
                      <div key={item.parser_mode ?? 'unknown'} className="database-parser-breakdown-card">
                        <strong>{item.parser_mode ?? 'unknown'}</strong>
                        <span>{item.attempts} attempt(s)</span>
                        <span>{item.successful_attempts} success / {item.failed_attempts} failed</span>
                        <span>{item.average_latency_ms.toFixed(2)} ms avg</span>
                        <div className="database-parser-breakdown-bar mode-bar">
                          <div
                            style={{
                              width: `${Math.max(
                                4,
                                Math.round(
                                  (item.attempts /
                                    Math.max(
                                      ...databaseParserAttemptSummaryResult.by_parser_mode.map(
                                        (modeItem) => modeItem.attempts
                                      ),
                                      1
                                    )) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="database-parser-breakdown-section">
                <h4>By parser type</h4>
                {databaseParserAttemptSummaryResult.by_parser_type.length === 0 ? (
                  <p className="small-note">No parser type summary available.</p>
                ) : (
                  <div className="database-parser-breakdown-list">
                    {databaseParserAttemptSummaryResult.by_parser_type.map((item) => (
                      <div key={item.parser_type ?? 'unknown'} className="database-parser-breakdown-card">
                        <strong>{item.parser_type ?? 'unknown'}</strong>
                        <span>{item.attempts} attempt(s)</span>
                        <span>{item.successful_attempts} success / {item.failed_attempts} failed</span>
                        <span>{item.average_latency_ms.toFixed(2)} ms avg</span>
                        <div className="database-parser-breakdown-bar type-bar">
                          <div
                            style={{
                              width: `${Math.max(
                                4,
                                Math.round(
                                  (item.attempts /
                                    Math.max(
                                      ...databaseParserAttemptSummaryResult.by_parser_type.map(
                                        (typeItem) => typeItem.attempts
                                      ),
                                      1
                                    )) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="database-parser-breakdown-section">
                <h4>By parser error</h4>
                {databaseParserAttemptSummaryResult.by_error.length === 0 ? (
                  <p className="small-note">No parser errors found for the current filters.</p>
                ) : (
                  <div className="database-parser-error-list">
                    {databaseParserAttemptSummaryResult.by_error.map((item) => (
                      <div key={item.error} className="database-parser-error-card">
                        <strong>{item.error}</strong>
                        <span>{item.attempts} attempt(s)</span>
                        <span>{item.average_latency_ms.toFixed(2)} ms avg</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {databaseParserAttemptLogsResult && (
            <div className="database-parser-attempt-logs-panel">
              <h3>PostgreSQL Parser Attempt Logs</h3>

              <div className="database-parser-log-summary">
                <div>
                  <span>Status</span>
                  <strong>{databaseParserAttemptLogsResult.status}</strong>
                </div>
                <div>
                  <span>Count</span>
                  <strong>{databaseParserAttemptLogsResult.count}</strong>
                </div>
              </div>

              <p className="small-note">
                Active filters: parser mode = {databaseParserLogParserModeFilter}, result = {databaseParserLogSuccessFilter}, limit = {databaseParserLogLimit}
              </p>

              {databaseParserAttemptLogsResult.logs.length === 0 ? (
                <p className="small-note">No PostgreSQL parser attempt logs found yet.</p>
              ) : (
                <div className="database-parser-log-list">
                  {databaseParserAttemptLogsResult.logs.map((log, index) => (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className={`database-parser-log-card ${log.success ? 'success' : 'failure'}`}
                    >
                      <div className="database-parser-log-header">
                        <strong>{log.command}</strong>
                        <span>{log.success ? 'Success' : 'Failed'}</span>
                      </div>

                      <p>
                        <strong>Parser mode:</strong> {log.parser_mode}
                      </p>
                      <p>
                        <strong>Parser type:</strong> {log.parser_type ?? 'none'}
                      </p>
                      <p>
                        <strong>Parser version:</strong> {log.parser_version ?? 'none'}
                      </p>
                      <p>
                        <strong>Latency:</strong> {log.latency_ms.toFixed(2)} ms
                      </p>
                      <p>
                        <strong>Timestamp:</strong> {log.timestamp}
                      </p>

                      {log.error && (
                        <p className="database-parser-log-error">
                          <strong>Error:</strong> {log.error}
                        </p>
                      )}

                      {log.parsed_command && (
                        <pre>{JSON.stringify(log.parsed_command, null, 2)}</pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {parserAttemptLogsResult && (
            <div className="parser-attempt-logs-panel">
              <h3>Parser Attempt Logs</h3>

              {parserAttemptLogsResult.logs.length === 0 ? (
                <p className="small-note">No parser attempts logged yet.</p>
              ) : (
                <div className="parser-attempt-log-list">
                  {parserAttemptLogsResult.logs.map((log, index) => (
                    <div
                      className={`parser-attempt-log-card ${log.success ? 'success' : 'failure'}`}
                      key={`${log.timestamp}-${index}`}
                    >
                      <div className="parser-attempt-log-header">
                        <strong>{log.command}</strong>
                        <span>{log.success ? 'Success' : 'Failed'}</span>
                      </div>

                      <div className="parse-field-list">
                        <div className="parse-field">
                          <span>parser_mode</span>
                          <strong>{log.parser_mode}</strong>
                        </div>
                        <div className="parse-field">
                          <span>parser_type</span>
                          <strong>{log.parser_type ?? 'null'}</strong>
                        </div>
                        <div className="parse-field">
                          <span>parser_version</span>
                          <strong>{log.parser_version ?? 'null'}</strong>
                        </div>
                        <div className="parse-field">
                          <span>latency_ms</span>
                          <strong>{log.latency_ms}</strong>
                        </div>
                      </div>

                      {log.parsed_command && (
                        <div className="prompt-block">
                          <h4>Parsed Command</h4>
                          <pre>{JSON.stringify(log.parsed_command, null, 2)}</pre>
                        </div>
                      )}

                      {log.error && (
                        <div className="parser-attempt-error">
                          <strong>Error:</strong> {log.error}
                        </div>
                      )}

                      <p className="small-note">Timestamp: {log.timestamp}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {parserComparisonResult && (
            <div className="parser-comparison-panel">
              <h3>Parser Comparison Results</h3>

              <div className="parser-comparison-grid">
                {parserComparisonResult.evaluations.map((evaluation) => (
                  <div className="parser-comparison-card" key={evaluation.parser_type}>
                    <h4>{evaluation.parser_type}</h4>
                    <p><strong>Version:</strong> {evaluation.parser_version}</p>
                    <p><strong>Total cases:</strong> {evaluation.total_cases}</p>
                    <p><strong>Passed:</strong> {evaluation.passed_cases}</p>
                    <p><strong>Failed:</strong> {evaluation.failed_cases}</p>
                    <p><strong>Accuracy:</strong> {(evaluation.accuracy * 100).toFixed(1)}%</p>
                  </div>
                ))}
              {parserComparisonResult.skipped_evaluations &&
                parserComparisonResult.skipped_evaluations.length > 0 && (
                  <div className="parser-comparison-skipped">
                    <h4>Skipped parser modes</h4>
                    {parserComparisonResult.skipped_evaluations.map((skipped) => (
                      <div key={skipped.parser_mode} className="parser-comparison-skipped-card">
                        <strong>{skipped.parser_mode}</strong>
                        <span>{skipped.reason}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

          {commandEvaluationResult && (
            <div className="parser-evaluation-panel">
              <h3>Parser Evaluation Results</h3>

              <div className="parser-evaluation-summary">
                <div>
                  <span>Parser</span>
                  <strong>{commandEvaluationResult.parser_type}</strong>
                </div>
                <div>
                  <span>Version</span>
                  <strong>{commandEvaluationResult.parser_version}</strong>
                </div>
                <div>
                  <span>Total cases</span>
                  <strong>{commandEvaluationResult.total_cases}</strong>
                </div>
                <div>
                  <span>Passed</span>
                  <strong>{commandEvaluationResult.passed_cases}</strong>
                </div>
                <div>
                  <span>Failed</span>
                  <strong>{commandEvaluationResult.failed_cases}</strong>
                </div>
                <div>
                  <span>Accuracy</span>
                  <strong>{(commandEvaluationResult.accuracy * 100).toFixed(1)}%</strong>
                </div>
              </div>

              <div className="parser-evaluation-list">
                {commandEvaluationResult.results.map((result) => (
                  <div
                    className={result.passed ? 'evaluation-item passed' : 'evaluation-item failed'}
                    key={result.command}
                  >
                    <div>
                      <strong>{result.command}</strong>
                      <p>{result.passed ? 'Passed' : 'Failed'}</p>
                    </div>

                    <div>
                      <span>Expected: {result.expected.action}</span>
                      <span>Actual: {result.actual?.action ?? 'none'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {commandLogSummary && (
            <div className="command-history-summary">
              <h3>Command History Summary</h3>

              <div className="summary-grid">
                <div className="summary-card">
                  <span>Total commands</span>
                  <strong>{commandLogSummary.total_commands}</strong>
                </div>

                <div className="summary-card">
                  <span>Parser modes</span>
                  <strong>{commandLogSummary.by_parser_mode.length}</strong>
                </div>

                <div className="summary-card">
                  <span>Result types</span>
                  <strong>{commandLogSummary.by_result_type.length}</strong>
                </div>
              </div>

              <div className="summary-columns">
                <div>
                  <h4>By parser mode</h4>
                  {commandLogSummary.by_parser_mode.map((item) => (
                    <p key={item.name}>
                      <strong>{item.name}</strong>: {item.count}
                    </p>
                  ))}
                </div>

                <div>
                  <h4>By result type</h4>
                  {commandLogSummary.by_result_type.map((item) => (
                    <p key={item.name}>
                      <strong>{item.name}</strong>: {item.count}
                    </p>
                  ))}
                </div>

                <div>
                  <h4>By parsed action</h4>
                  {commandLogSummary.by_parsed_action.map((item) => (
                    <p key={item.name}>
                      <strong>{item.name}</strong>: {item.count}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasLoadedCommandLogs && (
            <div className="command-history">
              <h3>Recent Command History</h3>

              {commandLogs.length === 0 && (
                <p className="empty-state">
                  No command logs found for the selected parser filter. Run a command with this parser mode, then load command history again.
                </p>
              )}

              {commandLogs.map((log, index) => (
                <div className="command-log-item" key={`${log.timestamp}-${index}`}>
                  <div>
                    <strong>{log.command}</strong>
                    <p>{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <span>{log.parsed_action}</span>
                    {log.parsed_class && <span> · {log.parsed_class}</span>}
                    {log.parser_mode && <span> · parser: {log.parser_mode}</span>}
                    {log.parser_version && <span> · {log.parser_version}</span>}
                    <span> · {(log.confidence_threshold * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="card">
        <h2>Video Upload Foundation</h2>
        <p className="small-note">
          Upload a video file and preview it from the backend. Video detection and trimming will come later.
        </p>

        <input
          className="file-input"
          type="file"
          accept="video/*"
          onChange={handleVideoFileChange}
          disabled={isBusy}
        />

        {selectedVideoFile && (
          <p className="selected-file">
            Selected video: <strong>{selectedVideoFile.name}</strong>
          </p>
        )}

        <div className="button-row">
          <button onClick={handleVideoUpload} disabled={isBusy || !selectedVideoFile}>
            {isUploadingVideo ? 'Uploading video...' : 'Upload Video'}
          </button>
        </div>
      </section>

      {videoUploadResult && (
        <>
          <section className="result-grid">
            <div className="card">
              <h2>Video Upload Result</h2>
              <div className="metadata-list">
                <p><strong>Original filename:</strong> {videoUploadResult.original_filename}</p>
                <p><strong>Stored filename:</strong> {videoUploadResult.stored_filename}</p>
                <p><strong>Content type:</strong> {videoUploadResult.content_type}</p>
                <p><strong>File size:</strong> {videoUploadResult.file_size_bytes} bytes</p>
                <p><strong>Readable:</strong> {videoUploadResult.metadata.is_readable ? 'Yes' : 'No'}</p>
                <p><strong>Width:</strong> {videoUploadResult.metadata.width ?? 'Unknown'}</p>
                <p><strong>Height:</strong> {videoUploadResult.metadata.height ?? 'Unknown'}</p>
                <p><strong>FPS:</strong> {videoUploadResult.metadata.fps ?? 'Unknown'}</p>
                <p><strong>Frame count:</strong> {videoUploadResult.metadata.frame_count ?? 'Unknown'}</p>
                <p><strong>Duration:</strong> {videoUploadResult.metadata.duration_seconds ? `${videoUploadResult.metadata.duration_seconds}s` : 'Unknown'}</p>
              </div>
            </div>

            <div className="card">
              <h2>Video Preview</h2>
              {uploadedVideoUrl && videoUploadResult && (
                <>
                  <video className="preview-video" src={uploadedVideoUrl} controls />

                  <div className="output-actions">
                    <a href={uploadedVideoUrl} target="_blank" rel="noreferrer">
                      Open video
                    </a>
                    <a href={uploadedVideoUrl} download={videoUploadResult.original_filename}>
                      Download video
                    </a>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="card video-trim-card">
            <h2>Trim Video</h2>
            <p className="small-note">
              Select a start and end time in seconds. The backend will create a browser-playable trimmed MP4.
            </p>

            <div className="trim-input-grid">
              <label>
                Start seconds
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={trimStartSeconds}
                  onChange={(event) => setTrimStartSeconds(Number(event.target.value))}
                  disabled={isBusy}
                />
              </label>

              <label>
                End seconds
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={trimEndSeconds}
                  onChange={(event) => setTrimEndSeconds(Number(event.target.value))}
                  disabled={isBusy}
                />
              </label>
            </div>

            <button onClick={handleVideoTrim} disabled={isBusy || !videoUploadResult}>
              {isTrimmingVideo ? 'Trimming video...' : 'Trim Video'}
            </button>
          </section>
        </>
      )}

      {uploadResult && (
        <section className="result-grid">
          <div className="card">
            <h2>2. Upload Result</h2>
            <div className="metadata-list">
              <p><strong>Original filename:</strong> {uploadResult.original_filename}</p>
              <p><strong>Stored filename:</strong> {uploadResult.stored_filename}</p>
              <p><strong>Content type:</strong> {uploadResult.content_type}</p>
              <p><strong>Width:</strong> {uploadResult.width}px</p>
              <p><strong>Height:</strong> {uploadResult.height}px</p>
            </div>
          </div>

          <div className="card">
            <h2>Original Preview</h2>
            {uploadedImageUrl && (
              <>
                <img
                  className="preview-image"
                  src={uploadedImageUrl}
                  alt={uploadResult.original_filename}
                />

                <div className="output-actions">
                  <a href={uploadedImageUrl} target="_blank" rel="noreferrer">
                    Open original
                  </a>
                  <a href={uploadedImageUrl} download={uploadResult.original_filename}>
                    Download original
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {detectionResult && (
        <section className="result-grid">
          <div className="card">
            <h2>3. Detection Result</h2>

            <div className="summary-box">
              <p><strong>Total detections:</strong> {detectionResult.detection_count}</p>
              <p><strong>Visible after filter:</strong> {filteredDetections.length}</p>
              <p><strong>Annotated filename:</strong> {detectionResult.annotated_filename}</p>
            </div>

            <div className="filter-box">
              <label htmlFor="confidence-threshold">
                Confidence threshold: <strong>{confidenceThreshold}%</strong>
              </label>
              <input
                id="confidence-threshold"
                type="range"
                min="0"
                max="100"
                step="5"
                value={confidenceThreshold}
                onChange={(event) => setConfidenceThreshold(Number(event.target.value))}
              />
              <div className="filter-hints">
                <span>Show more</span>
                <span>Show stronger detections</span>
              </div>

              {filtersChangedAfterDetection && (
                <p className="rerun-hint">
                  Filter changed. Run YOLO Detection again to update the annotated image.
                </p>
              )}
            </div>

            <div className="filter-box">
              <label htmlFor="class-filter">
                Class filter
              </label>
              <select
                id="class-filter"
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
              >
                <option value="all">All classes</option>
                {availableClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>

              <button
                className="class-crop-button"
                onClick={handleCropByClass}
                disabled={isBusy || selectedClass === 'all'}
              >
                {isCropping ? 'Cropping...' : 'Crop best selected class'}
              </button>

              {selectedClass === 'all' && (
                <p className="small-note">
                  Select a specific class to crop the best object of that class.
                </p>
              )}
            </div>

            {filteredDetections.length > 0 ? (
              <div className="detections-list">
                {filteredDetections.map((detection, index) => (
                  <div className="detection-item" key={`${detection.class_name}-${index}`}>
                    <div className="detection-header">
                      <strong>{index + 1}. {detection.class_name}</strong>
                      <span className="confidence-badge">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <span>
                      Box: x1 {detection.bbox.x1}, y1 {detection.bbox.y1}, x2 {detection.bbox.x2}, y2 {detection.bbox.y2}
                    </span>
                    <div className="detection-actions">
                      <button
                        className="crop-button"
                        onClick={() => handleCrop(detection)}
                        disabled={isBusy}
                      >
                        {isCropping ? 'Cropping...' : 'Crop this object'}
                      </button>

                      <button
                        className="blur-button"
                        onClick={() => handleBlur(detection)}
                        disabled={isBusy}
                      >
                        {isBlurring ? 'Blurring...' : 'Blur this object'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No detections match the selected confidence threshold and class filter.</p>
            )}
          </div>

          <div className="card">
            <h2>Annotated Output</h2>
            <p className="small-note">
              The annotated image is generated using the selected confidence threshold and class filter.
            </p>
            {annotatedImageUrl && detectionResult && (
              <>
                <img
                  className="preview-image"
                  src={annotatedImageUrl}
                  alt="YOLO annotated output"
                />

                <div className="output-actions">
                  <a href={annotatedImageUrl} target="_blank" rel="noreferrer">
                    Open annotated
                  </a>
                  <a href={annotatedImageUrl} download={detectionResult.annotated_filename}>
                    Download annotated
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {cropResult && (
        <section className="result-grid">
          <div className="card">
            <h2>4. Crop Result</h2>
            <div className="summary-box">
              {cropResult.class_name && (
                <p><strong>Crop by class:</strong> {cropResult.class_name}</p>
              )}

              {cropResult.selected_detection && (
                <p>
                  <strong>Selected confidence:</strong> {(cropResult.selected_detection.confidence * 100).toFixed(1)}%
                </p>
              )}

              <p><strong>Cropped filename:</strong> {cropResult.cropped_filename}</p>
              <p>
                <strong>Crop box:</strong> x1 {cropResult.crop_box.x1}, y1 {cropResult.crop_box.y1}, x2 {cropResult.crop_box.x2}, y2 {cropResult.crop_box.y2}
              </p>
            </div>
          </div>

          <div className="card">
            <h2>Cropped Output</h2>
            {croppedImageUrl && cropResult && (
              <>
                <img
                  className="preview-image"
                  src={croppedImageUrl}
                  alt="Cropped object output"
                />

                <div className="output-actions">
                  <a href={croppedImageUrl} target="_blank" rel="noreferrer">
                    Open crop
                  </a>
                  <a href={croppedImageUrl} download={cropResult.cropped_filename}>
                    Download crop
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {blurResult && (
        <section className="result-grid">
          <div className="card">
            <h2>5. Blur Result</h2>
            <div className="summary-box">
              <p><strong>Blurred filename:</strong> {blurResult.blurred_filename}</p>
              <p>
                <strong>Blur box:</strong> x1 {blurResult.blur_box.x1}, y1 {blurResult.blur_box.y1}, x2 {blurResult.blur_box.x2}, y2 {blurResult.blur_box.y2}
              </p>
            </div>
          </div>

          <div className="card">
            <h2>Blurred Output</h2>
            {blurredImageUrl && blurResult && (
              <>
                <img
                  className="preview-image"
                  src={blurredImageUrl}
                  alt="Blurred object output"
                />

                <div className="output-actions">
                  <a href={blurredImageUrl} target="_blank" rel="noreferrer">
                    Open blurred
                  </a>
                  <a href={blurredImageUrl} download={blurResult.blurred_filename}>
                    Download blurred
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}
      {videoUploadResult && (
        <section className="card video-frame-card">
          <h2>Extract Video Frame</h2>
          <p className="small-note">
            Select a timestamp in seconds. The backend will extract that video frame as an image.
          </p>

          <div className="trim-input-grid">
            <label>
              Timestamp seconds
              <input
                type="number"
                min="0"
                step="0.1"
                value={frameTimestampSeconds}
                onChange={(event) => setFrameTimestampSeconds(Number(event.target.value))}
                disabled={isBusy}
              />
            </label>
          </div>

          <button onClick={handleExtractVideoFrame} disabled={isBusy || !videoUploadResult}>
            {isExtractingFrame ? 'Extracting frame...' : 'Extract Frame'}
          </button>
        </section>
      )}

      {videoUploadResult && (
        <section className="card video-multiframe-card">
          <h2>Extract Multiple Frames</h2>
          <p className="small-note">
            Select a start time, end time, and interval. The backend will extract a frame gallery.
          </p>

          <div className="trim-input-grid">
            <label>
              Start seconds
              <input
                type="number"
                min="0"
                step="0.1"
                value={multiFrameStartSeconds}
                onChange={(event) => setMultiFrameStartSeconds(Number(event.target.value))}
                disabled={isBusy}
              />
            </label>

            <label>
              End seconds
              <input
                type="number"
                min="0"
                step="0.1"
                value={multiFrameEndSeconds}
                onChange={(event) => setMultiFrameEndSeconds(Number(event.target.value))}
                disabled={isBusy}
              />
            </label>

            <label>
              Interval seconds
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={multiFrameIntervalSeconds}
                onChange={(event) => setMultiFrameIntervalSeconds(Number(event.target.value))}
                disabled={isBusy}
              />
            </label>
          </div>

          <button
            onClick={handleExtractMultipleVideoFrames}
            disabled={isBusy || !videoUploadResult}
          >
            {isExtractingMultipleFrames ? 'Extracting frames...' : 'Extract Multiple Frames'}
          </button>
        </section>
      )}

      {videoTrimResult && (
        <section className="result-grid">
          <div className="card">
            <h2>Trimmed Video Result</h2>
            <div className="metadata-list">
              <p><strong>Original filename:</strong> {videoTrimResult.filename}</p>
              <p><strong>Trimmed filename:</strong> {videoTrimResult.trimmed_filename}</p>
              <p><strong>Start:</strong> {videoTrimResult.start_seconds}s</p>
              <p><strong>End:</strong> {videoTrimResult.end_seconds}s</p>
              <p><strong>Trim duration:</strong> {videoTrimResult.duration_seconds}s</p>
              <p><strong>Readable:</strong> {videoTrimResult.metadata.is_readable ? 'Yes' : 'No'}</p>
              <p><strong>Width:</strong> {videoTrimResult.metadata.width ?? 'Unknown'}</p>
              <p><strong>Height:</strong> {videoTrimResult.metadata.height ?? 'Unknown'}</p>
              <p><strong>FPS:</strong> {videoTrimResult.metadata.fps ?? 'Unknown'}</p>
              <p><strong>Frame count:</strong> {videoTrimResult.metadata.frame_count ?? 'Unknown'}</p>
            </div>
          </div>

          <div className="card">
            <h2>Trimmed Video Preview</h2>
            {trimmedVideoUrl && videoTrimResult && (
              <>
                <video className="preview-video" src={trimmedVideoUrl} controls />

                <div className="output-actions">
                  <a href={trimmedVideoUrl} target="_blank" rel="noreferrer">
                    Open trimmed video
                  </a>
                  <a href={trimmedVideoUrl} download={videoTrimResult.trimmed_filename}>
                    Download trimmed video
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {videoFrameResult && (
        <section className="result-grid">
          <div className="card">
            <h2>Extracted Frame Result</h2>
            <div className="metadata-list">
              <p><strong>Original filename:</strong> {videoFrameResult.filename}</p>
              <p><strong>Frame filename:</strong> {videoFrameResult.frame_filename}</p>
              <p><strong>Timestamp:</strong> {videoFrameResult.timestamp_seconds}s</p>
              <p><strong>Frame index:</strong> {videoFrameResult.frame_index}</p>
              <p><strong>FPS:</strong> {videoFrameResult.fps}</p>
              <p><strong>Video duration:</strong> {videoFrameResult.video_duration_seconds}s</p>
            </div>
          </div>

          <div className="card">
            <h2>Extracted Frame Preview</h2>
            {extractedFrameUrl && videoFrameResult && (
              <>
                <img
                  className="preview-image"
                  src={extractedFrameUrl}
                  alt="Extracted video frame"
                />

                <div className="output-actions">
                  <a href={extractedFrameUrl} target="_blank" rel="noreferrer">
                    Open frame
                  </a>
                  <a href={extractedFrameUrl} download={videoFrameResult.frame_filename}>
                    Download frame
                  </a>
                </div>

                <button
                  className="secondary-button frame-detection-button"
                  onClick={handleDetectExtractedFrame}
                  disabled={isBusy || !videoFrameResult}
                >
                  {isDetectingFrame ? 'Detecting frame...' : 'Run YOLO on Frame'}
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {videoFrameDetectionResult && (
        <section className="result-grid">
          <div className="card">
            <h2>Video Frame Detection Result</h2>
            <div className="summary-box">
              <p><strong>Frame filename:</strong> {videoFrameDetectionResult.frame_filename}</p>
              <p><strong>Detection count:</strong> {videoFrameDetectionResult.detection_count}</p>
              <p><strong>Annotated frame:</strong> {videoFrameDetectionResult.annotated_frame_filename}</p>
            </div>

            {videoFrameDetectionResult.detections.length > 0 ? (
              <div className="detections-list">
                {videoFrameDetectionResult.detections.map((detection, index) => (
                  <div className="detection-item" key={`${detection.class_name}-${index}`}>
                    <div className="detection-header">
                      <strong>{index + 1}. {detection.class_name}</strong>
                      <span className="confidence-badge">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <span>
                      Box: x1 {detection.bbox.x1}, y1 {detection.bbox.y1}, x2 {detection.bbox.x2}, y2 {detection.bbox.y2}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No objects detected in this frame.</p>
            )}
          </div>

          <div className="card">
            <h2>Annotated Frame Preview</h2>
            {annotatedFrameUrl && videoFrameDetectionResult && (
              <>
                <img
                  className="preview-image"
                  src={annotatedFrameUrl}
                  alt="Annotated extracted video frame"
                />

                <div className="output-actions">
                  <a href={annotatedFrameUrl} target="_blank" rel="noreferrer">
                    Open annotated frame
                  </a>
                  <a href={annotatedFrameUrl} download={videoFrameDetectionResult.annotated_frame_filename}>
                    Download annotated frame
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {videoUploadResult && (
        <section className="card video-sampled-detection-card">
          <h2>Detect Sampled Video</h2>
          <p className="small-note">
            Sample frames across the full video and run YOLO detection on each sampled frame.
          </p>

          <div className="trim-input-grid">
            <label>
              Sampling interval seconds
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={sampledVideoIntervalSeconds}
                onChange={(event) => setSampledVideoIntervalSeconds(Number(event.target.value))}
                disabled={isBusy}
              />
            </label>
          </div>

          <button
            onClick={handleDetectSampledVideo}
            disabled={isBusy || !videoUploadResult}
          >
            {isDetectingSampledVideo ? 'Detecting sampled video...' : 'Detect Sampled Video'}
          </button>

          {videoUploadResult && (
        <section className="card video-tracking-card">
          <h2>Track Sampled Video</h2>
          <p className="small-note">
            Track detected objects across sampled video frames using simple centroid-based matching.
          </p>

          <div className="trim-input-grid">
            <label>
              Start seconds
              <input
                type="number"
                min="0"
                step="0.1"
                value={trackingStartSeconds}
                onChange={(event) => setTrackingStartSeconds(Number(event.target.value))}
                disabled={isBusy}
              />
            </label>

            <label>
              End seconds
              <input
                type="number"
                min="0"
                step="0.1"
                value={trackingEndSeconds}
                onChange={(event) => setTrackingEndSeconds(Number(event.target.value))}
                disabled={isBusy}
              />
            </label>

            <label>
              Interval seconds
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={trackingIntervalSeconds}
                onChange={(event) => setTrackingIntervalSeconds(Number(event.target.value))}
                disabled={isBusy}
              />
            </label>

            <label>
              Max distance pixels
              <input
                type="number"
                min="1"
                step="1"
                value={trackingMaxDistancePixels}
                onChange={(event) => setTrackingMaxDistancePixels(Number(event.target.value))}
                disabled={isBusy}
              />
            </label>
          </div>

          <button
            onClick={handleTrackSampledVideo}
            disabled={isBusy || !videoUploadResult}
          >
            {isTrackingVideo ? 'Tracking video...' : 'Track Sampled Video'}
          </button>
        </section>
      )}

      {videoSampledDetectionResult && (
            <div className="summary-box sampled-video-summary">
              <p><strong>Video:</strong> {videoSampledDetectionResult.filename}</p>
              <p><strong>Interval:</strong> {videoSampledDetectionResult.interval_seconds}s</p>
              <p><strong>Confidence threshold:</strong> {(videoSampledDetectionResult.confidence_threshold * 100).toFixed(0)}%</p>
              <p><strong>Class filter:</strong> {videoSampledDetectionResult.class_filter ?? 'All classes'}</p>
              <p><strong>Extracted frames:</strong> {videoSampledDetectionResult.extracted_frames.frame_count}</p>
              <p><strong>Detected frames:</strong> {videoSampledDetectionResult.detection.frame_count}</p>
            </div>
          )}
        </section>
      )}

      {videoMultiFrameResult && (
        <section className="card">
          <h2>Multi-Frame Extraction Result</h2>

          <div className="summary-box">
            <p><strong>Original filename:</strong> {videoMultiFrameResult.filename}</p>
            <p><strong>Start:</strong> {videoMultiFrameResult.start_seconds}s</p>
            <p><strong>End:</strong> {videoMultiFrameResult.end_seconds}s</p>
            <p><strong>Interval:</strong> {videoMultiFrameResult.interval_seconds}s</p>
            <p><strong>Extracted frames:</strong> {videoMultiFrameResult.frame_count}</p>
            <p><strong>FPS:</strong> {videoMultiFrameResult.fps}</p>
            <p><strong>Video duration:</strong> {videoMultiFrameResult.video_duration_seconds}s</p>
          </div>

          <div className="button-row multiframe-detection-actions">
            <button
              className="secondary-button"
              onClick={handleDetectMultipleVideoFrames}
              disabled={isBusy || !videoMultiFrameResult}
            >
              {isDetectingMultipleFrames ? 'Detecting frames...' : 'Run YOLO on Extracted Frames'}
            </button>
          </div>

          <div className="frame-gallery">
            {videoMultiFrameResult.frames.map((frame) => {
              const frameUrl = `/api${frame.frame_file_url}`

              return (
                <div className="frame-card" key={frame.frame_filename}>
                  <img
                    className="preview-image"
                    src={frameUrl}
                    alt={`Extracted frame at ${frame.timestamp_seconds}s`}
                  />

                  <div className="metadata-list">
                    <p><strong>Timestamp:</strong> {frame.timestamp_seconds}s</p>
                    <p><strong>Frame index:</strong> {frame.frame_index}</p>
                  </div>

                  <div className="output-actions">
                    <a href={frameUrl} target="_blank" rel="noreferrer">
                      Open frame
                    </a>
                    <a href={frameUrl} download={frame.frame_filename}>
                      Download frame
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {videoMultiFrameDetectionResult && (
        <section className="card">
          <h2>Multi-Frame Detection Result</h2>

          <div className="summary-box">
            <p><strong>Processed frames:</strong> {videoMultiFrameDetectionResult.frame_count}</p>
            <p><strong>Confidence threshold:</strong> {(videoMultiFrameDetectionResult.confidence_threshold * 100).toFixed(0)}%</p>
            <p><strong>Class filter:</strong> {videoMultiFrameDetectionResult.class_filter ?? 'All classes'}</p>
          </div>

          <div className="video-timeline">
            <h3>Video Detection Timeline</h3>

            {videoMultiFrameDetectionResult.frames.map((frame, index) => (
              <div className="timeline-item" key={`${frame.frame_filename}-timeline`}>
                <div className="timeline-index">
                  <span>{index + 1}</span>
                </div>

                <div className="timeline-content">
                  <div className="timeline-header">
                    <strong>{formatFrameTimestamp(frame.frame_filename)}</strong>
                    <span>{frame.detection_count} detection(s)</span>
                  </div>

                  <p>{getFrameClassSummary(frame.detections)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="frame-gallery">
            {videoMultiFrameDetectionResult.frames.map((frame) => {
              const annotatedFrameUrl = `/api${frame.annotated_frame_file_url}`

              return (
                <div className="frame-card" key={frame.annotated_frame_filename}>
                  <img
                    className="preview-image"
                    src={annotatedFrameUrl}
                    alt={`Annotated frame ${frame.frame_filename}`}
                  />

                  <div className="metadata-list">
                    <p><strong>Frame:</strong> {frame.frame_filename}</p>
                    <p><strong>Detections:</strong> {frame.detection_count}</p>
                  </div>

                  {frame.detections.length > 0 ? (
                    <div className="detections-list compact-detections">
                      {frame.detections.map((detection, index) => (
                        <div className="detection-item" key={`${frame.frame_filename}-${index}`}>
                          <div className="detection-header">
                            <strong>{index + 1}. {detection.class_name}</strong>
                            <span className="confidence-badge">
                              {(detection.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No objects detected in this frame.</p>
                  )}

                  <div className="output-actions">
                    <a href={annotatedFrameUrl} target="_blank" rel="noreferrer">
                      Open annotated frame
                    </a>
                    <a href={annotatedFrameUrl} download={frame.annotated_frame_filename}>
                      Download annotated frame
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {videoTrackingResult && (
        <section className="card">
          <h2>Video Tracking Result</h2>

          <div className="summary-box">
            <p><strong>Video:</strong> {videoTrackingResult.filename}</p>
            <p><strong>Frames processed:</strong> {videoTrackingResult.frame_count}</p>
            <p><strong>Tracks found:</strong> {videoTrackingResult.track_count}</p>
            <p><strong>Range:</strong> {videoTrackingResult.start_seconds}s to {videoTrackingResult.end_seconds}s</p>
            <p><strong>Interval:</strong> {videoTrackingResult.interval_seconds}s</p>
            <p><strong>Max distance:</strong> {videoTrackingResult.max_distance_pixels}px</p>
            <p><strong>Class filter:</strong> {videoTrackingResult.class_filter ?? 'All classes'}</p>
          </div>

          {videoTrackingResult.tracks.length > 0 ? (
            <div className="track-summary-list">
              <h3>Track Summary</h3>

              {videoTrackingResult.tracks.map((track) => (
                <div className="track-summary-item" key={track.track_id}>
                  <div>
                    <strong>Track {track.track_id}: {track.class_name}</strong>
                    <p>{track.observation_count} observation(s)</p>
                  </div>

                  <div>
                    <span>{track.first_timestamp_seconds}s → {track.last_timestamp_seconds}s</span>
                    <span>Max confidence: {(track.max_confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No tracks found.</p>
          )}

          <div className="video-timeline">
            <h3>Tracking Timeline</h3>

            {videoTrackingResult.frames.map((frame, index) => (
              <div className="timeline-item" key={`${frame.frame_filename}-tracking`}>
                <div className="timeline-index">
                  <span>{index + 1}</span>
                </div>

                <div className="timeline-content">
                  <div className="timeline-header">
                    <strong>{frame.timestamp_seconds}s</strong>
                    <span>{frame.detection_count} tracked detection(s)</span>
                  </div>

                  {frame.annotated_frame_file_url && (
                    <div className="tracking-frame-preview">
                      <img
                        src={`/api${frame.annotated_frame_file_url}`}
                        alt={`Annotated tracking frame at ${frame.timestamp_seconds}s`}
                      />

                      <div className="output-actions">
                        <a
                          href={`/api${frame.annotated_frame_file_url}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open tracked frame
                        </a>

                        {frame.annotated_frame_filename && (
                          <a
                            href={`/api${frame.annotated_frame_file_url}`}
                            download={frame.annotated_frame_filename}
                          >
                            Download tracked frame
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {frame.detections.length > 0 ? (
                    <div className="tracking-detection-list">
                      {frame.detections.map((detection) => (
                        <span key={`${frame.frame_filename}-${detection.track_id}`}>
                          Track {detection.track_id}: {detection.class_name} ({(detection.confidence * 100).toFixed(1)}%)
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No tracked detections in this frame.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </main>
  )
}

export default App
