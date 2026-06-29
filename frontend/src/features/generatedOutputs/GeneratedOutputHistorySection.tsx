import type { RefObject } from 'react'

import { GeneratedOutputGroup } from './GeneratedOutputGroup'
import { GeneratedOutputHistoryFilters } from './GeneratedOutputHistoryFilters'
import { GeneratedOutputHistoryHeader } from './GeneratedOutputHistoryHeader'
import { GeneratedOutputWorkflowAnalyticsPanel } from './GeneratedOutputWorkflowAnalyticsPanel'
import type {
  GeneratedOutputHistoryFilters as GeneratedOutputHistoryFilterState,
  GeneratedOutputHistoryItem,
  GeneratedOutputWorkflowAnalytics,
} from './generatedOutputTypes'

type GeneratedOutputHistorySectionProps = {
  isDeveloperMode: boolean
  isVisible: boolean
  sectionRef: RefObject<HTMLElement | null>
  activeGeneratedImageSource: GeneratedOutputHistoryItem | null
  autoUseLatestGeneratedOutputAsActive: boolean
  generatedOutputHistory: GeneratedOutputHistoryItem[]
  filteredGeneratedOutputHistory: GeneratedOutputHistoryItem[]
  groupedGeneratedOutputHistory: Record<string, GeneratedOutputHistoryItem[]>
  filters: GeneratedOutputHistoryFilterState
  parserModes: string[]
  plannerModes: string[]
  hasFilters: boolean
  analytics: GeneratedOutputWorkflowAnalytics
  selectedWorkflowSource: string | null
  expandedGeneratedOutputDetails: ReadonlySet<string>
  isBusy: boolean
  isLoadingGeneratedOutputHistory: boolean
  isWorkflowJsonDownloaded: boolean
  isWorkflowReportDownloaded: boolean
  onAutoUseLatestGeneratedOutputAsActiveChange: (enabled: boolean) => void
  onLoadSavedHistory: () => void
  onExportWorkflowJson: () => void
  onDownloadWorkflowReport: () => void
  onClearOutputHistory: () => void
  onSearchChange: (value: string) => void
  onActionFilterChange: (value: GeneratedOutputHistoryFilterState['actionFilter']) => void
  onSourceFilterChange: (value: GeneratedOutputHistoryFilterState['sourceFilter']) => void
  onCreatedByFilterChange: (value: GeneratedOutputHistoryFilterState['createdByFilter']) => void
  onParserFilterChange: (value: string) => void
  onPlannerFilterChange: (value: string) => void
  onClearFilters: () => void
  onToggleWorkflowDetails: (groupKey: string) => void
  onUseAsActiveImage: (item: GeneratedOutputHistoryItem) => void
  onRunYolo: (item: GeneratedOutputHistoryItem) => void
  onToggleItemDetails: (itemId: string) => void
  onRemove: (item: GeneratedOutputHistoryItem) => void
}

export function GeneratedOutputHistorySection({
  isDeveloperMode,
  isVisible,
  sectionRef,
  activeGeneratedImageSource,
  autoUseLatestGeneratedOutputAsActive,
  generatedOutputHistory,
  filteredGeneratedOutputHistory,
  groupedGeneratedOutputHistory,
  filters,
  parserModes,
  plannerModes,
  hasFilters,
  analytics,
  selectedWorkflowSource,
  expandedGeneratedOutputDetails,
  isBusy,
  isLoadingGeneratedOutputHistory,
  isWorkflowJsonDownloaded,
  isWorkflowReportDownloaded,
  onAutoUseLatestGeneratedOutputAsActiveChange,
  onLoadSavedHistory,
  onExportWorkflowJson,
  onDownloadWorkflowReport,
  onClearOutputHistory,
  onSearchChange,
  onActionFilterChange,
  onSourceFilterChange,
  onCreatedByFilterChange,
  onParserFilterChange,
  onPlannerFilterChange,
  onClearFilters,
  onToggleWorkflowDetails,
  onUseAsActiveImage,
  onRunYolo,
  onToggleItemDetails,
  onRemove,
}: GeneratedOutputHistorySectionProps) {
  if (!isVisible) {
    return null
  }

  return (
    <section className="card generated-output-history-card" ref={sectionRef}>
      <GeneratedOutputHistoryHeader
        activeGeneratedImageSource={activeGeneratedImageSource}
        autoUseLatestGeneratedOutputAsActive={autoUseLatestGeneratedOutputAsActive}
        generatedOutputHistoryCount={generatedOutputHistory.length}
        isDeveloperMode={isDeveloperMode}
        isBusy={isBusy}
        isLoadingGeneratedOutputHistory={isLoadingGeneratedOutputHistory}
        isWorkflowJsonDownloaded={isWorkflowJsonDownloaded}
        isWorkflowReportDownloaded={isWorkflowReportDownloaded}
        onAutoUseLatestGeneratedOutputAsActiveChange={onAutoUseLatestGeneratedOutputAsActiveChange}
        onLoadSavedHistory={onLoadSavedHistory}
        onExportWorkflowJson={onExportWorkflowJson}
        onDownloadWorkflowReport={onDownloadWorkflowReport}
        onClearOutputHistory={onClearOutputHistory}
      />

      {isDeveloperMode && (
        <GeneratedOutputHistoryFilters
          search={filters.search}
        actionFilter={filters.actionFilter}
        sourceFilter={filters.sourceFilter}
        createdByFilter={filters.createdByFilter}
        parserFilter={filters.parserFilter}
        plannerFilter={filters.plannerFilter}
        parserModes={parserModes}
        plannerModes={plannerModes}
        visibleOutputCount={filteredGeneratedOutputHistory.length}
        totalOutputCount={generatedOutputHistory.length}
        hasFilters={hasFilters}
        isBusy={isBusy}
        onSearchChange={onSearchChange}
        onActionFilterChange={onActionFilterChange}
        onSourceFilterChange={onSourceFilterChange}
        onCreatedByFilterChange={onCreatedByFilterChange}
        onParserFilterChange={onParserFilterChange}
        onPlannerFilterChange={onPlannerFilterChange}
          onClearFilters={onClearFilters}
        />
      )}

      {isDeveloperMode && generatedOutputHistory.length > 0 && (
        <GeneratedOutputWorkflowAnalyticsPanel
          analytics={analytics}
          hasFilters={hasFilters}
        />
      )}

      {filteredGeneratedOutputHistory.length === 0 && (
        <div className="generated-output-empty-filter-state">
          {generatedOutputHistory.length === 0
            ? 'No generated outputs yet.'
            : 'No generated outputs match the current filters.'}
        </div>
      )}

      <div className="generated-output-list">
        {Object.entries(groupedGeneratedOutputHistory).map(([groupKey, groupItems]) => (
          <GeneratedOutputGroup
            key={groupKey}
            groupKey={groupKey}
            items={groupItems}
            isDeveloperMode={isDeveloperMode}
            selectedWorkflowSource={selectedWorkflowSource}
            activeGeneratedImageSourceId={activeGeneratedImageSource?.id ?? null}
            expandedGeneratedOutputDetails={expandedGeneratedOutputDetails}
            isBusy={isBusy}
            isLoadingGeneratedOutputHistory={isLoadingGeneratedOutputHistory}
            onToggleWorkflowDetails={onToggleWorkflowDetails}
            onUseAsActiveImage={onUseAsActiveImage}
            onRunYolo={onRunYolo}
            onToggleItemDetails={onToggleItemDetails}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  )
}
