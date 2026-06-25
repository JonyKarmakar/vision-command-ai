import type { VideoUploadResponse } from '../../types/apiTypes'

type VideoFrameToolsSectionProps = {
  videoUploadResult: VideoUploadResponse | null
  frameTimestampSeconds: number
  multiFrameStartSeconds: number
  multiFrameEndSeconds: number
  multiFrameIntervalSeconds: number
  isBusy: boolean
  isExtractingFrame: boolean
  isExtractingMultipleFrames: boolean
  onFrameTimestampSecondsChange: (value: number) => void
  onMultiFrameStartSecondsChange: (value: number) => void
  onMultiFrameEndSecondsChange: (value: number) => void
  onMultiFrameIntervalSecondsChange: (value: number) => void
  onExtractVideoFrame: () => void | Promise<void>
  onExtractMultipleVideoFrames: () => void | Promise<void>
}

export function VideoFrameToolsSection({
  videoUploadResult,
  frameTimestampSeconds,
  multiFrameStartSeconds,
  multiFrameEndSeconds,
  multiFrameIntervalSeconds,
  isBusy,
  isExtractingFrame,
  isExtractingMultipleFrames,
  onFrameTimestampSecondsChange,
  onMultiFrameStartSecondsChange,
  onMultiFrameEndSecondsChange,
  onMultiFrameIntervalSecondsChange,
  onExtractVideoFrame,
  onExtractMultipleVideoFrames,
}: VideoFrameToolsSectionProps) {
  if (!videoUploadResult) {
    return null
  }

  return (
    <>
      <section className="card video-frame-card">
        <h2>Extract Video Frame</h2>
        <p className="small-note">
          Select a timestamp in seconds. The backend will extract that video frame as an image.
        </p>

        <div className="trim-input-grid">
          <label>
            Timestamp seconds
            <input
              type="number"
              min="0"
              step="0.1"
              value={frameTimestampSeconds}
              onChange={(event) => onFrameTimestampSecondsChange(Number(event.target.value))}
              disabled={isBusy}
            />
          </label>
        </div>

        <button onClick={() => void onExtractVideoFrame()} disabled={isBusy || !videoUploadResult}>
          {isExtractingFrame ? 'Extracting frame...' : 'Extract Frame'}
        </button>
      </section>

      <section className="card video-multiframe-card">
        <h2>Extract Multiple Frames</h2>
        <p className="small-note">
          Select a start time, end time, and interval. The backend will extract a frame gallery.
        </p>

        <div className="trim-input-grid">
          <label>
            Start seconds
            <input
              type="number"
              min="0"
              step="0.1"
              value={multiFrameStartSeconds}
              onChange={(event) => onMultiFrameStartSecondsChange(Number(event.target.value))}
              disabled={isBusy}
            />
          </label>

          <label>
            End seconds
            <input
              type="number"
              min="0"
              step="0.1"
              value={multiFrameEndSeconds}
              onChange={(event) => onMultiFrameEndSecondsChange(Number(event.target.value))}
              disabled={isBusy}
            />
          </label>

          <label>
            Interval seconds
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={multiFrameIntervalSeconds}
              onChange={(event) => onMultiFrameIntervalSecondsChange(Number(event.target.value))}
              disabled={isBusy}
            />
          </label>
        </div>

        <button
          onClick={() => void onExtractMultipleVideoFrames()}
          disabled={isBusy || !videoUploadResult}
        >
          {isExtractingMultipleFrames ? 'Extracting frames...' : 'Extract Multiple Frames'}
        </button>
      </section>
    </>
  )
}
