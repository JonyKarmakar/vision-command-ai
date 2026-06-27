import type { RefObject } from 'react'

type ParserComparisonEvaluation = {
  parser_type: string
  parser_version: string
  total_cases: number
  passed_cases: number
  failed_cases: number
  accuracy: number
}

type ParserComparisonSkippedEvaluation = {
  parser_mode: string
  reason: string
}

type ParserComparisonResult = {
  parser_modes: string[]
  evaluations: ParserComparisonEvaluation[]
  skipped_evaluations?: ParserComparisonSkippedEvaluation[] | null
}

type ParserComparisonSectionProps = {
  parserComparisonResult: ParserComparisonResult | null
  parserComparisonRef: RefObject<HTMLDivElement | null>
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  onClearParserComparison: () => void
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

export function ParserComparisonSection({
  parserComparisonResult,
  parserComparisonRef,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  onClearParserComparison,
  onCopyJson,
  onDownloadJson,
}: ParserComparisonSectionProps) {
  if (!parserComparisonResult) {
    return null
  }

  return (
    <div className="parser-comparison-panel" ref={parserComparisonRef}>
      <h3>Parser Comparison Results</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearParserComparison}
          disabled={isBusy}
        >
          Clear Parser Comparison View
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
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
            onDownloadJson(
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
  )
}
