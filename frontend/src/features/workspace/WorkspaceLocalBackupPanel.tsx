type WorkspaceLocalBackupPreview = {
  loadedResultCount: number
  savedAt: string
  size: string | number
  activeResultView?: string | null
  resultViews: string[]
}

type WorkspaceLocalBackupPanelProps = {
  workspaceLocalBackupAutoSavedAt: string | null
  workspaceLocalBackupPreview: WorkspaceLocalBackupPreview | null
  workspaceLocalBackupNotice: string
  workspaceLocalBackupError: string
  hasWorkspaceSnapshotResults: boolean
  isBusy: boolean
  onSaveWorkspaceLocally: () => void | Promise<void>
  onLoadLocalWorkspaceSnapshot: () => void | Promise<void>
  onClearLocalWorkspaceBackup: () => void | Promise<void>
}

export function WorkspaceLocalBackupPanel({
  workspaceLocalBackupAutoSavedAt,
  workspaceLocalBackupPreview,
  workspaceLocalBackupNotice,
  workspaceLocalBackupError,
  hasWorkspaceSnapshotResults,
  isBusy,
  onSaveWorkspaceLocally,
  onLoadLocalWorkspaceSnapshot,
  onClearLocalWorkspaceBackup,
}: WorkspaceLocalBackupPanelProps) {
  return (
          <details className="workspace-local-backup-panel">
            <summary>Local Workspace Backup</summary>

            <div className="workspace-local-backup-content">
              <p className="small-note">
                Save the current workspace in this browser, or restore the last local backup after clearing the workspace.
              </p>

              <div className="workspace-local-backup-status">
                <span>Automatic local backup</span>
                <strong>
                  {workspaceLocalBackupAutoSavedAt
                    ? `Last saved at ${workspaceLocalBackupAutoSavedAt}`
                    : hasWorkspaceSnapshotResults
                      ? 'Waiting for workspace changes'
                      : 'No loaded views to auto-save'}
                </strong>
              </div>

              {workspaceLocalBackupPreview ? (
                <div className="workspace-local-backup-preview">
                  <div className="workspace-local-backup-preview-header">
                    <div>
                      <span>Local backup available</span>
                      <strong>{workspaceLocalBackupPreview.loadedResultCount} result view(s)</strong>
                    </div>

                    <div>
                      <span>Saved at</span>
                      <strong>{workspaceLocalBackupPreview.savedAt}</strong>
                    </div>

                    <div>
                      <span>Size</span>
                      <strong>{workspaceLocalBackupPreview.size}</strong>
                    </div>

                    <div>
                      <span>Active view</span>
                      <strong>{workspaceLocalBackupPreview.activeResultView ?? 'None'}</strong>
                    </div>
                  </div>

                  <div className="workspace-local-backup-preview-chips">
                    {workspaceLocalBackupPreview.resultViews.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="workspace-local-backup-empty">
                  No saved local backup found in this browser yet.
                </p>
              )}

              <div className="workspace-local-backup-actions" aria-label="Local workspace backup actions">
                <button
                  className="workspace-snapshot-button"
                  onClick={onSaveWorkspaceLocally}
                  disabled={isBusy || !hasWorkspaceSnapshotResults}
                  type="button"
                >
                  Save Workspace Locally
                </button>

                <button
                  className="workspace-snapshot-button"
                  onClick={onLoadLocalWorkspaceSnapshot}
                  disabled={isBusy}
                  type="button"
                >
                  Load Local Workspace
                </button>

                <button
                  className="workspace-snapshot-button"
                  onClick={onClearLocalWorkspaceBackup}
                  disabled={isBusy}
                  type="button"
                >
                  Clear Local Workspace Backup
                </button>
              </div>

              {workspaceLocalBackupNotice && (
                <p className="workspace-local-backup-notice">{workspaceLocalBackupNotice}</p>
              )}

              {workspaceLocalBackupError && (
                <p className="workspace-local-backup-error">{workspaceLocalBackupError}</p>
              )}
            </div>
          </details>
  )
}
