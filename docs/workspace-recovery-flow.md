# VisionCommand AI Workspace Recovery Flow

## 1. Purpose

The workspace recovery system protects users from losing result views while working with image, video, command, and model outputs.

It supports:

- Workspace Snapshot Export
- Workspace Snapshot Import
- Local Workspace Backup
- Automatic Autosave
- Local Backup Preview
- Recovery Banner
- Clear Confirmations
- Undo Clear Workspace
- Restore Confirmations

The goal is to make result panels recoverable after clearing, refreshing, or accidentally replacing the workspace.

---

## 2. Core Concepts

### Active Workspace

The active workspace is the current set of loaded result views visible in the app.

Examples:

- Image Upload Result
- Detection Result
- Crop Result
- Blur Result
- Video Upload Result
- Video Trim Result
- Extracted Frame Result
- Frame Detection Result
- Multi-Frame Extraction Result
- Multi-Frame Detection Result
- Sampled Video Detection Result
- Video Tracking Result
- Command Result

### Workspace Snapshot

A workspace snapshot is a JSON object containing the current restorable result state.

It includes:

- export timestamp
- active result view
- loaded result count
- loaded result labels
- result payloads

It is used by:

- Copy Workspace Snapshot JSON
- Download Workspace Snapshot JSON
- Import Workspace Snapshot JSON
- Local Workspace Backup
- Automatic Autosave
- Undo Clear Workspace

### Local Workspace Backup

The local workspace backup is saved in browser `localStorage`.

It is useful when:

- the user refreshes the browser
- the user accidentally clears the workspace
- the user wants to restore the latest non-empty workspace

The local backup is browser-specific. It does not sync across devices.

### Undo Clear Workspace

Undo Clear Workspace is a temporary in-memory recovery state.

It appears after:

- Clear All Workspace Views is confirmed

It disappears after:

- Undo Clear Workspace is clicked
- another workspace is successfully imported
- local workspace backup is restored

It does not survive browser refresh.

---

## 3. User Flows

### Export Workspace Snapshot

User flow:

1. Load one or more result views.
2. Use Copy Workspace Snapshot JSON or Download Workspace Snapshot JSON.
3. The snapshot includes all restorable workspace result views.
4. The downloaded JSON can later be imported.

Expected behavior:

- Empty workspaces should not be useful as backups.
- Snapshot count should match the actual saved result views.

---

### Import Workspace Snapshot

User flow:

1. Open Import Workspace Snapshot JSON.
2. Select a valid VisionCommand workspace snapshot file.
3. Preview appears with file name, result count, active view, and labels.
4. Click Restore Workspace.

Restore confirmation rules:

- If active result views exist, ask for confirmation.
- If Undo Clear Workspace exists, ask for confirmation.
- If no active result views and no undo recovery exist, restore directly.

Expected behavior:

- Cancel keeps the current workspace unchanged.
- Confirm restores imported result views.
- Successful import clears stale Undo Clear Workspace state.

---

### Save Workspace Locally

User flow:

1. Load one or more result views.
2. Click Save Workspace Locally.
3. Current snapshot is saved in browser `localStorage`.
4. Local backup preview updates.

Expected behavior:

- Save is disabled or rejected when no restorable result views exist.
- Local backup preview shows saved timestamp, size, active view, count, and labels.

---

### Automatic Autosave

User flow:

1. User loads result views through upload, detection, crop, blur, video processing, tracking, or command execution.
2. App automatically saves the latest non-empty workspace to localStorage.
3. Local backup preview updates.

Expected behavior:

- Autosave only runs when at least one restorable result exists.
- Clearing all views should not overwrite the local backup with an empty workspace.
- Autosave should not remove Undo Clear Workspace by itself.

---

### Load Local Workspace

User flow:

1. Open Local Workspace Backup.
2. Click Load Local Workspace.
3. App loads the saved browser backup.

Restore confirmation rules:

- If active result views exist, ask for confirmation.
- If Undo Clear Workspace exists, ask for confirmation.
- If no active result views and no undo recovery exist, restore directly.

Expected behavior:

- Cancel keeps the current workspace unchanged.
- Confirm restores local backup.
- Successful local restore clears stale Undo Clear Workspace state.

---

### Recovery Banner

User flow:

1. User refreshes or opens the app.
2. No workspace result views are currently loaded.
3. A local backup exists.
4. A recovery banner appears near the top.
5. User can click Restore Local Workspace.

Expected behavior:

- Banner appears only when:
  - local backup preview exists
  - no active workspace result views exist
  - no Undo Clear Workspace state exists
  - banner has not been dismissed
- Restore uses the same local workspace restore handler.
- Dismiss hides the banner but does not delete the backup.
- Refresh may show the banner again if the backup still exists.

---

### Clear All Workspace Views

User flow:

1. User clicks Clear All Workspace Views.
2. Confirmation appears.
3. If confirmed, active result views are cleared.
4. Undo Clear Workspace appears.

Expected behavior:

- Cancel keeps result views visible.
- Confirm clears active result views.
- Confirm creates an in-memory undo snapshot when restorable results exist.
- Local workspace backup is not deleted.
- Clear should not overwrite local backup with an empty snapshot.

---

### Undo Clear Workspace

User flow:

1. User clears all workspace views.
2. Undo Clear Workspace panel appears.
3. User clicks Undo Clear Workspace.
4. Cleared result views are restored.

Expected behavior:

- Undo restores from in-memory snapshot.
- Undo panel disappears after restore.
- Undo does not require localStorage.
- Undo does not survive browser refresh.

---

### Clear Local Workspace Backup

User flow:

