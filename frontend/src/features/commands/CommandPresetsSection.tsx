type GeneralCommandPreset = {
  label: string
  command: string
  target?: string
}

type DetectedObjectCommandPreset = {
  label: string
  command: string
}

type CommandPresetsSectionProps = {
  generalCommandPresets: GeneralCommandPreset[]
  detectedObjectCommandPresets: DetectedObjectCommandPreset[]
  hasUploadResult: boolean
  hasVideoUploadResult: boolean
  isBusy: boolean
  onSelectCommand: (command: string) => void
}

export function CommandPresetsSection({
  generalCommandPresets,
  detectedObjectCommandPresets,
  hasUploadResult,
  hasVideoUploadResult,
  isBusy,
  onSelectCommand,
}: CommandPresetsSectionProps) {
  return (
    <div className="smart-command-presets">
      <div className="command-preset-group">
        <h3>Suggested actions</h3>
        <p className="small-note">
          Quick assistant actions for the current workspace.
        </p>

        <div className="preset-button-grid">
          {generalCommandPresets.map((preset) => {
            const requiresImage = preset.target === 'image'
            const requiresVideo = preset.target === 'video'
            const disabled =
              isBusy ||
              (requiresImage && !hasUploadResult) ||
              (requiresVideo && !hasVideoUploadResult)

            return (
              <button
                key={preset.command}
                className="preset-button"
                type="button"
                onClick={() => onSelectCommand(preset.command)}
                disabled={disabled}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="command-preset-group">
        <h3>Object-aware suggestions</h3>
        <p className="small-note">
          Suggestions generated from detected object classes. Run detection first.
        </p>

        {detectedObjectCommandPresets.length > 0 ? (
          <div className="preset-button-grid">
            {detectedObjectCommandPresets.map((preset) => (
              <button
                key={preset.command}
                className="preset-button"
                type="button"
                onClick={() => onSelectCommand(preset.command)}
                disabled={isBusy || !hasUploadResult}
              >
                {preset.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-preset-note">
            No detected classes yet. Upload an image and run YOLO detection to generate object presets.
          </p>
        )}
      </div>
    </div>
  )
}
