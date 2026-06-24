import type { GeneratedOutputHistoryItem } from './generatedOutputTypes'
import { GeneratedOutputItemCard } from './GeneratedOutputItemCard'
import { GeneratedOutputWorkflowDetailPanel } from './GeneratedOutputWorkflowDetailPanel'

type GeneratedOutputGroupProps = {
  groupKey: string
  items: GeneratedOutputHistoryItem[]
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
          <span>Workflow source</span>
          <strong>{groupKey}</strong>
          <small>
            {items.length} generated output
            {items.length === 1 ? '' : 's'}
          </small>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onToggleWorkflowDetails(groupKey)}
          disabled={isBusy}
        >
          {isWorkflowDetailsVisible ? 'Hide Workflow Details' : 'View Workflow Details'}
        </button>
      </div>

      {isWorkflowDetailsVisible && (
        <GeneratedOutputWorkflowDetailPanel groupKey={groupKey} items={items} />
      )}

      <div className="generated-output-group-items">
        {items.map((item) => (
          <GeneratedOutputItemCard
            key={item.id}
            item={item}
            isActive={activeGeneratedImageSourceId === item.id}
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