1. User opens Local Workspace Backup.
2. User clicks Clear Local Workspace Backup.
3. Confirmation appears.
4. If confirmed, localStorage backup is deleted.

Expected behavior:

- Cancel keeps the backup.
- Confirm removes local backup.
- Preview disappears after clearing.
- Load Local Workspace should then show a no-backup message.

---

## 4. Restore and Clear Decision Rules

### Restore Confirmation Matrix

| Situation | Confirmation Required | Reason |
|---|---:|---|
| Active result views are loaded | Yes | Restore replaces visible work |
| No active views, but Undo Clear Workspace exists | Yes | Restore discards undo recovery |
| Active views and Undo Clear Workspace both exist | Yes | Restore replaces work and discards undo recovery |
| No active views and no undo recovery | No | Nothing active or recoverable is being overwritten |

### Clear Decision Matrix

| Action | Confirmation Required | Recovery Created |
|---|---:|---:|
| Clear All Workspace Views | Yes | Yes, if results exist |
| Clear Local Workspace Backup | Yes | No |
| Dismiss Recovery Banner | No | No |
| Undo Clear Workspace | No | Restores temporary undo snapshot |

---

## 5. State Model

Important frontend state groups:

### Snapshot Import State

- `workspaceSnapshotImportData`
- `workspaceSnapshotImportPreview`
- `workspaceSnapshotImportError`
- `workspaceSnapshotImportNotice`

Purpose:

- Holds selected JSON snapshot before restore.
- Shows import preview and messages.

### Local Backup State

- `workspaceLocalBackupPreview`
- `workspaceLocalBackupAutoSavedAt`
- `workspaceLocalBackupNotice`
- `workspaceLocalBackupError`

Purpose:

- Shows whether a local browser backup exists.
- Tracks autosave/manual save feedback.
- Supports restore from localStorage.

### Undo Clear State

- `workspaceClearUndoSnapshot`
- `workspaceClearUndoPreview`

Purpose:

- Temporarily stores the last cleared workspace.
- Enables immediate undo after clearing all result views.

### Recovery Banner State

- `isWorkspaceRecoveryBannerDismissed`
- `showWorkspaceRecoveryBanner`

Purpose:

- Shows restore shortcut when local backup exists and the workspace is empty.
- Allows user to dismiss the banner without deleting the backup.

### Snapshot Result Source of Truth

- `workspaceSnapshotResultViews`
- `hasWorkspaceSnapshotResults`

Purpose:

- Tracks all result views included in snapshots.
- Prevents mismatch between quick-jump navigation and actual saved/restored results.

---

## 6. Manual Test Matrix

### A. Snapshot Export and Import

1. Upload image.
2. Run YOLO Detection.
3. Download Workspace Snapshot JSON.
4. Clear all workspace views.
5. Import downloaded snapshot.
6. Restore it.

Expected:

- Import preview appears.
- Restore works.
- Result panels return.

---

### B. Local Manual Save and Load

1. Upload image.
2. Run YOLO Detection.
3. Save Workspace Locally.
4. Clear all workspace views.
5. Load Local Workspace.

Expected:

- Local backup preview shows saved workspace.
- Load restores result panels.
- Undo state clears after local restore.

---

### C. Automatic Autosave

1. Upload image.
2. Run YOLO Detection.
3. Wait for autosave.
4. Refresh browser.
5. Use recovery banner or Local Workspace Backup to restore.

Expected:

- Backup exists after refresh.
- Workspace restores.

---

### D. Clear All and Undo

1. Load result views.
2. Click Clear All Workspace Views.
3. Cancel confirmation.

Expected:

- Result panels remain.

Then:

1. Click Clear All Workspace Views again.
2. Confirm.
3. Click Undo Clear Workspace.

Expected:

- Result panels restore.
- Undo panel disappears.

---

### E. Restore Confirmation with Active Workspace

1. Load result views.
2. Import a snapshot.
3. Click Restore Workspace.
4. Cancel confirmation.

Expected:

- Current result panels remain.

Then:

1. Click Restore Workspace again.
2. Confirm.

Expected:

- Imported workspace replaces current views.

---

### F. Restore Confirmation with Undo Recovery

1. Load result views.
2. Clear all workspace views.
3. Confirm clear.
4. Undo Clear Workspace appears.
5. Click Load Local Workspace.
6. Cancel confirmation.

Expected:

- Undo Clear Workspace remains.

Then:

1. Click Load Local Workspace again.
2. Confirm.

Expected:

- Local workspace restores.
- Undo Clear Workspace disappears.

---

### G. Empty Workspace Restore

1. Refresh browser.
2. Ensure no active views and no undo panel exist.
3. Restore from recovery banner or Local Workspace Backup.

Expected:

- No confirmation appears.
- Workspace restores directly.

---

## 7. Known Limitations

- Local backup is browser-specific and stored in localStorage.
- Local backup does not sync across devices.
- Undo Clear Workspace is in-memory only and disappears after refresh.
- Snapshot JSON can become large when many video/frame results are included.
- Browser confirmation dialogs are basic and not styled like the app UI.
- Restored files depend on backend output URLs still being available.

---

## 8. Future Improvements

Possible future improvements:

- Replace browser `window.confirm` with custom styled confirmation modals.
- Add named workspace snapshots.
- Add multiple local backup slots instead of one overwriteable backup.
- Add backend-persisted workspace sessions.
- Add workspace recovery tests.
- Add snapshot schema versioning.
- Add snapshot compatibility validation for older exports.
- Add a compact workspace state machine diagram.
- Add “Restore as New Workspace” instead of replacing current views.
