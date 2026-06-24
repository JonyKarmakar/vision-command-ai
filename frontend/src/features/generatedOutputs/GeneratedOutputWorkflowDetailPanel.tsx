import type { GeneratedOutputHistoryItem } from './generatedOutputTypes'
import {
  getGeneratedOutputWorkflowActions,
  getSortedGeneratedOutputWorkflowItems,
} from './generatedOutputUtils'

type GeneratedOutputWorkflowDetailPanelProps = {
  groupKey: string
  items: GeneratedOutputHistoryItem[]
}

export function GeneratedOutputWorkflowDetailPanel({
  groupKey,
  items,
}: GeneratedOutputWorkflowDetailPanelProps) {
  return (
    <div className="generated-output-workflow-detail-panel">
      <div className="generated-output-workflow-detail-summary">
        <span>Workflow details</span>
        <strong>{groupKey}</strong>
        <p className="small-note">
          {items.length} step{items.length === 1 ? '' : 's'} · Actions:{' '}
          {getGeneratedOutputWorkflowActions(items).join(', ')}
        </p>
      </div>

      <ol className="generated-output-workflow-steps">
        {getSortedGeneratedOutputWorkflowItems(items).map((workflowItem, index) => (
          <li className="generated-output-workflow-step" key={workflowItem.id}>
            <span className="generated-output-workflow-step-number">{index + 1}</span>

            <div className="generated-output-workflow-step-content">
              <strong>
                {workflowItem.action.replace(/_/g, ' ')} · {workflowItem.label}
              </strong>
              <p className="generated-output-workflow-step-filename">
                {workflowItem.filename}
              </p>
              <p className="small-note">
                {workflowItem.command_text ??
                  workflowItem.result_type ??
                  'No command metadata available'}
              </p>

              <div className="generated-output-workflow-step-meta">
                <span>Created by: {workflowItem.created_by ?? 'Unknown'}</span>
                {workflowItem.result_type && (
                  <span>Result: {workflowItem.result_type}</span>
                )}
                {workflowItem.parser_mode && (
                  <span>Parser: {workflowItem.parser_mode}</span>
                )}
                {workflowItem.planner_mode && (
                  <span>Planner: {workflowItem.planner_mode}</span>
                )}
                <span>{new Date(workflowItem.created_at).toLocaleString()}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
