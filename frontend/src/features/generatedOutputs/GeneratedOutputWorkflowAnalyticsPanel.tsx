import type { GeneratedOutputWorkflowAnalytics } from './generatedOutputTypes'

type GeneratedOutputWorkflowAnalyticsPanelProps = {
  analytics: GeneratedOutputWorkflowAnalytics
  hasFilters: boolean
}

const renderAnalyticsBreakdown = (
  title: string,
  entries: [string, number][],
  emptyMessage: string,
) => (
  <div className="generated-output-workflow-analytics-breakdown">
    <span>{title}</span>
    {entries.length > 0 ? (
      <ul>
        {entries.map(([label, count]) => (
          <li key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    ) : (
      <p className="small-note">{emptyMessage}</p>
    )}
  </div>
)

export function GeneratedOutputWorkflowAnalyticsPanel({
  analytics,
  hasFilters,
}: GeneratedOutputWorkflowAnalyticsPanelProps) {
  return (
    <div className="generated-output-workflow-analytics-panel">
      <div className="generated-output-workflow-analytics-header">
        <div>
          <span>Workflow analytics</span>
          <strong>Generated output activity summary</strong>
          <p className="small-note">
            Metrics update with the current Generated Output History filters.
          </p>
        </div>

        {hasFilters && (
          <span className="generated-output-workflow-analytics-filter-badge">
            Filtered view
          </span>
        )}
      </div>

      <div className="generated-output-workflow-analytics-grid">
        <div className="generated-output-workflow-analytics-metric">
          <span>Visible outputs</span>
          <strong>{analytics.visibleOutputCount}</strong>
          <small>of {analytics.totalOutputCount} total</small>
        </div>

        <div className="generated-output-workflow-analytics-metric">
          <span>Workflow sources</span>
          <strong>{analytics.workflowSourceCount}</strong>
          <small>grouped by source filename</small>
        </div>

        <div className="generated-output-workflow-analytics-metric">
          <span>Action types</span>
          <strong>{analytics.actionEntries.length}</strong>
          <small>detection, zoom, crop, or blur</small>
        </div>

        <div className="generated-output-workflow-analytics-metric">
          <span>Latest output</span>
          <strong>
            {analytics.latestItem
              ? new Date(analytics.latestItem.created_at).toLocaleTimeString()
              : 'None'}
          </strong>
          <small>{analytics.latestItem?.label ?? 'No output available'}</small>
        </div>
      </div>

      <div className="generated-output-workflow-analytics-breakdowns">
        {renderAnalyticsBreakdown(
          'Action distribution',
          analytics.actionEntries,
          'No visible action data.',
        )}
        {renderAnalyticsBreakdown(
          'Source breakdown',
          analytics.sourceEntries,
          'No visible source data.',
        )}
        {renderAnalyticsBreakdown(
          'Created by',
          analytics.createdByEntries,
          'No creator data.',
        )}
        {renderAnalyticsBreakdown(
          'Parser usage',
          analytics.parserEntries,
          'No parser data.',
        )}
        {renderAnalyticsBreakdown(
          'Planner usage',
          analytics.plannerEntries,
          'No planner data.',
        )}
      </div>
    </div>
  )
}
