type WorkspacePreview = {
  loadedResultCount: number
  savedAt?: string
  resultViews: string[]
}

type WorkspaceRecoveryPanelsSectionProps = {
  showWorkspaceRecoveryBanner: boolean
  workspaceLocalBackupPreview: WorkspacePreview | null
  workspaceClearUndoPreview: WorkspacePreview | null
  isBusy: boolean
  onLoadLocalWorkspaceSnapshot: () => void
  onDismissWorkspaceRecoveryBanner: () => void
  onUndoClearWorkspaceViews: () => void
}

export function WorkspaceRecoveryPanelsSection({
  showWorkspaceRecoveryBanner,
  workspaceLocalBackupPreview,
  workspaceClearUndoPreview,
  isBusy,
  onLoadLocalWorkspaceSnapshot,
  onDismissWorkspaceRecoveryBanner,
  onUndoClearWorkspaceViews,
}: WorkspaceRecoveryPanelsSectionProps) {
  return (
    <>
      {showWorkspaceRecoveryBanner && workspaceLocalBackupPreview && (
        <section className="workspace-recovery-banner" aria-label="Local workspace recovery">
          <div>
            <strong>Local workspace backup available</strong>
            <p>
              Restore {workspaceLocalBackupPreview.loadedResultCount} saved result view(s)
              from {workspaceLocalBackupPreview.savedAt}.
            </p>

            <div className="workspace-recovery-banner-chips">
              {workspaceLocalBackupPreview.resultViews.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          <div className="workspace-recovery-banner-actions">
            <button
              className="secondary-button workspace-recovery-banner-restore-button"
              onClick={onLoadLocalWorkspaceSnapshot}
              disabled={isBusy}
              type="button"
            >
              Restore Local Workspace
            </button>

            <button
              className="workspace-recovery-banner-dismiss-button"
              onClick={onDismissWorkspaceRecoveryBanner}
              disabled={isBusy}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {workspaceClearUndoPreview && (
        <section className="workspace-undo-clear-panel" aria-label="Undo cleared workspace">
          <div>
            <strong>Undo clear available</strong>
            <p>
              Restore {workspaceClearUndoPreview.loadedResultCount} cleared workspace result view(s).
            </p>

            <div className="workspace-undo-clear-chips">
              {workspaceClearUndoPreview.resultViews.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          <button
            className="secondary-button workspace-undo-clear-button"
            onClick={onUndoClearWorkspaceViews}
            disabled={isBusy}
            type="button"
          >
            Undo Clear Workspace
          </button>
        </section>
      )}
    </>
  )
}
