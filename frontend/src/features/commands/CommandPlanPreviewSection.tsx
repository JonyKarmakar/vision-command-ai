import { useState, type RefObject } from 'react'
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

type CommandExecutionSafetyHint = {
  label: string
  detail: string
}


type PreparedExecutionDecisionChecklistItem = {
  label: string
  status: 'pass' | 'review' | 'blocked'
  detail: string
}

const formatChecklistStatus = (status: PreparedExecutionDecisionChecklistItem['status']) => {
  if (status === 'pass') {
    return 'Ready'
  }

  if (status === 'blocked') {
    return 'Blocked'
  }

  return 'Review'
}

const getPreparedExecutionDecisionChecklist = (
  preparation: PreparedExecutionResult,
): PreparedExecutionDecisionChecklistItem[] => {
  const skill = preparation.command_skill
  const hasPreparedCommand = Boolean(preparation.prepared_command)
  const hasWarnings = preparation.warnings.length > 0
  const isImplementedSkill = skill?.execution_status === 'implemented_command'

  return [
    {
      label: 'Prepared command object',
      status: hasPreparedCommand ? 'pass' : 'blocked',
      detail: hasPreparedCommand
        ? 'A prepared command object is available for inspection.'
        : 'No prepared command object is available, so execution must stay blocked.',
    },
    {
      label: 'Backend executable flag',
      status: preparation.executable ? 'pass' : 'blocked',
      detail: preparation.executable
        ? 'The backend marked this prepared command as executable.'
        : 'The backend blocked this prepared command before execution.',
    },
    {
      label: 'Registry skill readiness',
      status: !skill ? 'review' : isImplementedSkill ? 'pass' : 'review',
      detail: !skill
        ? 'No registry skill metadata was matched, so this command needs extra review.'
        : isImplementedSkill
          ? 'The matched registry skill is marked as an implemented command path.'
          : 'The matched registry skill is not marked as a fully implemented command path.',
    },
    {
      label: 'Warnings',
      status: hasWarnings ? 'review' : 'pass',
      detail: hasWarnings
        ? 'Warnings are present and should be reviewed before any execution decision.'
        : 'No prepare-execution warnings were returned.',
    },
    {
      label: 'Manual confirmation',
      status:
        preparation.executable && hasPreparedCommand && isImplementedSkill
          ? 'review'
          : 'blocked',
      detail:
        preparation.executable && hasPreparedCommand && isImplementedSkill
          ? 'Execution is technically available, but the developer should still confirm the active media and intended action manually.'
          : 'Manual confirmation should not proceed to execution until the blocked or review items are resolved.',
    },
  ]
}


