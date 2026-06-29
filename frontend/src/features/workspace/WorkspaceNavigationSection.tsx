type WorkspaceNavigationSectionProps = {
  workspaceResultNavigatorItems: string[]
  isWorkspaceQuickJumpOpen: boolean
  activeWorkspaceResultLabel: string | null
  workspaceSnapshotFileName: string
  workspaceSnapshotEstimatedSize: string
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  showWorkspaceSnapshotPanel?: boolean
  onToggleQuickJump: () => void
  onCollapseQuickJump: () => void
  onSelectWorkspaceResult: (item: string) => void
  onCopyWorkspaceSnapshot: () => void
  onDownloadWorkspaceSnapshot: () => void
}

export function WorkspaceNavigationSection({
  workspaceResultNavigatorItems,
  isWorkspaceQuickJumpOpen,
  activeWorkspaceResultLabel,
  workspaceSnapshotFileName,
  workspaceSnapshotEstimatedSize,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  showWorkspaceSnapshotPanel = true,
  onToggleQuickJump,
  onCollapseQuickJump,
  onSelectWorkspaceResult,
  onCopyWorkspaceSnapshot,
  onDownloadWorkspaceSnapshot,
}: WorkspaceNavigationSectionProps) {
  if (workspaceResultNavigatorItems.length === 0) {
    return null
  }

  return (
    <>
      <div
        className={
          isWorkspaceQuickJumpOpen
            ? 'workspace-result-navigator-shell open'
            : 'workspace-result-navigator-shell'
        }
      >
        <button
          className="workspace-result-navigator-fab"
          onClick={onToggleQuickJump}
          disabled={isBusy}
          type="button"
          aria-expanded={isWorkspaceQuickJumpOpen}
          aria-label="Toggle workspace quick jump"
        >
          <span className="workspace-result-navigator-fab-icon">↕</span>
          <span>{workspaceResultNavigatorItems.length} open</span>
        </button>

        {isWorkspaceQuickJumpOpen && (
          <section className="workspace-result-navigator" aria-label="Loaded result views">
            <div className="workspace-result-navigator-header">
              <div>
                <span className="workspace-result-navigator-eyebrow">Workspace quick jump</span>
                <h2>Loaded views</h2>
              </div>

              <div className="workspace-result-navigator-header-actions">
                <span className="workspace-result-navigator-count">
                  {workspaceResultNavigatorItems.length} open
                </span>

                <button
                  className="workspace-result-navigator-collapse-button"
                  onClick={onCollapseQuickJump}
                  disabled={isBusy}
                  type="button"
                >
                  Collapse
                </button>
              </div>
            </div>

            <div className="workspace-result-navigator-buttons">
              {workspaceResultNavigatorItems.map((item) => (
                <button
                  key={item}
                  className={
                    activeWorkspaceResultLabel === item
                      ? 'workspace-result-navigator-button active'
                      : 'workspace-result-navigator-button'
                  }
                  onClick={() => onSelectWorkspaceResult(item)}
                  disabled={isBusy}
                  type="button"
                  aria-current={activeWorkspaceResultLabel === item ? 'true' : undefined}
                >
                  <span className="workspace-result-navigator-dot"></span>
                  {item}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {showWorkspaceSnapshotPanel && (
        <section className="workspace-snapshot-panel" aria-label="Workspace snapshot export">
        <div className="workspace-snapshot-compact" aria-label="Workspace snapshot summary">
          <span>
            Snapshot: <strong>{workspaceResultNavigatorItems.length}</strong> view(s)
          </span>
          <span>
            Active: <strong>{activeWorkspaceResultLabel ?? 'None'}</strong>
          </span>
          <span>
            Size: <strong>{workspaceSnapshotEstimatedSize}</strong>
          </span>
        </div>

        <details className="workspace-snapshot-details">
          <summary>Show snapshot details</summary>

          <div className="workspace-snapshot-details-content">
            <p>
              File: <strong>{workspaceSnapshotFileName}</strong>
            </p>

            <div className="workspace-snapshot-preview-included">
              <span>Included</span>
              <div>
                {workspaceResultNavigatorItems.map((item) => (
                  <span key={item} className="workspace-snapshot-preview-chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </details>

        <div className="workspace-snapshot-actions" aria-label="Workspace snapshot actions">
          <button
            className="workspace-snapshot-button"
            onClick={onCopyWorkspaceSnapshot}
            disabled={isBusy}
            type="button"
          >
            {copiedParserLogJsonKey === 'workspace-snapshot-json'
              ? 'Copied Workspace Snapshot'
              : failedParserLogJsonKey === 'workspace-snapshot-json'
                ? 'Copy Failed'
                : 'Copy Workspace Snapshot JSON'}
          </button>

          <button
            className="workspace-snapshot-button"
            onClick={onDownloadWorkspaceSnapshot}
            disabled={isBusy}
            type="button"
          >
            {downloadedParserLogJsonKey === 'download-workspace-snapshot-json'
              ? 'Downloaded Workspace Snapshot'
              : 'Download Workspace Snapshot JSON'}
          </button>
        </div>
        </section>
      )}
    </>
  )
}
