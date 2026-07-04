type ImageChatAnalysisSectionProps = {
  question: string
  answer: string | null
  responderType: string | null
  promptVersion: string | null
  contextSummary: Record<string, unknown> | null
  isDeveloperMode: boolean
  isBusy: boolean
  isLoading: boolean
  hasImageContext: boolean
  error: string | null
  onQuestionChange: (question: string) => void
  onAskImage: () => void
  onSelectQuestion: (question: string) => void
  onClearAnswer: () => void
}

const imageChatExamples = [
  'What do you see in this image?',
  'What objects are detected?',
  'What should I blur for privacy?',
  'What did I do to this image so far?',
]

export function ImageChatAnalysisSection({
  question,
  answer,
  responderType,
  promptVersion,
  contextSummary,
  isDeveloperMode,
  isBusy,
  isLoading,
  hasImageContext,
  error,
  onQuestionChange,
  onAskImage,
  onSelectQuestion,
  onClearAnswer,
}: ImageChatAnalysisSectionProps) {
  return (
    <section className="image-chat-panel" aria-label="Image chat analysis">
      <div className="image-chat-header">
        <div>
          <h3>Ask about this image</h3>
          <p>
            Ask a natural question about the current image. VisionCommand AI answers from
            detection results, generated outputs, and workflow context.
          </p>
        </div>

        {answer && (
          <button type="button" onClick={onClearAnswer} disabled={isBusy || isLoading}>
            Clear answer
          </button>
        )}
      </div>

      <div className="image-chat-examples" aria-label="Image chat example questions">
        {imageChatExamples.map((example) => (
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
          placeholder="Ask about the current image, for example: What should I blur for privacy?"
          rows={3}
          disabled={isBusy || isLoading}
        />

        <button
          type="button"
          onClick={onAskImage}
          disabled={isBusy || isLoading || !question.trim() || !hasImageContext}
        >
          {isLoading ? 'Asking...' : 'Ask image'}
        </button>
      </div>

      {!hasImageContext && (
        <p className="image-chat-hint">
          Upload an image or select a generated output before asking about image context.
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
        </div>
      )}

      {isDeveloperMode && contextSummary && (
        <details className="image-chat-debug">
          <summary>Image chat context summary</summary>
          <pre>{JSON.stringify(contextSummary, null, 2)}</pre>
        </details>
      )}
    </section>
  )
}
