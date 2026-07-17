import type { RefObject } from 'react'
import type { CommandSkillsRegistryResponse } from '../../types/apiTypes'

type CommandSkillsRegistrySectionProps = {
  commandSkillsRegistryResult: CommandSkillsRegistryResponse | null
  commandSkillsRegistryRef: RefObject<HTMLDivElement | null>
  isBusy: boolean
  onClearCommandSkillsRegistry: () => void
}

const formatSkillStatus = (status: string) => status.replace(/_/g, ' ')

const getSkillsByStatus = (registry: CommandSkillsRegistryResponse) =>
  registry.skills.reduce<Record<string, number>>((summary, skill) => {
    summary[skill.execution_status] = (summary[skill.execution_status] ?? 0) + 1
    return summary
  }, {})

const getSkillsByCategory = (registry: CommandSkillsRegistryResponse) =>
  registry.skills.reduce<Record<string, number>>((summary, skill) => {
    summary[skill.category] = (summary[skill.category] ?? 0) + 1
    return summary
  }, {})

export function CommandSkillsRegistrySection({
  commandSkillsRegistryResult,
  commandSkillsRegistryRef,
  isBusy,
  onClearCommandSkillsRegistry,
}: CommandSkillsRegistrySectionProps) {
  if (!commandSkillsRegistryResult) {
    return null
  }

  const statusSummary = getSkillsByStatus(commandSkillsRegistryResult)
  const categorySummary = getSkillsByCategory(commandSkillsRegistryResult)

  return (
    <div className="parser-evaluation-panel" ref={commandSkillsRegistryRef}>
      <h3>Command Skills Registry</h3>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={onClearCommandSkillsRegistry}
          disabled={isBusy}
        >
          Clear Command Skills Registry View
        </button>
      </div>

      <p className="small-note">
        This registry separates implemented command skills from manual workflows that
        are planned for later E.4 command routing. It is a visibility layer, not a new
        execution engine.
      </p>

      <div className="parser-evaluation-summary">
        <div>
          <span>Version</span>
          <strong>{commandSkillsRegistryResult.version}</strong>
        </div>
        <div>
          <span>Milestone</span>
          <strong>{commandSkillsRegistryResult.milestone}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{commandSkillsRegistryResult.status}</strong>
        </div>
        <div>
          <span>Total skills</span>
          <strong>{commandSkillsRegistryResult.skill_count}</strong>
        </div>
      </div>

      <div className="provider-mode-list">
        <span>Execution status summary</span>
        <div>
          {Object.entries(statusSummary).map(([status, count]) => (
            <strong key={status}>
              {formatSkillStatus(status)}: {count}
            </strong>
          ))}
        </div>
      </div>

      <div className="provider-mode-list">
        <span>Category summary</span>
        <div>
          {Object.entries(categorySummary).map(([category, count]) => (
            <strong key={category}>
              {formatSkillStatus(category)}: {count}
            </strong>
          ))}
        </div>
      </div>

      {commandSkillsRegistryResult.notes.length > 0 && (
        <div className="provider-mode-list">
          <span>Registry notes</span>
          <ul>
            {commandSkillsRegistryResult.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="parser-evaluation-list">
        {commandSkillsRegistryResult.skills.map((skill) => (
          <div className="evaluation-item" key={skill.id}>
            <div>
              <strong>{skill.title}</strong>
              <p>
                {skill.id} · {formatSkillStatus(skill.category)} ·{' '}
                {formatSkillStatus(skill.execution_status)}
              </p>
            </div>

            <div>
              <span>
                Media:{' '}
                {skill.supported_media.length > 0
                  ? skill.supported_media.join(', ')
                  : 'none'}
              </span>
              <span>
                Actions:{' '}
                {skill.mapped_actions.length > 0
                  ? skill.mapped_actions.join(', ')
                  : 'none yet'}
              </span>
            </div>

            <div className="provider-mode-list">
              <span>Examples</span>
              <div>
                {skill.user_examples.map((example) => (
                  <strong key={example}>{example}</strong>
                ))}
              </div>
            </div>

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
        ))}
      </div>
    </div>
  )
}
