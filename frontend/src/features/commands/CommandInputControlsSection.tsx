type AssistantParserMode = 'rule_based' | 'llm_mock' | 'real_llm'

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
  selectedParserMode: AssistantParserMode
  llmProviderName: string | null
  llmProviderModel: string | null
  realLlmAvailable: boolean | null
  isLoadingLlmProviderStatus: boolean
  onCommandTextChange: (commandText: string) => void
  onParseCommand: () => void | Promise<void>
  onPlanCommand: () => void | Promise<void>
  onLoadPlannerPromptPreview: () => void | Promise<void>
  onLoadPromptPreview: () => void | Promise<void>
  onRunCommand: () => void | Promise<void>
  onVoiceCommand: () => void
  onUseRealLlm: () => void | Promise<void>
  onLoadLlmProviderStatus: () => void | Promise<void>
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
  selectedParserMode,
  llmProviderName,
  llmProviderModel,
  realLlmAvailable,
  isLoadingLlmProviderStatus,
  onCommandTextChange,
  onParseCommand,
  onPlanCommand,
  onLoadPlannerPromptPreview,
  onLoadPromptPreview,
  onRunCommand,
  onVoiceCommand,
  onUseRealLlm,
  onLoadLlmProviderStatus,
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

  const localAiStatusLabel = isLoadingLlmProviderStatus
    ? 'Checking...'
    : realLlmAvailable === true
      ? 'Available'
      : realLlmAvailable === false
        ? 'Offline'
        : 'Not checked'

  const localAiModeLabel = selectedParserMode === 'real_llm'
    ? 'Local AI selected'
    : 'Basic command parser selected'

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
              Write or speak a natural command. Local AI can understand more natural image and video
              commands when it is available.
            </p>
          </div>

          <div className="assistant-local-ai-panel" aria-label="Local AI command intelligence">
            <div>
              <span className="assistant-local-ai-label">Assistant intelligence</span>
              <strong>{localAiModeLabel}</strong>
              <p>
                Local AI status: <strong>{localAiStatusLabel}</strong>
                {llmProviderName ? <> with {llmProviderName}</> : null}
                {llmProviderModel ? <> / {llmProviderModel}</> : null}
              </p>
            </div>

            <div className="assistant-local-ai-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => void onUseRealLlm()}
                disabled={isBusy || selectedParserMode === 'real_llm'}
              >
                {selectedParserMode === 'real_llm' ? 'Using Local AI' : 'Use Local AI'}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => void onLoadLlmProviderStatus()}
                disabled={isBusy || isLoadingLlmProviderStatus}
              >
                {isLoadingLlmProviderStatus ? 'Checking...' : 'Check Local AI'}
              </button>
            </div>

            {realLlmAvailable === false && (
              <p className="small-note">
                Local AI is offline. Start Ollama and the backend with Ollama settings, then check again.
                You can continue with basic commands while Local AI is unavailable.
              </p>
            )}
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
