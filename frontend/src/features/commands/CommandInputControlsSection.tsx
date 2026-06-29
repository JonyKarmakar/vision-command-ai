type CommandInputControlsSectionProps = {
  commandText: string
  isBusy: boolean
  isRealLlmActionBlocked: boolean
  isParsingCommand: boolean
  isPlanningCommand: boolean
  isLoadingPlannerPromptPreview: boolean
  isLoadingPromptPreview: boolean
  isRunningCommand: boolean
  isListening: boolean
  isDeveloperMode: boolean
  onCommandTextChange: (commandText: string) => void
  onParseCommand: () => void | Promise<void>
  onPlanCommand: () => void | Promise<void>
  onLoadPlannerPromptPreview: () => void | Promise<void>
  onLoadPromptPreview: () => void | Promise<void>
  onRunCommand: () => void | Promise<void>
  onVoiceCommand: () => void
  onUseRuleBasedParser: () => void
  onUseMockParser: () => void
}

export function CommandInputControlsSection({
  commandText,
  isBusy,
  isRealLlmActionBlocked,
  isParsingCommand,
  isPlanningCommand,
  isLoadingPlannerPromptPreview,
  isLoadingPromptPreview,
  isRunningCommand,
  isListening,
  isDeveloperMode,
  onCommandTextChange,
  onParseCommand,
  onPlanCommand,
  onLoadPlannerPromptPreview,
  onLoadPromptPreview,
  onRunCommand,
  onVoiceCommand,
  onUseRuleBasedParser,
  onUseMockParser,
}: CommandInputControlsSectionProps) {
  const commandInput = (
    <input
      id="vision-command-input"
      className="command-input"
      type="text"
      value={commandText}
      placeholder={isDeveloperMode
        ? 'Type a command, for example: crop person or extract frame at 1 second'
        : 'Ask VisionCommand AI, for example: blur the person or zoom into the left person'}
      onChange={(event) => onCommandTextChange(event.target.value)}
      disabled={isBusy}
    />
  )

  const runButton = (
    <button
      onClick={() => void onRunCommand()}
      disabled={isBusy || !commandText.trim() || isRealLlmActionBlocked}
    >
      {isRunningCommand ? 'Working...' : isDeveloperMode ? 'Run Command' : 'Ask / Run'}
    </button>
  )

  const voiceButton = (
    <button
      className="voice-button"
      onClick={onVoiceCommand}
      disabled={isBusy}
    >
      {isListening ? 'Listening...' : isDeveloperMode ? 'Voice Command' : 'Speak'}
    </button>
  )

  return (
    <>
      {isDeveloperMode ? (
        <div className="command-row">
          {commandInput}

          <button
            className="secondary-button"
            onClick={() => void onParseCommand()}
            disabled={isBusy || !commandText.trim() || isRealLlmActionBlocked}
          >
            {isParsingCommand ? 'Parsing...' : 'Parse Command'}
          </button>

          <button
            className="secondary-button"
            onClick={() => void onPlanCommand()}
            disabled={isBusy || !commandText.trim()}
          >
            {isPlanningCommand ? 'Planning...' : 'Plan Command'}
          </button>

          <button
            className="secondary-button"
            onClick={() => void onLoadPlannerPromptPreview()}
            disabled={isBusy || !commandText.trim()}
          >
            {isLoadingPlannerPromptPreview ? 'Loading planner prompt...' : 'Preview Planner Prompt'}
          </button>

          <button
            className="secondary-button"
            onClick={() => void onLoadPromptPreview()}
            disabled={isBusy || !commandText.trim()}
          >
            {isLoadingPromptPreview ? 'Loading prompt...' : 'Preview LLM Prompt'}
          </button>

          {runButton}
          {voiceButton}
        </div>
      ) : (
        <div className="assistant-command-composer">
          <div className="assistant-command-copy">
            <label htmlFor="vision-command-input">What should VisionCommand do?</label>
            <p>
              Write a simple command, then run it. You can also speak the command instead.
            </p>
          </div>

          <div className="assistant-command-row">
            {commandInput}

            <div className="assistant-command-actions">
              {runButton}
              {voiceButton}
            </div>
          </div>
        </div>
      )}

      {isRealLlmActionBlocked && (
        <div className="real-llm-warning">
          <strong>Real LLM actions are disabled</strong>
          <p>
            Load provider status first. If no provider is available, use <code>rule_based</code> or <code>llm_mock</code>, or configure Ollama/OpenAI.
          </p>

          <div className="real-llm-warning-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onUseRuleBasedParser}
            >
              Use rule_based
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={onUseMockParser}
            >
              Use llm_mock
            </button>
          </div>
        </div>
      )}
    </>
  )
}
