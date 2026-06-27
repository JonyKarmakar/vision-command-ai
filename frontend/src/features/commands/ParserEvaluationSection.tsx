import type { RefObject } from 'react'

type ParserEvaluationCommandLike = {
  action?: string | null
}

type ParserEvaluationResultItem = {
  command: string
  passed: boolean
  expected: ParserEvaluationCommandLike
  actual?: ParserEvaluationCommandLike | null
}

type ParserEvaluationResult = {
  parser_type: string
  parser_version: string
  total_cases: number
  passed_cases: number
  failed_cases: number
  accuracy: number
  results: ParserEvaluationResultItem[]
}

type ParserEvaluationSectionProps = {
  commandEvaluationResult: ParserEvaluationResult | null
  parserEvaluationRef: RefObject<HTMLDivElement | null>
  isBusy: boolean
  onClearParserEvaluation: () => void
}

export function ParserEvaluationSection({
  commandEvaluationResult,
  parserEvaluationRef,
  isBusy,
  onClearParserEvaluation,
}: ParserEvaluationSectionProps) {
  if (!commandEvaluationResult) {
    return null
  }

  return (
    <div className="parser-evaluation-panel" ref={parserEvaluationRef}>
      <h3>Parser Evaluation Results</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearParserEvaluation}
          disabled={isBusy}
        >
          Clear Parser Evaluation View
        </button>
      </div>

      <div className="parser-evaluation-summary">
        <div>
          <span>Parser</span>
          <strong>{commandEvaluationResult.parser_type}</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>{commandEvaluationResult.parser_version}</strong>
        </div>
        <div>
          <span>Total cases</span>
          <strong>{commandEvaluationResult.total_cases}</strong>
        </div>
        <div>
          <span>Passed</span>
          <strong>{commandEvaluationResult.passed_cases}</strong>
        </div>
        <div>
          <span>Failed</span>
          <strong>{commandEvaluationResult.failed_cases}</strong>
        </div>
        <div>
          <span>Accuracy</span>
          <strong>{(commandEvaluationResult.accuracy * 100).toFixed(1)}%</strong>
        </div>
      </div>

      <div className="parser-evaluation-list">
        {commandEvaluationResult.results.map((result) => (
          <div
            className={result.passed ? 'evaluation-item passed' : 'evaluation-item failed'}
            key={result.command}
          >
            <div>
              <strong>{result.command}</strong>
              <p>{result.passed ? 'Passed' : 'Failed'}</p>
            </div>

            <div>
              <span>Expected: {result.expected.action}</span>
              <span>Actual: {result.actual?.action ?? 'none'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
