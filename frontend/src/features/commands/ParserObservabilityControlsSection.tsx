type ParserObservabilityControlsSectionProps = {
  databaseParserLogParserModeFilter: string
  databaseParserLogSuccessFilter: string
  databaseParserLogLimit: string
  includeRealLlmEvaluationInDashboard: boolean
  databaseParserResetNotice: string
  databaseParserExportNotice: string
  isBusy: boolean
  isLoadingDatabaseParserAttemptLogs: boolean
  isLoadingDatabaseParserAttemptSummary: boolean
  isLoadingLlmProviderStatus: boolean
  isLoadingLlmOpsDashboard: boolean
  hasAnyLoadedObservabilityView: boolean
  loadedObservabilityViewCount: number
  loadedObservabilityViewNames: string[]
  onDatabaseParserLogParserModeFilterChange: (value: string) => void
  onDatabaseParserLogSuccessFilterChange: (value: string) => void
  onDatabaseParserLogLimitChange: (value: string) => void
  onIncludeRealLlmEvaluationChange: (checked: boolean) => void
  onResetParserFilters: () => void
  onLoadDatabaseParserAttemptLogs: () => void | Promise<void>
  onExportDatabaseParserAttemptLogs: () => void | Promise<void>
  onLoadDatabaseParserAttemptSummary: () => void | Promise<void>
  onLoadLlmProviderStatus: () => void | Promise<void>
  onLoadLlmOpsDashboard: () => void | Promise<void>
  onClearAllLoadedObservabilityViews: () => void
}

export function ParserObservabilityControlsSection({
  databaseParserLogParserModeFilter,
  databaseParserLogSuccessFilter,
  databaseParserLogLimit,
  includeRealLlmEvaluationInDashboard,
  databaseParserResetNotice,
  databaseParserExportNotice,
  isBusy,
  isLoadingDatabaseParserAttemptLogs,
  isLoadingDatabaseParserAttemptSummary,
  isLoadingLlmProviderStatus,
  isLoadingLlmOpsDashboard,
  hasAnyLoadedObservabilityView,
  loadedObservabilityViewCount,
  loadedObservabilityViewNames,
  onDatabaseParserLogParserModeFilterChange,
  onDatabaseParserLogSuccessFilterChange,
  onDatabaseParserLogLimitChange,
  onIncludeRealLlmEvaluationChange,
  onResetParserFilters,
  onLoadDatabaseParserAttemptLogs,
  onExportDatabaseParserAttemptLogs,
  onLoadDatabaseParserAttemptSummary,
  onLoadLlmProviderStatus,
  onLoadLlmOpsDashboard,
  onClearAllLoadedObservabilityViews,
}: ParserObservabilityControlsSectionProps) {
  return (
    <>
      <div className="database-parser-log-filters">
        <label>
          Parser mode
          <select
            value={databaseParserLogParserModeFilter}
            onChange={(event) => onDatabaseParserLogParserModeFilterChange(event.target.value)}
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
            onChange={(event) => onDatabaseParserLogSuccessFilterChange(event.target.value)}
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
            onChange={(event) => onDatabaseParserLogLimitChange(event.target.value)}
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
            onChange={(event) => onIncludeRealLlmEvaluationChange(event.target.checked)}
          />
          Include real LLM evaluation
        </label>

        <button
          className="secondary-button"
          onClick={onResetParserFilters}
          disabled={isBusy}
        >
          Reset Parser Filters
        </button>
      </div>

      <button
        className="secondary-button"
        onClick={() => void onLoadDatabaseParserAttemptLogs()}
        disabled={isBusy}
      >
        {isLoadingDatabaseParserAttemptLogs ? 'Loading DB logs...' : 'Load DB Parser Logs'}
      </button>

      <button
        className="secondary-button"
        onClick={() => void onExportDatabaseParserAttemptLogs()}
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
        onClick={() => void onLoadDatabaseParserAttemptSummary()}
        disabled={isBusy}
      >
        {isLoadingDatabaseParserAttemptSummary ? 'Loading DB summary...' : 'Load DB Parser Summary'}
      </button>

      <button
        className="secondary-button"
        onClick={() => void onLoadLlmProviderStatus()}
        disabled={isBusy}
      >
        {isLoadingLlmProviderStatus ? 'Loading provider...' : 'Load LLM Provider Status'}
      </button>

      <button
        className="secondary-button"
        onClick={() => void onLoadLlmOpsDashboard()}
        disabled={isBusy}
      >
        {isLoadingLlmOpsDashboard ? 'Loading LLMOps...' : 'Load LLMOps Dashboard'}
      </button>

      <button
        className="secondary-button"
        onClick={onClearAllLoadedObservabilityViews}
        disabled={isBusy || !hasAnyLoadedObservabilityView}
      >
        Clear All Loaded Views
      </button>

      <p className="loaded-views-status">
        {hasAnyLoadedObservabilityView
          ? `${loadedObservabilityViewCount} loaded observability view(s) open: ${loadedObservabilityViewNames.join(', ')}.`
          : 'No loaded observability views open.'}
      </p>
    </>
  )
}
