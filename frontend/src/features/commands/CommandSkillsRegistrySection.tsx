import { useState, type RefObject } from 'react'
import type { CommandSkillsRegistryResponse } from '../../types/apiTypes'

type CommandSkillsRegistrySectionProps = {
  commandSkillsRegistryResult: CommandSkillsRegistryResponse | null
  commandSkillsRegistryRef: RefObject<HTMLDivElement | null>
  isBusy: boolean
  onClearCommandSkillsRegistry: () => void
  onSelectExampleCommand: (commandText: string) => void
}

const formatSkillStatus = (status: string) => status.replace(/_/g, ' ')

const ALL_COMMAND_SKILL_FILTER_VALUE = 'all'

const getExecutionStatusOptions = (registry: CommandSkillsRegistryResponse) =>
  Array.from(new Set(registry.skills.map((skill) => skill.execution_status))).sort()

const getCategoryOptions = (registry: CommandSkillsRegistryResponse) =>
  Array.from(new Set(registry.skills.map((skill) => skill.category))).sort()

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
  onSelectExampleCommand,
}: CommandSkillsRegistrySectionProps) {
  const [selectedExecutionStatus, setSelectedExecutionStatus] = useState(
    ALL_COMMAND_SKILL_FILTER_VALUE,
  )
  const [selectedCategory, setSelectedCategory] = useState(
    ALL_COMMAND_SKILL_FILTER_VALUE,
  )

  if (!commandSkillsRegistryResult) {
    return null
  }

  const statusSummary = getSkillsByStatus(commandSkillsRegistryResult)
  const categorySummary = getSkillsByCategory(commandSkillsRegistryResult)
  const executionStatusOptions = getExecutionStatusOptions(commandSkillsRegistryResult)
  const categoryOptions = getCategoryOptions(commandSkillsRegistryResult)
  const filteredSkills = commandSkillsRegistryResult.skills.filter((skill) => {
    const matchesStatus =
      selectedExecutionStatus === ALL_COMMAND_SKILL_FILTER_VALUE ||
      skill.execution_status === selectedExecutionStatus
    const matchesCategory =
      selectedCategory === ALL_COMMAND_SKILL_FILTER_VALUE ||
      skill.category === selectedCategory

    return matchesStatus && matchesCategory
  })
  const hasActiveFilters =
    selectedExecutionStatus !== ALL_COMMAND_SKILL_FILTER_VALUE ||
    selectedCategory !== ALL_COMMAND_SKILL_FILTER_VALUE

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
        execution engine. Example commands can be loaded into the command input for
        testing, but they do not run automatically.
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

      <div className="provider-mode-list">
        <span>Registry filters</span>

        <div className="registry-filter-controls">
          <label>
            <span>Execution status</span>
            <select
              value={selectedExecutionStatus}
              onChange={(event) => setSelectedExecutionStatus(event.target.value)}
              disabled={isBusy}
            >
              <option value={ALL_COMMAND_SKILL_FILTER_VALUE}>All statuses</option>
              {executionStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatSkillStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              disabled={isBusy}
            >
              <option value={ALL_COMMAND_SKILL_FILTER_VALUE}>All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {formatSkillStatus(category)}
                </option>
              ))}
            </select>
          </label>

          <button
            className="secondary-button"
            onClick={() => {
              setSelectedExecutionStatus(ALL_COMMAND_SKILL_FILTER_VALUE)
              setSelectedCategory(ALL_COMMAND_SKILL_FILTER_VALUE)
            }}
            disabled={isBusy || !hasActiveFilters}
          >
            Reset filters
          </button>
        </div>

        <p className="small-note">
          Showing {filteredSkills.length} of {commandSkillsRegistryResult.skill_count}
          command skills.
        </p>
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
        {filteredSkills.length === 0 && (
          <div className="evaluation-item">
            <div>
              <strong>No command skills match the selected filters.</strong>
              <p>Reset the filters to show the full command skills registry.</p>
            </div>
          </div>
        )}

        {filteredSkills.map((skill) => (
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
              <div className="registry-example-command-list">
                {skill.user_examples.map((example) => (
                  <button
                    type="button"
                    className="secondary-button registry-example-command-button"
                    key={example}
                    onClick={() => onSelectExampleCommand(example)}
                    disabled={isBusy}
                  >
                    Use example: {example}
                  </button>
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
