type ParserModeSummaryItem = {
  parser_mode?: string | null
  attempts: number
  successful_attempts: number
  failed_attempts: number
  average_latency_ms: number
}

type ParserTypeSummaryItem = {
  parser_type?: string | null
  attempts: number
  successful_attempts: number
  failed_attempts: number
  average_latency_ms: number
}

type ParserErrorSummaryItem = {
  error: string
  attempts: number
  average_latency_ms: number
}

type DatabaseParserAttemptSummary = {
  status: string
  total_attempts: number
  successful_attempts: number
  failed_attempts: number
  success_rate: number
  average_latency_ms: number
  by_parser_mode: ParserModeSummaryItem[]
  by_parser_type: ParserTypeSummaryItem[]
  by_error: ParserErrorSummaryItem[]
}

type DatabaseParserAttemptSummarySectionProps = {
  databaseParserAttemptSummaryResult: DatabaseParserAttemptSummary | null
  databaseParserLogParserModeFilter: string
  databaseParserLogSuccessFilter: string
  databaseParserLogLimit: number | string
  isBusy: boolean
  onClearDatabaseParserAttemptSummary: () => void
}

function getBreakdownBarWidth(
  attempts: number,
  items: Array<{ attempts: number }>,
) {
  const maxAttempts = Math.max(...items.map((item) => item.attempts), 1)

  return `${Math.max(
    4,
    Math.round((attempts / maxAttempts) * 100),
  )}%`
}

export function DatabaseParserAttemptSummarySection({
  databaseParserAttemptSummaryResult,
  databaseParserLogParserModeFilter,
  databaseParserLogSuccessFilter,
  databaseParserLogLimit,
  isBusy,
  onClearDatabaseParserAttemptSummary,
}: DatabaseParserAttemptSummarySectionProps) {
  if (!databaseParserAttemptSummaryResult) {
    return null
  }

  return (
    <div className="database-parser-attempt-summary-panel">
      <h3>PostgreSQL Parser Attempt Summary</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearDatabaseParserAttemptSummary}
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
                      width: getBreakdownBarWidth(
                        item.attempts,
                        databaseParserAttemptSummaryResult.by_parser_mode,
                      ),
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
                      width: getBreakdownBarWidth(
                        item.attempts,
                        databaseParserAttemptSummaryResult.by_parser_type,
                      ),
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
  )
}
