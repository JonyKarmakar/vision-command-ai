import type { RefObject } from 'react'
import type { CommandLog } from '../../types/apiTypes'

type VisibleCommandHistorySummary = {
  total: number
  byParserMode: [string, number][]
  byResultType: [string, number][]
  byParsedAction: [string, number][]
  byParserType: [string, number][]
  byParserVersion: [string, number][]
}

type RecentCommandHistorySectionProps = {
  hasLoadedCommandLogs: boolean
  commandHistoryRef: RefObject<HTMLDivElement | null>
  commandLogs: CommandLog[]
  filteredCommandHistoryLogs: CommandLog[]
  visibleCommandHistorySummary: VisibleCommandHistorySummary | null
  commandHistoryParserModeFilter: string
  commandHistoryResultTypeFilter: string
  commandHistoryLimit: string
  commandHistorySearch: string
  commandHistorySortOrder: string
  commandHistoryViewResetNotice: string
  commandHistoryVisibleExportNotice: string
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  getSafeJsonFileSearchPart: (searchText: string) => string
  getCommandHistorySearchMatchFields: (log: CommandLog) => string[]
  onClearCommandHistory: () => void
  onCommandHistorySearchChange: (value: string) => void
  onCommandHistorySortOrderChange: (value: string) => void
  onResetLoadedCommandHistoryView: () => void
  onExportVisibleCommandHistoryLogs: () => void
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
}

export function RecentCommandHistorySection({
  hasLoadedCommandLogs,
  commandHistoryRef,
  commandLogs,
  filteredCommandHistoryLogs,
  visibleCommandHistorySummary,
  commandHistoryParserModeFilter,
  commandHistoryResultTypeFilter,
  commandHistoryLimit,
  commandHistorySearch,
  commandHistorySortOrder,
  commandHistoryViewResetNotice,
  commandHistoryVisibleExportNotice,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  getSafeJsonFileSearchPart,
  getCommandHistorySearchMatchFields,
  onClearCommandHistory,
  onCommandHistorySearchChange,
  onCommandHistorySortOrderChange,
  onResetLoadedCommandHistoryView,
  onExportVisibleCommandHistoryLogs,
  onCopyJson,
  onDownloadJson,
}: RecentCommandHistorySectionProps) {
  if (!hasLoadedCommandLogs) {
    return null
  }

  return (
    <div className="command-history" ref={commandHistoryRef}>
      <h3>Recent Command History</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearCommandHistory}
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
              onCommandHistorySearchChange(event.target.value)
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
              onCommandHistorySortOrderChange(event.target.value)
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
          onClick={onResetLoadedCommandHistoryView}
          disabled={isBusy}
        >
          Reset Loaded Command History View
        </button>

        <button
          className="secondary-button"
          onClick={onExportVisibleCommandHistoryLogs}
          disabled={isBusy || filteredCommandHistoryLogs.length === 0}
        >
          Export Visible Command History CSV
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
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
            onDownloadJson(
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
                void onCopyJson(
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
                onDownloadJson(
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
  )
}
