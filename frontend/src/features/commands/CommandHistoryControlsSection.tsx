type CommandHistoryControlsSectionProps = {
  commandHistoryParserModeFilter: string
  commandHistoryResultTypeFilter: string
  commandHistoryLimit: string
  commandHistoryResetNotice: string
  commandHistoryExportNotice: string
  isBusy: boolean
  isRealLlmActionBlocked: boolean
  isLoadingLogs: boolean
  isLoadingCommandLogSummary: boolean
  isLoadingCommandEvaluation: boolean
  isLoadingParserComparison: boolean
  isLoadingPlannerComparison: boolean
  isLoadingParserAttemptLogs: boolean
  onCommandHistoryParserModeFilterChange: (value: string) => void
  onCommandHistoryResultTypeFilterChange: (value: string) => void
  onCommandHistoryLimitChange: (value: string) => void
  onResetCommandHistoryFilters: () => void
  onLoadCommandLogs: () => void | Promise<void>
  onExportCommandLogs: () => void | Promise<void>
  onLoadCommandLogSummary: () => void | Promise<void>
  onLoadCommandEvaluation: () => void | Promise<void>
  onLoadParserComparison: () => void | Promise<void>
  onLoadPlannerComparison: () => void | Promise<void>
  onLoadParserAttemptLogs: () => void | Promise<void>
}

export function CommandHistoryControlsSection({
  commandHistoryParserModeFilter,
  commandHistoryResultTypeFilter,
  commandHistoryLimit,
  commandHistoryResetNotice,
  commandHistoryExportNotice,
  isBusy,
  isRealLlmActionBlocked,
  isLoadingLogs,
  isLoadingCommandLogSummary,
  isLoadingCommandEvaluation,
  isLoadingParserComparison,
  isLoadingPlannerComparison,
  isLoadingParserAttemptLogs,
  onCommandHistoryParserModeFilterChange,
  onCommandHistoryResultTypeFilterChange,
  onCommandHistoryLimitChange,
  onResetCommandHistoryFilters,
  onLoadCommandLogs,
  onExportCommandLogs,
  onLoadCommandLogSummary,
  onLoadCommandEvaluation,
  onLoadParserComparison,
  onLoadPlannerComparison,
  onLoadParserAttemptLogs,
}: CommandHistoryControlsSectionProps) {
  return (
    <>
      <label className="command-history-filter">
        Command history parser
        <select
          value={commandHistoryParserModeFilter}
          onChange={(event) => onCommandHistoryParserModeFilterChange(event.target.value)}
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
          onChange={(event) => onCommandHistoryResultTypeFilterChange(event.target.value)}
          disabled={isBusy}
        >
          <option value="all">all</option>
          <option value="annotated_detection">annotated_detection</option>
          <option value="crop_by_class">crop_by_class</option>
          <option value="blur_by_class">blur_by_class</option>
          <option value="blur_all_by_class">blur_all_by_class</option>
          <option value="enhance_image">enhance_image</option>
          <option value="background_blur">background_blur</option>
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
          onChange={(event) => onCommandHistoryLimitChange(event.target.value)}
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
        onClick={onResetCommandHistoryFilters}
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
        onClick={() => void onLoadCommandLogs()}
        disabled={isBusy}
      >
        {isLoadingLogs ? 'Loading history...' : 'Load Command History'}
      </button>

      <button
        className="secondary-button"
        onClick={() => void onExportCommandLogs()}
        disabled={isBusy}
      >
        Export Command History CSV
      </button>

      <button
        className="secondary-button"
        onClick={() => void onLoadCommandLogSummary()}
        disabled={isBusy || isLoadingCommandLogSummary}
      >
        {isLoadingCommandLogSummary ? 'Loading summary...' : 'Load Command Summary'}
      </button>

      <button
        className="secondary-button"
        onClick={() => void onLoadCommandEvaluation()}
        disabled={isBusy || isRealLlmActionBlocked}
      >
        {isLoadingCommandEvaluation ? 'Loading evaluation...' : 'Load Parser Evaluation'}
      </button>

      <button
        className="secondary-button"
        onClick={() => void onLoadParserComparison()}
        disabled={isBusy}
      >
        {isLoadingParserComparison ? 'Loading comparison...' : 'Load Parser Comparison'}
      </button>

      <button
        className="secondary-button"
        onClick={() => void onLoadPlannerComparison()}
        disabled={isBusy}
      >
        {isLoadingPlannerComparison ? 'Loading planner comparison...' : 'Load Planner Comparison'}
      </button>

      <button
        className="secondary-button"
        onClick={() => void onLoadParserAttemptLogs()}
        disabled={isBusy}
      >
        {isLoadingParserAttemptLogs ? 'Loading logs...' : 'Load Local Parser Attempt Logs'}
      </button>
    </>
  )
}