const getCommandExecutionSafetyHints = (
  preparation: PreparedExecutionResult,
): CommandExecutionSafetyHint[] => {
  const hints: CommandExecutionSafetyHint[] = []
  const skill = preparation.command_skill

  if (!skill) {
    hints.push({
      label: 'No matched skill metadata',
      detail:
        'The prepared command does not include registry metadata, so execution should be reviewed carefully before running.',
    })
  }

  if (!preparation.executable || !preparation.prepared_command) {
    hints.push({
      label: 'Execution blocked',
      detail:
        'The prepared command is not executable yet. Review the warning message and provide the missing context before trying to run it.',
    })
  } else {
    hints.push({
      label: 'Prepared command available',
      detail:
        'The backend prepared an executable command object. Review the command action, target, and warnings before executing.',
    })
  }

  if (preparation.warnings.length > 0) {
    hints.push({
      label: 'Warnings present',
      detail: preparation.warnings.join(' '),
    })
  }

  if (skill?.execution_status === 'implemented_command') {
    hints.push({
      label: 'Implemented command path',
      detail:
        'The matched registry skill is marked as an implemented command. Execution still depends on valid uploaded media and required context.',
    })
  }

  if (skill?.execution_status === 'workflow_available_manual') {
    hints.push({
      label: 'Manual workflow only',
      detail:
        'The matched workflow exists in the product, but it is not fully connected to command execution yet. Prefer the manual UI workflow for now.',
    })
  }

  if (skill?.execution_status === 'partially_implemented_command_support') {
    hints.push({
      label: 'Partially supported command',
      detail:
        'Some command support exists, but this skill may still require manual steps or future routing work before it is safe to treat as fully automated.',
    })
  }

  if (skill && skill.execution_status !== 'implemented_command') {
    hints.push({
      label: 'Do not overclaim automation',
      detail:
        'This registry status should be presented as workflow visibility, not as a completed command automation feature.',
    })
  }

  if (skill?.required_context.length) {
    hints.push({
      label: 'Required context',
      detail: `Needs: ${skill.required_context.join(', ')}.`,
    })
  }

  return hints
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

const getCommandSkillReadiness = (status: string) => {
  if (status === 'implemented_command') {
    return {
      label: 'Executable now',
      summary: 'This skill maps to an implemented command path.',
      detail:
        'The planner can prepare this command for the existing execution flow when the required context is present.',
    }
  }

  if (status === 'workflow_available_manual') {
    return {
      label: 'Manual workflow available',
      summary: 'This workflow exists in the product, but it is not command-driven yet.',
      detail:
        'The user can complete this through existing UI workflow steps, but E.4 routing has not connected it to one command yet.',
    }
  }

  if (status === 'partially_implemented_command_support') {
    return {
      label: 'Partially supported',
      summary: 'Some command support exists, but the workflow is not fully automated yet.',
      detail:
        'This skill may still need extra context, manual steps, or future routing work before it behaves like a complete command workflow.',
    }
  }

  return {
    label: 'Future work',
    summary: 'This skill is tracked in the registry, but it is not ready for command execution yet.',
    detail:
      'The registry keeps this visible for roadmap planning without pretending that execution is already implemented.',
  }
}



type PreparedExecutionDecisionChecklistPanelProps = {
  preparation: PreparedExecutionResult
}

function PreparedExecutionDecisionChecklistPanel({
  preparation,
}: PreparedExecutionDecisionChecklistPanelProps) {
  const checklist = getPreparedExecutionDecisionChecklist(preparation)

  return (
    <div className="parser-evaluation-panel prepared-execution-decision-checklist">
      <h4>Prepared Execution Decision Checklist</h4>

      <p className="small-note">
        Review this checklist before using Execute Prepared Command. It summarizes
        whether the prepared command is technically available, blocked, or still
        needs manual confirmation.
      </p>

      <div className="prepared-execution-checklist-list">
        {checklist.map((item) => (
          <div
            className={`prepared-execution-checklist-item prepared-execution-checklist-item-${item.status}`}
            key={item.label}
          >
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
            <span>{formatChecklistStatus(item.status)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type CommandExecutionSafetyHintsPanelProps = {
  preparation: PreparedExecutionResult
}

function CommandExecutionSafetyHintsPanel({
  preparation,
}: CommandExecutionSafetyHintsPanelProps) {
  const hints = getCommandExecutionSafetyHints(preparation)

  return (
    <div className="parser-evaluation-panel">
      <h4>Execution Safety Hints</h4>

      <p className="small-note">
        These hints explain whether this prepared command should be executed now,
        blocked for more context, or treated as a manual or partial workflow.
      </p>

      <div className="provider-mode-list">
        <span>Safety review</span>
        <ul>
          {hints.map((hint) => (
            <li key={`${hint.label}-${hint.detail}`}>
              <strong>{hint.label}</strong> {hint.detail}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

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

  const readiness = getCommandSkillReadiness(skill.execution_status)

  return (
    <div className="parser-evaluation-panel">
      <h4>{title}</h4>

      <div className="parser-provider-status-badge">
        <span>Execution readiness</span>
        <strong>{readiness.label}</strong>
      </div>

      <p className="small-note">
        {readiness.summary} {readiness.detail}
      </p>

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
  const [
    confirmedPreparedExecutionResult,
    setConfirmedPreparedExecutionResult,
  ] = useState<PreparedExecutionResult | null>(null)

  const isPreparedExecutionTechnicallyExecutable = Boolean(
    commandPlanExecutionPrepareResult?.executable &&
      commandPlanExecutionPrepareResult.prepared_command,
  )
  const hasConfirmedPreparedExecutionReview =
    Boolean(commandPlanExecutionPrepareResult) &&
    confirmedPreparedExecutionResult === commandPlanExecutionPrepareResult
  const canExecutePreparedCommand =
    isPreparedExecutionTechnicallyExecutable &&
    hasConfirmedPreparedExecutionReview

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
                !canExecutePreparedCommand
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

          <div className="prepared-execution-confirmation-gate">
            <label>
              <input
                type="checkbox"
                checked={hasConfirmedPreparedExecutionReview}
                onChange={(event) =>
                  setConfirmedPreparedExecutionResult(
                    event.target.checked ? commandPlanExecutionPrepareResult : null,
                  )
                }
                disabled={
                  isBusy ||
                  isExecutingPreparedCommand ||
                  !isPreparedExecutionTechnicallyExecutable
                }
              />
              <span>
                I reviewed the decision checklist, warnings, active media, and
                prepared command. Enable Execute Prepared Command.
              </span>
            </label>

            <p className="small-note">
              Execute Prepared Command stays disabled until this confirmation is
              selected and the prepared command is technically executable.
            </p>
          </div>

<PreparedExecutionDecisionChecklistPanel
  preparation={commandPlanExecutionPrepareResult}
/>

<CommandExecutionSafetyHintsPanel
  preparation={commandPlanExecutionPrepareResult}
/>

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
