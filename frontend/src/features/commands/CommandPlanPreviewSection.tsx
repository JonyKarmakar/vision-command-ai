import type { RefObject } from 'react'
import type { CommandSkill } from '../../types/apiTypes'

type CommandPlanResult = Record<string, unknown> & {
  action: string
  needs_clarification?: boolean
  clarification_question?: string | null
  command_skill?: CommandSkill | null
}

type PreparedExecutionResult = {
  status: string
  executable: boolean
  prepared_command: unknown | null
  warnings: string[]
  command_skill?: CommandSkill | null
}

type CommandPlanPreviewSectionProps = {
  commandPlanResult: CommandPlanResult | null
  commandPlanExecutionPrepareResult: PreparedExecutionResult | null
  commandPlanPreviewRef: RefObject<HTMLDivElement | null>
  commandPlanExecutionPrepareRef: RefObject<HTMLDivElement | null>
  commandText: string
  selectedPlannerMode: string
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  isPreparingCommandPlanExecution: boolean
  isExecutingPreparedCommand: boolean
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
  onPrepareCommandPlanExecution: () => void | Promise<void>
  onExecutePreparedCommand: () => void | Promise<void>
  onClearCommandPlanPreview: () => void
  onClearPreparedExecutionPreview: () => void
}

const formatSkillStatus = (status: string) => status.replace(/_/g, ' ')

type CommandSkillMetadataPanelProps = {
  title: string
  skill?: CommandSkill | null
}

