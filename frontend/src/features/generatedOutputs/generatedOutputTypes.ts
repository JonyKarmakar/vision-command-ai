export type GeneratedOutputHistoryItem = {
  id: string
  action: 'annotated_detection' | 'zoom' | 'crop' | 'blur'
  label: string
  filename: string
  file_url: string
  source?: 'uploads' | 'outputs'
  source_filename?: string | null
  created_by?: string | null
  command_text?: string | null
  result_type?: string | null
  execution_mode?: string | null
  parser_mode?: string | null
  parser_type?: string | null
  planner_mode?: string | null
  created_at: string
}

export type GeneratedOutputCreatedByFilter = 'all' | 'run_command' | 'generated_output' | 'unknown'

export type GeneratedOutputHistoryFilters = {
  search: string
  actionFilter: 'all' | GeneratedOutputHistoryItem['action']
  sourceFilter: 'all' | 'uploads' | 'outputs'
  createdByFilter: GeneratedOutputCreatedByFilter
  parserFilter: string
  plannerFilter: string
}

export type GeneratedOutputWorkflowAnalytics = {
  visibleOutputCount: number
  totalOutputCount: number
  workflowSourceCount: number
  actionEntries: [string, number][]
  sourceEntries: [string, number][]
  createdByEntries: [string, number][]
  parserEntries: [string, number][]
  plannerEntries: [string, number][]
  latestItem: GeneratedOutputHistoryItem | null
}
