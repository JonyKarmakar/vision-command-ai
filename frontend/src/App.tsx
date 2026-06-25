import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import './App.css'

import {
  buildGeneratedOutputWorkflowAnalytics,
  buildGeneratedOutputWorkflowExport,
  buildGeneratedOutputWorkflowMarkdownReport,
  filterGeneratedOutputHistory,
  getGeneratedOutputHistoryModes,
  groupGeneratedOutputHistoryByWorkflowSource,
  hasGeneratedOutputHistoryFilters as getHasGeneratedOutputHistoryFilters,
} from './features/generatedOutputs/generatedOutputUtils'
import { GeneratedOutputHistorySection } from './features/generatedOutputs/GeneratedOutputHistorySection'
import { ImageUploadMediaHistorySection } from './features/media/ImageUploadMediaHistorySection'
import { ImageUploadResultSection } from './features/media/ImageUploadResultSection'
import { VideoUploadFoundationSection } from './features/media/VideoUploadFoundationSection'
import { VideoFrameToolsSection } from './features/media/VideoFrameToolsSection'
import { VideoTrimResultSection } from './features/media/VideoTrimResultSection'
import { ExtractedFrameResultSection } from './features/media/ExtractedFrameResultSection'
import { VideoFrameDetectionResultSection } from './features/media/VideoFrameDetectionResultSection'
import { SampledVideoSection } from './features/media/SampledVideoSection'
import { MultiFrameExtractionResultSection } from './features/media/MultiFrameExtractionResultSection'
import { MultiFrameDetectionResultSection } from './features/media/MultiFrameDetectionResultSection'
import { VideoTrackingResultSection } from './features/media/VideoTrackingResultSection'
import { DatabaseDashboardSection } from './features/dashboard/DatabaseDashboardSection'
import { DetectionResultSection } from './features/vision/DetectionResultSection'
import { CropResultSection } from './features/vision/CropResultSection'
import { BlurResultSection } from './features/vision/BlurResultSection'
import type { GeneratedOutputHistoryItem } from './features/generatedOutputs/generatedOutputTypes'
import type {
  UploadResponse,
  VideoUploadResponse,
  VideoTrimResponse,
  VideoFrameExtractResponse,
  VideoFrameDetectionResponse,
  VideoMultiFrameExtractResponse,
  Detection,
  DetectionResponse,
  VideoMultiFrameDetectionResponse,
  CropResponse,
  ZoomResponse,
  BlurResponse,
  VideoDetectFramesCommandResponse,
  VideoSampledDetectionResponse,
  VideoTrackingResponse,
  CommandParseResponse,
  CommandEvaluationResponse,
  ParserComparisonResponse,
  PlannerMode,
  CommandPlanResponse,
  CommandPlanExecutionPrepareResponse,
  PlannerComparisonResponse,
  CommandPromptPreviewResponse,
  CommandPlannerPromptPreviewResponse,
  ParsedCommandValidationResponse,
  ParserAttemptLogEntry,
  DatabaseParserAttemptLog,
  DatabaseParserAttemptSummaryResponse,
  LLMOpsDashboardResponse,
  DatabaseParserAttemptLogsResponse,
  ParserAttemptLogsResponse,
  LLMProviderStatusResponse,
  CommandResponse,
  CommandLog,
  CommandLogSummaryItem,
  CommandLogSummaryResponse,
  MediaFileLog,
  DatabaseStats,
  DetectionSummary,
  DetectionLog,
  InferenceSummary,
  InferenceLog,
  ModelInfo,
  ModelClassesResponse,
  SpeechRecognitionConstructor,
} from './types/apiTypes'

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
  const [generatedOutputHistory, setGeneratedOutputHistory] = useState<GeneratedOutputHistoryItem[]>([])
  const [isLoadingGeneratedOutputHistory, setIsLoadingGeneratedOutputHistory] = useState(false)
  const [
    isGeneratedOutputHistoryPanelVisible,
    setIsGeneratedOutputHistoryPanelVisible,
  ] = useState(false)
  const [
    selectedGeneratedOutputWorkflowSource,
    setSelectedGeneratedOutputWorkflowSource,
  ] = useState<string | null>(null)
  const [
    activeGeneratedImageSource,
    setActiveGeneratedImageSource,
  ] = useState<GeneratedOutputHistoryItem | null>(null)
  const [
    autoUseLatestGeneratedOutputAsActive,
    setAutoUseLatestGeneratedOutputAsActive,
  ] = useState(false)
  const [
    expandedGeneratedOutputDetails,
    setExpandedGeneratedOutputDetails,
  ] = useState<Set<string>>(new Set())
  const [
    generatedOutputHistorySearch,
    setGeneratedOutputHistorySearch,
  ] = useState('')
  const [
    generatedOutputHistoryActionFilter,
    setGeneratedOutputHistoryActionFilter,
  ] = useState<'all' | GeneratedOutputHistoryItem['action']>('all')
  const [
    generatedOutputHistorySourceFilter,
    setGeneratedOutputHistorySourceFilter,
  ] = useState<'all' | 'uploads' | 'outputs'>('all')
  const [
    generatedOutputHistoryCreatedByFilter,
    setGeneratedOutputHistoryCreatedByFilter,
  ] = useState<'all' | 'run_command' | 'generated_output' | 'unknown'>('all')
  const [
    generatedOutputHistoryParserFilter,
    setGeneratedOutputHistoryParserFilter,
  ] = useState('all')
  const [
    generatedOutputHistoryPlannerFilter,
    setGeneratedOutputHistoryPlannerFilter,
  ] = useState('all')
  const [
    isGeneratedOutputHistoryDetecting,
    setIsGeneratedOutputHistoryDetecting,
  ] = useState(false)

  const [confidenceThreshold, setConfidenceThreshold] = useState(30)
  const [selectedClass, setSelectedClass] = useState('all')
  const [classOptions, setClassOptions] = useState<string[]>([])

  const [commandText, setCommandText] = useState('')
  const [selectedParserMode, setSelectedParserMode] = useState<PlannerMode>('rule_based')
  const [selectedPlannerMode, setSelectedPlannerMode] = useState<PlannerMode>('rule_based')
  const [commandResult, setCommandResult] = useState<CommandResponse | null>(null)
  const [commandParseResult, setCommandParseResult] = useState<CommandParseResponse | null>(null)
  const [commandPlanResult, setCommandPlanResult] = useState<CommandPlanResponse | null>(null)
  const [commandPlanExecutionPrepareResult, setCommandPlanExecutionPrepareResult] = useState<CommandPlanExecutionPrepareResponse | null>(null)
  const [parsedCommandValidationResult, setParsedCommandValidationResult] = useState<ParsedCommandValidationResponse | null>(null)
  const [commandPromptPreviewResult, setCommandPromptPreviewResult] = useState<CommandPromptPreviewResponse | null>(null)
  const [commandPlannerPromptPreviewResult, setCommandPlannerPromptPreviewResult] = useState<CommandPlannerPromptPreviewResponse | null>(null)
  const [commandEvaluationResult, setCommandEvaluationResult] = useState<CommandEvaluationResponse | null>(null)
  const [parserComparisonResult, setParserComparisonResult] = useState<ParserComparisonResponse | null>(null)
  const [plannerComparisonResult, setPlannerComparisonResult] = useState<PlannerComparisonResponse | null>(null)
  const [parserAttemptLogsResult, setParserAttemptLogsResult] = useState<ParserAttemptLogsResponse | null>(null)
  const [localParserAttemptModeFilter, setLocalParserAttemptModeFilter] = useState('all')
  const [localParserAttemptResultFilter, setLocalParserAttemptResultFilter] = useState('all')
  const [localParserAttemptSearch, setLocalParserAttemptSearch] = useState('')
  const [localParserAttemptSortOrder, setLocalParserAttemptSortOrder] = useState('newest')
  const [localParserAttemptResetNotice, setLocalParserAttemptResetNotice] = useState('')
  const [localParserAttemptExportNotice, setLocalParserAttemptExportNotice] = useState('')
  const [databaseParserAttemptLogsResult, setDatabaseParserAttemptLogsResult] = useState<DatabaseParserAttemptLogsResponse | null>(null)
  const [databaseParserLogParserModeFilter, setDatabaseParserLogParserModeFilter] = useState('all')
  const [databaseParserLogSuccessFilter, setDatabaseParserLogSuccessFilter] = useState('all')
  const [databaseParserLogLimit, setDatabaseParserLogLimit] = useState('10')
  const [databaseParserExportNotice, setDatabaseParserExportNotice] = useState('')
  const [databaseParserLogSearch, setDatabaseParserLogSearch] = useState('')
  const [databaseParserLogSortOrder, setDatabaseParserLogSortOrder] = useState('newest')
  const [databaseParserLogViewResetNotice, setDatabaseParserLogViewResetNotice] = useState('')
  const [databaseParserResetNotice, setDatabaseParserResetNotice] = useState('')
  const [databaseParserAttemptSummaryResult, setDatabaseParserAttemptSummaryResult] = useState<DatabaseParserAttemptSummaryResponse | null>(null)
  const [llmProviderStatusResult, setLlmProviderStatusResult] = useState<LLMProviderStatusResponse | null>(null)
  const [llmOpsDashboardLoaded, setLlmOpsDashboardLoaded] = useState(false)
  const [llmOpsDashboardResult, setLlmOpsDashboardResult] = useState<LLMOpsDashboardResponse | null>(null)
  const [includeRealLlmEvaluationInDashboard, setIncludeRealLlmEvaluationInDashboard] = useState(false)
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([])
  const [commandLogSummary, setCommandLogSummary] = useState<CommandLogSummaryResponse | null>(null)
  const [isLoadingCommandLogSummary, setIsLoadingCommandLogSummary] = useState(false)
  const [hasLoadedCommandLogs, setHasLoadedCommandLogs] = useState(false)
  const [commandHistoryParserModeFilter, setCommandHistoryParserModeFilter] = useState('all')
  const [commandHistoryResultTypeFilter, setCommandHistoryResultTypeFilter] = useState('all')
  const [commandHistoryLimit, setCommandHistoryLimit] = useState('10')
  const [commandHistorySearch, setCommandHistorySearch] = useState('')
  const [commandHistorySortOrder, setCommandHistorySortOrder] = useState('newest')
  const [commandHistoryViewResetNotice, setCommandHistoryViewResetNotice] = useState('')
  const [commandHistoryVisibleExportNotice, setCommandHistoryVisibleExportNotice] = useState('')
  const [commandHistoryResetNotice, setCommandHistoryResetNotice] = useState('')
  const [commandHistoryExportNotice, setCommandHistoryExportNotice] = useState('')
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
  const [isLoadingPlannerPromptPreview, setIsLoadingPlannerPromptPreview] = useState(false)
  const [isPlanningCommand, setIsPlanningCommand] = useState(false)
  const [isPreparingCommandPlanExecution, setIsPreparingCommandPlanExecution] = useState(false)
  const [isExecutingPreparedCommand, setIsExecutingPreparedCommand] = useState(false)
  const [isLoadingCommandEvaluation, setIsLoadingCommandEvaluation] = useState(false)
  const [isLoadingParserComparison, setIsLoadingParserComparison] = useState(false)
  const [isLoadingPlannerComparison, setIsLoadingPlannerComparison] = useState(false)
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

  const llmPromptPreviewRef = useRef<HTMLDivElement | null>(null)
  const plannerPromptPreviewRef = useRef<HTMLDivElement | null>(null)
  const parsedCommandPreviewRef = useRef<HTMLDivElement | null>(null)
  const commandPlanPreviewRef = useRef<HTMLDivElement | null>(null)
  const commandPlanExecutionPrepareRef = useRef<HTMLDivElement | null>(null)
  const parsedCommandValidationRef = useRef<HTMLDivElement | null>(null)
  const commandResultRef = useRef<HTMLDivElement | null>(null)
  const uploadResultRef = useRef<HTMLElement | null>(null)
  const videoUploadResultRef = useRef<HTMLElement | null>(null)
  const detectionResultRef = useRef<HTMLHeadingElement | null>(null)
  const cropResultRef = useRef<HTMLElement | null>(null)
  const blurResultRef = useRef<HTMLElement | null>(null)
  const generatedOutputHistoryRef = useRef<HTMLElement | null>(null)
  const videoTrimResultRef = useRef<HTMLElement | null>(null)
  const videoFrameResultRef = useRef<HTMLElement | null>(null)
  const videoFrameDetectionResultRef = useRef<HTMLElement | null>(null)
  const videoSampledDetectionResultRef = useRef<HTMLHeadingElement | null>(null)
  const videoMultiFrameResultRef = useRef<HTMLElement | null>(null)
  const videoMultiFrameDetectionResultRef = useRef<HTMLElement | null>(null)
  const videoTrackingResultRef = useRef<HTMLHeadingElement | null>(null)
  const parserComparisonRef = useRef<HTMLDivElement | null>(null)
  const plannerComparisonRef = useRef<HTMLDivElement | null>(null)
  const commandHistoryRef = useRef<HTMLDivElement | null>(null)
  const [activeWorkspaceResultLabel, setActiveWorkspaceResultLabel] = useState<string | null>(null)
  const [isWorkspaceQuickJumpOpen, setIsWorkspaceQuickJumpOpen] = useState(false)
  const [workspaceSnapshotImportData, setWorkspaceSnapshotImportData] = useState<{
    active_result_view?: string | null
    loaded_result_views?: string[]
    results: Record<string, unknown>
  } | null>(null)
  const [workspaceSnapshotImportPreview, setWorkspaceSnapshotImportPreview] = useState<{
    fileName: string
    loadedResultCount: number
    activeResultView: string | null
    resultViews: string[]
  } | null>(null)
  const [workspaceSnapshotImportError, setWorkspaceSnapshotImportError] = useState('')
  const [workspaceSnapshotImportNotice, setWorkspaceSnapshotImportNotice] = useState('')
  const [workspaceLocalBackupNotice, setWorkspaceLocalBackupNotice] = useState('')
  const [workspaceLocalBackupError, setWorkspaceLocalBackupError] = useState('')
  const [workspaceLocalBackupAutoSavedAt, setWorkspaceLocalBackupAutoSavedAt] = useState('')
  const [workspaceLocalBackupPreview, setWorkspaceLocalBackupPreview] = useState<{
    savedAt: string
    loadedResultCount: number
    activeResultView: string | null
    resultViews: string[]
    size: string
  } | null>(null)
  const [workspaceClearUndoSnapshot, setWorkspaceClearUndoSnapshot] = useState<{
    active_result_view?: string | null
    loaded_result_views?: string[]
    results: Record<string, unknown>
  } | null>(null)
  const [workspaceClearUndoPreview, setWorkspaceClearUndoPreview] = useState<{
    loadedResultCount: number
    resultViews: string[]
  } | null>(null)
  const [isWorkspaceRecoveryBannerDismissed, setIsWorkspaceRecoveryBannerDismissed] =
    useState(false)

  const scrollToLoadedView = (targetRef: { current: HTMLElement | null }) => {
    window.setTimeout(() => {
      targetRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    }, 180)
  }

  const persistGeneratedOutputHistoryItem = async (historyItem: GeneratedOutputHistoryItem) => {
    try {
      const response = await fetch('/api/db/generated-outputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyItem),
      })

      if (!response.ok) {
        throw new Error(`Failed to persist generated output history: ${response.status}`)
      }
    } catch (error) {
      console.warn('Generated output history persistence failed:', error)
    }
  }

  const loadPersistedGeneratedOutputHistory = async () => {
    try {
      setIsLoadingGeneratedOutputHistory(true)
      setIsGeneratedOutputHistoryPanelVisible(true)
      setError(null)

      const response = await fetch('/api/db/generated-outputs?limit=500')

      if (!response.ok) {
        throw new Error(`Failed to load generated output history: ${response.status}`)
      }

      const data = await response.json()
      const persistedOutputs = Array.isArray(data.generated_outputs)
        ? (data.generated_outputs as GeneratedOutputHistoryItem[])
        : []

      if (persistedOutputs.length === 0) {
        setStatusMessage('No persisted generated output history found.')
        return
      }

      setGeneratedOutputHistory((previousItems) => {
        const existingIds = new Set(previousItems.map((item) => item.id))
        const newItems = persistedOutputs.filter((item) => !existingIds.has(item.id))

        return [...newItems, ...previousItems].sort(
          (firstItem, secondItem) =>
            Date.parse(secondItem.created_at) - Date.parse(firstItem.created_at),
        )
      })

      setStatusMessage(`Loaded ${persistedOutputs.length} persisted generated output item(s).`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load generated output history.')
    } finally {
      setIsLoadingGeneratedOutputHistory(false)
    }
  }

  const clearPersistedGeneratedOutputHistory = async () => {
    try {
      await fetch('/api/db/generated-outputs', {
        method: 'DELETE',
      })
    } catch (error) {
      console.warn('Clearing persisted generated output history failed:', error)
    }
  }

  const deletePersistedGeneratedOutputHistoryItem = async (itemId: string) => {
    try {
      await fetch(`/api/db/generated-outputs/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.warn('Deleting persisted generated output history item failed:', error)
    }
  }

  const handleClearGeneratedOutputHistory = async () => {
    setGeneratedOutputHistory([])
    setIsGeneratedOutputHistoryPanelVisible(true)
    setSelectedGeneratedOutputWorkflowSource(null)
    setActiveGeneratedImageSource(null)
    setExpandedGeneratedOutputDetails(new Set())
    setStatusMessage('Generated Output History cleared.')

    await clearPersistedGeneratedOutputHistory()
  }

  const handleRemoveGeneratedOutputHistoryItem = async (item: GeneratedOutputHistoryItem) => {
    setGeneratedOutputHistory((previousItems) =>
      previousItems.filter((historyItem) => historyItem.id !== item.id),
    )
    setExpandedGeneratedOutputDetails((previousIds) => {
      const nextIds = new Set(previousIds)
      nextIds.delete(item.id)

      return nextIds
    })

    if (activeGeneratedImageSource?.id === item.id) {
      setActiveGeneratedImageSource(null)
    }

    if (selectedGeneratedOutputWorkflowSource === (item.source_filename ?? item.filename)) {
      setSelectedGeneratedOutputWorkflowSource(null)
    }

    setStatusMessage(`Removed output history item: ${item.label}.`)

    await deletePersistedGeneratedOutputHistoryItem(item.id)
  }

  const addGeneratedOutputHistoryItem = (
    item: Omit<GeneratedOutputHistoryItem, 'id' | 'created_at'>,
  ) => {
    const createdAt = new Date().toISOString()
    setIsGeneratedOutputHistoryPanelVisible(true)

    const historyItem: GeneratedOutputHistoryItem = {
      ...item,
      id: `${item.action}-${item.filename}-${createdAt}`,
      created_by: item.created_by ?? (commandText.trim() ? 'Run Command' : 'Generated output'),
      command_text: item.command_text ?? (commandText.trim() || null),
      result_type: item.result_type ?? item.action,
      execution_mode: item.execution_mode ?? (commandText.trim() ? 'run_command' : 'generated_output'),
      parser_mode: item.parser_mode ?? selectedParserMode,
      parser_type: item.parser_type ?? null,
      planner_mode: item.planner_mode ?? selectedPlannerMode,
      created_at: createdAt,
    }

    setGeneratedOutputHistory((previousItems) => [
      historyItem,
      ...previousItems,
    ])

    void persistGeneratedOutputHistoryItem(historyItem)

    if (autoUseLatestGeneratedOutputAsActive) {
      setActiveGeneratedImageSource(historyItem)
    }
  }

  const addNonZoomCommandGeneratedOutputToHistory = (data: CommandResponse) => {
    if (data.result_type === 'annotated_detection') {
      const result = data.result as DetectionResponse

      if (!result.annotated_filename || !result.annotated_file_url) {
        return
      }

      addGeneratedOutputHistoryItem({
        action: 'annotated_detection',
        label:
          result.source === 'outputs'
            ? 'YOLO on generated output'
            : 'Annotated detection output',
        filename: result.annotated_filename,
        file_url: result.annotated_file_url,
        source: result.source ?? 'uploads',
        source_filename: result.filename,
      })
    }

    if (data.result_type === 'crop_by_class') {
      const result = data.result as CropResponse

      if (!result.cropped_filename || !result.cropped_file_url) {
        return
      }

      addGeneratedOutputHistoryItem({
        action: 'crop',
        label: 'Cropped output',
        filename: result.cropped_filename,
        file_url: result.cropped_file_url,
        source: result.source ?? 'uploads',
        source_filename: result.filename,
      })
    }

    if (data.result_type === 'blur_by_class' || data.result_type === 'blur_all_by_class') {
      const result = data.result as BlurResponse

      if (!result.blurred_filename || !result.blurred_file_url) {
        return
      }

      addGeneratedOutputHistoryItem({
        action: 'blur',
        label:
          data.result_type === 'blur_all_by_class'
            ? 'Blurred all output'
            : 'Blurred output',
        filename: result.blurred_filename,
        file_url: result.blurred_file_url,
        source: result.source ?? 'uploads',
        source_filename: result.filename,
      })
    }
  }

  const scrollToCommandOutputView = (resultType: string) => {
    const resultViewByType: Record<string, { current: HTMLElement | null }> = {
      annotated_detection: detectionResultRef,
      crop_by_class: cropResultRef,
      zoom_by_class: commandResultRef,
      blur_by_class: blurResultRef,
      blur_all_by_class: blurResultRef,
      trim_video: videoTrimResultRef,
      extract_frame: videoFrameResultRef,
      extract_frames: videoMultiFrameResultRef,
      detect_frames: videoMultiFrameDetectionResultRef,
      track_video: videoTrackingResultRef,
    }

    scrollToLoadedView(resultViewByType[resultType] ?? commandResultRef)
  }


  const getWorkspaceResultTargetRef = useCallback((label: string) => {
    switch (label) {
      case 'Image Upload':
        return uploadResultRef
      case 'Detection':
        return detectionResultRef
      case 'Crop':
        return cropResultRef
      case 'Blur':
        return blurResultRef
      case 'Generated Outputs':
        return generatedOutputHistoryRef
      case 'Video Upload':
        return videoUploadResultRef
      case 'Video Trim':
        return videoTrimResultRef
      case 'Extracted Frame':
        return videoFrameResultRef
      case 'Frame Detection':
        return videoFrameDetectionResultRef
      case 'Multi-Frame Extraction':
        return videoMultiFrameResultRef
      case 'Multi-Frame Detection':
        return videoMultiFrameDetectionResultRef
      case 'Sampled Video Detection':
        return videoSampledDetectionResultRef
      case 'Video Tracking':
        return videoTrackingResultRef
      default:
        return null
    }
  }, [])

  const workspaceResultNavigatorItems = useMemo(
    () =>
      [
        uploadResult ? 'Image Upload' : null,
        detectionResult ? 'Detection' : null,
        cropResult ? 'Crop' : null,
        blurResult ? 'Blur' : null,
        videoUploadResult ? 'Video Upload' : null,
        videoTrimResult ? 'Video Trim' : null,
        videoFrameResult ? 'Extracted Frame' : null,
        videoFrameDetectionResult ? 'Frame Detection' : null,
        videoMultiFrameResult ? 'Multi-Frame Extraction' : null,
        videoMultiFrameDetectionResult ? 'Multi-Frame Detection' : null,
        videoSampledDetectionResult ? 'Sampled Video Detection' : null,
        videoTrackingResult ? 'Video Tracking' : null,
      ].filter((label): label is string => label !== null),
    [
      uploadResult,
      detectionResult,
      cropResult,
      blurResult,
      videoUploadResult,
      videoTrimResult,
      videoFrameResult,
      videoFrameDetectionResult,
      videoMultiFrameResult,
      videoMultiFrameDetectionResult,
      videoSampledDetectionResult,
      videoTrackingResult,
    ],
  )

  const handleDetectGeneratedOutputHistoryItem = async (
    item: GeneratedOutputHistoryItem,
  ) => {
    try {
      setIsGeneratedOutputHistoryDetecting(true)
      setError(null)
      setStatusMessage(`Running YOLO on generated output: ${item.label}...`)

      const normalizedDetectionThreshold =
        confidenceThreshold > 1 ? confidenceThreshold / 100 : confidenceThreshold

      const response = await fetch(
        `/api/vision/detect-output/${encodeURIComponent(item.filename)}/annotated?confidence_threshold=${normalizedDetectionThreshold}`,
        {
          method: 'POST',
        },
      )

      if (!response.ok) {
        throw new Error(
          await getBackendErrorMessage(
            response,
            `Failed to run YOLO on generated output: ${item.label}.`,
          ),
        )
      }

      const detectionData = await response.json() as DetectionResponse

      setDetectionResult(detectionData)
      addGeneratedOutputHistoryItem({
        action: 'annotated_detection',
        label: 'YOLO on generated output',
        filename: detectionData.annotated_filename,
        file_url: detectionData.annotated_file_url,
        source: detectionData.source ?? 'outputs',
        source_filename: detectionData.filename,
      })
      setSelectedClass('all')
      setLastDetectionThreshold(normalizedDetectionThreshold)
      setLastDetectionClass('all')
      setClassOptions((previousClasses) =>
        Array.from(
          new Set([
            ...previousClasses,
            ...detectionData.detections.map((detection) => detection.class_name),
          ]),
        ).sort(),
      )

      window.setTimeout(() => {
        detectionResultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100)

      setStatusMessage(`YOLO detection completed for generated output: ${item.label}.`)
    } catch (err) {
      const message = getErrorMessage(
        err,
        `Failed to run YOLO on generated output: ${item.label}.`,
      )

      setError(message)
      setStatusMessage(message)
    } finally {
      setIsGeneratedOutputHistoryDetecting(false)
    }
  }

  const workspaceSnapshotResultViews = [
    uploadResult ? 'Image Upload' : null,
    detectionResult ? 'Detection' : null,
    cropResult ? 'Crop' : null,
    blurResult ? 'Blur' : null,
    generatedOutputHistory.length > 0 ? 'Generated Outputs' : null,
    videoUploadResult ? 'Video Upload' : null,
    videoTrimResult ? 'Video Trim' : null,
    videoFrameResult ? 'Extracted Frame' : null,
    videoFrameDetectionResult ? 'Frame Detection' : null,
    videoMultiFrameResult ? 'Multi-Frame Extraction' : null,
    videoMultiFrameDetectionResult ? 'Multi-Frame Detection' : null,
    videoSampledDetectionResult ? 'Sampled Video Detection' : null,
    videoTrackingResult ? 'Video Tracking' : null,
    commandResult ? 'Command Result' : null,
  ].filter((label): label is string => label !== null)

  const hasWorkspaceSnapshotResults = workspaceSnapshotResultViews.length > 0


  const workspaceSnapshot = {
    exported_at: new Date().toISOString(),
    active_result_view: activeWorkspaceResultLabel,
    loaded_result_count: workspaceSnapshotResultViews.length,
    loaded_result_views: workspaceSnapshotResultViews,
    results: {
      ...(uploadResult ? { uploadResult } : {}),
      ...(detectionResult ? { detectionResult } : {}),
      ...(cropResult ? { cropResult } : {}),
      ...(blurResult ? { blurResult } : {}),
      ...(generatedOutputHistory.length > 0 ? { generatedOutputHistory } : {}),
      ...(videoUploadResult ? { videoUploadResult } : {}),
      ...(videoTrimResult ? { videoTrimResult } : {}),
      ...(videoFrameResult ? { videoFrameResult } : {}),
      ...(videoFrameDetectionResult ? { videoFrameDetectionResult } : {}),
      ...(videoMultiFrameResult ? { videoMultiFrameResult } : {}),
      ...(videoMultiFrameDetectionResult ? { videoMultiFrameDetectionResult } : {}),
      ...(videoSampledDetectionResult ? { videoSampledDetectionResult } : {}),
      ...(videoTrackingResult ? { videoTrackingResult } : {}),
      ...(commandResult ? { commandResult } : {}),
    },
  }

  const workspaceSnapshotFileName = `visioncommand-workspace-snapshot-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.json`

  const workspaceSnapshotJson = JSON.stringify(workspaceSnapshot, null, 2)
  const workspaceSnapshotSizeBytes = new Blob([workspaceSnapshotJson]).size
  const workspaceSnapshotEstimatedSize =
    workspaceSnapshotSizeBytes < 1024
      ? `${workspaceSnapshotSizeBytes} B`
      : `${(workspaceSnapshotSizeBytes / 1024).toFixed(1)} KB`

  const workspaceLocalBackupStorageKey = 'visioncommand-local-workspace-snapshot'

  const handleWorkspaceResultNavigatorClick = (label: string) => {
    const targetRef = getWorkspaceResultTargetRef(label)

    setActiveWorkspaceResultLabel(label)

    if (targetRef) {
      scrollToLoadedView(targetRef)
    }
  }

  const getWorkspaceSnapshotResultLabels = useCallback((results: Record<string, unknown>) =>
    [
      results.uploadResult ? 'Image Upload' : null,
      results.detectionResult ? 'Detection' : null,
      results.cropResult ? 'Crop' : null,
      results.blurResult ? 'Blur' : null,
      results.generatedOutputHistory ? 'Generated Outputs' : null,
      results.videoUploadResult ? 'Video Upload' : null,
      results.videoTrimResult ? 'Video Trim' : null,
      results.videoFrameResult ? 'Extracted Frame' : null,
      results.videoFrameDetectionResult ? 'Frame Detection' : null,
      results.videoMultiFrameResult ? 'Multi-Frame Extraction' : null,
      results.videoMultiFrameDetectionResult ? 'Multi-Frame Detection' : null,
      results.videoSampledDetectionResult ? 'Sampled Video Detection' : null,
      results.videoTrackingResult ? 'Video Tracking' : null,
      results.commandResult ? 'Command Result' : null,
    ].filter((label): label is string => label !== null), [])

  const formatWorkspaceSnapshotSize = useCallback((snapshotText: string) => {
    const sizeBytes = new Blob([snapshotText]).size

    return sizeBytes < 1024 ? `${sizeBytes} B` : `${(sizeBytes / 1024).toFixed(1)} KB`
  }, [])

  const getWorkspaceLocalBackupPreview = useCallback((snapshotText: string) => {
    const parsedSnapshot: unknown = JSON.parse(snapshotText)

    if (!isRecord(parsedSnapshot) || !isRecord(parsedSnapshot.results)) {
      throw new Error('The local workspace backup is not a valid workspace snapshot.')
    }

    const results = parsedSnapshot.results as Record<string, unknown>
    const resultViews = getWorkspaceSnapshotResultLabels(results)

    if (resultViews.length === 0) {
      throw new Error('The local workspace backup does not contain supported result views.')
    }

    const activeResultView =
      typeof parsedSnapshot.active_result_view === 'string'
        ? parsedSnapshot.active_result_view
        : null

    const savedAt =
      typeof parsedSnapshot.exported_at === 'string'
        ? new Date(parsedSnapshot.exported_at).toLocaleString()
        : 'Unknown time'

    return {
      savedAt,
      loadedResultCount: resultViews.length,
      activeResultView,
      resultViews,
      size: formatWorkspaceSnapshotSize(snapshotText),
    }
  }, [formatWorkspaceSnapshotSize, getWorkspaceSnapshotResultLabels])

  const refreshWorkspaceLocalBackupPreview = useCallback((snapshotText?: string | null) => {
    const savedSnapshot =
      snapshotText ?? window.localStorage.getItem(workspaceLocalBackupStorageKey)

    if (!savedSnapshot) {
      setWorkspaceLocalBackupPreview(null)
      return null
    }

    try {
      const preview = getWorkspaceLocalBackupPreview(savedSnapshot)

      setWorkspaceLocalBackupPreview(preview)
      setWorkspaceLocalBackupAutoSavedAt(preview.savedAt)
      setIsWorkspaceRecoveryBannerDismissed(false)

      return preview
    } catch {
      setWorkspaceLocalBackupPreview(null)
      return null
    }
  }, [getWorkspaceLocalBackupPreview, workspaceLocalBackupStorageKey])

  const handleWorkspaceSnapshotImportChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedSnapshotFile = event.target.files?.[0]

    setWorkspaceSnapshotImportError('')
    setWorkspaceSnapshotImportNotice('')

    if (!selectedSnapshotFile) {
      setWorkspaceSnapshotImportData(null)
      setWorkspaceSnapshotImportPreview(null)
      return
    }

    try {
      const snapshotText = await selectedSnapshotFile.text()
      const parsedSnapshot: unknown = JSON.parse(snapshotText)

      if (!isRecord(parsedSnapshot) || !isRecord(parsedSnapshot.results)) {
        throw new Error('This file is not a valid VisionCommand workspace snapshot.')
      }

      const results = parsedSnapshot.results as Record<string, unknown>
      const resultViews = getWorkspaceSnapshotResultLabels(results)

      if (resultViews.length === 0) {
        throw new Error('This snapshot does not contain supported result views.')
      }

      const activeResultView =
        typeof parsedSnapshot.active_result_view === 'string'
          ? parsedSnapshot.active_result_view
          : null

      const loadedResultViews = Array.isArray(parsedSnapshot.loaded_result_views)
        ? parsedSnapshot.loaded_result_views.filter(
            (label): label is string => typeof label === 'string',
          )
        : resultViews

      setWorkspaceSnapshotImportData({
        active_result_view: activeResultView,
        loaded_result_views: loadedResultViews,
        results,
      })

      setWorkspaceSnapshotImportPreview({
        fileName: selectedSnapshotFile.name,
        loadedResultCount: resultViews.length,
        activeResultView,
        resultViews,
      })

      setWorkspaceSnapshotImportNotice(
        `Snapshot ready to restore: ${resultViews.length} result view(s).`,
      )
    } catch (err) {
      const message = getErrorMessage(err, 'Could not import workspace snapshot.')

      setWorkspaceSnapshotImportData(null)
      setWorkspaceSnapshotImportPreview(null)
      setWorkspaceSnapshotImportError(message)
      setWorkspaceSnapshotImportNotice('')
    }
  }

  const restoreWorkspaceSnapshotData = (
    snapshotData: {
      active_result_view?: string | null
      loaded_result_views?: string[]
      results: Record<string, unknown>
    },
    sourceLabel: string,
    noticeTarget: 'import' | 'local' | 'workspace',
  ) => {
    const { results } = snapshotData

    const restoredUploadResult = (results.uploadResult as UploadResponse | undefined) ?? null
    const restoredDetectionResult =
      (results.detectionResult as DetectionResponse | undefined) ?? null
    const restoredCropResult = (results.cropResult as CropResponse | undefined) ?? null
    const restoredBlurResult = (results.blurResult as BlurResponse | undefined) ?? null
    const restoredGeneratedOutputHistory = Array.isArray(results.generatedOutputHistory)
      ? (results.generatedOutputHistory as GeneratedOutputHistoryItem[])
      : []
    const restoredVideoUploadResult =
      (results.videoUploadResult as VideoUploadResponse | undefined) ?? null
    const restoredVideoTrimResult =
      (results.videoTrimResult as VideoTrimResponse | undefined) ?? null
    const restoredVideoFrameResult =
      (results.videoFrameResult as VideoFrameExtractResponse | undefined) ?? null
    const restoredVideoFrameDetectionResult =
      (results.videoFrameDetectionResult as VideoFrameDetectionResponse | undefined) ?? null
    const restoredVideoMultiFrameResult =
      (results.videoMultiFrameResult as VideoMultiFrameExtractResponse | undefined) ?? null
    const restoredVideoMultiFrameDetectionResult =
      (results.videoMultiFrameDetectionResult as VideoMultiFrameDetectionResponse | undefined) ??
      null
    const restoredVideoSampledDetectionResult =
      (results.videoSampledDetectionResult as VideoSampledDetectionResponse | undefined) ?? null
    const restoredVideoTrackingResult =
      (results.videoTrackingResult as VideoTrackingResponse | undefined) ?? null
    const restoredCommandResult = (results.commandResult as CommandResponse | undefined) ?? null

    setUploadResult(restoredUploadResult)
    setDetectionResult(restoredDetectionResult)
    setCropResult(restoredCropResult)
    setBlurResult(restoredBlurResult)
    setGeneratedOutputHistory(restoredGeneratedOutputHistory)
    setVideoUploadResult(restoredVideoUploadResult)
    setVideoTrimResult(restoredVideoTrimResult)
    setVideoFrameResult(restoredVideoFrameResult)
    setVideoFrameDetectionResult(restoredVideoFrameDetectionResult)
    setVideoMultiFrameResult(restoredVideoMultiFrameResult)
    setVideoMultiFrameDetectionResult(restoredVideoMultiFrameDetectionResult)
    setVideoSampledDetectionResult(restoredVideoSampledDetectionResult)
    setVideoTrackingResult(restoredVideoTrackingResult)
    setCommandResult(restoredCommandResult)

    setSelectedClass('all')
    setLastDetectionThreshold(null)
    setLastDetectionClass(null)

    setClassOptions(
      restoredDetectionResult
        ? Array.from(
            new Set(
              restoredDetectionResult.detections.map(
                (detection) => detection.class_name,
              ),
            ),
          ).sort()
        : [],
    )

    const restoredLabels = getWorkspaceSnapshotResultLabels(results)
    const preferredActiveLabel = snapshotData.active_result_view

    setActiveWorkspaceResultLabel(
      preferredActiveLabel && restoredLabels.includes(preferredActiveLabel)
        ? preferredActiveLabel
        : restoredLabels[0] ?? null,
    )

    const restoreMessage = `Workspace restored from ${sourceLabel} with ${restoredLabels.length} result view(s).`

    setError(null)
    setWorkspaceSnapshotImportError('')
    setWorkspaceLocalBackupError('')

    if (noticeTarget === 'import') {
      setWorkspaceSnapshotImportNotice(restoreMessage)
      setWorkspaceLocalBackupNotice('')
      setWorkspaceClearUndoSnapshot(null)
      setWorkspaceClearUndoPreview(null)
    } else if (noticeTarget === 'local') {
      setWorkspaceLocalBackupNotice(restoreMessage)
      setWorkspaceSnapshotImportNotice('')
      setWorkspaceClearUndoSnapshot(null)
      setWorkspaceClearUndoPreview(null)
    } else {
      setWorkspaceSnapshotImportNotice('')
      setWorkspaceLocalBackupNotice('')
    }

    setStatusMessage(restoreMessage)
  }

  const handleUndoClearWorkspaceViews = () => {
    if (!workspaceClearUndoSnapshot || !workspaceClearUndoPreview) {
      setStatusMessage('No cleared workspace available to undo.')
      return
    }

    restoreWorkspaceSnapshotData(workspaceClearUndoSnapshot, 'last cleared workspace', 'workspace')

    setWorkspaceClearUndoSnapshot(null)
    setWorkspaceClearUndoPreview(null)
    setStatusMessage(
      `Undo restored ${workspaceClearUndoPreview.loadedResultCount} workspace result view(s).`,
    )
  }

  const shouldProceedWithWorkspaceRestore = () => {
    const hasLoadedWorkspaceViews = hasWorkspaceSnapshotResults
    const hasUndoClearRecovery = workspaceClearUndoSnapshot !== null

    if (!hasLoadedWorkspaceViews && !hasUndoClearRecovery) {
      return true
    }

    const confirmationMessage = hasLoadedWorkspaceViews
      ? hasUndoClearRecovery
        ? 'Restoring this workspace will replace your currently loaded result views and discard the current Undo Clear Workspace recovery. Continue?'
        : 'Restoring this workspace will replace your currently loaded result views. Continue?'
      : 'Restoring this workspace will discard the current Undo Clear Workspace recovery. Continue?'

    const shouldRestoreWorkspace = window.confirm(confirmationMessage)

    if (!shouldRestoreWorkspace) {
      setStatusMessage(
        hasUndoClearRecovery
          ? 'Workspace restore cancelled. Undo Clear Workspace is still available.'
          : 'Workspace restore cancelled.',
      )
      return false
    }

    return true
  }

  const handleRestoreWorkspaceSnapshot = () => {
    if (!workspaceSnapshotImportData) {
      setWorkspaceSnapshotImportError('Please choose a workspace snapshot JSON file first.')
      return
    }

    if (!shouldProceedWithWorkspaceRestore()) {
      return
    }

    restoreWorkspaceSnapshotData(workspaceSnapshotImportData, 'imported snapshot', 'import')
  }

  const handleSaveWorkspaceLocally = () => {
    try {
      if (!hasWorkspaceSnapshotResults) {
        throw new Error('There are no loaded result views to save locally.')
      }

      window.localStorage.setItem(workspaceLocalBackupStorageKey, workspaceSnapshotJson)

      refreshWorkspaceLocalBackupPreview(workspaceSnapshotJson)

      setWorkspaceLocalBackupError('')
      setWorkspaceLocalBackupNotice(
        `Local workspace backup saved with ${workspaceSnapshotResultViews.length} result view(s).`,
      )
      setStatusMessage('Workspace saved locally in this browser.')
    } catch (err) {
      const message = getErrorMessage(err, 'Could not save workspace locally.')

      setWorkspaceLocalBackupNotice('')
      setWorkspaceLocalBackupError(message)
      setStatusMessage(message)
    }
  }

  const handleLoadLocalWorkspaceSnapshot = () => {
    try {
      const savedSnapshot = window.localStorage.getItem(workspaceLocalBackupStorageKey)

      if (!savedSnapshot) {
        throw new Error('No local workspace backup found in this browser.')
      }

      refreshWorkspaceLocalBackupPreview(savedSnapshot)

      const parsedSnapshot: unknown = JSON.parse(savedSnapshot)

      if (!isRecord(parsedSnapshot) || !isRecord(parsedSnapshot.results)) {
        throw new Error('The local workspace backup is not a valid workspace snapshot.')
      }

      const results = parsedSnapshot.results as Record<string, unknown>
      const resultViews = getWorkspaceSnapshotResultLabels(results)

      if (resultViews.length === 0) {
        throw new Error('The local workspace backup does not contain supported result views.')
      }

      const activeResultView =
        typeof parsedSnapshot.active_result_view === 'string'
          ? parsedSnapshot.active_result_view
          : null

      const loadedResultViews = Array.isArray(parsedSnapshot.loaded_result_views)
        ? parsedSnapshot.loaded_result_views.filter(
            (label): label is string => typeof label === 'string',
          )
        : resultViews

      const localSnapshotData = {
        active_result_view: activeResultView,
        loaded_result_views: loadedResultViews,
        results,
      }

      if (!shouldProceedWithWorkspaceRestore()) {
        return
      }

      setWorkspaceSnapshotImportData(localSnapshotData)
      setWorkspaceSnapshotImportPreview({
        fileName: 'Local browser backup',
        loadedResultCount: resultViews.length,
        activeResultView,
        resultViews,
      })

      restoreWorkspaceSnapshotData(localSnapshotData, 'local browser backup', 'local')
      setIsWorkspaceRecoveryBannerDismissed(true)
    } catch (err) {
      const message = getErrorMessage(err, 'Could not load local workspace backup.')

      setWorkspaceLocalBackupNotice('')
      setWorkspaceLocalBackupError(message)
      setStatusMessage(message)
    }
  }

  const handleClearLocalWorkspaceBackup = () => {
    const shouldClearLocalBackup = window.confirm(
      'Clear the saved local workspace backup from this browser? This cannot be undone.',
    )

    if (!shouldClearLocalBackup) {
      setWorkspaceLocalBackupNotice('Clear local workspace backup cancelled.')
      setStatusMessage('Clear local workspace backup cancelled.')
      return
    }

    window.localStorage.removeItem(workspaceLocalBackupStorageKey)

    setWorkspaceLocalBackupAutoSavedAt('')
    setWorkspaceLocalBackupPreview(null)
    setIsWorkspaceRecoveryBannerDismissed(false)
    setWorkspaceLocalBackupError('')
    setWorkspaceLocalBackupNotice('Local workspace backup cleared.')
    setStatusMessage('Local workspace backup cleared.')
  }

  useEffect(() => {
    const previewRefreshTimer = window.setTimeout(() => {
      refreshWorkspaceLocalBackupPreview()
    }, 0)

    return () => {
      window.clearTimeout(previewRefreshTimer)
    }
  }, [refreshWorkspaceLocalBackupPreview])

  useEffect(() => {
    if (!hasWorkspaceSnapshotResults) {
      return
    }

    const autoSaveTimer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(workspaceLocalBackupStorageKey, workspaceSnapshotJson)

        refreshWorkspaceLocalBackupPreview(workspaceSnapshotJson)
        setWorkspaceLocalBackupError('')
      } catch (err) {
        const message = getErrorMessage(err, 'Could not auto-save workspace locally.')

        setWorkspaceLocalBackupError(message)
      }
    }, 600)

    return () => {
      window.clearTimeout(autoSaveTimer)
    }
  }, [
    hasWorkspaceSnapshotResults,
    refreshWorkspaceLocalBackupPreview,
    workspaceSnapshotJson,
  ])

  useEffect(() => {
    if (workspaceResultNavigatorItems.length === 0) {
      const emptyNavigatorFrame = window.requestAnimationFrame(() => {
        setActiveWorkspaceResultLabel(null)
      })

      return () => {
        window.cancelAnimationFrame(emptyNavigatorFrame)
      }
    }

    let animationFrameId: number | null = null

    const updateActiveWorkspaceResult = () => {
      const activeLine = Math.min(320, window.innerHeight * 0.35)

      const measuredItems = workspaceResultNavigatorItems
        .map((item) => {
          const targetElement = getWorkspaceResultTargetRef(item)?.current

          if (!targetElement) {
            return null
          }

          targetElement.setAttribute('data-workspace-result-label', item)

          return {
            label: item,
            top: targetElement.getBoundingClientRect().top,
          }
        })
        .filter((item): item is { label: string; top: number } => item !== null)

      if (measuredItems.length === 0) {
        return
      }

      const passedItems = measuredItems.filter((item) => item.top <= activeLine)
      const activeItem =
        passedItems.length > 0
          ? passedItems.reduce((closest, item) => (item.top > closest.top ? item : closest))
          : measuredItems.reduce((closest, item) =>
              Math.abs(item.top - activeLine) < Math.abs(closest.top - activeLine)
                ? item
                : closest,
            )

      setActiveWorkspaceResultLabel(activeItem.label)
    }

    const scheduleActiveWorkspaceUpdate = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }

      animationFrameId = window.requestAnimationFrame(updateActiveWorkspaceResult)
    }

    const initialNavigatorFrame = window.requestAnimationFrame(() => {
      setActiveWorkspaceResultLabel((currentLabel) =>
        currentLabel && workspaceResultNavigatorItems.includes(currentLabel)
          ? currentLabel
          : workspaceResultNavigatorItems[0],
      )

      updateActiveWorkspaceResult()
})

    window.addEventListener('scroll', scheduleActiveWorkspaceUpdate, { passive: true })
    window.addEventListener('resize', scheduleActiveWorkspaceUpdate)

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }

      window.cancelAnimationFrame(initialNavigatorFrame)

      window.removeEventListener('scroll', scheduleActiveWorkspaceUpdate)
      window.removeEventListener('resize', scheduleActiveWorkspaceUpdate)
    }
  }, [getWorkspaceResultTargetRef, workspaceResultNavigatorItems])


  const hasLoadedDashboardViews = Boolean(
    databaseStats ||
      modelInfo ||
      modelClasses ||
      detectionLogs.length > 0 ||
      detectionSummary ||
      inferenceLogs.length > 0 ||
      inferenceSummary,
  )

  const hasLoadedWorkspaceViews = Boolean(
    uploadResult ||
      videoUploadResult ||
      videoTrimResult ||
      videoFrameResult ||
      videoMultiFrameResult ||
      videoMultiFrameDetectionResult ||
      videoSampledDetectionResult ||
      videoTrackingResult ||
      videoFrameDetectionResult ||
      detectionResult ||
      cropResult ||
      blurResult ||
      commandResult ||
      commandParseResult ||
      parsedCommandValidationResult ||
      commandPromptPreviewResult ||
      commandEvaluationResult ||
      parserComparisonResult ||
      plannerComparisonResult ||
      parserAttemptLogsResult ||
      databaseParserAttemptLogsResult ||
      databaseParserAttemptSummaryResult ||
      llmProviderStatusResult ||
      llmOpsDashboardResult ||
      commandLogs.length > 0 ||
      commandLogSummary ||
      mediaFiles.length > 0 ||
      hasLoadedDashboardViews,
  )
  const [isListening, setIsListening] = useState(false)

  const [statusMessage, setStatusMessage] = useState<string>('Ready to upload an image.')
  const [copiedParserLogJsonKey, setCopiedParserLogJsonKey] = useState('')
  const [failedParserLogJsonKey, setFailedParserLogJsonKey] = useState('')
  const [downloadedParserLogJsonKey, setDownloadedParserLogJsonKey] = useState('')
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
      scrollToLoadedView(videoUploadResultRef)
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
      scrollToLoadedView(videoTrimResultRef)
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
      scrollToLoadedView(videoFrameResultRef)
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
      scrollToLoadedView(videoFrameDetectionResultRef)
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
      scrollToLoadedView(videoMultiFrameResultRef)
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
      scrollToLoadedView(videoMultiFrameDetectionResultRef)
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
      scrollToLoadedView(videoSampledDetectionResultRef)
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
      scrollToLoadedView(videoTrackingResultRef)
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
      scrollToLoadedView(uploadResultRef)
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
      addGeneratedOutputHistoryItem({
        action: 'annotated_detection',
        label: 'Annotated detection output',
        filename: data.annotated_filename,
        file_url: data.annotated_file_url,
        source: data.source ?? 'uploads',
        source_filename: data.filename,
      })
      setActiveWorkspaceResultLabel('Detection')
      scrollToLoadedView(detectionResultRef)
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
      const detectionSource = detectionResult?.source ?? 'uploads'
      const sourceFilename =
        detectionSource === 'outputs'
          ? detectionResult?.filename
          : uploadResult?.stored_filename

      if (!sourceFilename) {
        setError('No source image is available for cropping.')
        return
      }

    try {
      setIsCropping(true)
      setError(null)
      setCommandResult(null)
      setStatusMessage(`Cropping selected ${detection.class_name}...`)

        const cropEndpoint =
          detectionSource === 'outputs'
            ? `/api/vision/crop-output/${encodeURIComponent(sourceFilename)}`
            : `/api/vision/crop/${encodeURIComponent(sourceFilename)}`

      const response = await fetch(
        cropEndpoint,
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
      addGeneratedOutputHistoryItem({
        action: 'crop',
        label: 'Cropped object output',
        filename: data.cropped_filename,
        file_url: data.cropped_file_url,
        source: data.source ?? 'uploads',
        source_filename: data.filename,
      })
      scrollToLoadedView(cropResultRef)
      setStatusMessage('Crop complete. Cropped output is ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Crop failed.')
    } finally {
      setIsCropping(false)
    }
  }

  const handleBlur = async (detection: Detection) => {
      const detectionSource = detectionResult?.source ?? 'uploads'
      const sourceFilename =
        detectionSource === 'outputs'
          ? detectionResult?.filename
          : uploadResult?.stored_filename

      if (!sourceFilename) {
        setError('No source image is available for blurring.')
        return
      }

    try {
      setIsBlurring(true)
      setError(null)
      setCommandResult(null)
      setStatusMessage(`Blurring selected ${detection.class_name}...`)

        const blurEndpoint =
          detectionSource === 'outputs'
            ? `/api/vision/blur-output/${encodeURIComponent(sourceFilename)}`
            : `/api/vision/blur/${encodeURIComponent(sourceFilename)}`

      const response = await fetch(
        blurEndpoint,
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
      addGeneratedOutputHistoryItem({
        action: 'blur',
        label: 'Blurred object output',
        filename: data.blurred_filename,
        file_url: data.blurred_file_url,
        source: data.source ?? 'uploads',
        source_filename: data.filename,
      })
      scrollToLoadedView(blurResultRef)
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


  const handleClearDashboardViews = () => {
    setDatabaseStats(null)
    setModelInfo(null)
    setModelClasses(null)
    setModelClassSearch('')
    setDetectionLogs([])
    setDetectionSummary(null)
    setInferenceLogs([])
    setInferenceSummary(null)
    setError(null)
    setStatusMessage('Dashboard views cleared.')
  }

  const handleClearAllWorkspaceViews = () => {
    const shouldClearWorkspaceViews = window.confirm(
      'Clear all loaded workspace views and result panels? Your local backup will not be deleted.',
    )

    if (!shouldClearWorkspaceViews) {
      setStatusMessage('Clear all workspace views cancelled.')
      return
    }

    if (hasWorkspaceSnapshotResults) {
      const undoResultViews = getWorkspaceSnapshotResultLabels(workspaceSnapshot.results)

      setWorkspaceClearUndoSnapshot({
        active_result_view: activeWorkspaceResultLabel,
        loaded_result_views: workspaceSnapshotResultViews,
        results: { ...workspaceSnapshot.results },
      })
      setWorkspaceClearUndoPreview({
        loadedResultCount: undoResultViews.length,
        resultViews: undoResultViews,
      })
    } else {
      setWorkspaceClearUndoSnapshot(null)
      setWorkspaceClearUndoPreview(null)
    }

    setUploadResult(null)
    setSelectedFile(null)

    setVideoUploadResult(null)
    setSelectedVideoFile(null)
    setVideoTrimResult(null)
    setVideoFrameResult(null)
    setVideoMultiFrameResult(null)
    setVideoMultiFrameDetectionResult(null)
    setVideoSampledDetectionResult(null)
    setVideoTrackingResult(null)
    setVideoFrameDetectionResult(null)

    setDetectionResult(null)
    setCropResult(null)
    setBlurResult(null)
    setLastDetectionThreshold(null)
    setLastDetectionClass(null)

    setCommandResult(null)
    setCommandParseResult(null)
    setParsedCommandValidationResult(null)
    setCommandPromptPreviewResult(null)
    setCommandEvaluationResult(null)
    setParserComparisonResult(null)
    setPlannerComparisonResult(null)
    setParserAttemptLogsResult(null)
    setDatabaseParserAttemptLogsResult(null)
    setDatabaseParserAttemptSummaryResult(null)
    setLlmProviderStatusResult(null)
    setLlmOpsDashboardLoaded(false)
    setLlmOpsDashboardResult(null)

    setCommandLogs([])
    setCommandLogSummary(null)
    setHasLoadedCommandLogs(false)
    setMediaFiles([])

    setDatabaseStats(null)
    setModelInfo(null)
    setModelClasses(null)
    setModelClassSearch('')
    setDetectionLogs([])
    setDetectionSummary(null)
    setInferenceLogs([])
    setInferenceSummary(null)

    setError(null)
    setStatusMessage('Workspace views cleared. Undo available.')
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
        const errorText = await response.text()
        let errorMessage = errorText || 'Could not load uploaded media history'

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch {
          // Keep plain text backend error message.
        }

        throw new Error(errorMessage)
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

  const handleCopyParserLogJson = async (
    jsonData: unknown,
    copyKey: string,
    successMessage = 'Copied parsed command JSON to clipboard.',
  ) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))

      setCopiedParserLogJsonKey(copyKey)
      setFailedParserLogJsonKey('')
      setStatusMessage(successMessage)

      window.setTimeout(() => {
        setCopiedParserLogJsonKey((currentKey) => (currentKey === copyKey ? '' : currentKey))
      }, 2000)
    } catch {
      setCopiedParserLogJsonKey('')
      setFailedParserLogJsonKey(copyKey)
      setStatusMessage('Copy failed. Please try again.')

      window.setTimeout(() => {
        setFailedParserLogJsonKey((currentKey) => (currentKey === copyKey ? '' : currentKey))
      }, 2000)
    }
  }


  const getSafeJsonFileSearchPart = (searchValue: string) => {
    const normalizedSearch = searchValue.trim()

    if (normalizedSearch.length === 0) {
      return 'search-none'
    }

    return `search-${normalizedSearch
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)}`
  }

  const handleDownloadJsonFile = (
    jsonData: unknown,
    fileName: string,
    successMessage: string,
    downloadKey = '',
  ) => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json',
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(downloadUrl)
    setStatusMessage(successMessage)

    if (downloadKey) {
      setDownloadedParserLogJsonKey(downloadKey)

      window.setTimeout(() => {
        setDownloadedParserLogJsonKey((currentKey) => (currentKey === downloadKey ? '' : currentKey))
      }, 2000)
    }
  }

  const handleDownloadTextFile = (
    textData: string,
    fileName: string,
    successMessage: string,
    downloadKey = '',
    mimeType = 'text/markdown',
  ) => {
    const blob = new Blob([textData], {
      type: mimeType,
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(downloadUrl)
    setStatusMessage(successMessage)

    if (downloadKey) {
      setDownloadedParserLogJsonKey(downloadKey)

      window.setTimeout(() => {
        setDownloadedParserLogJsonKey((currentKey) => (currentKey === downloadKey ? '' : currentKey))
      }, 2000)
    }
  }

  const generatedOutputHistoryParserModes = getGeneratedOutputHistoryModes(
    generatedOutputHistory,
    'parser_mode',
  )

  const generatedOutputHistoryPlannerModes = getGeneratedOutputHistoryModes(
    generatedOutputHistory,
    'planner_mode',
  )

  const generatedOutputHistoryFilters = {
    search: generatedOutputHistorySearch,
    actionFilter: generatedOutputHistoryActionFilter,
    sourceFilter: generatedOutputHistorySourceFilter,
    createdByFilter: generatedOutputHistoryCreatedByFilter,
    parserFilter: generatedOutputHistoryParserFilter,
    plannerFilter: generatedOutputHistoryPlannerFilter,
  }

  const filteredGeneratedOutputHistory = filterGeneratedOutputHistory(
    generatedOutputHistory,
    generatedOutputHistoryFilters,
  )

  const generatedOutputHistoryFilteredGroups = groupGeneratedOutputHistoryByWorkflowSource(
    filteredGeneratedOutputHistory,
  )

  const generatedOutputWorkflowAnalytics = buildGeneratedOutputWorkflowAnalytics({
    filteredItems: filteredGeneratedOutputHistory,
    totalItems: generatedOutputHistory,
    groupedItems: generatedOutputHistoryFilteredGroups,
  })

  const handleToggleGeneratedOutputWorkflowDetails = (workflowSourceFilename: string) => {
    const isCurrentlySelected = selectedGeneratedOutputWorkflowSource === workflowSourceFilename

    setSelectedGeneratedOutputWorkflowSource(isCurrentlySelected ? null : workflowSourceFilename)
    setStatusMessage(
      isCurrentlySelected
        ? 'Workflow details hidden.'
        : `Viewing workflow details for ${workflowSourceFilename}.`,
    )
  }

  const hasGeneratedOutputHistoryFilters = getHasGeneratedOutputHistoryFilters(generatedOutputHistoryFilters)

  const handleClearGeneratedOutputHistoryFilters = () => {
    setGeneratedOutputHistorySearch('')
    setGeneratedOutputHistoryActionFilter('all')
    setGeneratedOutputHistorySourceFilter('all')
    setGeneratedOutputHistoryCreatedByFilter('all')
    setGeneratedOutputHistoryParserFilter('all')
    setGeneratedOutputHistoryPlannerFilter('all')
    setStatusMessage('Generated Output History filters cleared.')
  }

  const handleDownloadGeneratedOutputWorkflowJson = () => {
    const exportedAt = new Date().toISOString()
    const fileTimestamp = exportedAt.replace(/[:.]/g, '-')
    const workflowExport = buildGeneratedOutputWorkflowExport({
      items: generatedOutputHistory,
      exportedAt,
      autoUseLatestGeneratedOutputAsActive,
      activeGeneratedImageSource,
    })

    handleDownloadJsonFile(
      workflowExport,
      `visioncommand-generated-output-workflow-${fileTimestamp}.json`,
      'Generated Output workflow JSON downloaded.',
      'download-generated-output-workflow-json',
    )
  }

  const handleDownloadGeneratedOutputWorkflowReport = () => {
    const exportedAt = new Date().toISOString()
    const fileTimestamp = exportedAt.replace(/[:.]/g, '-')
    const workflowReport = buildGeneratedOutputWorkflowMarkdownReport({
      items: generatedOutputHistory,
      exportedAt,
      autoUseLatestGeneratedOutputAsActive,
      activeGeneratedImageSource,
    })

    handleDownloadTextFile(
      workflowReport,
      `visioncommand-generated-output-workflow-report-${fileTimestamp}.md`,
      'Generated Output workflow report downloaded.',
      'download-generated-output-workflow-report',
    )
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

  const clearCommandHistoryResultsForFilterChange = () => {
    setCommandLogs([])
    setCommandLogSummary(null)
    setHasLoadedCommandLogs(false)
    setCommandHistoryResetNotice('')
    setCommandHistoryExportNotice('')
  }

  const handleResetCommandHistoryFilters = () => {
    setCommandHistoryParserModeFilter('all')
    setCommandHistoryResultTypeFilter('all')
    setCommandHistoryLimit('10')
    setCommandHistorySearch('')
    setCommandHistorySortOrder('newest')
    setCommandHistoryViewResetNotice('')
    setCommandHistoryVisibleExportNotice('')
    setCommandHistorySearch('')
    setCommandLogs([])
    setCommandLogSummary(null)
    setHasLoadedCommandLogs(false)
    setCommandHistoryResetNotice('Command history filters reset.')
    setCommandHistoryExportNotice('')
    setStatusMessage('Command history filters reset.')
  }

  const handleLoadCommandLogs = async () => {
    try {
      setIsLoadingLogs(true)
      setError(null)
      setCommandHistoryResetNotice('')
      setCommandHistoryExportNotice('')
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
      scrollToLoadedView(commandHistoryRef)
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
      setCommandHistoryResetNotice('')
      setCommandHistoryExportNotice('')
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

      const exportedRowCount = response.headers.get('X-Command-Logs-Count') ?? commandHistoryLimit
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      const exportFileName = `command_logs_parser-${commandHistoryParserModeFilter}_result-${commandHistoryResultTypeFilter}_limit-${commandHistoryLimit}.csv`

      link.href = downloadUrl
      link.download = exportFileName
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(downloadUrl)

      const exportMessage = `Exported ${exportedRowCount} command history row(s) to ${exportFileName}.`

      setCommandHistoryExportNotice(exportMessage)
      setStatusMessage(exportMessage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not export command history.')
    }
  }

  const handleExportVisibleCommandHistoryLogs = () => {
    if (filteredCommandHistoryLogs.length === 0) {
      setCommandHistoryVisibleExportNotice('No visible command history rows to export.')
      return
    }

    const escapeCsvValue = (value: string | number | null | undefined) => {
      const stringValue = value === null || value === undefined ? '' : String(value)
      return `"${stringValue.replaceAll('"', '""')}"`
    }

    const headers = [
      'timestamp',
      'filename',
      'command',
      'confidence_threshold',
      'parsed_action',
      'parsed_class',
      'result_type',
      'parser_mode',
      'parser_type',
      'parser_version',
    ]

    const rows = filteredCommandHistoryLogs.map((log) => [
      log.timestamp,
      log.filename,
      log.command,
      log.confidence_threshold,
      log.parsed_action,
      log.parsed_class,
      log.result_type,
      log.parser_mode ?? 'unknown',
      log.parser_type ?? 'unknown',
      log.parser_version ?? 'unknown',
    ])

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\n')

    const searchPart = commandHistorySearch.trim()
      ? `search-${commandHistorySearch.trim().replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`
      : 'search-all'

    const exportFileName = `visible_command_history_parser-${commandHistoryParserModeFilter}_result-${commandHistoryResultTypeFilter}_limit-${commandHistoryLimit}_${searchPart}_sort-${commandHistorySortOrder}.csv`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = downloadUrl
    link.download = exportFileName
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(downloadUrl)

    const exportMessage = `Exported ${filteredCommandHistoryLogs.length} visible command history row(s) to ${exportFileName}.`

    setCommandHistoryVisibleExportNotice(exportMessage)
    setCommandHistoryViewResetNotice('')
    setStatusMessage(exportMessage)
  }


  const handleLoadCommandLogSummary = async () => {
    try {
      setIsLoadingCommandLogSummary(true)
      setError(null)
      setCommandHistoryResetNotice('')
      setCommandHistoryExportNotice('')
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
      scrollToLoadedView(llmPromptPreviewRef)
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
      scrollToLoadedView(parsedCommandPreviewRef)
      setStatusMessage(`Command parsed as: ${data.parsed_command.action}.`)
    } catch (err) {
      const message = getErrorMessage(err, 'Command parsing failed.')
      setError(message)
      setStatusMessage(message)
    } finally {
      setIsParsingCommand(false)
    }
  }

  const handleLoadPlannerPromptPreview = async () => {
    if (!commandText.trim()) {
      setError('Please type a command before previewing the planner prompt.')
      return
    }

    try {
      setIsLoadingPlannerPromptPreview(true)
      setError(null)
      setCommandPlannerPromptPreviewResult(null)
      setStatusMessage(`Generating planner prompt preview for: "${commandText}"...`)

      const response = await fetch('/api/commands/plan/prompt-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: commandText,
          planner_mode: selectedPlannerMode,
        }),
      })

      if (!response.ok) {
        throw new Error(await getBackendErrorMessage(response, 'Planner prompt preview failed'))
      }

      const data: CommandPlannerPromptPreviewResponse = await response.json()
      setCommandPlannerPromptPreviewResult(data)
      scrollToLoadedView(plannerPromptPreviewRef)
      setStatusMessage(`Loaded planner prompt preview: ${data.prompt_version}.`)
    } catch (err) {
      const message = getErrorMessage(err, 'Planner prompt preview failed.')
      setError(message)
      setStatusMessage(message)
    } finally {
      setIsLoadingPlannerPromptPreview(false)
    }
  }

  const handlePlanCommand = async () => {
    if (!commandText.trim()) {
      setError('Please type a command to plan.')
      return
    }

    try {
      setIsPlanningCommand(true)
      setError(null)
      setCommandPlanResult(null)
      setStatusMessage(`Planning command with ${selectedPlannerMode}: "${commandText}"...`)

      const response = await fetch('/api/commands/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: commandText,
          planner_mode: selectedPlannerMode,
        }),
      })

      if (!response.ok) {
        throw new Error(await getBackendErrorMessage(response, 'Command planning failed'))
      }

      const data: CommandPlanResponse = await response.json()
      setCommandPlanResult(data)
      scrollToLoadedView(commandPlanPreviewRef)
      setStatusMessage(`Command planned as: ${data.action}.`)
    } catch (err) {
      const message = getErrorMessage(err, 'Command planning failed.')
      setError(message)
      setStatusMessage(message)
    } finally {
      setIsPlanningCommand(false)
    }
  }

  const handlePrepareCommandPlanExecution = async () => {
    if (!commandPlanResult) {
      setError('Please create a command plan before preparing execution.')
      return
    }

    try {
      setIsPreparingCommandPlanExecution(true)
      setError(null)
      setCommandPlanExecutionPrepareResult(null)
      setStatusMessage('Preparing command plan for execution...')

      const response = await fetch('/api/commands/plan/prepare-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: commandPlanResult,
        }),
      })

      if (!response.ok) {
        throw new Error(await getBackendErrorMessage(response, 'Command plan execution preparation failed'))
      }

      const data: CommandPlanExecutionPrepareResponse = await response.json()
      setCommandPlanExecutionPrepareResult(data)
      scrollToLoadedView(commandPlanExecutionPrepareRef)
      setStatusMessage(
        data.executable
          ? 'Command plan is ready for execution.'
          : 'Command plan is blocked before execution.',
      )
    } catch (err) {
      const message = getErrorMessage(err, 'Command plan execution preparation failed.')
      setError(message)
      setStatusMessage(message)
    } finally {
      setIsPreparingCommandPlanExecution(false)
    }
  }

  const handleExecutePreparedCommand = async () => {
    if (!commandPlanExecutionPrepareResult) {
      setError('Please prepare a command plan before executing it.')
      return
    }

    if (
      !commandPlanExecutionPrepareResult.executable ||
      !commandPlanExecutionPrepareResult.prepared_command
    ) {
      setError('Prepared command is not executable.')
      setStatusMessage('Prepared command is blocked before execution.')
      return
    }

    const preparedCommand = commandPlanExecutionPrepareResult.prepared_command
    const preparedAction =
      typeof preparedCommand.action === 'string' ? preparedCommand.action : 'unknown'

    const videoPreparedActions = new Set([
      'detect_frames',
      'extract_frame',
      'extract_frames',
      'track_video',
      'trim_video',
    ])

    const activeImageFilename =
      activeGeneratedImageSource?.filename ?? uploadResult?.stored_filename
    const activeImageMediaSource = activeGeneratedImageSource ? 'outputs' : 'uploads'
    const activeFilename = videoPreparedActions.has(preparedAction)
      ? videoUploadResult?.stored_filename
      : activeImageFilename
    const activeMediaSource = videoPreparedActions.has(preparedAction)
      ? 'uploads'
      : activeImageMediaSource

    if (!activeFilename) {
      setError(
        videoPreparedActions.has(preparedAction)
          ? 'Please upload a video before executing this prepared command.'
          : 'Please upload an image or choose a generated output as the active image before executing this prepared command.',
      )
      return
    }

    try {
      setIsExecutingPreparedCommand(true)
      setError(null)
      setStatusMessage(`Executing prepared command: ${preparedAction}...`)

      const response = await fetch('/api/commands/execute-prepared', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: activeFilename,
          command: commandText.trim() || 'prepared_command',
          confidence_threshold: confidenceThreshold / 100,
          prepared_command: preparedCommand,
            media_source: activeMediaSource,
        }),
      })

      if (!response.ok) {
        throw new Error(await getBackendErrorMessage(response, 'Prepared command execution failed'))
      }

      const data: CommandResponse = await response.json()
      setCommandResult(data)
      scrollToCommandOutputView(data.result_type)

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

      if (data.result_type === 'zoom_by_class') {
        const result = data.result as ZoomResponse
        addGeneratedOutputHistoryItem({
          action: 'zoom',
          label: 'Zoomed output',
          filename: result.zoomed_filename,
          file_url: result.zoomed_file_url,
          source: 'outputs',
          source_filename: result.filename,
        })
        setCropResult(null)
        setBlurResult(null)
      }

        addNonZoomCommandGeneratedOutputToHistory(data)

      setStatusMessage(`Executed prepared command as: ${data.result_type}.`)
    } catch (err) {
      const message = getErrorMessage(err, 'Prepared command execution failed.')
      setError(message)
      setStatusMessage(message)
    } finally {
      setIsExecutingPreparedCommand(false)
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
      scrollToLoadedView(parserComparisonRef)
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

  const handleLoadPlannerComparison = async () => {
    try {
      setIsLoadingPlannerComparison(true)
      setError(null)
      setStatusMessage('Loading planner comparison...')

      const queryParams = new URLSearchParams()

      if (includeRealLlmEvaluationInDashboard) {
        queryParams.set('include_real_llm', 'true')
      }

      const queryString = queryParams.toString()
      const response = await fetch(
        `/api/commands/plan/evaluate/compare${queryString ? `?${queryString}` : ''}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load planner comparison')
      }

      const data: PlannerComparisonResponse = await response.json()
      setPlannerComparisonResult(data)
      scrollToLoadedView(plannerComparisonRef)
      setStatusMessage(
        `Loaded planner comparison for ${data.planner_modes.length} planner mode(s).`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load planner comparison.')
    } finally {
      setIsLoadingPlannerComparison(false)
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
      scrollToLoadedView(parsedCommandValidationRef)
      setStatusMessage('Parsed command JSON is valid.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Parsed command validation failed.')
    } finally {
      setIsValidatingParsedCommand(false)
    }
  }

  const handleExportLocalParserAttemptLogs = () => {
    if (!parserAttemptLogsResult || sortedLocalParserAttemptLogs.length === 0) {
      const exportMessage = 'No local parser attempt logs to export for the selected filters.'
      setLocalParserAttemptExportNotice(exportMessage)
      setStatusMessage(exportMessage)
      return
    }

    const headers = [
      'timestamp',
      'command',
      'success',
      'parser_mode',
      'parser_type',
      'parser_version',
      'latency_ms',
      'error',
      'parsed_command',
    ]

    const escapeCsvValue = (value: unknown) => {
      const stringValue =
        typeof value === 'string'
          ? value
          : value === null || value === undefined
            ? ''
            : JSON.stringify(value)

      return `"${stringValue.replace(/"/g, '""')}"`
    }

    const rows = sortedLocalParserAttemptLogs.map((log) => [
      log.timestamp,
      log.command,
      String(log.success),
      log.parser_mode,
      log.parser_type ?? '',
      log.parser_version ?? '',
      log.latency_ms,
      log.error ?? '',
      log.parsed_command ?? '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const exportFileName = `local_parser_attempt_logs_mode-${localParserAttemptModeFilter}_result-${localParserAttemptResultFilter}.csv`

    link.href = downloadUrl
    link.download = exportFileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    const exportMessage = `Exported ${sortedLocalParserAttemptLogs.length} local parser attempt row(s) to ${exportFileName}.`

    setLocalParserAttemptResetNotice('')
    setLocalParserAttemptExportNotice(exportMessage)
    setStatusMessage(exportMessage)
  }

  const handleLoadParserAttemptLogs = async () => {
    try {
      setIsLoadingParserAttemptLogs(true)
      setError(null)
      setLocalParserAttemptResetNotice('')
      setLocalParserAttemptExportNotice('')
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
      setDatabaseParserResetNotice('')
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

  const llmOpsCommandLogSummary = llmOpsDashboardResult?.command_log_summary ?? null
  const llmOpsParserAttemptSummary = llmOpsDashboardResult?.parser_attempt_summary ?? null
  const llmOpsProviderStatus = llmOpsDashboardResult?.provider_status ?? null
  const llmOpsParserEvaluation = llmOpsDashboardResult?.parser_evaluation ?? null
  const llmOpsPlannerEvaluation = llmOpsDashboardResult?.planner_evaluation ?? null

  const llmOpsHasLegacyCommandParserMetadata = llmOpsCommandLogSummary
    ? llmOpsCommandLogSummary.by_parser_mode.some((item) => item.name === 'unknown')
    : false

  const llmOpsHasLegacyParserAttemptMode = llmOpsParserAttemptSummary
    ? llmOpsParserAttemptSummary.by_parser_mode.some((item) => item.parser_mode === 'llm')
    : false

  const loadedObservabilityViewNames = [
    commandPromptPreviewResult ? 'LLM Prompt Preview' : null,
    commandPlannerPromptPreviewResult ? 'Planner Prompt Preview' : null,
    commandParseResult ? 'Parsed Command Preview' : null,
    commandPlanResult ? 'Command Plan Preview' : null,
    commandPlanExecutionPrepareResult ? 'Prepared Execution Preview' : null,
    parsedCommandValidationResult ? 'Parsed Command Validation' : null,
    commandResult ? 'Command Result' : null,
    databaseParserAttemptLogsResult ? 'DB Parser Logs' : null,
    hasLoadedCommandLogs ? 'Command History' : null,
    commandLogSummary ? 'Command Summary' : null,
    commandEvaluationResult ? 'Parser Evaluation' : null,
    parserComparisonResult ? 'Parser Comparison' : null,
    plannerComparisonResult ? 'Planner Comparison' : null,
    parserAttemptLogsResult ? 'Local Parser Attempt Logs' : null,
    databaseParserAttemptSummaryResult ? 'DB Parser Summary' : null,
    llmProviderStatusResult ? 'LLM Provider Status' : null,
    llmOpsDashboardLoaded ? 'LLMOps Dashboard' : null,
  ].filter((name): name is string => Boolean(name))

  const loadedObservabilityViewCount = loadedObservabilityViewNames.length
  const hasAnyLoadedObservabilityView = loadedObservabilityViewCount > 0

  const clearAllLoadedObservabilityViews = () => {
    setCommandPromptPreviewResult(null)
    setCommandParseResult(null)
    setParsedCommandValidationResult(null)
    setCommandResult(null)

    setDatabaseParserAttemptLogsResult(null)
    setDatabaseParserLogSearch('')
    setDatabaseParserLogSortOrder('newest')
    setDatabaseParserExportNotice('')
    setDatabaseParserLogViewResetNotice('')

    setCommandLogs([])
    setHasLoadedCommandLogs(false)
    setCommandHistorySearch('')
    setCommandHistorySortOrder('newest')

    setCommandLogSummary(null)
    setCommandEvaluationResult(null)
    setParserComparisonResult(null)
    setPlannerComparisonResult(null)

    setParserAttemptLogsResult(null)
    setLocalParserAttemptModeFilter('all')
    setLocalParserAttemptResultFilter('all')
    setLocalParserAttemptSearch('')
    setLocalParserAttemptSortOrder('newest')
    setLocalParserAttemptResetNotice('')
    setLocalParserAttemptExportNotice('')

    setDatabaseParserAttemptSummaryResult(null)
    setLlmProviderStatusResult(null)
    setLlmOpsDashboardLoaded(false)
  }

  const handleResetParserFilters = () => {
    setDatabaseParserLogParserModeFilter('all')
    setDatabaseParserLogSuccessFilter('all')
    setDatabaseParserLogLimit('10')
    setDatabaseParserLogSearch('')
    setDatabaseParserLogSortOrder('newest')
    setDatabaseParserAttemptLogsResult(null)
    setDatabaseParserAttemptSummaryResult(null)
    setDatabaseParserLogSearch('')
    setDatabaseParserLogSortOrder('newest')
    setDatabaseParserExportNotice('')
    setDatabaseParserResetNotice('')
    setLlmOpsDashboardLoaded(false)
    setDatabaseParserResetNotice('Parser filters reset.')
    setStatusMessage('Parser filters reset.')
  }

  const clearDatabaseParserResultsForFilterChange = () => {
    setDatabaseParserAttemptLogsResult(null)
    setDatabaseParserAttemptSummaryResult(null)
    setDatabaseParserLogSearch('')
    setDatabaseParserExportNotice('')
    setDatabaseParserResetNotice('')
    setLlmOpsDashboardLoaded(false)
  }

  const handleExportVisibleDatabaseParserAttemptLogs = () => {
    if (!databaseParserAttemptLogsResult || sortedDatabaseParserAttemptLogs.length === 0) {
      const exportMessage = 'No visible DB parser logs to export for the current search and sort.'
      setDatabaseParserExportNotice(exportMessage)
      setStatusMessage(exportMessage)
      return
    }

    const headers = [
      'timestamp',
      'command',
      'success',
      'parser_mode',
      'parser_type',
      'parser_version',
      'latency_ms',
      'error',
      'parsed_command',
    ]

    const escapeCsvValue = (value: unknown) => {
      const stringValue =
        typeof value === 'string'
          ? value
          : value === null || value === undefined
            ? ''
            : JSON.stringify(value)

      return `"${stringValue.replace(/"/g, '""')}"`
    }

    const rows = sortedDatabaseParserAttemptLogs.map((log) => [
      log.timestamp,
      log.command,
      String(log.success),
      log.parser_mode,
      log.parser_type ?? '',
      log.parser_version ?? '',
      log.latency_ms,
      log.error ?? '',
      log.parsed_command ?? '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\n')

    const searchPart = databaseParserLogSearch.trim()
      ? `search-${databaseParserLogSearch.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      : 'search-none'

    const exportFileName = `visible_db_parser_logs_mode-${databaseParserLogParserModeFilter}_result-${databaseParserLogSuccessFilter}_limit-${databaseParserLogLimit}_${searchPart}_sort-${databaseParserLogSortOrder}.csv`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = downloadUrl
    link.download = exportFileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    const exportMessage = `Exported ${sortedDatabaseParserAttemptLogs.length} visible DB parser log row(s) to ${exportFileName}.`

    setDatabaseParserResetNotice('')
    setDatabaseParserExportNotice(exportMessage)
    setStatusMessage(exportMessage)
  }

  const handleExportDatabaseParserAttemptLogs = async () => {
    try {
      setError(null)
      setDatabaseParserExportNotice('')
      setDatabaseParserResetNotice('')
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

      const exportedRowCount = response.headers.get('X-Parser-Logs-Count') ?? databaseParserLogLimit
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      const exportFileName = `parser_attempt_logs_mode-${databaseParserLogParserModeFilter}_result-${databaseParserLogSuccessFilter}_limit-${databaseParserLogLimit}.csv`

      link.href = downloadUrl
      link.download = exportFileName
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(downloadUrl)

      const exportMessage = `Exported ${exportedRowCount} parser attempt row(s) to ${exportFileName}.`

      setDatabaseParserExportNotice(exportMessage)
      setStatusMessage(exportMessage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not export PostgreSQL parser attempt logs.')
    }
  }

  const handleLoadDatabaseParserAttemptLogs = async () => {
    try {
      setIsLoadingDatabaseParserAttemptLogs(true)
      setError(null)
      setDatabaseParserLogSearch('')
      setDatabaseParserLogSortOrder('newest')
      setDatabaseParserExportNotice('')
      setDatabaseParserResetNotice('')
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
      setDatabaseParserExportNotice('')
      setDatabaseParserResetNotice('')
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
      setDatabaseParserResetNotice('')
      setLlmOpsDashboardLoaded(false)
      setLlmOpsDashboardResult(null)
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

      setLlmOpsDashboardResult(data)
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

    const activeImageFilename =
      activeGeneratedImageSource?.filename ?? uploadResult?.stored_filename
    const activeImageMediaSource = activeGeneratedImageSource ? 'outputs' : 'uploads'
    const activeFilename = isVideoCommand
      ? videoUploadResult?.stored_filename
      : activeImageFilename
    const activeMediaSource = isVideoCommand ? 'uploads' : activeImageMediaSource

    if (!activeFilename) {
      setError(
        isVideoCommand
          ? 'Please upload a video before running this command.'
          : 'Please upload an image or choose a generated output as the active image before running this command.',
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
            media_source: activeMediaSource,
        }),
      })

      if (!response.ok) {
        throw new Error(await getBackendErrorMessage(response, 'Command failed'))
      }

      const data: CommandResponse = await response.json()
      setCommandResult(data)
      scrollToCommandOutputView(data.result_type)

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

      if (data.result_type === 'zoom_by_class') {
        const result = data.result as ZoomResponse
        addGeneratedOutputHistoryItem({
          action: 'zoom',
          label: 'Zoomed output',
          filename: result.zoomed_filename,
          file_url: result.zoomed_file_url,
          source: 'outputs',
          source_filename: result.filename,
        })
        setCropResult(null)
        setBlurResult(null)
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

        addNonZoomCommandGeneratedOutputToHistory(data)

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

  const getLocalParserAttemptSearchMatchFields = (log: ParserAttemptLogEntry) => {
    const normalizedSearch = localParserAttemptSearch.trim().toLowerCase()

    if (normalizedSearch.length === 0) {
      return []
    }

    const searchableFields = [
      { label: 'timestamp', value: log.timestamp },
      { label: 'command', value: log.command },
      { label: 'parser mode', value: log.parser_mode },
      { label: 'parser type', value: log.parser_type },
      { label: 'parser version', value: log.parser_version },
      { label: 'status', value: log.success ? 'success' : 'failed' },
      { label: 'latency', value: String(log.latency_ms) },
      { label: 'error', value: log.error },
      {
        label: 'parsed command',
        value: log.parsed_command ? JSON.stringify(log.parsed_command) : null,
      },
    ]

    return searchableFields
      .filter((field) => (field.value ?? '').toLowerCase().includes(normalizedSearch))
      .map((field) => field.label)
  }


  const filteredLocalParserAttemptLogs = parserAttemptLogsResult
    ? parserAttemptLogsResult.logs.filter((log) => {
        const normalizedSearch = localParserAttemptSearch.trim().toLowerCase()

        const matchesMode =
          localParserAttemptModeFilter === 'all' ||
          log.parser_mode === localParserAttemptModeFilter

        const matchesResult =
          localParserAttemptResultFilter === 'all' ||
          (localParserAttemptResultFilter === 'success' && log.success) ||
          (localParserAttemptResultFilter === 'failed' && !log.success)

        const matchesSearch =
          normalizedSearch.length === 0 ||
          getLocalParserAttemptSearchMatchFields(log).length > 0

        return matchesMode && matchesResult && matchesSearch
      })
    : []

  const sortedLocalParserAttemptLogs = [...filteredLocalParserAttemptLogs].sort((firstLog, secondLog) => {
    if (localParserAttemptSortOrder === 'oldest') {
      return new Date(firstLog.timestamp).getTime() - new Date(secondLog.timestamp).getTime()
    }

    if (localParserAttemptSortOrder === 'latency_desc') {
      return secondLog.latency_ms - firstLog.latency_ms
    }

    if (localParserAttemptSortOrder === 'latency_asc') {
      return firstLog.latency_ms - secondLog.latency_ms
    }

    if (localParserAttemptSortOrder === 'command_az') {
      return firstLog.command.localeCompare(secondLog.command)
    }

    return new Date(secondLog.timestamp).getTime() - new Date(firstLog.timestamp).getTime()
  })

  const getCommandHistorySearchMatchFields = (log: CommandLog) => {
    const normalizedSearch = commandHistorySearch.trim().toLowerCase()

    if (normalizedSearch.length === 0) {
      return []
    }

    const searchableFields = [
      { label: 'timestamp', value: log.timestamp },
      { label: 'filename', value: log.filename },
      { label: 'command', value: log.command },
      { label: 'parsed action', value: log.parsed_action },
      { label: 'parsed class', value: log.parsed_class },
      { label: 'result type', value: log.result_type },
      { label: 'parser mode', value: log.parser_mode },
      { label: 'parser type', value: log.parser_type },
      { label: 'parser version', value: log.parser_version },
    ]

    return searchableFields
      .filter((field) => (field.value ?? '').toLowerCase().includes(normalizedSearch))
      .map((field) => field.label)
  }

  const filteredCommandHistoryLogs = commandLogs
    .filter((log) => {
      const normalizedSearch = commandHistorySearch.trim().toLowerCase()

      return (
        normalizedSearch.length === 0 ||
        getCommandHistorySearchMatchFields(log).length > 0
      )
    })
    .sort((a, b) => {
      if (commandHistorySortOrder === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      }

      if (commandHistorySortOrder === 'command_az') {
        return a.command.localeCompare(b.command)
      }

      if (commandHistorySortOrder === 'parser_mode_az') {
        return (a.parser_mode ?? 'unknown').localeCompare(b.parser_mode ?? 'unknown')
      }

      if (commandHistorySortOrder === 'result_type_az') {
        return a.result_type.localeCompare(b.result_type)
      }

      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

  const visibleCommandHistorySummary = filteredCommandHistoryLogs.length > 0
    ? {
        total: filteredCommandHistoryLogs.length,
        byParserMode: Object.entries(
          filteredCommandHistoryLogs.reduce<Record<string, number>>((summary, log) => {
            const parserMode = log.parser_mode || 'unknown'
            summary[parserMode] = (summary[parserMode] || 0) + 1
            return summary
          }, {})
        ).sort((a, b) => b[1] - a[1]),
        byResultType: Object.entries(
          filteredCommandHistoryLogs.reduce<Record<string, number>>((summary, log) => {
            const resultType = log.result_type || 'unknown'
            summary[resultType] = (summary[resultType] || 0) + 1
            return summary
          }, {})
        ).sort((a, b) => b[1] - a[1]),
        byParsedAction: Object.entries(
          filteredCommandHistoryLogs.reduce<Record<string, number>>((summary, log) => {
            const parsedAction = log.parsed_action || 'unknown'
            summary[parsedAction] = (summary[parsedAction] || 0) + 1
            return summary
          }, {})
        ).sort((a, b) => b[1] - a[1]),
        byParserType: Object.entries(
          filteredCommandHistoryLogs.reduce<Record<string, number>>((summary, log) => {
            const parserType = log.parser_type || 'unknown'
            summary[parserType] = (summary[parserType] || 0) + 1
            return summary
          }, {})
        ).sort((a, b) => b[1] - a[1]),
        byParserVersion: Object.entries(
          filteredCommandHistoryLogs.reduce<Record<string, number>>((summary, log) => {
            const parserVersion = log.parser_version || 'unknown'
            summary[parserVersion] = (summary[parserVersion] || 0) + 1
            return summary
          }, {})
        ).sort((a, b) => b[1] - a[1]),
      }
    : null

  const getDatabaseParserLogSearchMatchFields = (log: DatabaseParserAttemptLog) => {
    const normalizedSearch = databaseParserLogSearch.trim().toLowerCase()

    if (normalizedSearch.length === 0) {
      return []
    }

    const searchableFields = [
      { label: 'timestamp', value: log.timestamp },
      { label: 'command', value: log.command },
      { label: 'parser mode', value: log.parser_mode },
      { label: 'parser type', value: log.parser_type },
      { label: 'parser version', value: log.parser_version },
      { label: 'status', value: log.success ? 'success' : 'failed' },
      { label: 'latency', value: String(log.latency_ms) },
      { label: 'error', value: log.error },
      {
        label: 'parsed command',
        value: log.parsed_command ? JSON.stringify(log.parsed_command) : null,
      },
    ]

    return searchableFields
      .filter((field) => (field.value ?? '').toLowerCase().includes(normalizedSearch))
      .map((field) => field.label)
  }

  const filteredDatabaseParserAttemptLogs = databaseParserAttemptLogsResult
    ? databaseParserAttemptLogsResult.logs.filter((log) => {
        const normalizedSearch = databaseParserLogSearch.trim().toLowerCase()

        return (
          normalizedSearch.length === 0 ||
          getDatabaseParserLogSearchMatchFields(log).length > 0
        )
      })
    : []

  const sortedDatabaseParserAttemptLogs = [...filteredDatabaseParserAttemptLogs].sort((firstLog, secondLog) => {
    if (databaseParserLogSortOrder === 'oldest') {
      return new Date(firstLog.timestamp).getTime() - new Date(secondLog.timestamp).getTime()
    }

    if (databaseParserLogSortOrder === 'latency_desc') {
      return secondLog.latency_ms - firstLog.latency_ms
    }

    if (databaseParserLogSortOrder === 'latency_asc') {
      return firstLog.latency_ms - secondLog.latency_ms
    }

    if (databaseParserLogSortOrder === 'command_az') {
      return firstLog.command.localeCompare(secondLog.command)
    }

    return new Date(secondLog.timestamp).getTime() - new Date(firstLog.timestamp).getTime()
  })

  const visibleDatabaseParserLogSummary = databaseParserAttemptLogsResult
    ? (() => {
        const parserModeBreakdown = filteredDatabaseParserAttemptLogs.reduce<
          Record<string, { total: number; successful: number; failed: number; latencySum: number }>
        >((breakdown, log) => {
          const parserMode = log.parser_mode || 'unknown'

          if (!breakdown[parserMode]) {
            breakdown[parserMode] = {
              total: 0,
              successful: 0,
              failed: 0,
              latencySum: 0,
            }
          }

          breakdown[parserMode].total += 1
          breakdown[parserMode].latencySum += log.latency_ms

          if (log.success) {
            breakdown[parserMode].successful += 1
          } else {
            breakdown[parserMode].failed += 1
          }

          return breakdown
        }, {})

        const parserTypeBreakdown = filteredDatabaseParserAttemptLogs.reduce<
          Record<string, { total: number; successful: number; failed: number; latencySum: number }>
        >((breakdown, log) => {
          const parserType = log.parser_type || 'unknown'

          if (!breakdown[parserType]) {
            breakdown[parserType] = {
              total: 0,
              successful: 0,
              failed: 0,
              latencySum: 0,
            }
          }

          breakdown[parserType].total += 1
          breakdown[parserType].latencySum += log.latency_ms

          if (log.success) {
            breakdown[parserType].successful += 1
          } else {
            breakdown[parserType].failed += 1
          }

          return breakdown
        }, {})

        const parserErrorBreakdown = filteredDatabaseParserAttemptLogs.reduce<
          Record<string, { total: number; latencySum: number }>
        >((breakdown, log) => {
          const parserError = log.error || 'No error'

          if (!breakdown[parserError]) {
            breakdown[parserError] = {
              total: 0,
              latencySum: 0,
            }
          }

          breakdown[parserError].total += 1
          breakdown[parserError].latencySum += log.latency_ms

          return breakdown
        }, {})

        return {
          total: filteredDatabaseParserAttemptLogs.length,
          successful: filteredDatabaseParserAttemptLogs.filter((log) => log.success).length,
          failed: filteredDatabaseParserAttemptLogs.filter((log) => !log.success).length,
          averageLatencyMs:
            filteredDatabaseParserAttemptLogs.length > 0
              ? filteredDatabaseParserAttemptLogs.reduce((sum, log) => sum + log.latency_ms, 0) /
                filteredDatabaseParserAttemptLogs.length
              : 0,
          byDatabaseParserMode: Object.entries(parserModeBreakdown)
            .map(([parserMode, item]) => ({
              parserMode,
              total: item.total,
              successful: item.successful,
              failed: item.failed,
              averageLatencyMs: item.total > 0 ? item.latencySum / item.total : 0,
            }))
            .sort((a, b) => b.total - a.total),
          byDatabaseParserType: Object.entries(parserTypeBreakdown)
            .map(([parserType, item]) => ({
              parserType,
              total: item.total,
              successful: item.successful,
              failed: item.failed,
              averageLatencyMs: item.total > 0 ? item.latencySum / item.total : 0,
            }))
            .sort((a, b) => b.total - a.total),
          byDatabaseParserError: Object.entries(parserErrorBreakdown)
            .map(([parserError, item]) => ({
              parserError,
              total: item.total,
              averageLatencyMs: item.total > 0 ? item.latencySum / item.total : 0,
            }))
            .sort((a, b) => b.total - a.total),
        }
      })()
    : null

  const localParserAttemptSummary = parserAttemptLogsResult
    ? (() => {
        const parserModeBreakdown = filteredLocalParserAttemptLogs.reduce<
          Record<string, { total: number; successful: number; failed: number; latencySum: number }>
        >((breakdown, log) => {
          const parserMode = log.parser_mode || 'unknown'

          if (!breakdown[parserMode]) {
            breakdown[parserMode] = {
              total: 0,
              successful: 0,
              failed: 0,
              latencySum: 0,
            }
          }

          breakdown[parserMode].total += 1
          breakdown[parserMode].latencySum += log.latency_ms

          if (log.success) {
            breakdown[parserMode].successful += 1
          } else {
            breakdown[parserMode].failed += 1
          }

          return breakdown
        }, {})

        const parserTypeBreakdown = filteredLocalParserAttemptLogs.reduce<
          Record<string, { total: number; successful: number; failed: number; latencySum: number }>
        >((breakdown, log) => {
          const parserType = log.parser_type || 'unknown'

          if (!breakdown[parserType]) {
            breakdown[parserType] = {
              total: 0,
              successful: 0,
              failed: 0,
              latencySum: 0,
            }
          }

          breakdown[parserType].total += 1
          breakdown[parserType].latencySum += log.latency_ms

          if (log.success) {
            breakdown[parserType].successful += 1
          } else {
            breakdown[parserType].failed += 1
          }

          return breakdown
        }, {})

        const parserErrorBreakdown = filteredLocalParserAttemptLogs.reduce<
          Record<string, { total: number; latencySum: number }>
        >((breakdown, log) => {
          const parserError = log.error || 'No error'

          if (!breakdown[parserError]) {
            breakdown[parserError] = {
              total: 0,
              latencySum: 0,
            }
          }

          breakdown[parserError].total += 1
          breakdown[parserError].latencySum += log.latency_ms

          return breakdown
        }, {})

        return {
          total: filteredLocalParserAttemptLogs.length,
          successful: filteredLocalParserAttemptLogs.filter((log) => log.success).length,
          failed: filteredLocalParserAttemptLogs.filter((log) => !log.success).length,
          averageLatencyMs:
            filteredLocalParserAttemptLogs.length > 0
              ? filteredLocalParserAttemptLogs.reduce((sum, log) => sum + log.latency_ms, 0) /
                filteredLocalParserAttemptLogs.length
              : 0,
          byParserMode: Object.entries(parserModeBreakdown)
            .map(([parserMode, item]) => ({
              parserMode,
              total: item.total,
              successful: item.successful,
              failed: item.failed,
              averageLatencyMs: item.total > 0 ? item.latencySum / item.total : 0,
            }))
            .sort((a, b) => b.total - a.total),
          byParserType: Object.entries(parserTypeBreakdown)
            .map(([parserType, item]) => ({
              parserType,
              total: item.total,
              successful: item.successful,
              failed: item.failed,
              averageLatencyMs: item.total > 0 ? item.latencySum / item.total : 0,
            }))
            .sort((a, b) => b.total - a.total),
          byParserError: Object.entries(parserErrorBreakdown)
            .map(([parserError, item]) => ({
              parserError,
              total: item.total,
              averageLatencyMs: item.total > 0 ? item.latencySum / item.total : 0,
            }))
            .sort((a, b) => b.total - a.total),
        }
      })()
    : null

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

  const getCommandSummaryBarWidth = (
    count: number,
    items: CommandLogSummaryItem[],
  ) => {
    const maxCount = Math.max(1, ...items.map((item) => item.count))
    return `${Math.max(6, Math.round((count / maxCount) * 100))}%`
  }

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
    isGeneratedOutputHistoryDetecting ||
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
    isLoadingPlannerComparison ||
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

  const showWorkspaceRecoveryBanner =
    workspaceLocalBackupPreview !== null &&
    !hasWorkspaceSnapshotResults &&
    workspaceClearUndoSnapshot === null &&
    !isWorkspaceRecoveryBannerDismissed

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

      {showWorkspaceRecoveryBanner && workspaceLocalBackupPreview && (
        <section className="workspace-recovery-banner" aria-label="Local workspace recovery">
          <div>
            <strong>Local workspace backup available</strong>
            <p>
              Restore {workspaceLocalBackupPreview.loadedResultCount} saved result view(s)
              from {workspaceLocalBackupPreview.savedAt}.
            </p>

            <div className="workspace-recovery-banner-chips">
              {workspaceLocalBackupPreview.resultViews.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          <div className="workspace-recovery-banner-actions">
            <button
              className="secondary-button workspace-recovery-banner-restore-button"
              onClick={handleLoadLocalWorkspaceSnapshot}
              disabled={isBusy}
              type="button"
            >
              Restore Local Workspace
            </button>

            <button
              className="workspace-recovery-banner-dismiss-button"
              onClick={() => setIsWorkspaceRecoveryBannerDismissed(true)}
              disabled={isBusy}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {workspaceClearUndoSnapshot && workspaceClearUndoPreview && (
        <section className="workspace-undo-clear-panel" aria-label="Undo cleared workspace">
          <div>
            <strong>Undo clear available</strong>
            <p>
              Restore {workspaceClearUndoPreview.loadedResultCount} cleared workspace result view(s).
            </p>

            <div className="workspace-undo-clear-chips">
              {workspaceClearUndoPreview.resultViews.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          <button
            className="secondary-button workspace-undo-clear-button"
            onClick={handleUndoClearWorkspaceViews}
            disabled={isBusy}
            type="button"
          >
            Undo Clear Workspace
          </button>
        </section>
      )}

      <details className="workspace-snapshot-import-panel">
        <summary>Import Workspace Snapshot JSON</summary>

        <div className="workspace-snapshot-import-content">
          <p className="small-note">
            Restore a previously downloaded VisionCommand workspace snapshot. Restoring replaces the current loaded result views.
          </p>

          <div className="workspace-snapshot-import-actions">
            <input
              className="file-input workspace-snapshot-import-input"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void handleWorkspaceSnapshotImportChange(event)}
              disabled={isBusy}
            />

            <button
              className="secondary-button workspace-snapshot-import-restore-button"
              onClick={handleRestoreWorkspaceSnapshot}
              disabled={isBusy || !workspaceSnapshotImportData}
              type="button"
            >
              Restore Workspace
            </button>
          </div>

          {workspaceSnapshotImportPreview && (
            <div className="workspace-snapshot-import-preview">
              <div>
                <span>File</span>
                <strong>{workspaceSnapshotImportPreview.fileName}</strong>
              </div>

              <div>
                <span>Contains</span>
                <strong>{workspaceSnapshotImportPreview.loadedResultCount} result view(s)</strong>
              </div>

              <div>
                <span>Active view</span>
                <strong>{workspaceSnapshotImportPreview.activeResultView ?? 'None'}</strong>
              </div>

              <div className="workspace-snapshot-import-preview-chips">
                {workspaceSnapshotImportPreview.resultViews.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          )}

          {workspaceSnapshotImportNotice && (
            <p className="workspace-snapshot-import-notice">{workspaceSnapshotImportNotice}</p>
          )}

          {workspaceSnapshotImportError && (
            <p className="workspace-snapshot-import-error">{workspaceSnapshotImportError}</p>
          )}
        </div>
      </details>

      <details className="workspace-local-backup-panel">
        <summary>Local Workspace Backup</summary>

        <div className="workspace-local-backup-content">
          <p className="small-note">
            Save the current workspace in this browser, or restore the last local backup after clearing the workspace.
          </p>

          <div className="workspace-local-backup-status">
            <span>Automatic local backup</span>
            <strong>
              {workspaceLocalBackupAutoSavedAt
                ? `Last saved at ${workspaceLocalBackupAutoSavedAt}`
                : hasWorkspaceSnapshotResults
                  ? 'Waiting for workspace changes'
                  : 'No loaded views to auto-save'}
            </strong>
          </div>

          {workspaceLocalBackupPreview ? (
            <div className="workspace-local-backup-preview">
              <div className="workspace-local-backup-preview-header">
                <div>
                  <span>Local backup available</span>
                  <strong>{workspaceLocalBackupPreview.loadedResultCount} result view(s)</strong>
                </div>

                <div>
                  <span>Saved at</span>
                  <strong>{workspaceLocalBackupPreview.savedAt}</strong>
                </div>

                <div>
                  <span>Size</span>
                  <strong>{workspaceLocalBackupPreview.size}</strong>
                </div>

                <div>
                  <span>Active view</span>
                  <strong>{workspaceLocalBackupPreview.activeResultView ?? 'None'}</strong>
                </div>
              </div>

              <div className="workspace-local-backup-preview-chips">
                {workspaceLocalBackupPreview.resultViews.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="workspace-local-backup-empty">
              No saved local backup found in this browser yet.
            </p>
          )}

          <div className="workspace-local-backup-actions" aria-label="Local workspace backup actions">
            <button
              className="workspace-snapshot-button"
              onClick={handleSaveWorkspaceLocally}
              disabled={isBusy || !hasWorkspaceSnapshotResults}
              type="button"
            >
              Save Workspace Locally
            </button>

            <button
              className="workspace-snapshot-button"
              onClick={handleLoadLocalWorkspaceSnapshot}
              disabled={isBusy}
              type="button"
            >
              Load Local Workspace
            </button>

            <button
              className="workspace-snapshot-button"
              onClick={handleClearLocalWorkspaceBackup}
              disabled={isBusy}
              type="button"
            >
              Clear Local Workspace Backup
            </button>
          </div>

          {workspaceLocalBackupNotice && (
            <p className="workspace-local-backup-notice">{workspaceLocalBackupNotice}</p>
          )}

          {workspaceLocalBackupError && (
            <p className="workspace-local-backup-error">{workspaceLocalBackupError}</p>
          )}
        </div>
      </details>

      {workspaceResultNavigatorItems.length > 0 && (
        <>
            <div
              className={
                isWorkspaceQuickJumpOpen
                  ? 'workspace-result-navigator-shell open'
                  : 'workspace-result-navigator-shell'
              }
            >
              <button
                className="workspace-result-navigator-fab"
                onClick={() => setIsWorkspaceQuickJumpOpen((isOpen) => !isOpen)}
                disabled={isBusy}
                type="button"
                aria-expanded={isWorkspaceQuickJumpOpen}
                aria-label="Toggle workspace quick jump"
              >
                <span className="workspace-result-navigator-fab-icon">↕</span>
                <span>{workspaceResultNavigatorItems.length} open</span>
              </button>

              {isWorkspaceQuickJumpOpen && (
                <section className="workspace-result-navigator" aria-label="Loaded result views">
                  <div className="workspace-result-navigator-header">
                    <div>
                      <span className="workspace-result-navigator-eyebrow">Workspace quick jump</span>
                      <h2>Loaded views</h2>
                    </div>

                    <div className="workspace-result-navigator-header-actions">
                      <span className="workspace-result-navigator-count">
                        {workspaceResultNavigatorItems.length} open
                      </span>

                      <button
                        className="workspace-result-navigator-collapse-button"
                        onClick={() => setIsWorkspaceQuickJumpOpen(false)}
                        disabled={isBusy}
                        type="button"
                      >
                        Collapse
                      </button>
                    </div>
                  </div>

                  <div className="workspace-result-navigator-buttons">
                    {workspaceResultNavigatorItems.map((item) => (
                      <button
                        key={item}
                        className={
                          activeWorkspaceResultLabel === item
                            ? 'workspace-result-navigator-button active'
                            : 'workspace-result-navigator-button'
                        }
                        onClick={() => {
                          handleWorkspaceResultNavigatorClick(item)
                          setIsWorkspaceQuickJumpOpen(false)
                        }}
                        disabled={isBusy}
                        type="button"
                        aria-current={activeWorkspaceResultLabel === item ? 'true' : undefined}
                      >
                        <span className="workspace-result-navigator-dot"></span>
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

          <section className="workspace-snapshot-panel" aria-label="Workspace snapshot export">
            <div className="workspace-snapshot-compact" aria-label="Workspace snapshot summary">
              <span>
                Snapshot: <strong>{workspaceResultNavigatorItems.length}</strong> view(s)
              </span>
              <span>
                Active: <strong>{activeWorkspaceResultLabel ?? 'None'}</strong>
              </span>
              <span>
                Size: <strong>{workspaceSnapshotEstimatedSize}</strong>
              </span>
            </div>

            <details className="workspace-snapshot-details">
              <summary>Show snapshot details</summary>

              <div className="workspace-snapshot-details-content">
                <p>
                  File: <strong>{workspaceSnapshotFileName}</strong>
                </p>

                <div className="workspace-snapshot-preview-included">
                  <span>Included</span>
                  <div>
                    {workspaceResultNavigatorItems.map((item) => (
                      <span key={item} className="workspace-snapshot-preview-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </details>

            <div className="workspace-snapshot-actions" aria-label="Workspace snapshot actions">
              <button
                className="workspace-snapshot-button"
                onClick={() =>
                  void handleCopyParserLogJson(
                    workspaceSnapshot,
                    'workspace-snapshot-json',
                  )
                }
                disabled={isBusy}
                type="button"
              >
                {copiedParserLogJsonKey === 'workspace-snapshot-json'
                  ? 'Copied Workspace Snapshot'
                  : failedParserLogJsonKey === 'workspace-snapshot-json'
                    ? 'Copy Failed'
                    : 'Copy Workspace Snapshot JSON'}
              </button>

              <button
                className="workspace-snapshot-button"
                onClick={() => {
                  handleDownloadJsonFile(
                    workspaceSnapshot,
                    workspaceSnapshotFileName,
                    'download-workspace-snapshot-json',
                  )
                  setDownloadedParserLogJsonKey('download-workspace-snapshot-json')

                  window.setTimeout(() => {
                    setDownloadedParserLogJsonKey((currentKey) =>
                      currentKey === 'download-workspace-snapshot-json' ? '' : currentKey,
                    )
                  }, 2500)
                }}
                disabled={isBusy}
                type="button"
              >
                {downloadedParserLogJsonKey === 'download-workspace-snapshot-json'
                  ? 'Downloaded Workspace Snapshot'
                  : 'Download Workspace Snapshot JSON'}
              </button>
            </div>

          </section>
        </>
      )}

      <DatabaseDashboardSection
        databaseStats={databaseStats}
        modelInfo={modelInfo}
        modelClasses={modelClasses}
        detectionSummary={detectionSummary}
        inferenceSummary={inferenceSummary}
        inferenceLogs={inferenceLogs}
        detectionLogs={detectionLogs}
        visibleModelClasses={visibleModelClasses}
        visibleClassAliases={visibleClassAliases}
        modelClassSearch={modelClassSearch}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        isBusy={isBusy}
        isLoadingStats={isLoadingStats}
        isLoadingModelInfo={isLoadingModelInfo}
        isLoadingModelClasses={isLoadingModelClasses}
        isLoadingDetections={isLoadingDetections}
        isLoadingDetectionSummary={isLoadingDetectionSummary}
        isLoadingInferenceLogs={isLoadingInferenceLogs}
        isLoadingInferenceSummary={isLoadingInferenceSummary}
        hasLoadedDashboardViews={hasLoadedDashboardViews}
        hasLoadedWorkspaceViews={hasLoadedWorkspaceViews}
        onLoadDatabaseStats={handleLoadDatabaseStats}
        onLoadModelInfo={handleLoadModelInfo}
        onLoadModelClasses={handleLoadModelClasses}
        onLoadDetectionLogs={handleLoadDetectionLogs}
        onLoadDetectionSummary={handleLoadDetectionSummary}
        onLoadInferenceLogs={handleLoadInferenceLogs}
        onLoadInferenceSummary={handleLoadInferenceSummary}
        onClearDashboardViews={handleClearDashboardViews}
        onClearAllWorkspaceViews={handleClearAllWorkspaceViews}
        onModelClassSearchChange={setModelClassSearch}
        onClearModelInfo={() => {
          setModelInfo(null)
          setStatusMessage('Model Information view cleared.')
        }}
        onClearModelClasses={() => {
          setModelClasses(null)
          setModelClassSearch('')
          setStatusMessage('Supported Model Classes view cleared.')
        }}
        onClearDatabaseStats={() => {
          setDatabaseStats(null)
          setStatusMessage('Database Stats view cleared.')
        }}
        onClearDetectionSummary={() => {
          setDetectionSummary(null)
          setStatusMessage('Detection Summary view cleared.')
        }}
        onClearInferenceSummary={() => {
          setInferenceSummary(null)
          setStatusMessage('Inference Summary view cleared.')
        }}
        onClearInferenceLogs={() => {
          setInferenceLogs([])
          setStatusMessage('Inference Logs view cleared.')
        }}
        onClearDetectionLogs={() => {
          setDetectionLogs([])
          setStatusMessage('Detection History view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <ImageUploadMediaHistorySection
        selectedFile={selectedFile}
        uploadResult={uploadResult}
        mediaFiles={mediaFiles}
        isBusy={isBusy}
        isUploading={isUploading}
        isDetecting={isDetecting}
        isLoadingMediaFiles={isLoadingMediaFiles}
        error={error}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onFileChange={handleFileChange}
        onUpload={handleUpload}
        onDetection={handleDetection}
        onLoadMediaFiles={handleLoadMediaFiles}
        onClearMediaHistory={() => {
          setMediaFiles([])
          setStatusMessage('Uploaded Media History view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
        onUseMediaFile={handleUseMediaFile}
      />

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

          <div className="parser-mode-selector">
            <label htmlFor="planner-mode">Planner mode</label>

            <select
              id="planner-mode"
              value={selectedPlannerMode}
              onChange={(event) => {
                const nextPlannerMode = event.target.value as PlannerMode

                setSelectedPlannerMode(nextPlannerMode)

                if (
                  nextPlannerMode === 'real_llm' &&
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

            <p className="small-note">
              Planner mode converts the command into a structured action plan before execution.
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
                onClick={handlePlanCommand}
                disabled={isBusy || !commandText.trim()}
              >
                {isPlanningCommand ? 'Planning...' : 'Plan Command'}
              </button>

              <button
                className="secondary-button"
                onClick={handleLoadPlannerPromptPreview}
                disabled={isBusy || !commandText.trim()}
              >
                {isLoadingPlannerPromptPreview ? 'Loading planner prompt...' : 'Preview Planner Prompt'}
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
                onChange={(event) => {
                  setCommandHistoryParserModeFilter(event.target.value)
                  setCommandHistorySearch('')
                  clearCommandHistoryResultsForFilterChange()
                }}
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
                onChange={(event) => {
                  setCommandHistoryResultTypeFilter(event.target.value)
                  setCommandHistorySearch('')
                  clearCommandHistoryResultsForFilterChange()
                }}
                disabled={isBusy}
              >
                <option value="all">all</option>
                <option value="annotated_detection">annotated_detection</option>
                <option value="crop_by_class">crop_by_class</option>
                <option value="blur_by_class">blur_by_class</option>
                <option value="blur_all_by_class">blur_all_by_class</option>
                <option value="zoom_by_class">zoom_by_class</option>
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
                onChange={(event) => {
                  setCommandHistoryLimit(event.target.value)
                  setCommandHistorySearch('')
                  clearCommandHistoryResultsForFilterChange()
                }}
                disabled={isBusy}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>

            <p className="small-note command-history-active-filters">
              <strong>Command history filters:</strong> parser = {commandHistoryParserModeFilter}, result type = {commandHistoryResultTypeFilter}, limit = {commandHistoryLimit}
            </p>

            <button
              className="secondary-button"
              onClick={handleResetCommandHistoryFilters}
              disabled={isBusy}
            >
              Reset Command History Filters
            </button>

            {commandHistoryResetNotice && (
              <p className="command-history-reset-notice">
                {commandHistoryResetNotice}
              </p>
            )}

            {commandHistoryExportNotice && (
              <p className="command-history-export-notice">
                {commandHistoryExportNotice}
              </p>
            )}

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
              onClick={handleLoadPlannerComparison}
              disabled={isBusy}
            >
              {isLoadingPlannerComparison ? 'Loading planner comparison...' : 'Load Planner Comparison'}
            </button>

            <button
              className="secondary-button"
              onClick={handleLoadParserAttemptLogs}
              disabled={isBusy}
            >
              {isLoadingParserAttemptLogs ? 'Loading logs...' : 'Load Local Parser Attempt Logs'}
            </button>

            <div className="database-parser-log-filters">
              <label>
                Parser mode
                <select
                  value={databaseParserLogParserModeFilter}
                  onChange={(event) => {
                    setDatabaseParserLogParserModeFilter(event.target.value)
                    clearDatabaseParserResultsForFilterChange()
                  }}
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
                  onChange={(event) => {
                    setDatabaseParserLogSuccessFilter(event.target.value)
                    clearDatabaseParserResultsForFilterChange()
                  }}
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
                  onChange={(event) => {
                    setDatabaseParserLogLimit(event.target.value)
                    clearDatabaseParserResultsForFilterChange()
                  }}
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
                onChange={(event) => {
                  setIncludeRealLlmEvaluationInDashboard(event.target.checked)
                  clearDatabaseParserResultsForFilterChange()
                }}
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

            {databaseParserResetNotice && (
              <p className="database-parser-reset-notice">
                {databaseParserResetNotice}
              </p>
            )}

            {databaseParserExportNotice && (
              <p className="database-parser-export-notice">
                {databaseParserExportNotice}
              </p>
            )}

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

              <button
                className="secondary-button"
                onClick={clearAllLoadedObservabilityViews}
                disabled={isBusy || !hasAnyLoadedObservabilityView}
              >
                Clear All Loaded Views
              </button>

              <p className="loaded-views-status">
                {hasAnyLoadedObservabilityView
                  ? `${loadedObservabilityViewCount} loaded observability view(s) open: ${loadedObservabilityViewNames.join(', ')}.`
                  : 'No loaded observability views open.'}
              </p>
          </div>

          {commandPlannerPromptPreviewResult && (
            <div className="llm-prompt-preview" ref={plannerPromptPreviewRef}>
              <h3>Planner Prompt Preview</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'planner_prompt_preview',
                        copied_at: new Date().toISOString(),
                        command: commandPlannerPromptPreviewResult.command,
                        planner_mode: selectedPlannerMode,
                        prompt_version: commandPlannerPromptPreviewResult.prompt_version,
                        preview: commandPlannerPromptPreviewResult,
                      },
                      'planner-prompt-preview-json',
                      'Copied Planner Prompt Preview JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !commandPlannerPromptPreviewResult}
                >
                  {copiedParserLogJsonKey === 'planner-prompt-preview-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'planner-prompt-preview-json'
                      ? 'Copy failed'
                      : 'Copy Planner Prompt Preview JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'planner_prompt_preview',
                        downloaded_at: new Date().toISOString(),
                        command: commandPlannerPromptPreviewResult.command,
                        planner_mode: selectedPlannerMode,
                        prompt_version: commandPlannerPromptPreviewResult.prompt_version,
                        preview: commandPlannerPromptPreviewResult,
                      },
                      `planner_prompt_preview_mode-${selectedPlannerMode}_version-${commandPlannerPromptPreviewResult.prompt_version.replace(/[^a-z0-9]+/gi, '-')}.json`,
                      'Downloaded Planner Prompt Preview JSON.',
                      'download-planner-prompt-preview-json',
                    )
                  }
                  disabled={isBusy || !commandPlannerPromptPreviewResult}
                  data-testid="download-planner-prompt-preview-json"
                >
                  {downloadedParserLogJsonKey === 'download-planner-prompt-preview-json'
                    ? 'Downloaded!'
                    : 'Download Planner Prompt Preview JSON'}
                </button>

                <button
                  className="secondary-button view-clear-button"
                  onClick={() => {
                    setCommandPlannerPromptPreviewResult(null)
                    setStatusMessage('Planner Prompt Preview view cleared.')
                  }}
                  disabled={isBusy}
                >
                  Clear View
                </button>
              </div>

              <div className="prompt-metadata-grid">
                <div>
                  <span>Planner mode</span>
                  <strong>{selectedPlannerMode}</strong>
                </div>
                <div>
                  <span>Prompt version</span>
                  <strong>{commandPlannerPromptPreviewResult.prompt_version}</strong>
                </div>
              </div>

              <div className="prompt-preview-grid">
                <div className="prompt-block">
                  <h4>System Prompt</h4>
                  <pre>{commandPlannerPromptPreviewResult.system_prompt}</pre>
                </div>

                <div className="prompt-block">
                  <h4>User Prompt</h4>
                  <pre>{commandPlannerPromptPreviewResult.user_prompt}</pre>
                </div>

                <div className="prompt-block">
                  <h4>Expected JSON Schema</h4>
                  <pre>{JSON.stringify(commandPlannerPromptPreviewResult.expected_json_schema, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          {commandPromptPreviewResult && (
            <div className="llm-prompt-preview-panel" ref={llmPromptPreviewRef}>
              <h3>LLM Prompt Preview</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'llm_prompt_preview',
                        copied_at: new Date().toISOString(),
                        parser_mode: commandPromptPreviewResult.parser_mode,
                        prompt_version: commandPromptPreviewResult.prompt_version,
                        preview: commandPromptPreviewResult,
                      },
                      'llm-prompt-preview-json',
                      'Copied LLM Prompt Preview JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !commandPromptPreviewResult}
                >
                  {copiedParserLogJsonKey === 'llm-prompt-preview-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'llm-prompt-preview-json'
                      ? 'Copy failed'
                      : 'Copy LLM Prompt Preview JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'llm_prompt_preview',
                        downloaded_at: new Date().toISOString(),
                        parser_mode: commandPromptPreviewResult.parser_mode,
                        prompt_version: commandPromptPreviewResult.prompt_version,
                        preview: commandPromptPreviewResult,
                      },
                      `llm_prompt_preview_mode-${commandPromptPreviewResult.parser_mode}_version-${commandPromptPreviewResult.prompt_version.replace(/[^a-z0-9]+/gi, '-')}.json`,
                      'Downloaded LLM Prompt Preview JSON.',
                      'download-llm-prompt-preview-json',
                    )
                  }
                  disabled={isBusy || !commandPromptPreviewResult}
                  data-testid="download-llm-prompt-preview-json"
                >
                  {downloadedParserLogJsonKey === 'download-llm-prompt-preview-json'
                    ? 'Downloaded!'
                    : 'Download LLM Prompt Preview JSON'}
                </button>

                <button
                  className="secondary-button view-clear-button"
                  onClick={() => {
                    setCommandPromptPreviewResult(null)
                    setStatusMessage('LLM Prompt Preview view cleared.')
                  }}
                  disabled={isBusy}
                >
                  Clear View
                </button>
              </div>

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

          {commandPlanResult && (
            <div className="command-parse-result" ref={commandPlanPreviewRef}>
              <h3>Command Plan Preview</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'command_plan_preview',
                        copied_at: new Date().toISOString(),
                        command: commandText,
                        planner_mode: selectedPlannerMode,
                        plan: commandPlanResult,
                      },
                      'command-plan-preview-json',
                      'Copied Command Plan Preview JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !commandPlanResult}
                >
                  {copiedParserLogJsonKey === 'command-plan-preview-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'command-plan-preview-json'
                      ? 'Copy failed'
                      : 'Copy Command Plan JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'command_plan_preview',
                        downloaded_at: new Date().toISOString(),
                        command: commandText,
                        planner_mode: selectedPlannerMode,
                        plan: commandPlanResult,
                      },
                      `command_plan_preview_mode-${selectedPlannerMode}_action-${commandPlanResult.action}.json`,
                      'Downloaded Command Plan Preview JSON.',
                      'download-command-plan-preview-json',
                    )
                  }
                  disabled={isBusy || !commandPlanResult}
                >
                  {downloadedParserLogJsonKey === 'download-command-plan-preview-json'
                    ? 'Downloaded!'
                    : 'Download Command Plan JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={handlePrepareCommandPlanExecution}
                  disabled={isBusy || !commandPlanResult}
                >
                  {isPreparingCommandPlanExecution ? 'Preparing...' : 'Prepare Execution'}
                </button>

                <button
                  className="secondary-button view-clear-button"
                  onClick={() => {
                    setCommandPlanResult(null)
                    setStatusMessage('Command Plan Preview view cleared.')
                  }}
                  disabled={isBusy}
                >
                  Clear View
                </button>
              </div>

              <p><strong>Original command:</strong> {commandText}</p>
              <p><strong>Planner mode:</strong> {selectedPlannerMode}</p>

              <div className="parse-field-list">
                {Object.entries(commandPlanResult).map(([key, value]) => (
                  <div className="parse-field" key={key}>
                    <span>{key}</span>
                    <strong>
                      {value === null || value === undefined
                        ? 'null'
                        : typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                    </strong>
                  </div>
                ))}
              </div>

              {commandPlanResult.needs_clarification && commandPlanResult.clarification_question && (
                <div className="real-llm-warning">
                  <strong>Clarification needed</strong>
                  <p>{commandPlanResult.clarification_question}</p>
                </div>
              )}
            </div>
          )}

          {commandPlanExecutionPrepareResult && (
            <div className="command-parse-result" ref={commandPlanExecutionPrepareRef}>
              <h3>Prepared Execution Preview</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'prepared_execution_preview',
                        copied_at: new Date().toISOString(),
                        command: commandText,
                        planner_mode: selectedPlannerMode,
                        plan: commandPlanResult,
                        preparation: commandPlanExecutionPrepareResult,
                      },
                      'prepared-execution-preview-json',
                      'Copied Prepared Execution Preview JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !commandPlanExecutionPrepareResult}
                >
                  {copiedParserLogJsonKey === 'prepared-execution-preview-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'prepared-execution-preview-json'
                      ? 'Copy failed'
                      : 'Copy Prepared Execution JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'prepared_execution_preview',
                        downloaded_at: new Date().toISOString(),
                        command: commandText,
                        planner_mode: selectedPlannerMode,
                        plan: commandPlanResult,
                        preparation: commandPlanExecutionPrepareResult,
                      },
                      `prepared_execution_preview_status-${commandPlanExecutionPrepareResult.status}.json`,
                      'Downloaded Prepared Execution Preview JSON.',
                      'download-prepared-execution-preview-json',
                    )
                  }
                  disabled={isBusy || !commandPlanExecutionPrepareResult}
                  data-testid="download-prepared-execution-preview-json"
                >
                  {downloadedParserLogJsonKey === 'download-prepared-execution-preview-json'
                    ? 'Downloaded!'
                    : 'Download Prepared Execution JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={handleExecutePreparedCommand}
                  disabled={
                    isBusy ||
                    isExecutingPreparedCommand ||
                    !commandPlanExecutionPrepareResult.executable ||
                    !commandPlanExecutionPrepareResult.prepared_command
                  }
                >
                  {isExecutingPreparedCommand ? 'Executing...' : 'Execute Prepared Command'}
                </button>

                <button
                  className="secondary-button view-clear-button"
                  onClick={() => {
                    setCommandPlanExecutionPrepareResult(null)
                    setStatusMessage('Prepared Execution Preview view cleared.')
                  }}
                  disabled={isBusy}
                >
                  Clear View
                </button>
              </div>

              <p><strong>Status:</strong> {commandPlanExecutionPrepareResult.status}</p>
              <p><strong>Executable:</strong> {commandPlanExecutionPrepareResult.executable ? 'yes' : 'no'}</p>

              <div className="parse-field-list">
                <div className="parse-field">
                  <span>prepared_command</span>
                  <strong>
                    {commandPlanExecutionPrepareResult.prepared_command
                      ? JSON.stringify(commandPlanExecutionPrepareResult.prepared_command)
                      : 'null'}
                  </strong>
                </div>

                <div className="parse-field">
                  <span>warnings</span>
                  <strong>
                    {commandPlanExecutionPrepareResult.warnings.length > 0
                      ? commandPlanExecutionPrepareResult.warnings.join(' | ')
                      : 'none'}
                  </strong>
                </div>
              </div>

              {commandPlanExecutionPrepareResult.warnings.length > 0 && (
                <div className="real-llm-warning">
                  <strong>Preparation warning</strong>
                  <p>{commandPlanExecutionPrepareResult.warnings.join(' ')}</p>
                </div>
              )}
            </div>
          )}

          {commandParseResult && (
            <div className="command-parse-result" ref={parsedCommandPreviewRef}>
              <h3>Parsed Command Preview</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'parsed_command_preview',
                        copied_at: new Date().toISOString(),
                        command: commandParseResult.command,
                        parser_mode: commandParseResult.parser_mode ?? null,
                        parser_type: commandParseResult.parser_type ?? null,
                        parser_version: commandParseResult.parser_version ?? null,
                        preview: commandParseResult,
                      },
                      'parsed-command-preview-json',
                      'Copied Parsed Command Preview JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !commandParseResult}
                >
                  {copiedParserLogJsonKey === 'parsed-command-preview-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'parsed-command-preview-json'
                      ? 'Copy failed'
                      : 'Copy Parsed Command Preview JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'parsed_command_preview',
                        downloaded_at: new Date().toISOString(),
                        command: commandParseResult.command,
                        parser_mode: commandParseResult.parser_mode ?? null,
                        parser_type: commandParseResult.parser_type ?? null,
                        parser_version: commandParseResult.parser_version ?? null,
                        preview: commandParseResult,
                      },
                      `parsed_command_preview_mode-${commandParseResult.parser_mode ?? 'unknown'}_version-${(commandParseResult.parser_version ?? 'unknown').replace(/[^a-z0-9]+/gi, '-')}.json`,
                      'Downloaded Parsed Command Preview JSON.',
                      'download-parsed-command-preview-json',
                    )
                  }
                  disabled={isBusy || !commandParseResult}
                  data-testid="download-parsed-command-preview-json"
                >
                  {downloadedParserLogJsonKey === 'download-parsed-command-preview-json'
                    ? 'Downloaded!'
                    : 'Download Parsed Command Preview JSON'}
                </button>

                <button
                  className="secondary-button view-clear-button"
                  onClick={() => {
                    setCommandParseResult(null)
                    setStatusMessage('Parsed Command Preview view cleared.')
                  }}
                  disabled={isBusy}
                >
                  Clear View
                </button>
              </div>

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
            <div className="parsed-command-validation-panel" ref={parsedCommandValidationRef}>
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

                  <div className="loaded-panel-actions">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        void handleCopyParserLogJson(
                          {
                            source: 'parsed_command_validation',
                            copied_at: new Date().toISOString(),
                            status: parsedCommandValidationResult.status,
                            validation: parsedCommandValidationResult,
                          },
                          'parsed-command-validation-json',
                          'Copied Parsed Command Validation JSON to clipboard.',
                        )
                      }
                      disabled={isBusy || !parsedCommandValidationResult}
                    >
                      {copiedParserLogJsonKey === 'parsed-command-validation-json'
                        ? 'Copied!'
                        : failedParserLogJsonKey === 'parsed-command-validation-json'
                          ? 'Copy failed'
                          : 'Copy Validation JSON'}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        handleDownloadJsonFile(
                          {
                            source: 'parsed_command_validation',
                            downloaded_at: new Date().toISOString(),
                            status: parsedCommandValidationResult.status,
                            validation: parsedCommandValidationResult,
                          },
                          `parsed_command_validation_status-${parsedCommandValidationResult.status.replace(/[^a-z0-9]+/gi, '-')}.json`,
                          'Downloaded Parsed Command Validation JSON.',
                          'download-parsed-command-validation-json',
                        )
                      }
                      disabled={isBusy || !parsedCommandValidationResult}
                      data-testid="download-parsed-command-validation-json"
                    >
                      {downloadedParserLogJsonKey === 'download-parsed-command-validation-json'
                        ? 'Downloaded!'
                        : 'Download Validation JSON'}
                    </button>

                <button
                  className="secondary-button view-clear-button"
                  onClick={() => {
                    setParsedCommandValidationResult(null)
                    setStatusMessage('Parsed Command Validation view cleared.')
                  }}
                  disabled={isBusy}
                >
                  Clear View
                </button>
                  </div>

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
            <div className="command-result" ref={commandResultRef}>
              <h3>Command Result</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'command_result',
                        copied_at: new Date().toISOString(),
                        parser_mode: commandResult.parser_mode,
                        parser_type: commandResult.parser_type ?? null,
                        parser_version: commandResult.parser_version ?? null,
                        parsed_action: commandResult.parsed_command.action,
                        result_type: commandResult.result_type,
                        result: commandResult,
                      },
                      'command-result-json',
                      'Copied Command Result JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !commandResult}
                >
                  {copiedParserLogJsonKey === 'command-result-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'command-result-json'
                      ? 'Copy failed'
                      : 'Copy Command Result JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'command_result',
                        downloaded_at: new Date().toISOString(),
                        parser_mode: commandResult.parser_mode,
                        parser_type: commandResult.parser_type ?? null,
                        parser_version: commandResult.parser_version ?? null,
                        parsed_action: commandResult.parsed_command.action,
                        result_type: commandResult.result_type,
                        result: commandResult,
                      },
                      `command_result_action-${commandResult.parsed_command.action.replace(/[^a-z0-9]+/gi, '-')}_result-${commandResult.result_type.replace(/[^a-z0-9]+/gi, '-')}.json`,
                      'Downloaded Command Result JSON.',
                      'download-command-result-json',
                    )
                  }
                  disabled={isBusy || !commandResult}
                  data-testid="download-command-result-json"
                >
                  {downloadedParserLogJsonKey === 'download-command-result-json'
                    ? 'Downloaded!'
                    : 'Download Command Result JSON'}
                </button>

                <button
                  className="secondary-button view-clear-button"
                  onClick={() => {
                    setCommandResult(null)
                    setStatusMessage('Command Result view cleared.')
                  }}
                  disabled={isBusy}
                >
                  Clear View
                </button>
              </div>

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

                {commandResult.result_type === 'zoom_by_class' && (
                  <div className="command-result-output">
                    {(() => {
                      const result = commandResult.result as ZoomResponse
                      const zoomOriginalSource =
                        result.source ??
                        (activeGeneratedImageSource?.filename === result.filename ? 'outputs' : 'uploads')
                      const zoomOriginalFileUrl =
                        zoomOriginalSource === 'outputs'
                          ? `/media/outputs/${encodeURIComponent(result.filename)}`
                          : `/media/uploads/${encodeURIComponent(result.filename)}`

                      const handleDetectZoomedImage = async () => {
                        try {
                          setStatusMessage('Running YOLO on zoomed image...')

                          const normalizedDetectionThreshold =
                            confidenceThreshold > 1 ? confidenceThreshold / 100 : confidenceThreshold

                          const response = await fetch(
                            `/api/vision/detect-output/${encodeURIComponent(result.zoomed_filename)}/annotated?confidence_threshold=${normalizedDetectionThreshold}`,
                            {
                              method: 'POST',
                            },
                          )

                          if (!response.ok) {
                            const errorData = await response.json().catch(() => null)
                            throw new Error(errorData?.detail ?? 'Failed to run YOLO on zoomed image.')
                          }

                          const detectionData = await response.json() as DetectionResponse

                          setDetectionResult(detectionData)
                          addGeneratedOutputHistoryItem({
                            action: 'annotated_detection',
                            label: detectionData.source === 'outputs'
                              ? 'YOLO on generated output'
                              : 'Annotated detection output',
                            filename: detectionData.annotated_filename,
                            file_url: detectionData.annotated_file_url,
                            source: detectionData.source ?? 'uploads',
                            source_filename: detectionData.filename,
                          })
                          setSelectedClass('all')
                          setLastDetectionThreshold(normalizedDetectionThreshold)
                          setLastDetectionClass('all')

                          window.setTimeout(() => {
                            detectionResultRef.current?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            })
                          }, 100)

                          setClassOptions((previousClasses) =>
                            Array.from(
                              new Set([
                                ...previousClasses,
                                ...detectionData.detections.map((detection) => detection.class_name),
                              ]),
                            ).sort(),
                          )

                          setStatusMessage('YOLO detection completed on zoomed image.')
                        } catch (error) {
                          setStatusMessage(
                            error instanceof Error
                              ? error.message
                              : 'Failed to run YOLO on zoomed image.',
                          )
                        }
                      }

                      return (
                        <>
                          <p><strong>Zoomed file:</strong> {result.zoomed_filename}</p>
                          <p>
                            <strong>Zoom box:</strong>{' '}
                            x1={Math.round(result.zoom_box.x1)}, y1={Math.round(result.zoom_box.y1)},{' '}
                            x2={Math.round(result.zoom_box.x2)}, y2={Math.round(result.zoom_box.y2)}
                          </p>
                          <p>
                            <strong>Output size:</strong>{' '}
                            {result.output_size.width} × {result.output_size.height}
                          </p>
                          {result.target_scope && (
                            <p><strong>Target scope:</strong> {result.target_scope}</p>
                          )}

                          <div className="loaded-panel-actions">
                            <a
                              className="secondary-button zoom-image-action-link"
                              href={result.zoomed_file_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Zoomed Image
                            </a>

                            <a
                              className="secondary-button zoom-image-action-link"
                              href={result.zoomed_file_url}
                              download={result.zoomed_filename}
                            >
                              Download Zoomed Image
                            </a>

                            <button
                              type="button"
                              className="secondary-button zoom-image-action-link"
                              onClick={handleDetectZoomedImage}
                            >
                              Run YOLO on Zoomed Image
                            </button>
                          </div>

                          <div className="zoom-comparison-grid">
                            <div className="zoom-original-card">
                              <div className="zoom-card-header">
                                <span>Original</span>
                                <strong>Zoom region</strong>
                              </div>

                              <div className="zoom-original-frame">
                                <img
                                  src={zoomOriginalFileUrl}
                                  alt={`Original ${result.class_name}`}
                                />
                                <span
                                  className="zoom-region-box"
                                  style={{
                                    left: `${(result.zoom_box.x1 / result.output_size.width) * 100}%`,
                                    top: `${(result.zoom_box.y1 / result.output_size.height) * 100}%`,
                                    width: `${((result.zoom_box.x2 - result.zoom_box.x1) / result.output_size.width) * 100}%`,
                                    height: `${((result.zoom_box.y2 - result.zoom_box.y1) / result.output_size.height) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="zoomed-image-card">
                              <div className="zoom-card-header">
                                <span>Zoomed output</span>
                                <strong>{result.class_name}</strong>
                              </div>

                              <div className="zoomed-image-frame">
                                <img
                                  src={result.zoomed_file_url}
                                  alt={`Zoomed ${result.class_name}`}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}
            </div>
          )}

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

          {llmOpsDashboardLoaded && llmOpsDashboardResult && (
            <div className="llmops-dashboard-panel">
              <h3>LLMOps Dashboard</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setLlmOpsDashboardLoaded(false)
                    setLlmOpsDashboardResult(null)
                  }}
                  disabled={isBusy}
                >
                  Clear LLMOps Dashboard View
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'llmops_dashboard',
                        copied_at: new Date().toISOString(),
                        filters: {
                          parser_mode: databaseParserLogParserModeFilter,
                          result: databaseParserLogSuccessFilter,
                          limit: databaseParserLogLimit,
                          include_real_llm_evaluation: includeRealLlmEvaluationInDashboard,
                        },
                        dashboard: llmOpsDashboardResult,
                      },
                      'llmops-dashboard-json',
                      'Copied LLMOps Dashboard JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !llmOpsDashboardResult}
                >
                  {copiedParserLogJsonKey === 'llmops-dashboard-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'llmops-dashboard-json'
                      ? 'Copy failed'
                      : 'Copy LLMOps Dashboard JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'llmops_dashboard',
                        downloaded_at: new Date().toISOString(),
                        filters: {
                          parser_mode: databaseParserLogParserModeFilter,
                          result: databaseParserLogSuccessFilter,
                          limit: databaseParserLogLimit,
                          include_real_llm_evaluation: includeRealLlmEvaluationInDashboard,
                        },
                        dashboard: llmOpsDashboardResult,
                      },
                      `llmops_dashboard_parser-${databaseParserLogParserModeFilter}_result-${databaseParserLogSuccessFilter}_limit-${databaseParserLogLimit}_real-llm-${includeRealLlmEvaluationInDashboard ? 'yes' : 'no'}.json`,
                      'Downloaded LLMOps Dashboard JSON.',
                      'download-llmops-dashboard-json',
                    )
                  }
                  disabled={isBusy || !llmOpsDashboardResult}
                  data-testid="download-llmops-dashboard-json"
                >
                  {downloadedParserLogJsonKey === 'download-llmops-dashboard-json'
                    ? 'Downloaded!'
                    : 'Download LLMOps Dashboard JSON'}
                </button>
              </div>

              {(llmOpsHasLegacyCommandParserMetadata || llmOpsHasLegacyParserAttemptMode) && (
                <div className="legacy-metadata-note">
                  <strong>Legacy metadata note</strong>
                  <p>
                    Some older logs may appear as <code>unknown</code> or <code>llm</code>.
                    These entries were created before parser metadata was fully standardized.
                    New command executions use <code>rule_based</code>, <code>llm_mock</code>, or <code>real_llm</code>.
                  </p>
                </div>
              )}

              {llmOpsCommandLogSummary && (
                <div className="llmops-command-summary">
                  <h4>Command Execution Summary</h4>
                  <p className="small-note command-summary-filter-note">
                    <strong>LLMOps command summary filters:</strong> parser = {databaseParserLogParserModeFilter}
                  </p>

                  <div className="summary-grid">
                    <div className="summary-card">
                      <span>Total commands</span>
                      <strong>{llmOpsCommandLogSummary.total_commands}</strong>
                    </div>

                    <div className="summary-card">
                      <span>Parser modes used</span>
                      <strong>{llmOpsCommandLogSummary.by_parser_mode.length}</strong>
                    </div>

                    <div className="summary-card">
                      <span>Result types</span>
                      <strong>{llmOpsCommandLogSummary.by_result_type.length}</strong>
                    </div>
                  </div>

                  {llmOpsCommandLogSummary.total_commands === 0 && (
                    <div className="empty-state command-summary-empty-state">
                      <strong>No LLMOps command summary found for the selected filters.</strong>
                      <p>
                        Current filters: parser = {databaseParserLogParserModeFilter}.
                      </p>
                      <p>
                        Try running commands with this parser mode, or choose a broader parser filter.
                      </p>
                    </div>
                  )}

                  <div className="summary-columns">
                    <div>
                      <h5>By parser mode</h5>
                      <div className="summary-bar-list">
                        {llmOpsCommandLogSummary.by_parser_mode.map((item) => (
                          <div key={item.name} className="summary-bar-row">
                            <div className="summary-bar-meta">
                              <strong>{item.name}</strong>
                              <span>{item.count}</span>
                            </div>
                            <div className="summary-bar-track">
                              <div
                                className="summary-bar-fill"
                                style={{ width: getCommandSummaryBarWidth(item.count, llmOpsCommandLogSummary.by_parser_mode) }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5>By result type</h5>
                      <div className="summary-bar-list">
                        {llmOpsCommandLogSummary.by_result_type.map((item) => (
                          <div key={item.name} className="summary-bar-row">
                            <div className="summary-bar-meta">
                              <strong>{item.name}</strong>
                              <span>{item.count}</span>
                            </div>
                            <div className="summary-bar-track">
                              <div
                                className="summary-bar-fill"
                                style={{ width: getCommandSummaryBarWidth(item.count, llmOpsCommandLogSummary.by_result_type) }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5>By parsed action</h5>
                      <div className="summary-bar-list">
                        {llmOpsCommandLogSummary.by_parsed_action.map((item) => (
                          <div key={item.name} className="summary-bar-row">
                            <div className="summary-bar-meta">
                              <strong>{item.name}</strong>
                              <span>{item.count}</span>
                            </div>

                            <div className="summary-bar-track">
                              <div
                                className="summary-bar-fill"
                                style={{ width: getCommandSummaryBarWidth(item.count, llmOpsCommandLogSummary.by_parsed_action) }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}


              <div className="llmops-dashboard-grid">
                <div>
                  <span>Provider</span>
                  <strong>{llmOpsProviderStatus?.provider_name ?? 'not loaded'}</strong>
                </div>
                <div>
                  <span>Model</span>
                  <strong>{llmOpsProviderStatus?.provider_model ?? 'none'}</strong>
                </div>
                <div>
                  <span>Real LLM available</span>
                  <strong>{String(llmOpsProviderStatus?.real_llm_available ?? false)}</strong>
                </div>
                <div>
                  <span>Total parser attempts</span>
                  <strong>{llmOpsParserAttemptSummary?.total_attempts ?? 0}</strong>
                </div>
                <div>
                  <span>Success rate</span>
                  <strong>
                    {llmOpsParserAttemptSummary
                      ? `${(llmOpsParserAttemptSummary.success_rate * 100).toFixed(1)}%`
                      : '0.0%'}
                  </strong>
                </div>
                <div>
                  <span>Average latency</span>
                  <strong>
                    {llmOpsParserAttemptSummary
                      ? `${llmOpsParserAttemptSummary.average_latency_ms.toFixed(2)} ms`
                      : '0.00 ms'}
                  </strong>
                </div>
              </div>

              <p className="small-note">
                <strong>LLMOps active filters:</strong> parser mode = {databaseParserLogParserModeFilter}, result = {databaseParserLogSuccessFilter}, limit = {databaseParserLogLimit}, command summary parser filter = {databaseParserLogParserModeFilter}, include real LLM evaluation = {includeRealLlmEvaluationInDashboard ? 'yes' : 'no'}
              </p>
              {(llmOpsCommandLogSummary?.total_commands ?? 0) === 0 &&
                (!llmOpsParserAttemptSummary || llmOpsParserAttemptSummary.total_attempts === 0) && (
                  <div className="empty-state llmops-empty-state">
                    <strong>No LLMOps activity data found for the selected filters.</strong>
                    <p>
                      Current filters: parser mode = {databaseParserLogParserModeFilter}, result = {databaseParserLogSuccessFilter}, limit = {databaseParserLogLimit}, include real LLM evaluation = {includeRealLlmEvaluationInDashboard ? 'yes' : 'no'}.
                    </p>
                    <p>
                      Parser evaluation quality may still appear because it is based on evaluation cases, not recent command or PostgreSQL parser activity.
                    </p>
                  </div>
                )}


              {llmOpsParserEvaluation && (
                <div className="llmops-parser-evaluation-panel">
                  <h4>Parser Evaluation Quality</h4>

                  {llmOpsParserEvaluation.evaluations.length === 0 ? (
                    <div className="empty-state llmops-empty-state">
                      <strong>No parser evaluation results available for the selected filters.</strong>
                      <p>
                        Current filters: parser mode = {databaseParserLogParserModeFilter}, result = {databaseParserLogSuccessFilter}, include real LLM evaluation = {includeRealLlmEvaluationInDashboard ? 'yes' : 'no'}.
                      </p>
                      <p>
                        Try running parser evaluation again after generating more parser attempts.
                      </p>
                    </div>
                  ) : (
                    <div className="llmops-parser-evaluation-list">
                      {llmOpsParserEvaluation.evaluations.map((evaluation) => (
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

                  {llmOpsParserEvaluation.skipped_evaluations.length > 0 && (
                    <div className="llmops-skipped-evaluations">
                      <h5>Skipped parser evaluations</h5>
                      {llmOpsParserEvaluation.skipped_evaluations.map((skipped) => (
                        <div key={skipped.parser_mode} className="llmops-skipped-evaluation-card">
                          <strong>{skipped.parser_mode}</strong>
                          <span>{skipped.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {llmOpsPlannerEvaluation && (
                <div className="llmops-parser-evaluation-panel">
                  <h4>Planner Evaluation Quality</h4>

                  {llmOpsPlannerEvaluation.evaluations.length === 0 ? (
                    <div className="empty-state llmops-empty-state">
                      <strong>No planner evaluation results available for the selected filters.</strong>
                      <p>
                        Include real LLM evaluation = {includeRealLlmEvaluationInDashboard ? 'yes' : 'no'}.
                      </p>
                    </div>
                  ) : (
                    <div className="llmops-parser-evaluation-list">
                      {llmOpsPlannerEvaluation.evaluations.map((evaluation) => (
                        <div key={evaluation.planner_mode} className="llmops-parser-evaluation-card">
                          <div>
                            <span>Planner</span>
                            <strong>{evaluation.planner_mode}</strong>
                            <small>{evaluation.planner_version}</small>
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

                  {llmOpsPlannerEvaluation.skipped_evaluations.length > 0 && (
                    <div className="llmops-skipped-evaluations">
                      <h5>Skipped planner evaluations</h5>
                      {llmOpsPlannerEvaluation.skipped_evaluations.map((skipped) => (
                        <div key={skipped.planner_mode} className="llmops-skipped-evaluation-card">
                          <strong>{skipped.planner_mode}</strong>
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

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setLlmProviderStatusResult(null)
                  }}
                  disabled={isBusy}
                >
                  Clear LLM Provider Status View
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'llm_provider_status',
                        copied_at: new Date().toISOString(),
                        provider_status: llmProviderStatusResult,
                      },
                      'llm-provider-status-json',
                      'Copied LLM Provider Status JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !llmProviderStatusResult}
                >
                  {copiedParserLogJsonKey === 'llm-provider-status-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'llm-provider-status-json'
                      ? 'Copy failed'
                      : 'Copy LLM Provider Status JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'llm_provider_status',
                        downloaded_at: new Date().toISOString(),
                        provider_status: llmProviderStatusResult,
                      },
                      `llm_provider_status_provider-${llmProviderStatusResult.provider_name.replace(/[^a-z0-9]+/gi, '-')}_available-${llmProviderStatusResult.real_llm_available ? 'yes' : 'no'}.json`,
                      'Downloaded LLM Provider Status JSON.',
                      'download-llm-provider-status-json',
                    )
                  }
                  disabled={isBusy || !llmProviderStatusResult}
                  data-testid="download-llm-provider-status-json"
                >
                  {downloadedParserLogJsonKey === 'download-llm-provider-status-json'
                    ? 'Downloaded!'
                    : 'Download LLM Provider Status JSON'}
                </button>
              </div>

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

              <div className="provider-mode-list">
                <span>Supported planner modes</span>
                <div>
                  {(llmProviderStatusResult.supported_planner_modes ?? []).map((mode) => (
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
                  Real LLM parsing/planning is not configured yet. This is expected until an external provider is added.
                </p>
              )}
            </div>
          )}

          {databaseParserAttemptSummaryResult && (
            <div className="database-parser-attempt-summary-panel">
              <h3>PostgreSQL Parser Attempt Summary</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setDatabaseParserAttemptSummaryResult(null)
                  }}
                  disabled={isBusy}
                >
                  Clear DB Parser Summary View
                </button>
              </div>

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

              {databaseParserAttemptSummaryResult.total_attempts === 0 && (
                <div className="empty-state database-parser-summary-empty-state">
                  <strong>No PostgreSQL parser attempt summary found for the selected filters.</strong>
                  <p>
                    Current filters: parser mode = {databaseParserLogParserModeFilter}, result = {databaseParserLogSuccessFilter}, limit = {databaseParserLogLimit}.
                  </p>
                  <p>
                    Try running parser actions with this parser mode, resetting parser filters, or choosing broader filters.
                  </p>
                </div>
              )}

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

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setDatabaseParserAttemptLogsResult(null)
                    setDatabaseParserLogSearch('')
                    setDatabaseParserLogSortOrder('newest')
                    setDatabaseParserExportNotice('')
                    setDatabaseParserLogViewResetNotice('')
                  }}
                  disabled={isBusy}
                >
                  Clear DB Parser Logs View
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'db_parser_logs',
                        copied_at: new Date().toISOString(),
                        visible_count: sortedDatabaseParserAttemptLogs.length,
                        total_loaded_count: databaseParserAttemptLogsResult?.logs.length ?? 0,
                        filters: {
                          parser_mode: databaseParserLogParserModeFilter,
                          result: databaseParserLogSuccessFilter,
                          limit: databaseParserLogLimit,
                          search: databaseParserLogSearch.trim() || null,
                        },
                        sort_order: databaseParserLogSortOrder,
                        logs: sortedDatabaseParserAttemptLogs,
                      },
                      'visible-db-parser-logs-json',
                      'Copied visible DB parser logs JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || sortedDatabaseParserAttemptLogs.length === 0}
                >
                  {copiedParserLogJsonKey === 'visible-db-parser-logs-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'visible-db-parser-logs-json'
                      ? 'Copy failed'
                      : 'Copy visible logs JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'db_parser_logs',
                        downloaded_at: new Date().toISOString(),
                        visible_count: sortedDatabaseParserAttemptLogs.length,
                        total_loaded_count: databaseParserAttemptLogsResult?.logs.length ?? 0,
                        filters: {
                          parser_mode: databaseParserLogParserModeFilter,
                          result: databaseParserLogSuccessFilter,
                          limit: databaseParserLogLimit,
                          search: databaseParserLogSearch.trim() || null,
                        },
                        sort_order: databaseParserLogSortOrder,
                        logs: sortedDatabaseParserAttemptLogs,
                      },
                      `visible_db_parser_logs_mode-${databaseParserLogParserModeFilter}_result-${databaseParserLogSuccessFilter}_limit-${databaseParserLogLimit}_${getSafeJsonFileSearchPart(databaseParserLogSearch)}_sort-${databaseParserLogSortOrder}.json`,
                      'Downloaded visible DB parser logs JSON.',
                      'download-visible-db-parser-logs-json',
                    )
                  }
                  disabled={isBusy || sortedDatabaseParserAttemptLogs.length === 0}
                  data-testid="download-visible-db-parser-logs-json"
                >
                  {downloadedParserLogJsonKey === 'download-visible-db-parser-logs-json'
                    ? 'Downloaded!'
                    : 'Download visible logs JSON'}
                </button>
              </div>

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

              <div className="database-parser-log-search">
                <label>
                  Search loaded DB parser logs
                  <input
                    type="search"
                    value={databaseParserLogSearch}
                    onChange={(event) => {
                      setDatabaseParserLogSearch(event.target.value)
                      setDatabaseParserLogViewResetNotice('')
                    }}
                    placeholder="crop, detect, make it beautiful..."
                    disabled={isBusy}
                  />
                </label>

                <label>
                  Sort loaded DB logs
                  <select
                    value={databaseParserLogSortOrder}
                    onChange={(event) => {
                      setDatabaseParserLogSortOrder(event.target.value)
                      setDatabaseParserLogViewResetNotice('')
                    }}
                    disabled={isBusy}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="latency_desc">Highest latency</option>
                    <option value="latency_asc">Lowest latency</option>
                    <option value="command_az">Command A-Z</option>
                  </select>
                </label>

                <button
                  className="secondary-button"
                  onClick={() => {
                    setDatabaseParserLogSearch('')
                    setDatabaseParserLogSortOrder('newest')
                    setDatabaseParserExportNotice('')
                    setDatabaseParserLogViewResetNotice('Loaded DB log view reset.')
                  }}
                  disabled={isBusy}
                >
                  Reset Loaded DB Log View
                </button>
              </div>

              <p className="database-parser-log-filter-count">
                Showing {filteredDatabaseParserAttemptLogs.length} of {databaseParserAttemptLogsResult.logs.length} loaded DB parser log(s). Sorted by {databaseParserLogSortOrder.replace('_', ' ')}.
              </p>
              {databaseParserLogViewResetNotice && (
                <p className="database-parser-log-view-reset-notice">
                  {databaseParserLogViewResetNotice}
                </p>
              )}


              <div className="database-parser-visible-export-row">
                <button
                  className="secondary-button"
                  onClick={handleExportVisibleDatabaseParserAttemptLogs}
                  disabled={isBusy || sortedDatabaseParserAttemptLogs.length === 0}
                >
                  Export Visible DB Logs
                </button>
              </div>

              {visibleDatabaseParserLogSummary && filteredDatabaseParserAttemptLogs.length > 0 && (
                <>
                  <div className="database-parser-visible-summary-grid">
                    <div>
                      <span>Visible logs</span>
                      <strong>{visibleDatabaseParserLogSummary.total}</strong>
                    </div>
                    <div>
                      <span>Successful</span>
                      <strong>{visibleDatabaseParserLogSummary.successful}</strong>
                    </div>
                    <div>
                      <span>Failed</span>
                      <strong>{visibleDatabaseParserLogSummary.failed}</strong>
                    </div>
                    <div>
                      <span>Average latency</span>
                      <strong>{visibleDatabaseParserLogSummary.averageLatencyMs.toFixed(2)} ms</strong>
                    </div>
                  </div>

                  <div className="database-parser-visible-mode-breakdown">
                    <h4>By parser mode</h4>
                    <div className="database-parser-visible-mode-list">
                      {visibleDatabaseParserLogSummary.byDatabaseParserMode.map((item) => (
                        <div key={item.parserMode} className="database-parser-visible-mode-card">
                          <strong>{item.parserMode}</strong>
                          <span>{item.total} log(s)</span>
                          <span>{item.successful} success / {item.failed} failed</span>
                          <span>{item.averageLatencyMs.toFixed(2)} ms avg</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="database-parser-visible-type-breakdown">
                    <h4>By parser type</h4>
                    <div className="database-parser-visible-type-list">
                      {visibleDatabaseParserLogSummary.byDatabaseParserType.map((item) => (
                        <div key={item.parserType} className="database-parser-visible-type-card">
                          <strong>{item.parserType}</strong>
                          <span>{item.total} log(s)</span>
                          <span>{item.successful} success / {item.failed} failed</span>
                          <span>{item.averageLatencyMs.toFixed(2)} ms avg</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="database-parser-visible-error-breakdown">
                    <h4>By parser error</h4>
                    <div className="database-parser-visible-error-list">
                      {visibleDatabaseParserLogSummary.byDatabaseParserError.map((item) => (
                        <div key={item.parserError} className="database-parser-visible-error-card">
                          <strong>{item.parserError}</strong>
                          <span>{item.total} log(s)</span>
                          <span>{item.averageLatencyMs.toFixed(2)} ms avg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {filteredDatabaseParserAttemptLogs.length === 0 ? (
                <div className="empty-state database-parser-empty-state">
                  <strong>
                    {databaseParserAttemptLogsResult.logs.length === 0
                      ? 'No PostgreSQL parser attempt logs found for the selected filters.'
                      : 'No loaded DB parser logs match the search text.'}
                  </strong>
                  <p>
                    Current filters: parser mode = {databaseParserLogParserModeFilter}, result = {databaseParserLogSuccessFilter}, limit = {databaseParserLogLimit}, search = {databaseParserLogSearch.trim() || 'none'}.
                  </p>
                  <p>
                    {databaseParserAttemptLogsResult.logs.length === 0
                      ? 'Try resetting parser filters, choosing a broader result filter, or running parser actions with the selected parser mode.'
                      : 'Try clearing the DB parser log search or loading broader DB parser filters.'}
                  </p>
                </div>
              ) : (
                <div className="database-parser-log-list">
                  {sortedDatabaseParserAttemptLogs.map((log, index) => (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className={`database-parser-log-card ${log.success ? 'success' : 'failure'}`}
                    >
                      <div className="database-parser-log-header">
                        <strong>{log.command}</strong>
                        <div className="parser-log-card-header-actions">
                          <span>{log.success ? 'Success' : 'Failed'}</span>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              void handleCopyParserLogJson(
                                log,
                                `db-full-parser-log-json-${log.timestamp}-${index}`,
                                'Copied full DB parser log JSON to clipboard.',
                              )
                            }
                          >
                            {copiedParserLogJsonKey === `db-full-parser-log-json-${log.timestamp}-${index}`
                              ? 'Copied!'
                              : failedParserLogJsonKey === `db-full-parser-log-json-${log.timestamp}-${index}`
                                ? 'Copy failed'
                                : 'Copy full log'}
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              handleDownloadJsonFile(
                                log,
                                `db_parser_log_${log.timestamp.replace(/[^a-z0-9]+/gi, '-')}.json`,
                                'Downloaded full DB parser log JSON.',
                                `download-db-full-parser-log-json-${log.timestamp}-${index}`,
                              )
                            }
                          >
                            {downloadedParserLogJsonKey === `download-db-full-parser-log-json-${log.timestamp}-${index}`
                              ? 'Downloaded!'
                              : 'Download full log JSON'}
                          </button>
                        </div>
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

                      {databaseParserLogSearch.trim() && getDatabaseParserLogSearchMatchFields(log).length > 0 && (
                        <div className="database-parser-log-match-fields">
                          <span>Matched:</span>
                          {getDatabaseParserLogSearchMatchFields(log).map((field) => (
                            <strong key={field}>{field}</strong>
                          ))}
                        </div>
                      )}

                      {log.parsed_command && (
                        <details className="parser-log-json-details">
                          <summary>View parsed command JSON</summary>
                          <div className="parser-log-json-actions">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => void handleCopyParserLogJson(log.parsed_command, `parser-json-${log.timestamp}-${index}`)}
                            >
                              {copiedParserLogJsonKey === `parser-json-${log.timestamp}-${index}`
                                ? 'Copied!'
                                : failedParserLogJsonKey === `parser-json-${log.timestamp}-${index}`
                                  ? 'Copy failed'
                                  : 'Copy JSON'}
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleDownloadJsonFile(
                                  log.parsed_command,
                                  `db_parsed_command_${log.timestamp.replace(/[^a-z0-9]+/gi, '-')}.json`,
                                  'Downloaded DB parsed command JSON.',
                                  `download-db-parsed-command-json-${log.timestamp}-${index}`,
                                )
                              }
                            >
                              {downloadedParserLogJsonKey === `download-db-parsed-command-json-${log.timestamp}-${index}`
                                ? 'Downloaded!'
                                : 'Download JSON'}
                            </button>
                          </div>
                          <pre>{JSON.stringify(log.parsed_command, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {parserAttemptLogsResult && (
            <div className="parser-attempt-logs-panel">
              <h3>Local Parser Attempt Logs</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setParserAttemptLogsResult(null)
                    setLocalParserAttemptModeFilter('all')
                    setLocalParserAttemptResultFilter('all')
                    setLocalParserAttemptSearch('')
                    setLocalParserAttemptSortOrder('newest')
                    setLocalParserAttemptResetNotice('')
                    setLocalParserAttemptExportNotice('')
                  }}
                  disabled={isBusy}
                >
                  Clear Local Parser Attempt Logs View
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'local_parser_attempt_logs',
                        copied_at: new Date().toISOString(),
                        visible_count: sortedLocalParserAttemptLogs.length,
                        total_loaded_count: parserAttemptLogsResult?.logs.length ?? 0,
                        filters: {
                          parser_mode: localParserAttemptModeFilter,
                          result: localParserAttemptResultFilter,
                          search: localParserAttemptSearch.trim() || null,
                        },
                        sort_order: localParserAttemptSortOrder,
                        logs: sortedLocalParserAttemptLogs,
                      },
                      'visible-local-parser-logs-json',
                      'Copied visible local parser attempt logs JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || sortedLocalParserAttemptLogs.length === 0}
                >
                  {copiedParserLogJsonKey === 'visible-local-parser-logs-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'visible-local-parser-logs-json'
                      ? 'Copy failed'
                      : 'Copy visible logs JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'local_parser_attempt_logs',
                        downloaded_at: new Date().toISOString(),
                        visible_count: sortedLocalParserAttemptLogs.length,
                        total_loaded_count: parserAttemptLogsResult?.logs.length ?? 0,
                        filters: {
                          parser_mode: localParserAttemptModeFilter,
                          result: localParserAttemptResultFilter,
                          search: localParserAttemptSearch.trim() || null,
                        },
                        sort_order: localParserAttemptSortOrder,
                        logs: sortedLocalParserAttemptLogs,
                      },
                      `visible_local_parser_attempt_logs_mode-${localParserAttemptModeFilter}_result-${localParserAttemptResultFilter}_${getSafeJsonFileSearchPart(localParserAttemptSearch)}_sort-${localParserAttemptSortOrder}.json`,
                      'Downloaded visible local parser attempt logs JSON.',
                      'download-visible-local-parser-logs-json',
                    )
                  }
                  disabled={isBusy || sortedLocalParserAttemptLogs.length === 0}
                  data-testid="download-visible-local-parser-logs-json"
                >
                  {downloadedParserLogJsonKey === 'download-visible-local-parser-logs-json'
                    ? 'Downloaded!'
                    : 'Download visible logs JSON'}
                </button>
              </div>

              <p className="small-note parser-attempt-filter-note">
                These local parser attempt logs are not affected by Command history filters. Use DB Parser Logs below for filterable PostgreSQL parser logs.
              </p>

              <div className="local-parser-attempt-filters">
                <label>
                  Local parser mode
                  <select
                    value={localParserAttemptModeFilter}
                    onChange={(event) => {
                      setLocalParserAttemptModeFilter(event.target.value)
                      setLocalParserAttemptResetNotice('')
                      setLocalParserAttemptExportNotice('')
                    }}
                    disabled={isBusy}
                  >
                    <option value="all">All</option>
                    <option value="rule_based">rule_based</option>
                    <option value="llm_mock">llm_mock</option>
                    <option value="real_llm">real_llm</option>
                  </select>
                </label>

                <label>
                  Local result
                  <select
                    value={localParserAttemptResultFilter}
                    onChange={(event) => {
                      setLocalParserAttemptResultFilter(event.target.value)
                      setLocalParserAttemptResetNotice('')
                      setLocalParserAttemptExportNotice('')
                    }}
                    disabled={isBusy}
                  >
                    <option value="all">All</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                </label>

                <label>
                  Search command
                  <input
                    type="search"
                    value={localParserAttemptSearch}
                    onChange={(event) => {
                      setLocalParserAttemptSearch(event.target.value)
                      setLocalParserAttemptResetNotice('')
                      setLocalParserAttemptExportNotice('')
                    }}
                    placeholder="crop, rule_based, v1, annotated_detection..."
                    disabled={isBusy}
                  />
                </label>

                <label>
                  Sort by
                  <select
                    value={localParserAttemptSortOrder}
                    onChange={(event) => {
                      setLocalParserAttemptSortOrder(event.target.value)
                      setLocalParserAttemptResetNotice('')
                      setLocalParserAttemptExportNotice('')
                    }}
                    disabled={isBusy}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="latency_desc">Highest latency</option>
                    <option value="latency_asc">Lowest latency</option>
                    <option value="command_az">Command A-Z</option>
                  </select>
                </label>

                <button
                  className="secondary-button"
                  onClick={() => {
                    setLocalParserAttemptModeFilter('all')
                    setLocalParserAttemptResultFilter('all')
                    setLocalParserAttemptSearch('')
                    setLocalParserAttemptSortOrder('newest')
                    setLocalParserAttemptExportNotice('')
                    setLocalParserAttemptResetNotice('Local parser attempt filters reset.')
                  }}
                  disabled={isBusy}
                >
                  Reset Local Parser Filters
                </button>

                <button
                  className="secondary-button"
                  onClick={handleExportLocalParserAttemptLogs}
                  disabled={isBusy || !parserAttemptLogsResult || sortedLocalParserAttemptLogs.length === 0}
                >
                  Export Local Parser Logs
                </button>
</div>

              {parserAttemptLogsResult && (
                <p className="local-parser-attempt-filter-count">
                  Showing {filteredLocalParserAttemptLogs.length} of {parserAttemptLogsResult.logs.length} local parser attempt log(s). Sorted by {localParserAttemptSortOrder.replace('_', ' ')}.
                </p>
              )}

              {localParserAttemptResetNotice && (
                <p className="local-parser-attempt-reset-notice">
                  {localParserAttemptResetNotice}
                </p>
              )}

              {localParserAttemptExportNotice && (
                <p className="local-parser-attempt-export-notice">
                  {localParserAttemptExportNotice}
                </p>
              )}

              {localParserAttemptSummary && filteredLocalParserAttemptLogs.length > 0 && (
                <>
                  <div className="local-parser-attempt-summary-grid">
                    <div>
                      <span>Total attempts</span>
                      <strong>{localParserAttemptSummary.total}</strong>
                    </div>
                    <div>
                      <span>Successful</span>
                      <strong>{localParserAttemptSummary.successful}</strong>
                    </div>
                    <div>
                      <span>Failed</span>
                      <strong>{localParserAttemptSummary.failed}</strong>
                    </div>
                    <div>
                      <span>Average latency</span>
                      <strong>{localParserAttemptSummary.averageLatencyMs.toFixed(2)} ms</strong>
                    </div>
                  </div>

                  <div className="local-parser-attempt-mode-breakdown">
                    <h4>By parser mode</h4>
                    <div className="local-parser-attempt-mode-list">
                      {localParserAttemptSummary.byParserMode.map((item) => (
                        <div key={item.parserMode} className="local-parser-attempt-mode-card">
                          <strong>{item.parserMode}</strong>
                          <span>{item.total} attempt(s)</span>
                          <span>{item.successful} success / {item.failed} failed</span>
                          <span>{item.averageLatencyMs.toFixed(2)} ms avg</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="local-parser-attempt-type-breakdown">
                    <h4>By parser type</h4>
                    <div className="local-parser-attempt-type-list">
                      {localParserAttemptSummary.byParserType.map((item) => (
                        <div key={item.parserType} className="local-parser-attempt-type-card">
                          <strong>{item.parserType}</strong>
                          <span>{item.total} attempt(s)</span>
                          <span>{item.successful} success / {item.failed} failed</span>
                          <span>{item.averageLatencyMs.toFixed(2)} ms avg</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="local-parser-attempt-error-breakdown">
                    <h4>By parser error</h4>
                    <div className="local-parser-attempt-error-list">
                      {localParserAttemptSummary.byParserError.map((item) => (
                        <div key={item.parserError} className="local-parser-attempt-error-card">
                          <strong>{item.parserError}</strong>
                          <span>{item.total} attempt(s)</span>
                          <span>{item.averageLatencyMs.toFixed(2)} ms avg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {filteredLocalParserAttemptLogs.length === 0 ? (
                <div className="empty-state parser-attempt-empty-state">
                  <strong>
                    {parserAttemptLogsResult.logs.length === 0
                      ? 'No parser attempt logs available yet.'
                      : 'No local parser attempt logs match the selected filters.'}
                  </strong>
                  <p>
                    Current local filters: parser mode = {localParserAttemptModeFilter}, result = {localParserAttemptResultFilter}, search = {localParserAttemptSearch.trim() || 'none'}.
                  </p>
                  <p>
                    {parserAttemptLogsResult.logs.length === 0
                      ? 'Run Parse Command, Validate Parsed Command, or Parser Evaluation to generate parser attempts.'
                      : 'Try choosing broader local parser attempt filters.'}
                  </p>
                  <p>
                    PostgreSQL parser logs are available separately through Load DB Parser Logs.
                  </p>
                </div>
              ) : (
                <div className="parser-attempt-log-list">
                  {sortedLocalParserAttemptLogs.map((log, index) => (
                    <div
                      className={`parser-attempt-log-card ${log.success ? 'success' : 'failure'}`}
                      key={`${log.timestamp}-${index}`}
                    >
                      <div className="parser-attempt-log-header">
                        <strong>{log.command}</strong>
                        <div className="parser-log-card-header-actions">
                          <span>{log.success ? 'Success' : 'Failed'}</span>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              void handleCopyParserLogJson(
                                log,
                                `local-full-parser-log-json-${log.timestamp}-${index}`,
                                'Copied full local parser attempt log JSON to clipboard.',
                              )
                            }
                          >
                            {copiedParserLogJsonKey === `local-full-parser-log-json-${log.timestamp}-${index}`
                              ? 'Copied!'
                              : failedParserLogJsonKey === `local-full-parser-log-json-${log.timestamp}-${index}`
                                ? 'Copy failed'
                                : 'Copy full log'}
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              handleDownloadJsonFile(
                                log,
                                `local_parser_attempt_log_${log.timestamp.replace(/[^a-z0-9]+/gi, '-')}.json`,
                                'Downloaded full local parser attempt log JSON.',
                                `download-local-full-parser-log-json-${log.timestamp}-${index}`,
                              )
                            }
                          >
                            {downloadedParserLogJsonKey === `download-local-full-parser-log-json-${log.timestamp}-${index}`
                              ? 'Downloaded!'
                              : 'Download full log JSON'}
                          </button>
                        </div>
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
                        <details className="parser-log-json-details">
                          <summary>View parsed command JSON</summary>
                          <div className="parser-log-json-actions">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => void handleCopyParserLogJson(log.parsed_command, `parser-json-${log.timestamp}-${index}`)}
                            >
                              {copiedParserLogJsonKey === `parser-json-${log.timestamp}-${index}`
                                ? 'Copied!'
                                : failedParserLogJsonKey === `parser-json-${log.timestamp}-${index}`
                                  ? 'Copy failed'
                                  : 'Copy JSON'}
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleDownloadJsonFile(
                                  log.parsed_command,
                                  `local_parsed_command_${log.timestamp.replace(/[^a-z0-9]+/gi, '-')}.json`,
                                  'Downloaded local parsed command JSON.',
                                  `download-local-parsed-command-json-${log.timestamp}-${index}`,
                                )
                              }
                            >
                              {downloadedParserLogJsonKey === `download-local-parsed-command-json-${log.timestamp}-${index}`
                                ? 'Downloaded!'
                                : 'Download JSON'}
                            </button>
                          </div>
                          <pre>{JSON.stringify(log.parsed_command, null, 2)}</pre>
                        </details>
                      )}

                      {log.error && (
                        <div className="parser-attempt-error">
                          <strong>Error:</strong> {log.error}
                        </div>
                      )}

                      {localParserAttemptSearch.trim() && getLocalParserAttemptSearchMatchFields(log).length > 0 && (
                        <div className="local-parser-attempt-match-fields">
                          <span>Matched:</span>
                          {getLocalParserAttemptSearchMatchFields(log).map((field) => (
                            <strong key={field}>{field}</strong>
                          ))}
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
            <div className="parser-comparison-panel" ref={parserComparisonRef}>
              <h3>Parser Comparison Results</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setParserComparisonResult(null)
                  }}
                  disabled={isBusy}
                >
                  Clear Parser Comparison View
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'parser_comparison',
                        copied_at: new Date().toISOString(),
                        parser_modes: parserComparisonResult.parser_modes,
                        total_evaluations: parserComparisonResult.evaluations.length,
                        skipped_evaluations: parserComparisonResult.skipped_evaluations ?? [],
                        comparison: parserComparisonResult,
                      },
                      'parser-comparison-json',
                      'Copied Parser Comparison JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !parserComparisonResult}
                >
                  {copiedParserLogJsonKey === 'parser-comparison-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'parser-comparison-json'
                      ? 'Copy failed'
                      : 'Copy Parser Comparison JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'parser_comparison',
                        downloaded_at: new Date().toISOString(),
                        parser_modes: parserComparisonResult.parser_modes,
                        total_evaluations: parserComparisonResult.evaluations.length,
                        skipped_evaluations: parserComparisonResult.skipped_evaluations ?? [],
                        comparison: parserComparisonResult,
                      },
                      `parser_comparison_modes-${parserComparisonResult.parser_modes.join('-').replace(/[^a-z0-9]+/gi, '-')}.json`,
                      'Downloaded Parser Comparison JSON.',
                      'download-parser-comparison-json',
                    )
                  }
                  disabled={isBusy || !parserComparisonResult}
                  data-testid="download-parser-comparison-json"
                >
                  {downloadedParserLogJsonKey === 'download-parser-comparison-json'
                    ? 'Downloaded!'
                    : 'Download Parser Comparison JSON'}
                </button>
              </div>

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

          {plannerComparisonResult && (
            <div className="parser-comparison-panel" ref={plannerComparisonRef}>
              <h3>Planner Comparison Results</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setPlannerComparisonResult(null)
                  }}
                  disabled={isBusy}
                >
                  Clear Planner Comparison View
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'planner_comparison',
                        copied_at: new Date().toISOString(),
                        planner_modes: plannerComparisonResult.planner_modes,
                        total_evaluations: plannerComparisonResult.evaluations.length,
                        skipped_evaluations: plannerComparisonResult.skipped_evaluations ?? [],
                        comparison: plannerComparisonResult,
                      },
                      'planner-comparison-json',
                      'Copied Planner Comparison JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !plannerComparisonResult}
                >
                  {copiedParserLogJsonKey === 'planner-comparison-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'planner-comparison-json'
                      ? 'Copy failed'
                      : 'Copy Planner Comparison JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'planner_comparison',
                        downloaded_at: new Date().toISOString(),
                        planner_modes: plannerComparisonResult.planner_modes,
                        total_evaluations: plannerComparisonResult.evaluations.length,
                        skipped_evaluations: plannerComparisonResult.skipped_evaluations ?? [],
                        comparison: plannerComparisonResult,
                      },
                      `planner_comparison_modes-${plannerComparisonResult.planner_modes.join('-').replace(/[^a-z0-9]+/gi, '-')}.json`,
                      'Downloaded Planner Comparison JSON.',
                      'download-planner-comparison-json',
                    )
                  }
                  disabled={isBusy || !plannerComparisonResult}
                  data-testid="download-planner-comparison-json"
                >
                  {downloadedParserLogJsonKey === 'download-planner-comparison-json'
                    ? 'Downloaded!'
                    : 'Download Planner Comparison JSON'}
                </button>
              </div>

              <div className="parser-comparison-grid">
                {plannerComparisonResult.evaluations.map((evaluation) => (
                  <div className="parser-comparison-card" key={evaluation.planner_mode}>
                    <h4>{evaluation.planner_mode}</h4>
                    <p><strong>Type:</strong> {evaluation.planner_type}</p>
                    <p><strong>Version:</strong> {evaluation.planner_version}</p>
                    <p><strong>Total cases:</strong> {evaluation.total_cases}</p>
                    <p><strong>Passed:</strong> {evaluation.passed_cases}</p>
                    <p><strong>Failed:</strong> {evaluation.failed_cases}</p>
                    <p><strong>Accuracy:</strong> {(evaluation.accuracy * 100).toFixed(1)}%</p>
                  </div>
                ))}
                {plannerComparisonResult.skipped_evaluations &&
                  plannerComparisonResult.skipped_evaluations.length > 0 && (
                    <div className="parser-comparison-skipped">
                      <h4>Skipped planner modes</h4>
                      {plannerComparisonResult.skipped_evaluations.map((skipped) => (
                        <div key={skipped.planner_mode} className="parser-comparison-skipped-card">
                          <strong>{skipped.planner_mode}</strong>
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

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setCommandEvaluationResult(null)
                  }}
                  disabled={isBusy}
                >
                  Clear Parser Evaluation View
                </button>
              </div>

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

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setCommandLogSummary(null)
                  }}
                  disabled={isBusy}
                >
                  Clear Command Summary View
                </button>
              </div>
              <p className="small-note command-summary-filter-note">
                <strong>Command summary filters:</strong> parser = {commandHistoryParserModeFilter}, result type = {commandHistoryResultTypeFilter}
              </p>

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

              {commandLogSummary.total_commands === 0 && (
                <div className="empty-state command-summary-empty-state">
                  <strong>No command history summary found for the selected filters.</strong>
                  <p>
                    Current filters: parser = {commandHistoryParserModeFilter}, result type = {commandHistoryResultTypeFilter}.
                  </p>
                  <p>
                    Try loading command history, running more commands, or choosing broader filters.
                  </p>
                </div>
              )}

              <div className="summary-columns">
                <div>
                  <h4>By parser mode</h4>
                  <div className="summary-bar-list">
                    {commandLogSummary.by_parser_mode.map((item) => (
                      <div key={item.name} className="summary-bar-row">
                        <div className="summary-bar-meta">
                          <strong>{item.name}</strong>
                          <span>{item.count}</span>
                        </div>
                        <div className="summary-bar-track">
                          <div
                            className="summary-bar-fill"
                            style={{ width: getCommandSummaryBarWidth(item.count, commandLogSummary.by_parser_mode) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4>By result type</h4>
                  <div className="summary-bar-list">
                    {commandLogSummary.by_result_type.map((item) => (
                      <div key={item.name} className="summary-bar-row">
                        <div className="summary-bar-meta">
                          <strong>{item.name}</strong>
                          <span>{item.count}</span>
                        </div>
                        <div className="summary-bar-track">
                          <div
                            className="summary-bar-fill"
                            style={{ width: getCommandSummaryBarWidth(item.count, commandLogSummary.by_result_type) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4>By parsed action</h4>
                  <div className="summary-bar-list">
                    {commandLogSummary.by_parsed_action.map((item) => (
                      <div key={item.name} className="summary-bar-row">
                        <div className="summary-bar-meta">
                          <strong>{item.name}</strong>
                          <span>{item.count}</span>
                        </div>
                        <div className="summary-bar-track">
                          <div
                            className="summary-bar-fill"
                            style={{ width: getCommandSummaryBarWidth(item.count, commandLogSummary.by_parsed_action) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasLoadedCommandLogs && (
            <div className="command-history" ref={commandHistoryRef}>
              <h3>Recent Command History</h3>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setCommandLogs([])
                    setHasLoadedCommandLogs(false)
                    setCommandHistorySearch('')
                    setCommandHistorySortOrder('newest')
                    setCommandHistoryViewResetNotice('')
                    setCommandHistoryVisibleExportNotice('')
                  }}
                  disabled={isBusy}
                >
                  Clear Command History View
                </button>
              </div>

              <div className="command-history-search">
                <label>
                  Search loaded command history
                  <input
                    type="search"
                    value={commandHistorySearch}
                    onChange={(event) => {
                      setCommandHistorySearch(event.target.value)
                      setCommandHistoryViewResetNotice('')
                      setCommandHistoryVisibleExportNotice('')
                    }}
                    placeholder="detect, crop, blur..."
                    disabled={isBusy}
                  />
                </label>

                <label>
                  Sort loaded command history
                  <select
                    value={commandHistorySortOrder}
                    onChange={(event) => {
                      setCommandHistorySortOrder(event.target.value)
                      setCommandHistoryViewResetNotice('')
                      setCommandHistoryVisibleExportNotice('')
                    }}
                    disabled={isBusy}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="command_az">Command A-Z</option>
                    <option value="parser_mode_az">Parser mode A-Z</option>
                    <option value="result_type_az">Result type A-Z</option>
                  </select>
                </label>

                <button
                  className="secondary-button"
                  onClick={() => {
                    setCommandHistorySearch('')
                    setCommandHistorySortOrder('newest')
                    setCommandHistoryVisibleExportNotice('')
                    setCommandHistoryViewResetNotice('Loaded command history view reset.')
                  }}
                  disabled={isBusy}
                >
                  Reset Loaded Command History View
                </button>

                <button
                  className="secondary-button"
                  onClick={handleExportVisibleCommandHistoryLogs}
                  disabled={isBusy || filteredCommandHistoryLogs.length === 0}
                >
                  Export Visible Command History CSV
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    void handleCopyParserLogJson(
                      {
                        source: 'command_history',
                        copied_at: new Date().toISOString(),
                        visible_count: filteredCommandHistoryLogs.length,
                        total_loaded_count: commandLogs.length,
                        filters: {
                          parser_mode: commandHistoryParserModeFilter,
                          result_type: commandHistoryResultTypeFilter,
                          limit: commandHistoryLimit,
                          search: commandHistorySearch.trim() || null,
                        },
                        sort_order: commandHistorySortOrder,
                        logs: filteredCommandHistoryLogs,
                      },
                      'visible-command-history-json',
                      'Copied visible command history JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || filteredCommandHistoryLogs.length === 0}
                >
                  {copiedParserLogJsonKey === 'visible-command-history-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'visible-command-history-json'
                      ? 'Copy failed'
                      : 'Copy visible command history JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    handleDownloadJsonFile(
                      {
                        source: 'command_history',
                        downloaded_at: new Date().toISOString(),
                        visible_count: filteredCommandHistoryLogs.length,
                        total_loaded_count: commandLogs.length,
                        filters: {
                          parser_mode: commandHistoryParserModeFilter,
                          result_type: commandHistoryResultTypeFilter,
                          limit: commandHistoryLimit,
                          search: commandHistorySearch.trim() || null,
                        },
                        sort_order: commandHistorySortOrder,
                        logs: filteredCommandHistoryLogs,
                      },
                      `visible_command_history_parser-${commandHistoryParserModeFilter}_result-${commandHistoryResultTypeFilter}_limit-${commandHistoryLimit}_${getSafeJsonFileSearchPart(commandHistorySearch)}_sort-${commandHistorySortOrder}.json`,
                      'Downloaded visible command history JSON.',
                      'download-visible-command-history-json',
                    )
                  }
                  disabled={isBusy || filteredCommandHistoryLogs.length === 0}
                  data-testid="download-visible-command-history-json"
                >
                  {downloadedParserLogJsonKey === 'download-visible-command-history-json'
                    ? 'Downloaded!'
                    : 'Download visible command history JSON'}
                </button>
              </div>

              <p className="command-history-filter-count">
                Showing {filteredCommandHistoryLogs.length} of {commandLogs.length} loaded command history log(s). Sorted by {commandHistorySortOrder.replaceAll('_', ' ')}.
              </p>

              {commandHistoryViewResetNotice && (
                <p className="command-history-view-reset-notice">
                  {commandHistoryViewResetNotice}
                </p>
              )}

              {commandHistoryVisibleExportNotice && (
                <p className="command-history-visible-export-notice">
                  {commandHistoryVisibleExportNotice}
                </p>
              )}


              {visibleCommandHistorySummary && (
                <div className="visible-command-history-summary">
                  <h4>Visible Command History Summary</h4>

                  <div className="visible-command-history-summary-grid">
                    <div>
                      <span>Visible logs</span>
                      <strong>{visibleCommandHistorySummary.total}</strong>
                    </div>
                    <div>
                      <span>Parser modes</span>
                      <strong>{visibleCommandHistorySummary.byParserMode.length}</strong>
                    </div>
                    <div>
                      <span>Result types</span>
                      <strong>{visibleCommandHistorySummary.byResultType.length}</strong>
                    </div>
                    <div>
                      <span>Parsed actions</span>
                      <strong>{visibleCommandHistorySummary.byParsedAction.length}</strong>
                    </div>
                    <div>
                      <span>Parser types</span>
                      <strong>{visibleCommandHistorySummary.byParserType.length}</strong>
                    </div>
                    <div>
                      <span>Parser versions</span>
                      <strong>{visibleCommandHistorySummary.byParserVersion.length}</strong>
                    </div>
                  </div>

                  <div className="visible-command-history-breakdowns">
                    <div>
                      <h5>By parser mode</h5>
                      {visibleCommandHistorySummary.byParserMode.map(([name, count]) => (
                        <p key={name}>
                          <strong>{name}</strong>
                          <span>{count} log(s)</span>
                        </p>
                      ))}
                    </div>

                    <div>
                      <h5>By result type</h5>
                      {visibleCommandHistorySummary.byResultType.map(([name, count]) => (
                        <p key={name}>
                          <strong>{name}</strong>
                          <span>{count} log(s)</span>
                        </p>
                      ))}
                    </div>

                    <div>
                      <h5>By parsed action</h5>
                      {visibleCommandHistorySummary.byParsedAction.map(([name, count]) => (
                        <p key={name}>
                          <strong>{name}</strong>
                          <span>{count} log(s)</span>
                        </p>
                      ))}
                    </div>
                    <div>
                      <h5>By parser type</h5>
                      {visibleCommandHistorySummary.byParserType.map(([name, count]) => (
                        <p key={name}>
                          <strong>{name}</strong>
                          <span>{count} log(s)</span>
                        </p>
                      ))}
                    </div>

                    <div>
                      <h5>By parser version</h5>
                      {visibleCommandHistorySummary.byParserVersion.map(([name, count]) => (
                        <p key={name}>
                          <strong>{name}</strong>
                          <span>{count} log(s)</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {filteredCommandHistoryLogs.length === 0 && (
                <div className="empty-state command-history-empty-state">
                  <strong>No command logs found for the selected filters.</strong>
                  <p>
                    Current filters: parser = {commandHistoryParserModeFilter}, result type = {commandHistoryResultTypeFilter}, limit = {commandHistoryLimit}, search = {commandHistorySearch.trim() || 'none'}.
                  </p>
                  <p>
                    Try resetting the command history filters, choosing a broader result type, or running a command with the selected parser.
                  </p>
                </div>
              )}

              {filteredCommandHistoryLogs.map((log, index) => (
                <div className="command-log-item" key={`${log.timestamp}-${index}`}>
                  <div>
                    <strong>{log.command}</strong>
                    <p>{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="command-log-meta">
                    <span>{log.parsed_action}</span>
                    {log.parsed_class && <span> · {log.parsed_class}</span>}
                    {log.result_type && (
                      <span className="command-log-result-type">
                        result: {log.result_type}
                      </span>
                    )}

                    <button
                      type="button"
                      className="secondary-button command-history-copy-json-button"
                      onClick={() =>
                        void handleCopyParserLogJson(
                          log,
                          `command-history-log-json-${log.timestamp}-${index}`,
                          'Copied command history log JSON to clipboard.',
                        )
                      }
                    >
                      {copiedParserLogJsonKey === `command-history-log-json-${log.timestamp}-${index}`
                        ? 'Copied!'
                        : failedParserLogJsonKey === `command-history-log-json-${log.timestamp}-${index}`
                          ? 'Copy failed'
                          : 'Copy full log'}
                    </button>

                    <button
                      type="button"
                      className="secondary-button command-history-download-json-button"
                      onClick={() =>
                        handleDownloadJsonFile(
                          log,
                          `command_history_log_${log.timestamp.replace(/[^a-z0-9]+/gi, '-')}.json`,
                          'Downloaded command history log JSON.',
                          `download-command-history-log-json-${log.timestamp}-${index}`,
                        )
                      }
                    >
                      {downloadedParserLogJsonKey === `download-command-history-log-json-${log.timestamp}-${index}`
                        ? 'Downloaded!'
                        : 'Download full log JSON'}
                    </button>

                    {commandHistorySearch.trim() && getCommandHistorySearchMatchFields(log).length > 0 && (
                      <div className="command-history-match-fields">
                        <span>Matched:</span>
                        {getCommandHistorySearchMatchFields(log).map((field) => (
                          <strong key={field}>{field}</strong>
                        ))}
                      </div>
                    )}
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

      <VideoUploadFoundationSection
        selectedVideoFile={selectedVideoFile}
        videoUploadResult={videoUploadResult}
        uploadedVideoUrl={uploadedVideoUrl}
        videoUploadResultRef={videoUploadResultRef}
        trimStartSeconds={trimStartSeconds}
        trimEndSeconds={trimEndSeconds}
        isBusy={isBusy}
        isUploadingVideo={isUploadingVideo}
        isTrimmingVideo={isTrimmingVideo}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onVideoFileChange={handleVideoFileChange}
        onVideoUpload={handleVideoUpload}
        onVideoTrim={handleVideoTrim}
        onTrimStartSecondsChange={setTrimStartSeconds}
        onTrimEndSecondsChange={setTrimEndSeconds}
        onClearVideoUploadResult={() => {
          setVideoUploadResult(null)
          setStatusMessage('Video Upload Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <ImageUploadResultSection
        uploadResult={uploadResult}
        uploadedImageUrl={uploadedImageUrl}
        uploadResultRef={uploadResultRef}
        isBusy={isBusy}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onClearUploadResult={() => {
          setUploadResult(null)
          setStatusMessage('Image Upload Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

        <GeneratedOutputHistorySection
          isVisible={generatedOutputHistory.length > 0 || isGeneratedOutputHistoryPanelVisible}
          sectionRef={generatedOutputHistoryRef}
          activeGeneratedImageSource={activeGeneratedImageSource}
          autoUseLatestGeneratedOutputAsActive={autoUseLatestGeneratedOutputAsActive}
          generatedOutputHistory={generatedOutputHistory}
          filteredGeneratedOutputHistory={filteredGeneratedOutputHistory}
          groupedGeneratedOutputHistory={generatedOutputHistoryFilteredGroups}
          filters={generatedOutputHistoryFilters}
          parserModes={generatedOutputHistoryParserModes}
          plannerModes={generatedOutputHistoryPlannerModes}
          hasFilters={hasGeneratedOutputHistoryFilters}
          analytics={generatedOutputWorkflowAnalytics}
          selectedWorkflowSource={selectedGeneratedOutputWorkflowSource}
          expandedGeneratedOutputDetails={expandedGeneratedOutputDetails}
          isBusy={isBusy}
          isLoadingGeneratedOutputHistory={isLoadingGeneratedOutputHistory}
          isWorkflowJsonDownloaded={downloadedParserLogJsonKey === 'download-generated-output-workflow-json'}
          isWorkflowReportDownloaded={downloadedParserLogJsonKey === 'download-generated-output-workflow-report'}
          onAutoUseLatestGeneratedOutputAsActiveChange={(nextChecked) => {
            setAutoUseLatestGeneratedOutputAsActive(nextChecked)

            if (nextChecked && generatedOutputHistory.length > 0) {
              setActiveGeneratedImageSource(generatedOutputHistory[0])
            }

            if (!nextChecked) {
              setActiveGeneratedImageSource(null)
            }

            setStatusMessage(
              nextChecked
                ? 'Auto-use latest generated output as active image enabled.'
                : 'Auto-use latest generated output as active image disabled.',
            )
          }}
          onLoadSavedHistory={() => void loadPersistedGeneratedOutputHistory()}
          onExportWorkflowJson={handleDownloadGeneratedOutputWorkflowJson}
          onDownloadWorkflowReport={handleDownloadGeneratedOutputWorkflowReport}
          onClearOutputHistory={() => void handleClearGeneratedOutputHistory()}
          onSearchChange={setGeneratedOutputHistorySearch}
          onActionFilterChange={setGeneratedOutputHistoryActionFilter}
          onSourceFilterChange={setGeneratedOutputHistorySourceFilter}
          onCreatedByFilterChange={setGeneratedOutputHistoryCreatedByFilter}
          onParserFilterChange={setGeneratedOutputHistoryParserFilter}
          onPlannerFilterChange={setGeneratedOutputHistoryPlannerFilter}
          onClearFilters={handleClearGeneratedOutputHistoryFilters}
          onToggleWorkflowDetails={handleToggleGeneratedOutputWorkflowDetails}
          onUseAsActiveImage={(selectedItem) => {
            setActiveGeneratedImageSource(selectedItem)
            setStatusMessage(`Using generated output as active image: ${selectedItem.label}.`)
          }}
          onRunYolo={(selectedItem) => void handleDetectGeneratedOutputHistoryItem(selectedItem)}
          onToggleItemDetails={(itemId) => {
            setExpandedGeneratedOutputDetails((previousIds) => {
              const nextIds = new Set(previousIds)

              if (nextIds.has(itemId)) {
                nextIds.delete(itemId)
              } else {
                nextIds.add(itemId)
              }

              return nextIds
            })
          }}
          onRemove={(selectedItem) => void handleRemoveGeneratedOutputHistoryItem(selectedItem)}
        />

      <DetectionResultSection
        detectionResult={detectionResult}
        detectionResultRef={detectionResultRef}
        annotatedImageUrl={annotatedImageUrl}
        filteredDetections={filteredDetections}
        availableClasses={availableClasses}
        confidenceThreshold={confidenceThreshold}
        selectedClass={selectedClass}
        filtersChangedAfterDetection={filtersChangedAfterDetection}
        isBusy={isBusy}
        isCropping={isCropping}
        isBlurring={isBlurring}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onConfidenceThresholdChange={setConfidenceThreshold}
        onSelectedClassChange={setSelectedClass}
        onCropByClass={handleCropByClass}
        onCropDetection={handleCrop}
        onBlurDetection={handleBlur}
        onClearDetectionResult={() => {
          setDetectionResult(null)
          setStatusMessage('Detection Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <CropResultSection
        cropResult={cropResult}
        cropResultRef={cropResultRef}
        croppedImageUrl={croppedImageUrl}
        isBusy={isBusy}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onClearCropResult={() => {
          setCropResult(null)
          setStatusMessage('Crop Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <BlurResultSection
        blurResult={blurResult}
        blurResultRef={blurResultRef}
        blurredImageUrl={blurredImageUrl}
        isBusy={isBusy}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onClearBlurResult={() => {
          setBlurResult(null)
          setStatusMessage('Blur Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />
      <VideoFrameToolsSection
        videoUploadResult={videoUploadResult}
        frameTimestampSeconds={frameTimestampSeconds}
        multiFrameStartSeconds={multiFrameStartSeconds}
        multiFrameEndSeconds={multiFrameEndSeconds}
        multiFrameIntervalSeconds={multiFrameIntervalSeconds}
        isBusy={isBusy}
        isExtractingFrame={isExtractingFrame}
        isExtractingMultipleFrames={isExtractingMultipleFrames}
        onFrameTimestampSecondsChange={setFrameTimestampSeconds}
        onMultiFrameStartSecondsChange={setMultiFrameStartSeconds}
        onMultiFrameEndSecondsChange={setMultiFrameEndSeconds}
        onMultiFrameIntervalSecondsChange={setMultiFrameIntervalSeconds}
        onExtractVideoFrame={handleExtractVideoFrame}
        onExtractMultipleVideoFrames={handleExtractMultipleVideoFrames}
      />

      <VideoTrimResultSection
        videoTrimResult={videoTrimResult}
        videoTrimResultRef={videoTrimResultRef}
        trimmedVideoUrl={trimmedVideoUrl}
        isBusy={isBusy}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onClearVideoTrimResult={() => {
          setVideoTrimResult(null)
          setStatusMessage('Video Trim Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <ExtractedFrameResultSection
        videoFrameResult={videoFrameResult}
        videoFrameResultRef={videoFrameResultRef}
        extractedFrameUrl={extractedFrameUrl}
        isBusy={isBusy}
        isDetectingFrame={isDetectingFrame}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onClearVideoFrameResult={() => {
          setVideoFrameResult(null)
          setStatusMessage('Extracted Frame Result view cleared.')
        }}
        onDetectExtractedFrame={handleDetectExtractedFrame}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <VideoFrameDetectionResultSection
        videoFrameDetectionResult={videoFrameDetectionResult}
        videoFrameDetectionResultRef={videoFrameDetectionResultRef}
        annotatedFrameUrl={annotatedFrameUrl}
        isBusy={isBusy}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onClearVideoFrameDetectionResult={() => {
          setVideoFrameDetectionResult(null)
          setStatusMessage('Video Frame Detection Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <SampledVideoSection
        videoUploadResult={videoUploadResult}
        videoSampledDetectionResult={videoSampledDetectionResult}
        videoSampledDetectionResultRef={videoSampledDetectionResultRef}
        sampledVideoIntervalSeconds={sampledVideoIntervalSeconds}
        trackingStartSeconds={trackingStartSeconds}
        trackingEndSeconds={trackingEndSeconds}
        trackingIntervalSeconds={trackingIntervalSeconds}
        trackingMaxDistancePixels={trackingMaxDistancePixels}
        isBusy={isBusy}
        isDetectingSampledVideo={isDetectingSampledVideo}
        isTrackingVideo={isTrackingVideo}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onSampledVideoIntervalSecondsChange={setSampledVideoIntervalSeconds}
        onTrackingStartSecondsChange={setTrackingStartSeconds}
        onTrackingEndSecondsChange={setTrackingEndSeconds}
        onTrackingIntervalSecondsChange={setTrackingIntervalSeconds}
        onTrackingMaxDistancePixelsChange={setTrackingMaxDistancePixels}
        onDetectSampledVideo={handleDetectSampledVideo}
        onTrackSampledVideo={handleTrackSampledVideo}
        onClearVideoSampledDetectionResult={() => {
          setVideoSampledDetectionResult(null)
          setStatusMessage('Sampled Video Detection Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <MultiFrameExtractionResultSection
        videoMultiFrameResult={videoMultiFrameResult}
        videoMultiFrameResultRef={videoMultiFrameResultRef}
        isBusy={isBusy}
        isDetectingMultipleFrames={isDetectingMultipleFrames}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onClearVideoMultiFrameResult={() => {
          setVideoMultiFrameResult(null)
          setStatusMessage('Multi-Frame Extraction Result view cleared.')
        }}
        onDetectMultipleVideoFrames={handleDetectMultipleVideoFrames}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <MultiFrameDetectionResultSection
        videoMultiFrameDetectionResult={videoMultiFrameDetectionResult}
        videoMultiFrameDetectionResultRef={videoMultiFrameDetectionResultRef}
        isBusy={isBusy}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        formatFrameTimestamp={formatFrameTimestamp}
        getFrameClassSummary={getFrameClassSummary}
        onClearVideoMultiFrameDetectionResult={() => {
          setVideoMultiFrameDetectionResult(null)
          setStatusMessage('Multi-Frame Detection Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

      <VideoTrackingResultSection
        videoTrackingResult={videoTrackingResult}
        videoTrackingResultRef={videoTrackingResultRef}
        isBusy={isBusy}
        copiedParserLogJsonKey={copiedParserLogJsonKey}
        failedParserLogJsonKey={failedParserLogJsonKey}
        downloadedParserLogJsonKey={downloadedParserLogJsonKey}
        onClearVideoTrackingResult={() => {
          setVideoTrackingResult(null)
          setStatusMessage('Video Tracking Result view cleared.')
        }}
        onCopyJson={handleCopyParserLogJson}
        onDownloadJson={handleDownloadJsonFile}
      />

    </main>
  )
}

export default App
