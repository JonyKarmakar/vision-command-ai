import type { GeneratedOutputHistoryFilters as GeneratedOutputHistoryFilterState } from './generatedOutputTypes'

type GeneratedOutputHistoryFiltersProps = {
  search: string
  actionFilter: GeneratedOutputHistoryFilterState['actionFilter']
  sourceFilter: GeneratedOutputHistoryFilterState['sourceFilter']
  createdByFilter: GeneratedOutputHistoryFilterState['createdByFilter']
  parserFilter: string
  plannerFilter: string
  parserModes: string[]
  plannerModes: string[]
  visibleOutputCount: number
  totalOutputCount: number
  hasFilters: boolean
  isBusy: boolean
  onSearchChange: (value: string) => void
  onActionFilterChange: (value: GeneratedOutputHistoryFilterState['actionFilter']) => void
  onSourceFilterChange: (value: GeneratedOutputHistoryFilterState['sourceFilter']) => void
  onCreatedByFilterChange: (value: GeneratedOutputHistoryFilterState['createdByFilter']) => void
  onParserFilterChange: (value: string) => void
  onPlannerFilterChange: (value: string) => void
  onClearFilters: () => void
}

export function GeneratedOutputHistoryFilters({
  search,
  actionFilter,
  sourceFilter,
  createdByFilter,
  parserFilter,
  plannerFilter,
  parserModes,
  plannerModes,
  visibleOutputCount,
  totalOutputCount,
  hasFilters,
  isBusy,
  onSearchChange,
  onActionFilterChange,
  onSourceFilterChange,
  onCreatedByFilterChange,
  onParserFilterChange,
  onPlannerFilterChange,
  onClearFilters,
}: GeneratedOutputHistoryFiltersProps) {
  return (
    <div className="generated-output-history-filters">
      <label className="generated-output-history-filter-field">
        <span>Search</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search filename, command, label, or source"
          disabled={isBusy}
        />
      </label>

      <label className="generated-output-history-filter-field">
        <span>Action</span>
        <select
          value={actionFilter}
          onChange={(event) =>
            onActionFilterChange(
              event.target.value as GeneratedOutputHistoryFilterState['actionFilter'],
            )
          }
          disabled={isBusy}
        >
          <option value="all">All actions</option>
          <option value="annotated_detection">Detection</option>
          <option value="zoom">Zoom</option>
          <option value="crop">Crop</option>
          <option value="blur">Blur</option>
          <option value="enhance">Enhance</option>
          <option value="background_blur">Background blur</option>
        </select>
      </label>

      <label className="generated-output-history-filter-field">
        <span>Source</span>
        <select
          value={sourceFilter}
          onChange={(event) =>
            onSourceFilterChange(
              event.target.value as GeneratedOutputHistoryFilterState['sourceFilter'],
            )
          }
          disabled={isBusy}
        >
          <option value="all">All sources</option>
          <option value="uploads">Uploaded image</option>
          <option value="outputs">Generated output</option>
        </select>
      </label>

      <label className="generated-output-history-filter-field">
        <span>Created by</span>
        <select
          value={createdByFilter}
          onChange={(event) =>
            onCreatedByFilterChange(
              event.target.value as GeneratedOutputHistoryFilterState['createdByFilter'],
            )
          }
          disabled={isBusy}
        >
          <option value="all">All creators</option>
          <option value="run_command">Run Command</option>
          <option value="generated_output">Generated Output</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>

      <label className="generated-output-history-filter-field">
        <span>Parser</span>
        <select
          value={parserFilter}
          onChange={(event) => onParserFilterChange(event.target.value)}
          disabled={isBusy}
        >
          <option value="all">All parsers</option>
          {parserModes.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>

      <label className="generated-output-history-filter-field">
        <span>Planner</span>
        <select
          value={plannerFilter}
          onChange={(event) => onPlannerFilterChange(event.target.value)}
          disabled={isBusy}
        >
          <option value="all">All planners</option>
          {plannerModes.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>

      <div className="generated-output-history-filter-summary">
        <span>
          Showing {visibleOutputCount} of {totalOutputCount} output
          {totalOutputCount === 1 ? '' : 's'}
        </span>

        <button
          type="button"
          className="secondary-button"
          onClick={onClearFilters}
          disabled={isBusy || !hasFilters}
        >
          Clear filters
        </button>
      </div>
    </div>
  )
}
