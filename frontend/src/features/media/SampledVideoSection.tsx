import type { RefObject } from 'react'

import type {
  VideoSampledDetectionResponse,
  VideoUploadResponse,
} from '../../types/apiTypes'

type SampledVideoSectionProps = {
  videoUploadResult: VideoUploadResponse | null
  videoSampledDetectionResult: VideoSampledDetectionResponse | null
  videoSampledDetectionResultRef: RefObject<HTMLHeadingElement | null>
  sampledVideoIntervalSeconds: number
  trackingStartSeconds: number
  trackingEndSeconds: number
  trackingIntervalSeconds: number
  trackingMaxDistancePixels: number
  isBusy: boolean
  isDeveloperMode: boolean
  isDetectingSampledVideo: boolean
  isTrackingVideo: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onSampledVideoIntervalSecondsChange: (value: number) => void
  onTrackingStartSecondsChange: (value: number) => void
  onTrackingEndSecondsChange: (value: number) => void
  onTrackingIntervalSecondsChange: (value: number) => void
  onTrackingMaxDistancePixelsChange: (value: number) => void
  onDetectSampledVideo: () => void | Promise<void>
  onTrackSampledVideo: () => void | Promise<void>
  onClearVideoSampledDetectionResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}


export function SampledVideoDetectionResultSection({
  videoSampledDetectionResult,
  videoSampledDetectionResultRef,
  isBusy,
  isDeveloperMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onClearVideoSampledDetectionResult,
  onCopyJson,
  onDownloadJson,
}: Pick<
  SampledVideoSectionProps,
  | 'videoSampledDetectionResult'
  | 'videoSampledDetectionResultRef'
  | 'isBusy'
  | 'isDeveloperMode'
  | 'copiedParserLogJsonKey'
  | 'failedParserLogJsonKey'
  | 'downloadedParserLogJsonKey'
  | 'onClearVideoSampledDetectionResult'
  | 'onCopyJson'
  | 'onDownloadJson'
>) {
  if (!videoSampledDetectionResult) {
    return null
  }

  return (
  <section className="card video-sampled-result-card">
    <h3 ref={videoSampledDetectionResultRef}>
      {isDeveloperMode ? 'Sampled Video Detection Result' : 'Sampled detection results'}
    </h3>

    <div className={isDeveloperMode ? 'loaded-panel-actions' : 'loaded-panel-actions result-management-actions'}>
      {isDeveloperMode && (
        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
              {
                source: 'sampled_video_detection_result',
                copied_at: new Date().toISOString(),
                filename: videoSampledDetectionResult.filename,
                interval_seconds: videoSampledDetectionResult.interval_seconds,
                confidence_threshold: videoSampledDetectionResult.confidence_threshold,
                class_filter: videoSampledDetectionResult.class_filter,
                extracted_frame_count: videoSampledDetectionResult.extracted_frames.frame_count,
                detected_frame_count: videoSampledDetectionResult.detection.frame_count,
                extracted_frames: videoSampledDetectionResult.extracted_frames,
                detection: videoSampledDetectionResult.detection,
                result: videoSampledDetectionResult,
              },
              'sampled-video-detection-result-json',
              'Copied Sampled Video Detection Result JSON to clipboard.',
            )
          }
          disabled={isBusy || !videoSampledDetectionResult}
        >
          {copiedParserLogJsonKey === 'sampled-video-detection-result-json'
            ? 'Copied!'
            : failedParserLogJsonKey === 'sampled-video-detection-result-json'
              ? 'Copy failed'
              : 'Copy Sampled Video Detection Result JSON'}
        </button>
      )}

      {isDeveloperMode && (
        <button
          className="secondary-button"
          onClick={() =>
            onDownloadJson(
              {
                source: 'sampled_video_detection_result',
                downloaded_at: new Date().toISOString(),
                filename: videoSampledDetectionResult.filename,
                interval_seconds: videoSampledDetectionResult.interval_seconds,
                confidence_threshold: videoSampledDetectionResult.confidence_threshold,
                class_filter: videoSampledDetectionResult.class_filter,
                extracted_frame_count: videoSampledDetectionResult.extracted_frames.frame_count,
                detected_frame_count: videoSampledDetectionResult.detection.frame_count,
                extracted_frames: videoSampledDetectionResult.extracted_frames,
                detection: videoSampledDetectionResult.detection,
                result: videoSampledDetectionResult,
              },
              `sampled_video_detection_result_file-${videoSampledDetectionResult.filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
              'Downloaded Sampled Video Detection Result JSON.',
              'download-sampled-video-detection-result-json',
            )
          }
          disabled={isBusy || !videoSampledDetectionResult}
          data-testid="download-sampled-video-detection-result-json"
        >
          {downloadedParserLogJsonKey === 'download-sampled-video-detection-result-json'
            ? 'Downloaded!'
            : 'Download Sampled Video Detection Result JSON'}
        </button>
      )}

      <button
        className="secondary-button view-clear-button"
        onClick={onClearVideoSampledDetectionResult}
        disabled={isBusy}
      >
        {isDeveloperMode ? 'Clear View' : 'Clear result'}
      </button>
    </div>

    <div className="summary-box sampled-video-summary">
      {isDeveloperMode && (
        <p><strong>Video:</strong> {videoSampledDetectionResult.filename}</p>
      )}
      <p><strong>Interval:</strong> {videoSampledDetectionResult.interval_seconds}s</p>
      <p><strong>Confidence threshold:</strong> {(videoSampledDetectionResult.confidence_threshold * 100).toFixed(0)}%</p>
      <p><strong>Class filter:</strong> {videoSampledDetectionResult.class_filter ?? 'All classes'}</p>
      <p><strong>Extracted frames:</strong> {videoSampledDetectionResult.extracted_frames.frame_count}</p>
      <p><strong>Detected frames:</strong> {videoSampledDetectionResult.detection.frame_count}</p>
    </div>
  </section>
  )
}

export function SampledVideoSection({
  videoUploadResult,
  sampledVideoIntervalSeconds,
  trackingStartSeconds,
  trackingEndSeconds,
  trackingIntervalSeconds,
  trackingMaxDistancePixels,
  isBusy,
  isDeveloperMode,
  isDetectingSampledVideo,
  isTrackingVideo,
  onSampledVideoIntervalSecondsChange,
  onTrackingStartSecondsChange,
  onTrackingEndSecondsChange,
  onTrackingIntervalSecondsChange,
  onTrackingMaxDistancePixelsChange,
  onDetectSampledVideo,
  onTrackSampledVideo,
}: SampledVideoSectionProps) {
  if (!videoUploadResult) {
    return null
  }

  return (
    <>
      <section className="card video-sampled-detection-card">
        <h2>{isDeveloperMode ? 'Detect Sampled Video' : 'Detect objects across video'}</h2>
        <p className="small-note">
          {isDeveloperMode
            ? 'Sample frames across the full video and run YOLO detection on each sampled frame.'
            : 'Sample frames across the video and detect objects in each sampled frame.'}
        </p>

        <div className="trim-input-grid">
          <label>
            Sampling interval seconds
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={sampledVideoIntervalSeconds}
              onChange={(event) => onSampledVideoIntervalSecondsChange(Number(event.target.value))}
              disabled={isBusy}
            />
          </label>
        </div>

        <div className="sampled-video-action-row">
          <button
            onClick={() => void onDetectSampledVideo()}
            disabled={isBusy || !videoUploadResult}
          >
            {isDetectingSampledVideo
              ? isDeveloperMode
                ? 'Detecting sampled video...'
                : 'Detecting objects...'
              : isDeveloperMode
                ? 'Detect Sampled Video'
                : 'Detect objects in video'}
          </button>
        </div>
      </section>

      <section className="card video-tracking-card">
        <h2>{isDeveloperMode ? 'Track Sampled Video' : 'Track objects across video'}</h2>
        <p className="small-note">
          {isDeveloperMode
            ? 'Track detected objects across sampled video frames using simple centroid-based matching.'
            : 'Track detected objects across the selected video range.'}
        </p>

        <div className="trim-input-grid">
          <label>
            Start seconds
            <input
              type="number"
              min="0"
              step="0.1"
              value={trackingStartSeconds}
              onChange={(event) => onTrackingStartSecondsChange(Number(event.target.value))}
              disabled={isBusy}
            />
          </label>

          <label>
            End seconds
            <input
              type="number"
              min="0"
              step="0.1"
              value={trackingEndSeconds}
              onChange={(event) => onTrackingEndSecondsChange(Number(event.target.value))}
              disabled={isBusy}
            />
          </label>

          <label>
            Interval seconds
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={trackingIntervalSeconds}
              onChange={(event) => onTrackingIntervalSecondsChange(Number(event.target.value))}
              disabled={isBusy}
            />
          </label>

          <label>
            Max distance pixels
            <input
              type="number"
              min="1"
              step="1"
              value={trackingMaxDistancePixels}
              onChange={(event) => onTrackingMaxDistancePixelsChange(Number(event.target.value))}
              disabled={isBusy}
            />
          </label>
        </div>

        <div className="sampled-video-action-row">
          <button
            onClick={() => void onTrackSampledVideo()}
            disabled={isBusy || !videoUploadResult}
          >
            {isTrackingVideo
              ? 'Tracking video...'
              : isDeveloperMode
                ? 'Track Sampled Video'
                : 'Track objects'}
          </button>
        </div>
      </section>

    </>
  )
}
