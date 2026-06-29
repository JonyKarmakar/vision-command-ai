import type { GeneratedOutputHistoryItem } from './generatedOutputTypes'
import { GeneratedOutputItemCard } from './GeneratedOutputItemCard'
import { GeneratedOutputWorkflowDetailPanel } from './GeneratedOutputWorkflowDetailPanel'

type GeneratedOutputGroupProps = {
  groupKey: string
  items: GeneratedOutputHistoryItem[]
  isDeveloperMode: boolean
  selectedWorkflowSource: string | null
  activeGeneratedImageSourceId: string | null
  expandedGeneratedOutputDetails: ReadonlySet<string>
  isBusy: boolean
  isLoadingGeneratedOutputHistory: boolean
  onToggleWorkflowDetails: (groupKey: string) => void
  onUseAsActiveImage: (item: GeneratedOutputHistoryItem) => void
  onRunYolo: (item: GeneratedOutputHistoryItem) => void
  onToggleItemDetails: (itemId: string) => void
  onRemove: (item: GeneratedOutputHistoryItem) => void
}

export function GeneratedOutputGroup({
  groupKey,
  items,
  isDeveloperMode,
  selectedWorkflowSource,
  activeGeneratedImageSourceId,
  expandedGeneratedOutputDetails,
  isBusy,
  isLoadingGeneratedOutputHistory,
  onToggleWorkflowDetails,
  onUseAsActiveImage,
  onRunYolo,
  onToggleItemDetails,
  onRemove,
}: GeneratedOutputGroupProps) {
  const isWorkflowDetailsVisible = selectedWorkflowSource === groupKey

  return (
    <div className="generated-output-group">
      <div className="generated-output-group-header">
        <div className="generated-output-group-title">
          <span>{isDeveloperMode ? 'Workflow source' : 'Output group'}</span>
          <strong>{isDeveloperMode ? groupKey : 'Current image workflow'}</strong>
          <small>
            {items.length} generated output
            {items.length === 1 ? '' : 's'}
          </small>
        </div>

        {isDeveloperMode && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => onToggleWorkflowDetails(groupKey)}
            disabled={isBusy}
          >
            {isWorkflowDetailsVisible ? 'Hide Workflow Details' : 'View Workflow Details'}
          </button>
        )}
      </div>

      {isDeveloperMode && isWorkflowDetailsVisible && (
        <GeneratedOutputWorkflowDetailPanel groupKey={groupKey} items={items} />
      )}

      <div className="generated-output-group-items">
        {items.map((item) => (
          <GeneratedOutputItemCard
            key={item.id}
            item={item}
            isActive={activeGeneratedImageSourceId === item.id}
            isDeveloperMode={isDeveloperMode}
            isDetailsExpanded={expandedGeneratedOutputDetails.has(item.id)}
            isBusy={isBusy}
            isLoadingGeneratedOutputHistory={isLoadingGeneratedOutputHistory}
            onUseAsActiveImage={onUseAsActiveImage}
            onRunYolo={onRunYolo}
            onToggleDetails={onToggleItemDetails}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  )
}
