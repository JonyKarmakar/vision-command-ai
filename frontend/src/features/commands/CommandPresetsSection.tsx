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
  isDeveloperMode: boolean
  generalCommandPresets: GeneralCommandPreset[]
  detectedObjectCommandPresets: DetectedObjectCommandPreset[]
  hasUploadResult: boolean
  hasVideoUploadResult: boolean
  isBusy: boolean
  onSelectCommand: (command: string) => void
}

export function CommandPresetsSection({
  isDeveloperMode,
  generalCommandPresets,
  detectedObjectCommandPresets,
  hasUploadResult,
  hasVideoUploadResult,
  isBusy,
  onSelectCommand,
}: CommandPresetsSectionProps) {
  return (
    <div className={`smart-command-presets ${
      isDeveloperMode ? 'developer-command-presets' : 'assistant-command-presets'
    }`}>
      <div className="command-preset-group">
        <h3>{isDeveloperMode ? 'Suggested actions' : 'Quick actions'}</h3>
        <p className="small-note">
          {isDeveloperMode
            ? 'Quick assistant actions for the current workspace.'
            : 'Choose an action to fill the assistant box, then run it.'}
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
        <h3>{isDeveloperMode ? 'Object-aware suggestions' : 'Detected object actions'}</h3>
        <p className="small-note">
          {isDeveloperMode
            ? 'Suggestions generated from detected object classes. Run detection first.'
            : 'Use detected objects as targets for crop, blur, or zoom commands.'}
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
            {isDeveloperMode
              ? 'No detected classes yet. Upload an image and run YOLO detection to generate object presets.'
              : 'Run Detect objects first to unlock object-specific actions.'}
          </p>
        )}
      </div>
    </div>
  )
}
