import type {
  GeneratedOutputHistoryFilters,
  GeneratedOutputHistoryItem,
  GeneratedOutputWorkflowAnalytics,
} from './generatedOutputTypes'

export const getGeneratedOutputHistoryModes = (
  items: GeneratedOutputHistoryItem[],
  field: 'parser_mode' | 'planner_mode',
) =>
  Array.from(
    new Set(
      items
        .map((item) => item[field])
        .filter((mode): mode is string => Boolean(mode)),
    ),
  ).sort()

export const getGeneratedOutputCreatedByCategory = (item: GeneratedOutputHistoryItem) => {
  const createdBy = item.created_by?.toLowerCase() ?? ''

  if (createdBy.includes('run command')) {
    return 'run_command'
  }

  if (createdBy.includes('generated output')) {
    return 'generated_output'
  }

  return 'unknown'
}

export const filterGeneratedOutputHistory = (
  items: GeneratedOutputHistoryItem[],
  filters: GeneratedOutputHistoryFilters,
) => {
  const searchValue = filters.search.trim().toLowerCase()

  return items.filter((item) => {
    const searchableText = [
      item.action,
      item.label,
      item.filename,
      item.file_url,
      item.source ?? '',
      item.source_filename ?? '',
      item.created_by ?? '',
      item.command_text ?? '',
      item.result_type ?? '',
      item.execution_mode ?? '',
      item.parser_mode ?? '',
      item.parser_type ?? '',
      item.planner_mode ?? '',
    ]
      .join(' ')
      .toLowerCase()

    const matchesSearch = searchValue.length === 0 || searchableText.includes(searchValue)

    const matchesAction = filters.actionFilter === 'all' || item.action === filters.actionFilter

    const matchesSource = filters.sourceFilter === 'all' || item.source === filters.sourceFilter

    const matchesCreatedBy =
      filters.createdByFilter === 'all' ||
      getGeneratedOutputCreatedByCategory(item) === filters.createdByFilter

    const matchesParser = filters.parserFilter === 'all' || item.parser_mode === filters.parserFilter

    const matchesPlanner =
      filters.plannerFilter === 'all' || item.planner_mode === filters.plannerFilter

    return (
      matchesSearch &&
      matchesAction &&
      matchesSource &&
      matchesCreatedBy &&
      matchesParser &&
      matchesPlanner
    )
  })
}

export const groupGeneratedOutputHistoryByWorkflowSource = (
  items: GeneratedOutputHistoryItem[],
) =>
  items.reduce<Record<string, GeneratedOutputHistoryItem[]>>((groups, item) => {
    const groupKey = item.source_filename ?? item.filename
    const currentGroup = groups[groupKey] ?? []

    return {
      ...groups,
      [groupKey]: [...currentGroup, item],
    }
  }, {})

export const buildGeneratedOutputAnalyticsEntries = (
  items: GeneratedOutputHistoryItem[],
  getKey: (item: GeneratedOutputHistoryItem) => string,
) =>
  Object.entries(
    items.reduce<Record<string, number>>((counts, item) => {
      const key = getKey(item)
      return {
        ...counts,
        [key]: (counts[key] ?? 0) + 1,
      }
    }, {}),
  ).sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1])

export const getGeneratedOutputSourceLabel = (item: GeneratedOutputHistoryItem) => {
  if (item.source === 'uploads') {
    return 'Uploaded image'
  }

  if (item.source === 'outputs') {
    return 'Generated output'
  }

  return 'Unknown source'
}

export const getGeneratedOutputCreatedByLabel = (item: GeneratedOutputHistoryItem) => {
  const category = getGeneratedOutputCreatedByCategory(item)

  if (category === 'run_command') {
    return 'Run Command'
  }

  if (category === 'generated_output') {
    return 'Generated Output'
  }

  return 'Unknown'
}

