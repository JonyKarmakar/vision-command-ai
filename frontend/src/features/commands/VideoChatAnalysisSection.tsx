type VideoChatAnalysisSectionProps = {
  question: string
  answer: string | null
  responderType: string | null
  promptVersion: string | null
  contextSummary: Record<string, unknown> | null
  isDeveloperMode: boolean
  isBusy: boolean
  isLoading: boolean
  hasVideoContext: boolean
  error: string | null
  onQuestionChange: (question: string) => void
  onAskVideo: () => void
  onSelectQuestion: (question: string) => void
  onClearAnswer: () => void
}

const videoChatExamples = [
  'What happens in this video?',
  'What objects appear in the sampled frames?',
  'Should I blur anything for privacy?',
  'What changed between frames?',
  'What did I do to this video so far?',
]

export function VideoChatAnalysisSection({
  question,
  answer,
  responderType,
  promptVersion,
  contextSummary,
  isDeveloperMode,
  isBusy,
  isLoading,
  hasVideoContext,
  error,
  onQuestionChange,
  onAskVideo,
  onSelectQuestion,
  onClearAnswer,
}: VideoChatAnalysisSectionProps) {
  return (
    <section className="image-chat-panel video-chat-panel" aria-label="Video chat analysis">
      <div className="image-chat-header">
        <div>
          <h3>Ask about this video</h3>
          <p>
            Ask a natural question about the current video. VisionCommand AI answers from
            upload metadata, sampled detections, tracking results, and workflow context.
          </p>
        </div>

        {answer && (
          <button type="button" onClick={onClearAnswer} disabled={isBusy || isLoading}>
            Clear answer
          </button>
        )}
      </div>

      <div className="image-chat-examples" aria-label="Video chat example questions">
        {videoChatExamples.map((example) => (
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

      <div className="image-chat-input-row">
        <textarea
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Ask about the current video, for example: What objects appear in the sampled frames?"
          rows={3}
          disabled={isBusy || isLoading}
        />

        <button
          type="button"
          onClick={onAskVideo}
          disabled={isBusy || isLoading || !question.trim() || !hasVideoContext}
        >
          {isLoading ? 'Asking...' : 'Ask video'}
        </button>
      </div>

      {!hasVideoContext && (
        <p className="image-chat-hint">
          Upload a video or run a video workflow before asking about video context.
        </p>
      )}

      {error && (
        <p className="image-chat-error" role="alert">
          {error}
        </p>
      )}

      {answer && (
        <div className="image-chat-answer">
          <h4>Assistant answer</h4>
          <p>{answer}</p>

          <p className="image-chat-answer-meta">
            Answer source: {responderType ?? 'unknown'}
            {promptVersion ? ` · ${promptVersion}` : ''}
          </p>

          <div className="image-chat-grounding-note" role="note">
            <strong>Grounding note</strong>
            <p>
              This answer is grounded in sampled detections, tracking results, and workflow context.
              It does not identify people, infer emotions or recording location, or use full
              raw-video understanding.
            </p>
          </div>
        </div>
      )}

      {isDeveloperMode && contextSummary && (
        <details className="image-chat-debug">
          <summary>Video chat context summary</summary>
          <pre>{JSON.stringify(contextSummary, null, 2)}</pre>
        </details>
      )}
    </section>
  )
}
