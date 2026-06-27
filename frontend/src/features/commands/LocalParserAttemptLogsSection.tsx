import type {
  ParserAttemptLogEntry,
  ParserAttemptLogsResponse,
} from '../../types/apiTypes'

type LocalParserAttemptBreakdownItem = {
  parserMode?: string
  parserType?: string
  parserError?: string
  total: number
  successful: number
  failed: number
  averageLatencyMs: number
}

type LocalParserAttemptErrorBreakdownItem = {
  parserError: string
  total: number
  averageLatencyMs: number
}

type LocalParserAttemptSummary = {
  total: number
  successful: number
  failed: number
  averageLatencyMs: number
  byParserMode: LocalParserAttemptBreakdownItem[]
  byParserType: LocalParserAttemptBreakdownItem[]
  byParserError: LocalParserAttemptErrorBreakdownItem[]
}

type LocalParserAttemptLogsSectionProps = {
  parserAttemptLogsResult: ParserAttemptLogsResponse | null
  sortedLocalParserAttemptLogs: ParserAttemptLogEntry[]
  filteredLocalParserAttemptLogs: ParserAttemptLogEntry[]
  localParserAttemptSummary: LocalParserAttemptSummary | null
  localParserAttemptModeFilter: string
  localParserAttemptResultFilter: string
  localParserAttemptSearch: string
  localParserAttemptSortOrder: string
  localParserAttemptResetNotice: string
  localParserAttemptExportNotice: string
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  getSafeJsonFileSearchPart: (searchText: string) => string
  getLocalParserAttemptSearchMatchFields: (log: ParserAttemptLogEntry) => string[]
  onClearLocalParserAttemptLogs: () => void
  onCopyJson: (
    data: unknown,
    key: string,
    successMessage?: string,
  ) => void | Promise<void>
  onDownloadJson: (
    data: unknown,
    filename: string,
    successMessage: string,
    downloadKey?: string,
  ) => void
  onLocalParserAttemptModeFilterChange: (value: string) => void
  onLocalParserAttemptResultFilterChange: (value: string) => void
  onLocalParserAttemptSearchChange: (value: string) => void
  onLocalParserAttemptSortOrderChange: (value: string) => void
  onResetLocalParserFilters: () => void
  onExportLocalParserAttemptLogs: () => void
}

export function LocalParserAttemptLogsSection({
  parserAttemptLogsResult,
  sortedLocalParserAttemptLogs,
  filteredLocalParserAttemptLogs,
  localParserAttemptSummary,
  localParserAttemptModeFilter,
  localParserAttemptResultFilter,
  localParserAttemptSearch,
  localParserAttemptSortOrder,
  localParserAttemptResetNotice,
  localParserAttemptExportNotice,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  getSafeJsonFileSearchPart,
  getLocalParserAttemptSearchMatchFields,
  onClearLocalParserAttemptLogs,
  onCopyJson,
  onDownloadJson,
  onLocalParserAttemptModeFilterChange,
  onLocalParserAttemptResultFilterChange,
  onLocalParserAttemptSearchChange,
  onLocalParserAttemptSortOrderChange,
  onResetLocalParserFilters,
  onExportLocalParserAttemptLogs,
}: LocalParserAttemptLogsSectionProps) {
  if (!parserAttemptLogsResult) {
    return null
  }

  return (
    <div className="parser-attempt-logs-panel">
      <h3>Local Parser Attempt Logs</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearLocalParserAttemptLogs}
          disabled={isBusy}
        >
          Clear Local Parser Attempt Logs View
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
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
            onDownloadJson(
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
              onLocalParserAttemptModeFilterChange(event.target.value)
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
              onLocalParserAttemptResultFilterChange(event.target.value)
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
              onLocalParserAttemptSearchChange(event.target.value)
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
              onLocalParserAttemptSortOrderChange(event.target.value)
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
          onClick={onResetLocalParserFilters}
          disabled={isBusy}
        >
          Reset Local Parser Filters
        </button>

        <button
          className="secondary-button"
          onClick={onExportLocalParserAttemptLogs}
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
                      void onCopyJson(
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
                      onDownloadJson(
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

              {log.parsed_command != null && (
                <details className="parser-log-json-details">
                  <summary>View parsed command JSON</summary>
                  <div className="parser-log-json-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => void onCopyJson(log.parsed_command, `parser-json-${log.timestamp}-${index}`)}
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
                        onDownloadJson(
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
  )
}
