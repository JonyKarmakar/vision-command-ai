type CommandMode = 'rule_based' | 'llm_mock' | 'real_llm'

type CommandModeSelectorsSectionProps = {
  selectedParserMode: CommandMode
  selectedPlannerMode: CommandMode
  providerName: string | null
  realLlmAvailable: boolean | null
  isBusy: boolean
  isLoadingLlmProviderStatus: boolean
  isRealLlmProviderStatusLoading: boolean
  isRealLlmProviderStatusUnknown: boolean
  isRealLlmUnavailable: boolean
  onParserModeChange: (mode: CommandMode) => void
  onPlannerModeChange: (mode: CommandMode) => void
}

export function CommandModeSelectorsSection({
  selectedParserMode,
  selectedPlannerMode,
  providerName,
  realLlmAvailable,
  isBusy,
  isLoadingLlmProviderStatus,
  isRealLlmProviderStatusLoading,
  isRealLlmProviderStatusUnknown,
  isRealLlmUnavailable,
  onParserModeChange,
  onPlannerModeChange,
}: CommandModeSelectorsSectionProps) {
  return (
    <>
      <div className="parser-mode-selector">
        <label htmlFor="parser-mode">
          Parser mode
        </label>

        <select
          id="parser-mode"
          value={selectedParserMode}
          onChange={(event) => onParserModeChange(event.target.value as CommandMode)}
          disabled={isBusy}
        >
          <option value="rule_based">rule_based</option>
          <option value="llm_mock">llm_mock</option>
          <option value="real_llm">real_llm</option>
        </select>

        <div className="parser-provider-status-badge">
          <span>
            Provider:{' '}
            <strong>
              {isLoadingLlmProviderStatus ? 'checking...' : providerName ?? 'not loaded'}
            </strong>
          </span>

          <span>
            Real LLM:{' '}
            <strong>
              {isLoadingLlmProviderStatus
                ? 'checking...'
                : realLlmAvailable === true
                  ? 'available'
                  : realLlmAvailable === false
                    ? 'unavailable'
                    : 'unknown'}
            </strong>
          </span>
        </div>

        <p className="small-note">
          `llm_mock` uses the current rule-based parser internally, while `real_llm` uses the configured local Ollama/OpenAI provider.
          {isRealLlmProviderStatusLoading && (
            <div className="real-llm-warning">
              <strong>Checking real LLM provider status</strong>
              <p>
                The app is checking whether a configured Ollama/OpenAI provider is available.
              </p>
            </div>
          )}

          {isRealLlmProviderStatusUnknown && (
            <div className="real-llm-warning">
              <strong>Real LLM provider status not loaded</strong>
              <p>
                <code>real_llm</code> is selected. Load LLM provider status or the LLMOps dashboard to check whether Ollama/OpenAI is available.
              </p>
            </div>
          )}

          {isRealLlmUnavailable && (
            <div className="real-llm-warning">
              <strong>Real LLM unavailable</strong>
              <p>
                <code>real_llm</code> is selected, but no configured Ollama/OpenAI provider is currently available.
                Use <code>rule_based</code> or <code>llm_mock</code>, or configure a real LLM provider.
              </p>
            </div>
          )}

          {selectedParserMode === 'real_llm' && (
            <span className="parser-mode-warning">
              Real LLM evaluation requires a configured provider. Use local Ollama setup or OpenAI before evaluating this mode.
            </span>
          )}
        </p>
      </div>

      <div className="parser-mode-selector">
        <label htmlFor="planner-mode">Planner mode</label>

        <select
          id="planner-mode"
          value={selectedPlannerMode}
          onChange={(event) => onPlannerModeChange(event.target.value as CommandMode)}
          disabled={isBusy}
        >
          <option value="rule_based">rule_based</option>
          <option value="llm_mock">llm_mock</option>
          <option value="real_llm">real_llm</option>
        </select>

        <p className="small-note">
          Planner mode converts the command into a structured action plan before execution.
        </p>
      </div>
    </>
  )
}
