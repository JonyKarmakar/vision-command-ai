import type { RefObject } from 'react'

type PlannerComparisonEvaluation = {
  planner_mode: string
  planner_type: string
  planner_version: string
  total_cases: number
  passed_cases: number
  failed_cases: number
  accuracy: number
}

type PlannerComparisonSkippedEvaluation = {
  planner_mode: string
  reason: string
}

type PlannerComparisonResult = {
  planner_modes: string[]
  evaluations: PlannerComparisonEvaluation[]
  skipped_evaluations?: PlannerComparisonSkippedEvaluation[] | null
}

type PlannerComparisonSectionProps = {
  plannerComparisonResult: PlannerComparisonResult | null
  plannerComparisonRef: RefObject<HTMLDivElement | null>
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  onClearPlannerComparison: () => void
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

export function PlannerComparisonSection({
  plannerComparisonResult,
  plannerComparisonRef,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  onClearPlannerComparison,
  onCopyJson,
  onDownloadJson,
}: PlannerComparisonSectionProps) {
  if (!plannerComparisonResult) {
    return null
  }

  return (
    <div className="parser-comparison-panel" ref={plannerComparisonRef}>
      <h3>Planner Comparison Results</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearPlannerComparison}
          disabled={isBusy}
        >
          Clear Planner Comparison View
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
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
            onDownloadJson(
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
  )
}
