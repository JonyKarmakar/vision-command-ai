type LlmProviderStatus = {
  provider_name: string
  provider_model?: string | null
  real_llm_available: boolean
}

type LocalOllamaHelpSectionProps = {
  llmProviderStatusResult: LlmProviderStatus | null
}

export function LocalOllamaHelpSection({
  llmProviderStatusResult,
}: LocalOllamaHelpSectionProps) {
  return (
    <details className="local-ollama-help-panel">
      <summary>Local Ollama Setup for real_llm</summary>

      <div className="local-ollama-help-content">
        <p>
          Use this setup to run <code>parser_mode=real_llm</code> locally without a paid API key.
        </p>

        {llmProviderStatusResult && (
          <div className="local-ollama-status-grid">
            <div>
              <span>Current provider</span>
              <strong>{llmProviderStatusResult.provider_name}</strong>
            </div>
            <div>
              <span>Current model</span>
              <strong>{llmProviderStatusResult.provider_model ?? 'none'}</strong>
            </div>
            <div>
              <span>Real LLM available</span>
              <strong>{llmProviderStatusResult.real_llm_available ? 'yes' : 'no'}</strong>
            </div>
          </div>
        )}

        <div className="local-ollama-steps">
          <div>
            <span>1. Start Ollama</span>
            <code>ollama serve</code>
          </div>

          <div>
            <span>2. Pull a lightweight model</span>
            <code>ollama pull llama3.2:1b</code>
          </div>

          <div>
            <span>3. Start backend with Ollama</span>
            <pre>{`export LLM_PROVIDER=ollama
export OLLAMA_BASE_URL="http://localhost:11434"
export OLLAMA_MODEL="llama3.2:1b"
uvicorn app.main:app --reload`}</pre>
          </div>

          <div>
            <span>4. Use real LLM parser mode</span>
            <code>parser_mode=real_llm</code>
          </div>
        </div>

        <p className="small-note">
          Tip: click “Load LLM Provider Status” after starting the backend to verify that Ollama is configured and available.
        </p>
      </div>
    </details>
  )
}
