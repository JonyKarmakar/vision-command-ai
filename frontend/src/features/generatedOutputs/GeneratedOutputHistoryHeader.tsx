import type { GeneratedOutputHistoryItem } from './generatedOutputTypes'

type GeneratedOutputHistoryHeaderProps = {
  activeGeneratedImageSource: GeneratedOutputHistoryItem | null
  autoUseLatestGeneratedOutputAsActive: boolean
  generatedOutputHistoryCount: number
  isBusy: boolean
  isLoadingGeneratedOutputHistory: boolean
  isWorkflowJsonDownloaded: boolean
  isWorkflowReportDownloaded: boolean
  onAutoUseLatestGeneratedOutputAsActiveChange: (enabled: boolean) => void
  onLoadSavedHistory: () => void
  onExportWorkflowJson: () => void
  onDownloadWorkflowReport: () => void
  onClearOutputHistory: () => void
}

export function GeneratedOutputHistoryHeader({
  activeGeneratedImageSource,
  autoUseLatestGeneratedOutputAsActive,
  generatedOutputHistoryCount,
  isBusy,
  isLoadingGeneratedOutputHistory,
  isWorkflowJsonDownloaded,
  isWorkflowReportDownloaded,
  onAutoUseLatestGeneratedOutputAsActiveChange,
  onLoadSavedHistory,
  onExportWorkflowJson,
  onDownloadWorkflowReport,
  onClearOutputHistory,
}: GeneratedOutputHistoryHeaderProps) {
  return (
    <div className="generated-output-history-header">
      <div>
        <p className="section-eyebrow">Generated Outputs</p>
        <h2>Output History</h2>
        <p className="small-note">
          Session trace of generated images from detection, zoom, crop, and blur actions.
          Clearing this history does not remove active result panels.
        </p>

        {activeGeneratedImageSource && (
          <p className="small-note">
            Active image source: {activeGeneratedImageSource.label} · {activeGeneratedImageSource.filename}
          </p>
        )}

        <label className="generated-output-auto-active-toggle">
          <input
            type="checkbox"
            checked={autoUseLatestGeneratedOutputAsActive}
            onChange={(event) =>
              onAutoUseLatestGeneratedOutputAsActiveChange(event.target.checked)
            }
            disabled={isBusy}
          />
          <span>Auto-use latest generated output as active image</span>
        </label>
      </div>

      <div className="generated-output-history-actions">
        <button
          className="secondary-button"
          onClick={onLoadSavedHistory}
          disabled={isBusy || isLoadingGeneratedOutputHistory}
        >
          {isLoadingGeneratedOutputHistory ? 'Loading Saved History...' : 'Load Saved History'}
        </button>

        <button
          className="secondary-button"
          onClick={onExportWorkflowJson}
          disabled={isBusy}
          data-testid="download-generated-output-workflow-json"
        >
          {isWorkflowJsonDownloaded ? 'Downloaded' : 'Export Workflow JSON'}
        </button>

        <button
          className="secondary-button"
          onClick={onDownloadWorkflowReport}
          disabled={isBusy || generatedOutputHistoryCount === 0}
          data-testid="download-generated-output-workflow-report"
        >
          {isWorkflowReportDownloaded ? 'Downloaded' : 'Download Workflow Report'}
        </button>

        <button
          className="secondary-button view-clear-button"
          onClick={onClearOutputHistory}
          disabled={isBusy || isLoadingGeneratedOutputHistory}
        >
          Clear Output History
        </button>
      </div>
    </div>
  )
}
