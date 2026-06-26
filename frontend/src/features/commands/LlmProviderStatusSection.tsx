type LlmProviderStatus = {
  provider_name: string
  provider_model?: string | null
  is_supported: boolean
  is_configured: boolean
  real_llm_available: boolean
  supported_llm_providers: string[]
  supported_parser_modes: string[]
  supported_planner_modes?: string[] | null
}

type LlmProviderStatusSectionProps = {
  llmProviderStatusResult: LlmProviderStatus | null
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
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
  onClearLlmProviderStatus: () => void
}

export function LlmProviderStatusSection({
  llmProviderStatusResult,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  onCopyJson,
  onDownloadJson,
  onClearLlmProviderStatus,
}: LlmProviderStatusSectionProps) {
  if (!llmProviderStatusResult) {
    return null
  }

  return (
    <div className="llm-provider-status-panel">
      <h3>LLM Provider Status</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearLlmProviderStatus}
          disabled={isBusy}
        >
          Clear LLM Provider Status View
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
              {
                source: 'llm_provider_status',
                copied_at: new Date().toISOString(),
                provider_status: llmProviderStatusResult,
              },
              'llm-provider-status-json',
              'Copied LLM Provider Status JSON to clipboard.',
            )
          }
          disabled={isBusy || !llmProviderStatusResult}
        >
          {copiedParserLogJsonKey === 'llm-provider-status-json'
            ? 'Copied!'
            : failedParserLogJsonKey === 'llm-provider-status-json'
              ? 'Copy failed'
              : 'Copy LLM Provider Status JSON'}
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            onDownloadJson(
              {
                source: 'llm_provider_status',
                downloaded_at: new Date().toISOString(),
                provider_status: llmProviderStatusResult,
              },
              `llm_provider_status_provider-${llmProviderStatusResult.provider_name.replace(/[^a-z0-9]+/gi, '-')}_available-${llmProviderStatusResult.real_llm_available ? 'yes' : 'no'}.json`,
              'Downloaded LLM Provider Status JSON.',
              'download-llm-provider-status-json',
            )
          }
          disabled={isBusy || !llmProviderStatusResult}
          data-testid="download-llm-provider-status-json"
        >
          {downloadedParserLogJsonKey === 'download-llm-provider-status-json'
            ? 'Downloaded!'
            : 'Download LLM Provider Status JSON'}
        </button>
      </div>

      <div className="provider-status-grid">
        <div>
          <span>provider_name</span>
          <strong>{llmProviderStatusResult.provider_name}</strong>
        </div>
        <div>
          <span>provider_model</span>
          <strong>{llmProviderStatusResult.provider_model ?? 'none'}</strong>
        </div>
        <div>
          <span>is_supported</span>
          <strong>{String(llmProviderStatusResult.is_supported)}</strong>
        </div>
        <div>
          <span>is_configured</span>
          <strong>{String(llmProviderStatusResult.is_configured)}</strong>
        </div>
        <div>
          <span>real_llm_available</span>
          <strong>{String(llmProviderStatusResult.real_llm_available)}</strong>
        </div>
      </div>

      <div className="provider-mode-list">
        <span>Supported LLM providers</span>
        <div>
          {llmProviderStatusResult.supported_llm_providers.map((provider) => (
            <strong key={provider}>{provider}</strong>
          ))}
        </div>
      </div>

      <div className="provider-mode-list">
        <span>Supported parser modes</span>
        <div>
          {llmProviderStatusResult.supported_parser_modes.map((mode) => (
            <strong key={mode}>{mode}</strong>
          ))}
        </div>
      </div>

      <div className="provider-mode-list">
        <span>Supported planner modes</span>
        <div>
          {(llmProviderStatusResult.supported_planner_modes ?? []).map((mode) => (
            <strong key={mode}>{mode}</strong>
          ))}
        </div>
      </div>

      {!llmProviderStatusResult.is_supported && (
        <p className="small-note">
          The selected LLM provider is not supported by this backend yet.
        </p>
      )}

      {llmProviderStatusResult.is_supported && !llmProviderStatusResult.real_llm_available && (
        <p className="small-note">
          Real LLM parsing/planning is not configured yet. This is expected until an external provider is added.
        </p>
      )}
    </div>
  )
}
