import type { DatabaseParserAttemptLog } from '../../types/apiTypes'

type DatabaseParserAttemptLogsResult = {
  status: string
  count: number
  logs: DatabaseParserAttemptLog[]
}

type VisibleDatabaseParserModeSummary = {
  parserMode: string
  total: number
  successful: number
  failed: number
  averageLatencyMs: number
}

type VisibleDatabaseParserTypeSummary = {
  parserType: string
  total: number
  successful: number
  failed: number
  averageLatencyMs: number
}

type VisibleDatabaseParserErrorSummary = {
  parserError: string
  total: number
  averageLatencyMs: number
}

type VisibleDatabaseParserLogSummary = {
  total: number
  successful: number
  failed: number
  averageLatencyMs: number
  byDatabaseParserMode: VisibleDatabaseParserModeSummary[]
  byDatabaseParserType: VisibleDatabaseParserTypeSummary[]
  byDatabaseParserError: VisibleDatabaseParserErrorSummary[]
}

type DatabaseParserAttemptLogsSectionProps = {
  databaseParserAttemptLogsResult: DatabaseParserAttemptLogsResult | null
  sortedDatabaseParserAttemptLogs: DatabaseParserAttemptLog[]
  filteredDatabaseParserAttemptLogs: DatabaseParserAttemptLog[]
  visibleDatabaseParserLogSummary: VisibleDatabaseParserLogSummary | null
  databaseParserLogParserModeFilter: string
  databaseParserLogSuccessFilter: string
  databaseParserLogLimit: number | string
  databaseParserLogSearch: string
  databaseParserLogSortOrder: string
  databaseParserLogViewResetNotice: string
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  getSafeJsonFileSearchPart: (searchText: string) => string
  getDatabaseParserLogSearchMatchFields: (log: DatabaseParserAttemptLog) => string[]
  onClearDatabaseParserAttemptLogs: () => void
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
  onDatabaseParserLogSearchChange: (value: string) => void
  onDatabaseParserLogSortOrderChange: (value: string) => void
  onResetLoadedDatabaseParserLogView: () => void
  onExportVisibleDatabaseParserAttemptLogs: () => void
}

export function DatabaseParserAttemptLogsSection({
  databaseParserAttemptLogsResult,
  sortedDatabaseParserAttemptLogs,
  filteredDatabaseParserAttemptLogs,
  visibleDatabaseParserLogSummary,
  databaseParserLogParserModeFilter,
  databaseParserLogSuccessFilter,
  databaseParserLogLimit,
  databaseParserLogSearch,
  databaseParserLogSortOrder,
  databaseParserLogViewResetNotice,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  getSafeJsonFileSearchPart,
  getDatabaseParserLogSearchMatchFields,
  onClearDatabaseParserAttemptLogs,
  onCopyJson,
  onDownloadJson,
  onDatabaseParserLogSearchChange,
  onDatabaseParserLogSortOrderChange,
  onResetLoadedDatabaseParserLogView,
  onExportVisibleDatabaseParserAttemptLogs,
}: DatabaseParserAttemptLogsSectionProps) {
  if (!databaseParserAttemptLogsResult) {
    return null
  }

  return (
    <div className="database-parser-attempt-logs-panel">
      <h3>PostgreSQL Parser Attempt Logs</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearDatabaseParserAttemptLogs}
          disabled={isBusy}
        >
          Clear DB Parser Logs View
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
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
            onDownloadJson(
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
              onDatabaseParserLogSearchChange(event.target.value)
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
              onDatabaseParserLogSortOrderChange(event.target.value)
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
          onClick={onResetLoadedDatabaseParserLogView}
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
          onClick={onExportVisibleDatabaseParserAttemptLogs}
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
                      void onCopyJson(
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
                      onDownloadJson(
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
  )
}