export const buildGeneratedOutputWorkflowAnalytics = ({
  filteredItems,
  totalItems,
  groupedItems,
}: {
  filteredItems: GeneratedOutputHistoryItem[]
  totalItems: GeneratedOutputHistoryItem[]
  groupedItems: Record<string, GeneratedOutputHistoryItem[]>
}): GeneratedOutputWorkflowAnalytics => {
  const latestItem = filteredItems.reduce<GeneratedOutputHistoryItem | null>(
    (currentLatestItem, item) => {
      if (!currentLatestItem) {
        return item
      }

      return Date.parse(item.created_at) > Date.parse(currentLatestItem.created_at)
        ? item
        : currentLatestItem
    },
    null,
  )

  return {
    visibleOutputCount: filteredItems.length,
    totalOutputCount: totalItems.length,
    workflowSourceCount: Object.keys(groupedItems).length,
    actionEntries: buildGeneratedOutputAnalyticsEntries(filteredItems, (item) =>
      item.action.replace(/_/g, ' '),
    ),
    sourceEntries: buildGeneratedOutputAnalyticsEntries(
      filteredItems,
      getGeneratedOutputSourceLabel,
    ),
    createdByEntries: buildGeneratedOutputAnalyticsEntries(
      filteredItems,
      getGeneratedOutputCreatedByLabel,
    ),
    parserEntries: buildGeneratedOutputAnalyticsEntries(
      filteredItems,
      (item) => item.parser_mode ?? 'No parser',
    ),
    plannerEntries: buildGeneratedOutputAnalyticsEntries(
      filteredItems,
      (item) => item.planner_mode ?? 'No planner',
    ),
    latestItem,
  }
}

export const getSortedGeneratedOutputWorkflowItems = (items: GeneratedOutputHistoryItem[]) =>
  [...items].sort(
    (firstItem, secondItem) =>
      Date.parse(firstItem.created_at) - Date.parse(secondItem.created_at),
  )

export const getGeneratedOutputWorkflowActions = (items: GeneratedOutputHistoryItem[]) =>
  Array.from(new Set(items.map((item) => item.action.replace(/_/g, ' '))))

export const hasGeneratedOutputHistoryFilters = (filters: GeneratedOutputHistoryFilters) =>
  filters.search.trim().length > 0 ||
  filters.actionFilter !== 'all' ||
  filters.sourceFilter !== 'all' ||
  filters.createdByFilter !== 'all' ||
  filters.parserFilter !== 'all' ||
  filters.plannerFilter !== 'all'

