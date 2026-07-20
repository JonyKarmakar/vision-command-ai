import type { AnalysisMemoryChatResponse } from '../../types/apiTypes'

type AnalysisMemoryChatSectionProps = {
  question: string
  response: AnalysisMemoryChatResponse | null
  mediaTypeFilter: string
  sourceFilenameFilter: string
  limit: string
  isDeveloperMode: boolean
  isBusy: boolean
  isLoading: boolean
  hasGeneratedOutputHistory: boolean
  error: string | null
  onQuestionChange: (question: string) => void
  onMediaTypeFilterChange: (value: string) => void
  onSourceFilenameFilterChange: (value: string) => void
  onLimitChange: (value: string) => void
  onAskAnalysisMemory: () => void
  onSelectQuestion: (question: string) => void
  onClearAnswer: () => void
}

const analysisMemoryExamples = [
  'What have I analyzed so far?',
  'Which outputs mention people?',
  'Which results may need privacy review?',
  'Find recent video analyses.',
  'Summarize the latest generated outputs.',
]

const formatSourceTitle = (
  label: string | null,
  outputFilename: string | null,
  sourceFilename: string | null,
) => {
  if (label && outputFilename) {
    return `${label} · ${outputFilename}`
  }

  return label ?? outputFilename ?? sourceFilename ?? 'Retrieved source'
}

export function AnalysisMemoryChatSection({
  question,
  response,
  mediaTypeFilter,
  sourceFilenameFilter,
  limit,
  isDeveloperMode,
  isBusy,
  isLoading,
  hasGeneratedOutputHistory,
  error,
  onQuestionChange,
  onMediaTypeFilterChange,
  onSourceFilenameFilterChange,
  onLimitChange,
  onAskAnalysisMemory,
  onSelectQuestion,
  onClearAnswer,
}: AnalysisMemoryChatSectionProps) {
  return (
    <section
      className="image-chat-panel analysis-memory-chat-panel"
      aria-label="Analysis memory chat"
    >
      <div className="image-chat-header">
        <div>
          <h3>Ask analysis memory</h3>
          <p>
            Ask across stored generated outputs and previous workflow evidence. Answers
            are grounded in retrieved source cards from analysis memory.
          </p>
        </div>

        {response && (
          <button type="button" onClick={onClearAnswer} disabled={isBusy || isLoading}>
            Clear answer
          </button>
        )}
      </div>

      <div className="image-chat-examples" aria-label="Analysis memory example questions">
        {analysisMemoryExamples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onSelectQuestion(example)}
            disabled={isBusy || isLoading}
          >
            {example}
          </button>
        ))}
      </div>

      <div className="analysis-memory-filter-row">
        <label>
          <span>Media</span>
          <select
            value={mediaTypeFilter}
            onChange={(event) => onMediaTypeFilterChange(event.target.value)}
            disabled={isBusy || isLoading}
          >
            <option value="all">All media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>

        <label>
          <span>Source filename</span>
          <input
            type="text"
            value={sourceFilenameFilter}
            onChange={(event) => onSourceFilenameFilterChange(event.target.value)}
            placeholder="Optional, for example clip.mp4"
            disabled={isBusy || isLoading}
          />
        </label>

        <label>
          <span>Limit</span>
          <select
            value={limit}
            onChange={(event) => onLimitChange(event.target.value)}
            disabled={isBusy || isLoading}
          >
            <option value="5">5 sources</option>
            <option value="8">8 sources</option>
            <option value="12">12 sources</option>
            <option value="20">20 sources</option>
          </select>
        </label>
      </div>

      <div className="image-chat-input-row">
        <textarea
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Ask across previous analysis memory, for example: Which results may need privacy review?"
          rows={3}
          disabled={isBusy || isLoading}
        />

        <button
          type="button"
          onClick={onAskAnalysisMemory}
          disabled={isBusy || isLoading || !question.trim()}
        >
          {isLoading ? 'Asking...' : 'Ask memory'}
        </button>
      </div>

      {!hasGeneratedOutputHistory && (
        <p className="image-chat-hint">
          Analysis memory uses persisted generated output history. Create outputs or load
          saved history for richer answers.
        </p>
      )}

      {error && (
        <p className="image-chat-error" role="alert">
          {error}
        </p>
      )}

      {response && (
        <div className="image-chat-answer analysis-memory-answer">
          <h4>Assistant answer</h4>
          <p>{response.answer}</p>

          <p className="image-chat-answer-meta">
            Answer source: {response.responder_type}
            {response.prompt_version ? ` · ${response.prompt_version}` : ''}
            {` · ${response.retrieved_item_count} retrieved source${
              response.retrieved_item_count === 1 ? '' : 's'
            }`}
          </p>

          {response.retrieved_sources.length > 0 && (
            <div className="analysis-memory-source-grid">
              {response.retrieved_sources.map((source) => {
                const outputUrl = source.file_url ? `/api${source.file_url}` : null

                return (
                  <article
                    className="analysis-memory-source-card"
                    key={source.memory_id ?? source.output_filename ?? source.label}
                  >
                    <div>
                      <strong>
                        {formatSourceTitle(
                          source.label,
                          source.output_filename,
                          source.source_filename,
                        )}
                      </strong>
                      <p>
                        {source.media_type ?? 'unknown'} · {source.action ?? 'unknown action'}
                        {source.result_type ? ` · ${source.result_type}` : ''}
                      </p>
                    </div>

                    {source.source_filename && (
                      <p className="small-note">
                        Source file: {source.source_filename}
                      </p>
                    )}

                    {source.detected_classes.length > 0 && (
                      <p className="small-note">
                        Class hints: {source.detected_classes.join(', ')}
                      </p>
                    )}

                    {source.privacy_signals.length > 0 && (
                      <p className="small-note">
                        Privacy signals: {source.privacy_signals.join(', ')}
                      </p>
                    )}

                    {outputUrl && (
                      <a href={outputUrl} target="_blank" rel="noreferrer">
                        Open output
                      </a>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          <div className="image-chat-grounding-note" role="note">
            <strong>Grounding notes</strong>
            <ul>
              {response.grounding_notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          {response.limitations.length > 0 && (
            <div className="image-chat-grounding-note" role="note">
              <strong>Limitations</strong>
              <ul>
                {response.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isDeveloperMode && response && (
        <details className="image-chat-debug">
          <summary>Analysis memory response payload</summary>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </details>
      )}
    </section>
  )
}
