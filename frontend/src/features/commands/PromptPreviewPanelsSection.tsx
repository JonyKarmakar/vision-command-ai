import type { RefObject } from 'react'

type PlannerPromptPreviewResult = {
  command: string
  prompt_version: string
  system_prompt: string
  user_prompt: string
  expected_json_schema: unknown
}

type LlmPromptPreviewResult = {
  parser_mode: string
  prompt_version: string
  system_prompt: string
  user_prompt: string
  expected_json_schema: unknown
}

type PromptPreviewPanelsSectionProps = {
  commandPlannerPromptPreviewResult: PlannerPromptPreviewResult | null
  commandPromptPreviewResult: LlmPromptPreviewResult | null
  plannerPromptPreviewRef: RefObject<HTMLDivElement | null>
  llmPromptPreviewRef: RefObject<HTMLDivElement | null>
  selectedPlannerMode: string
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
  onClearPlannerPromptPreview: () => void
  onClearLlmPromptPreview: () => void
}

export function PromptPreviewPanelsSection({
  commandPlannerPromptPreviewResult,
  commandPromptPreviewResult,
  plannerPromptPreviewRef,
  llmPromptPreviewRef,
  selectedPlannerMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  onCopyJson,
  onDownloadJson,
  onClearPlannerPromptPreview,
  onClearLlmPromptPreview,
}: PromptPreviewPanelsSectionProps) {
  return (
    <>
      {commandPlannerPromptPreviewResult && (
        <div className="llm-prompt-preview" ref={plannerPromptPreviewRef}>
          <h3>Planner Prompt Preview</h3>

          <div className="loaded-panel-actions">
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'planner_prompt_preview',
                    copied_at: new Date().toISOString(),
                    command: commandPlannerPromptPreviewResult.command,
                    planner_mode: selectedPlannerMode,
                    prompt_version: commandPlannerPromptPreviewResult.prompt_version,
                    preview: commandPlannerPromptPreviewResult,
                  },
                  'planner-prompt-preview-json',
                  'Copied Planner Prompt Preview JSON to clipboard.',
                )
              }
              disabled={isBusy || !commandPlannerPromptPreviewResult}
            >
              {copiedParserLogJsonKey === 'planner-prompt-preview-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'planner-prompt-preview-json'
                  ? 'Copy failed'
                  : 'Copy Planner Prompt Preview JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'planner_prompt_preview',
                    downloaded_at: new Date().toISOString(),
                    command: commandPlannerPromptPreviewResult.command,
                    planner_mode: selectedPlannerMode,
                    prompt_version: commandPlannerPromptPreviewResult.prompt_version,
                    preview: commandPlannerPromptPreviewResult,
                  },
                  `planner_prompt_preview_mode-${selectedPlannerMode}_version-${commandPlannerPromptPreviewResult.prompt_version.replace(/[^a-z0-9]+/gi, '-')}.json`,
                  'Downloaded Planner Prompt Preview JSON.',
                  'download-planner-prompt-preview-json',
                )
              }
              disabled={isBusy || !commandPlannerPromptPreviewResult}
              data-testid="download-planner-prompt-preview-json"
            >
              {downloadedParserLogJsonKey === 'download-planner-prompt-preview-json'
                ? 'Downloaded!'
                : 'Download Planner Prompt Preview JSON'}
            </button>

            <button
              className="secondary-button view-clear-button"
              onClick={onClearPlannerPromptPreview}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <div className="prompt-metadata-grid">
            <div>
              <span>Planner mode</span>
              <strong>{selectedPlannerMode}</strong>
            </div>
            <div>
              <span>Prompt version</span>
              <strong>{commandPlannerPromptPreviewResult.prompt_version}</strong>
            </div>
          </div>

          <div className="prompt-preview-grid">
            <div className="prompt-block">
              <h4>System Prompt</h4>
              <pre>{commandPlannerPromptPreviewResult.system_prompt}</pre>
            </div>

            <div className="prompt-block">
              <h4>User Prompt</h4>
              <pre>{commandPlannerPromptPreviewResult.user_prompt}</pre>
            </div>

            <div className="prompt-block">
              <h4>Expected JSON Schema</h4>
              <pre>{JSON.stringify(commandPlannerPromptPreviewResult.expected_json_schema, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {commandPromptPreviewResult && (
        <div className="llm-prompt-preview-panel" ref={llmPromptPreviewRef}>
          <h3>LLM Prompt Preview</h3>

          <div className="loaded-panel-actions">
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'llm_prompt_preview',
                    copied_at: new Date().toISOString(),
                    parser_mode: commandPromptPreviewResult.parser_mode,
                    prompt_version: commandPromptPreviewResult.prompt_version,
                    preview: commandPromptPreviewResult,
                  },
                  'llm-prompt-preview-json',
                  'Copied LLM Prompt Preview JSON to clipboard.',
                )
              }
              disabled={isBusy || !commandPromptPreviewResult}
            >
              {copiedParserLogJsonKey === 'llm-prompt-preview-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'llm-prompt-preview-json'
                  ? 'Copy failed'
                  : 'Copy LLM Prompt Preview JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'llm_prompt_preview',
                    downloaded_at: new Date().toISOString(),
                    parser_mode: commandPromptPreviewResult.parser_mode,
                    prompt_version: commandPromptPreviewResult.prompt_version,
                    preview: commandPromptPreviewResult,
                  },
                  `llm_prompt_preview_mode-${commandPromptPreviewResult.parser_mode}_version-${commandPromptPreviewResult.prompt_version.replace(/[^a-z0-9]+/gi, '-')}.json`,
                  'Downloaded LLM Prompt Preview JSON.',
                  'download-llm-prompt-preview-json',
                )
              }
              disabled={isBusy || !commandPromptPreviewResult}
              data-testid="download-llm-prompt-preview-json"
            >
              {downloadedParserLogJsonKey === 'download-llm-prompt-preview-json'
                ? 'Downloaded!'
                : 'Download LLM Prompt Preview JSON'}
            </button>

            <button
              className="secondary-button view-clear-button"
              onClick={onClearLlmPromptPreview}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <div className="prompt-metadata-grid">
            <div>
              <span>Parser mode</span>
              <strong>{commandPromptPreviewResult.parser_mode}</strong>
            </div>
            <div>
              <span>Prompt version</span>
              <strong>{commandPromptPreviewResult.prompt_version}</strong>
            </div>
          </div>

          <div className="prompt-block">
            <h4>System Prompt</h4>
            <pre>{commandPromptPreviewResult.system_prompt}</pre>
          </div>

          <div className="prompt-block">
            <h4>User Prompt</h4>
            <pre>{commandPromptPreviewResult.user_prompt}</pre>
          </div>

          <div className="prompt-block">
            <h4>Expected JSON Schema</h4>
            <pre>{JSON.stringify(commandPromptPreviewResult.expected_json_schema, null, 2)}</pre>
          </div>
        </div>
      )}
    </>
  )
}