export const buildGeneratedOutputWorkflowExport = ({
  items,
  exportedAt,
  autoUseLatestGeneratedOutputAsActive,
  activeGeneratedImageSource,
}: {
  items: GeneratedOutputHistoryItem[]
  exportedAt: string
  autoUseLatestGeneratedOutputAsActive: boolean
  activeGeneratedImageSource: GeneratedOutputHistoryItem | null
}) => {
  const groups = groupGeneratedOutputHistoryByWorkflowSource(items)

  return {
    source: 'generated_output_workflow_export',
    workflow_version: 'generated-output-workflow-v1',
    exported_at: exportedAt,
    downloaded_at: exportedAt,
    summary: {
      output_count: items.length,
      workflow_source_count: Object.keys(groups).length,
      auto_use_latest_generated_output_as_active: autoUseLatestGeneratedOutputAsActive,
    },
    active_generated_image_source: activeGeneratedImageSource
      ? {
          id: activeGeneratedImageSource.id,
          action: activeGeneratedImageSource.action,
          label: activeGeneratedImageSource.label,
          filename: activeGeneratedImageSource.filename,
          file_url: activeGeneratedImageSource.file_url,
          source: activeGeneratedImageSource.source ?? null,
          source_filename: activeGeneratedImageSource.source_filename ?? null,
          created_by: activeGeneratedImageSource.created_by ?? null,
          command_text: activeGeneratedImageSource.command_text ?? null,
          result_type: activeGeneratedImageSource.result_type ?? null,
          execution_mode: activeGeneratedImageSource.execution_mode ?? null,
          parser_mode: activeGeneratedImageSource.parser_mode ?? null,
          parser_type: activeGeneratedImageSource.parser_type ?? null,
          planner_mode: activeGeneratedImageSource.planner_mode ?? null,
          created_at: activeGeneratedImageSource.created_at,
        }
      : null,
    workflow_groups: Object.entries(groups).map(([workflowSourceFilename, groupItems]) => ({
      workflow_source_filename: workflowSourceFilename,
      output_count: groupItems.length,
      outputs: groupItems.map((item, index) => ({
        step: index + 1,
        id: item.id,
        action: item.action,
        label: item.label,
        filename: item.filename,
        file_url: item.file_url,
        api_file_url: `/api${item.file_url}`,
        source: item.source ?? null,
        source_filename: item.source_filename ?? null,
        metadata: {
          created_by: item.created_by ?? null,
          command_text: item.command_text ?? null,
          result_type: item.result_type ?? null,
          execution_mode: item.execution_mode ?? null,
          parser_mode: item.parser_mode ?? null,
          parser_type: item.parser_type ?? null,
          planner_mode: item.planner_mode ?? null,
          created_at: item.created_at,
        },
        lineage: {
          input_source_type: item.source ?? 'unknown',
          input_source_filename: item.source_filename ?? null,
          output_action: item.action,
          output_filename: item.filename,
        },
      })),
    })),
    flat_outputs: items,
  }
}

