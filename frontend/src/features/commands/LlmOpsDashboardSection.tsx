type SummaryItem = {
  name: string
  count: number
}

type LlmOpsCommandLogSummary = {
  total_commands: number
  by_parser_mode: SummaryItem[]
  by_result_type: SummaryItem[]
  by_parsed_action: SummaryItem[]
}

type LlmOpsProviderStatus = {
  provider_name?: string | null
  provider_model?: string | null
  real_llm_available?: boolean | null
}

type LlmOpsParserAttemptSummary = {
  total_attempts: number
  success_rate: number
  average_latency_ms: number
}

type LlmOpsParserEvaluationItem = {
  parser_type: string
  parser_version: string
  accuracy: number
  total_cases: number
  passed_cases: number
  failed_cases: number
}

type LlmOpsSkippedParserEvaluation = {
  parser_mode: string
  reason: string
}

type LlmOpsParserEvaluation = {
  evaluations: LlmOpsParserEvaluationItem[]
  skipped_evaluations: LlmOpsSkippedParserEvaluation[]
}

type LlmOpsPlannerEvaluationItem = {
  planner_mode: string
  planner_version: string
  accuracy: number
  total_cases: number
  passed_cases: number
  failed_cases: number
}

type LlmOpsSkippedPlannerEvaluation = {
  planner_mode: string
  reason: string
}

type LlmOpsPlannerEvaluation = {
  evaluations: LlmOpsPlannerEvaluationItem[]
  skipped_evaluations: LlmOpsSkippedPlannerEvaluation[]
}

type LlmOpsDashboardSectionProps = {
  llmOpsDashboardLoaded: boolean
  llmOpsDashboardResult: unknown | null
  llmOpsHasLegacyCommandParserMetadata: boolean
  llmOpsHasLegacyParserAttemptMode: boolean
  llmOpsCommandLogSummary: LlmOpsCommandLogSummary | null
  llmOpsProviderStatus: LlmOpsProviderStatus | null
  llmOpsParserAttemptSummary: LlmOpsParserAttemptSummary | null
  llmOpsParserEvaluation: LlmOpsParserEvaluation | null
  llmOpsPlannerEvaluation: LlmOpsPlannerEvaluation | null
  databaseParserLogParserModeFilter: string
  databaseParserLogSuccessFilter: string
  databaseParserLogLimit: number | string
  includeRealLlmEvaluationInDashboard: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  getCommandSummaryBarWidth: (count: number, items: SummaryItem[]) => string
  onCopyJson: (
    data: unknown,
    key: string,
    successMessage: string,
  ) => void | Promise<void>
  onDownloadJson: (
    data: unknown,
    filename: string,
    successMessage: string,
    downloadKey?: string,
  ) => void
  onClearLlmOpsDashboard: () => void
}

export function LlmOpsDashboardSection({
  llmOpsDashboardLoaded,
  llmOpsDashboardResult,
  llmOpsHasLegacyCommandParserMetadata,
  llmOpsHasLegacyParserAttemptMode,
  llmOpsCommandLogSummary,
  llmOpsProviderStatus,
  llmOpsParserAttemptSummary,
  llmOpsParserEvaluation,
  llmOpsPlannerEvaluation,
  databaseParserLogParserModeFilter,
  databaseParserLogSuccessFilter,
  databaseParserLogLimit,
  includeRealLlmEvaluationInDashboard,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  getCommandSummaryBarWidth,
  onCopyJson,
  onDownloadJson,
  onClearLlmOpsDashboard,
}: LlmOpsDashboardSectionProps) {
  if (!llmOpsDashboardLoaded || !llmOpsDashboardResult) {
    return null
  }

  return (
    <div className="llmops-dashboard-panel">
      <h3>LLMOps Dashboard</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearLlmOpsDashboard}
          disabled={isBusy}
        >
          Clear LLMOps Dashboard View
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
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
            onDownloadJson(
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
  )
}
