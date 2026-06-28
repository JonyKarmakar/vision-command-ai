import type { ChangeEvent } from 'react'

type WorkspaceSnapshotImportPreview = {
  fileName: string
  loadedResultCount: number
  activeResultView?: string | null
  resultViews: string[]
}

type WorkspaceSnapshotImportPanelProps = {
  workspaceSnapshotImportPreview: WorkspaceSnapshotImportPreview | null
  workspaceSnapshotImportNotice: string
  workspaceSnapshotImportError: string
  hasWorkspaceSnapshotImportData: boolean
  isBusy: boolean
  onWorkspaceSnapshotImportChange: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>
  onRestoreWorkspaceSnapshot: () => void
}

export function WorkspaceSnapshotImportPanel({
  workspaceSnapshotImportPreview,
  workspaceSnapshotImportNotice,
  workspaceSnapshotImportError,
  hasWorkspaceSnapshotImportData,
  isBusy,
  onWorkspaceSnapshotImportChange,
  onRestoreWorkspaceSnapshot,
}: WorkspaceSnapshotImportPanelProps) {
  return (
    <details className="workspace-snapshot-import-panel">
      <summary>Import Workspace Snapshot JSON</summary>

      <div className="workspace-snapshot-import-content">
        <p className="small-note">
          Restore a previously downloaded VisionCommand workspace snapshot. Restoring replaces the current loaded result views.
        </p>

        <div className="workspace-snapshot-import-actions">
          <input
            className="file-input workspace-snapshot-import-input"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void onWorkspaceSnapshotImportChange(event)}
            disabled={isBusy}
          />

          <button
            className="secondary-button workspace-snapshot-import-restore-button"
            onClick={onRestoreWorkspaceSnapshot}
            disabled={isBusy || !hasWorkspaceSnapshotImportData}
            type="button"
          >
            Restore Workspace
          </button>
        </div>

        {workspaceSnapshotImportPreview && (
          <div className="workspace-snapshot-import-preview">
            <div>
              <span>File</span>
              <strong>{workspaceSnapshotImportPreview.fileName}</strong>
            </div>

            <div>
              <span>Contains</span>
              <strong>{workspaceSnapshotImportPreview.loadedResultCount} result view(s)</strong>
            </div>

            <div>
              <span>Active view</span>
              <strong>{workspaceSnapshotImportPreview.activeResultView ?? 'None'}</strong>
            </div>

            <div className="workspace-snapshot-import-preview-chips">
              {workspaceSnapshotImportPreview.resultViews.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        )}

        {workspaceSnapshotImportNotice && (
          <p className="workspace-snapshot-import-notice">{workspaceSnapshotImportNotice}</p>
        )}

        {workspaceSnapshotImportError && (
          <p className="workspace-snapshot-import-error">{workspaceSnapshotImportError}</p>
        )}
      </div>
    </details>
  )
}