export const buildGeneratedOutputWorkflowMarkdownReport = ({
  items,
  exportedAt,
  autoUseLatestGeneratedOutputAsActive,
  activeGeneratedImageSource,
}: {
  items: GeneratedOutputHistoryItem[]
  exportedAt: string
  autoUseLatestGeneratedOutputAsActive: boolean
  activeGeneratedImageSource: GeneratedOutputHistoryItem | null
}) => {
  const groups = groupGeneratedOutputHistoryByWorkflowSource(items)

  const formatMarkdownValue = (value?: string | null) => {
    const normalizedValue = value?.replace(/\s+/g, ' ').trim()

    return normalizedValue && normalizedValue.length > 0 ? normalizedValue : 'N/A'
  }

  const formatAnalyticsEntries = (entries: [string, number][]) =>
    entries.length > 0 ? entries.map(([label, count]) => `- ${label}: ${count}`).join('\n') : '- None'

  const actionEntries = buildGeneratedOutputAnalyticsEntries(items, (item) =>
    item.action.replace(/_/g, ' '),
  )
  const sourceEntries = buildGeneratedOutputAnalyticsEntries(items, getGeneratedOutputSourceLabel)
  const createdByEntries = buildGeneratedOutputAnalyticsEntries(items, getGeneratedOutputCreatedByLabel)
  const parserEntries = buildGeneratedOutputAnalyticsEntries(
    items,
    (item) => item.parser_mode ?? 'No parser',
  )
  const plannerEntries = buildGeneratedOutputAnalyticsEntries(
    items,
    (item) => item.planner_mode ?? 'No planner',
  )

  const latestItem = items.reduce<GeneratedOutputHistoryItem | null>((currentLatestItem, item) => {
    if (!currentLatestItem) {
      return item
    }

    return Date.parse(item.created_at) > Date.parse(currentLatestItem.created_at)
      ? item
      : currentLatestItem
  }, null)

  const activeSourceSection = activeGeneratedImageSource
    ? [
        '## Active Generated Image Source',
        '',
        `- Label: ${formatMarkdownValue(activeGeneratedImageSource.label)}`,
        `- Filename: ${formatMarkdownValue(activeGeneratedImageSource.filename)}`,
        `- Action: ${formatMarkdownValue(activeGeneratedImageSource.action)}`,
        `- Source: ${formatMarkdownValue(activeGeneratedImageSource.source)}`,
        `- Source filename: ${formatMarkdownValue(activeGeneratedImageSource.source_filename)}`,
        `- Created by: ${formatMarkdownValue(activeGeneratedImageSource.created_by)}`,
        `- Command: ${formatMarkdownValue(activeGeneratedImageSource.command_text)}`,
        `- Result type: ${formatMarkdownValue(activeGeneratedImageSource.result_type)}`,
        `- Created at: ${formatMarkdownValue(activeGeneratedImageSource.created_at)}`,
      ].join('\n')
    : ['## Active Generated Image Source', '', 'No active generated image source selected.'].join('\n')

  const workflowSections = Object.entries(groups)
    .map(([workflowSourceFilename, groupItems]) => {
      const sortedItems = getSortedGeneratedOutputWorkflowItems(groupItems)
      const actions = getGeneratedOutputWorkflowActions(groupItems).join(', ')

      const stepLines = sortedItems
        .map((item, index) =>
          [
            `### Step ${index + 1}: ${item.action.replace(/_/g, ' ')} · ${formatMarkdownValue(item.label)}`,
            '',
            `- Output filename: ${formatMarkdownValue(item.filename)}`,
            `- Source type: ${formatMarkdownValue(item.source)}`,
            `- Input source filename: ${formatMarkdownValue(item.source_filename)}`,
            `- Created by: ${formatMarkdownValue(item.created_by)}`,
            `- Command: ${formatMarkdownValue(item.command_text)}`,
            `- Result type: ${formatMarkdownValue(item.result_type)}`,
            `- Execution mode: ${formatMarkdownValue(item.execution_mode)}`,
            `- Parser mode: ${formatMarkdownValue(item.parser_mode)}`,
            `- Parser type: ${formatMarkdownValue(item.parser_type)}`,
            `- Planner mode: ${formatMarkdownValue(item.planner_mode)}`,
            `- Created at: ${formatMarkdownValue(item.created_at)}`,
            '',
            `Lineage: ${formatMarkdownValue(item.source_filename)} -> ${formatMarkdownValue(item.filename)}`,
          ].join('\n'),
        )
        .join('\n\n')

      return [
        `## Workflow Source: ${workflowSourceFilename}`,
        '',
        `- Output count: ${groupItems.length}`,
        `- Actions: ${actions || 'None'}`,
        '',
        stepLines,
      ].join('\n')
    })
    .join('\n\n')

  return [
    '# VisionCommand AI Workflow Report',
    '',
    `Generated at: ${new Date(exportedAt).toLocaleString()}`,
    `Export timestamp: ${exportedAt}`,
    '',
    '## Summary',
    '',
    `- Total generated outputs: ${items.length}`,
    `- Workflow source count: ${Object.keys(groups).length}`,
    `- Auto-use latest generated output as active image: ${
      autoUseLatestGeneratedOutputAsActive ? 'Enabled' : 'Disabled'
    }`,
    `- Latest output: ${latestItem ? formatMarkdownValue(latestItem.label) : 'None'}`,
    `- Latest output timestamp: ${latestItem ? formatMarkdownValue(latestItem.created_at) : 'N/A'}`,
    '',
    '## Analytics',
    '',
    '### Action Distribution',
    formatAnalyticsEntries(actionEntries),
    '',
    '### Source Breakdown',
    formatAnalyticsEntries(sourceEntries),
    '',
    '### Created By Breakdown',
    formatAnalyticsEntries(createdByEntries),
    '',
    '### Parser Usage',
    formatAnalyticsEntries(parserEntries),
    '',
    '### Planner Usage',
    formatAnalyticsEntries(plannerEntries),
    '',
    activeSourceSection,
    '',
    '## Workflow Groups',
    '',
    workflowSections || 'No workflow groups available.',
    '',
  ].join('\n')
}
