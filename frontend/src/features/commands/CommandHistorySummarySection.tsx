import type { RefObject } from 'react'

type CommandSummaryBreakdownItem = {
  name: string
  count: number
}

type CommandLogSummary = {
  total_commands: number
  by_parser_mode: CommandSummaryBreakdownItem[]
  by_result_type: CommandSummaryBreakdownItem[]
  by_parsed_action: CommandSummaryBreakdownItem[]
}

type CommandHistorySummarySectionProps = {
  commandLogSummary: CommandLogSummary | null
  commandHistorySummaryRef: RefObject<HTMLDivElement | null>
  commandHistoryParserModeFilter: string
  commandHistoryResultTypeFilter: string
  isBusy: boolean
  getCommandSummaryBarWidth: (
    count: number,
    items: CommandSummaryBreakdownItem[],
  ) => string
  onClearCommandSummary: () => void
}

export function CommandHistorySummarySection({
  commandLogSummary,
  commandHistorySummaryRef,
  commandHistoryParserModeFilter,
  commandHistoryResultTypeFilter,
  isBusy,
  getCommandSummaryBarWidth,
  onClearCommandSummary,
}: CommandHistorySummarySectionProps) {
  if (!commandLogSummary) {
    return null
  }

  return (
    <div className="command-history-summary" ref={commandHistorySummaryRef}>
      <h3>Command History Summary</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearCommandSummary}
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
  )
}