function CommandSkillMetadataPanel({ title, skill }: CommandSkillMetadataPanelProps) {
  if (!skill) {
    return (
      <div className="real-llm-warning">
        <strong>{title}</strong>
        <p>No command skill metadata was matched for this plan.</p>
      </div>
    )
  }

  return (
    <div className="parser-evaluation-panel">
      <h4>{title}</h4>

      <div className="parser-evaluation-summary">
        <div>
          <span>Skill ID</span>
          <strong>{skill.id}</strong>
        </div>
        <div>
          <span>Title</span>
          <strong>{skill.title}</strong>
        </div>
        <div>
          <span>Category</span>
          <strong>{formatSkillStatus(skill.category)}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{formatSkillStatus(skill.execution_status)}</strong>
        </div>
      </div>

      <div className="provider-mode-list">
        <span>Supported media</span>
        <div>
          {skill.supported_media.map((media) => (
            <strong key={media}>{media}</strong>
          ))}
        </div>
      </div>

      {skill.mapped_actions.length > 0 && (
        <div className="provider-mode-list">
          <span>Mapped actions</span>
          <div>
            {skill.mapped_actions.map((action) => (
              <strong key={action}>{action}</strong>
            ))}
          </div>
        </div>
      )}

      <div className="provider-mode-list">
        <span>Mapped workflows</span>
        <ul>
          {skill.mapped_workflows.map((workflow) => (
            <li key={workflow}>{workflow}</li>
          ))}
        </ul>
      </div>

      <div className="provider-mode-list">
        <span>Required context</span>
        <ul>
          {skill.required_context.map((contextItem) => (
            <li key={contextItem}>{contextItem}</li>
          ))}
        </ul>
      </div>

      {skill.optional_context.length > 0 && (
        <div className="provider-mode-list">
          <span>Optional context</span>
          <ul>
            {skill.optional_context.map((contextItem) => (
              <li key={contextItem}>{contextItem}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="provider-mode-list">
        <span>Outputs</span>
        <ul>
          {skill.outputs.map((output) => (
            <li key={output}>{output}</li>
          ))}
        </ul>
      </div>

      <div className="provider-mode-list">
        <span>Limitations</span>
        <ul>
          {skill.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function CommandPlanPreviewSection({
  commandPlanResult,
  commandPlanExecutionPrepareResult,
  commandPlanPreviewRef,
  commandPlanExecutionPrepareRef,
  commandText,
  selectedPlannerMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  isPreparingCommandPlanExecution,
  isExecutingPreparedCommand,
  onCopyJson,
  onDownloadJson,
  onPrepareCommandPlanExecution,
  onExecutePreparedCommand,
  onClearCommandPlanPreview,
  onClearPreparedExecutionPreview,
}: CommandPlanPreviewSectionProps) {
  return (
    <>
      {commandPlanResult && (
        <div className="command-parse-result" ref={commandPlanPreviewRef}>
          <h3>Command Plan Preview</h3>

          <div className="loaded-panel-actions">
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'command_plan_preview',
                    copied_at: new Date().toISOString(),
                    command: commandText,
                    planner_mode: selectedPlannerMode,
                    plan: commandPlanResult,
                  },
                  'command-plan-preview-json',
                  'Copied Command Plan Preview JSON to clipboard.',
                )
              }
              disabled={isBusy || !commandPlanResult}
            >
              {copiedParserLogJsonKey === 'command-plan-preview-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'command-plan-preview-json'
                  ? 'Copy failed'
                  : 'Copy Command Plan JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'command_plan_preview',
                    downloaded_at: new Date().toISOString(),
                    command: commandText,
                    planner_mode: selectedPlannerMode,
                    plan: commandPlanResult,
                  },
                  `command_plan_preview_mode-${selectedPlannerMode}_action-${commandPlanResult.action}.json`,
                  'Downloaded Command Plan Preview JSON.',
                  'download-command-plan-preview-json',
                )
              }
              disabled={isBusy || !commandPlanResult}
            >
              {downloadedParserLogJsonKey === 'download-command-plan-preview-json'
                ? 'Downloaded!'
                : 'Download Command Plan JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() => void onPrepareCommandPlanExecution()}
              disabled={isBusy || !commandPlanResult}
            >
              {isPreparingCommandPlanExecution ? 'Preparing...' : 'Prepare Execution'}
            </button>

            <button
              className="secondary-button view-clear-button"
              onClick={onClearCommandPlanPreview}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <p><strong>Original command:</strong> {commandText}</p>
          <p><strong>Planner mode:</strong> {selectedPlannerMode}</p>

          <CommandSkillMetadataPanel
            title="Matched Command Skill"
            skill={commandPlanResult.command_skill}
          />

          <div className="parse-field-list">
            {Object.entries(commandPlanResult).map(([key, value]) => (
              <div className="parse-field" key={key}>
                <span>{key}</span>
                <strong>
                  {value === null || value === undefined
                    ? 'null'
                    : typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                </strong>
              </div>
            ))}
          </div>

          {commandPlanResult.needs_clarification && commandPlanResult.clarification_question && (
            <div className="real-llm-warning">
              <strong>Clarification needed</strong>
              <p>{commandPlanResult.clarification_question}</p>
            </div>
          )}
        </div>
      )}

      {commandPlanExecutionPrepareResult && (
        <div className="command-parse-result" ref={commandPlanExecutionPrepareRef}>
          <h3>Prepared Execution Preview</h3>

          <div className="loaded-panel-actions">
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'prepared_execution_preview',
                    copied_at: new Date().toISOString(),
                    command: commandText,
                    planner_mode: selectedPlannerMode,
                    plan: commandPlanResult,
                    preparation: commandPlanExecutionPrepareResult,
                  },
                  'prepared-execution-preview-json',
                  'Copied Prepared Execution Preview JSON to clipboard.',
                )
              }
              disabled={isBusy || !commandPlanExecutionPrepareResult}
            >
              {copiedParserLogJsonKey === 'prepared-execution-preview-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'prepared-execution-preview-json'
                  ? 'Copy failed'
                  : 'Copy Prepared Execution JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'prepared_execution_preview',
                    downloaded_at: new Date().toISOString(),
                    command: commandText,
                    planner_mode: selectedPlannerMode,
                    plan: commandPlanResult,
                    preparation: commandPlanExecutionPrepareResult,
                  },
                  `prepared_execution_preview_status-${commandPlanExecutionPrepareResult.status}.json`,
                  'Downloaded Prepared Execution Preview JSON.',
                  'download-prepared-execution-preview-json',
                )
              }
              disabled={isBusy || !commandPlanExecutionPrepareResult}
              data-testid="download-prepared-execution-preview-json"
            >
              {downloadedParserLogJsonKey === 'download-prepared-execution-preview-json'
                ? 'Downloaded!'
                : 'Download Prepared Execution JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() => void onExecutePreparedCommand()}
              disabled={
                isBusy ||
                isExecutingPreparedCommand ||
                !commandPlanExecutionPrepareResult.executable ||
                !commandPlanExecutionPrepareResult.prepared_command
              }
            >
              {isExecutingPreparedCommand ? 'Executing...' : 'Execute Prepared Command'}
            </button>

            <button
              className="secondary-button view-clear-button"
              onClick={onClearPreparedExecutionPreview}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <p><strong>Status:</strong> {commandPlanExecutionPrepareResult.status}</p>
          <p><strong>Executable:</strong> {commandPlanExecutionPrepareResult.executable ? 'yes' : 'no'}</p>

          <CommandSkillMetadataPanel
            title="Prepared Execution Command Skill"
            skill={commandPlanExecutionPrepareResult.command_skill}
          />

          <div className="parse-field-list">
            <div className="parse-field">
              <span>prepared_command</span>
              <strong>
                {commandPlanExecutionPrepareResult.prepared_command
                  ? JSON.stringify(commandPlanExecutionPrepareResult.prepared_command)
                  : 'null'}
              </strong>
            </div>

            <div className="parse-field">
              <span>warnings</span>
              <strong>
                {commandPlanExecutionPrepareResult.warnings.length > 0
                  ? commandPlanExecutionPrepareResult.warnings.join(' | ')
                  : 'none'}
              </strong>
            </div>
          </div>

          {commandPlanExecutionPrepareResult.warnings.length > 0 && (
            <div className="real-llm-warning">
              <strong>Preparation warning</strong>
              <p>{commandPlanExecutionPrepareResult.warnings.join(' ')}</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
