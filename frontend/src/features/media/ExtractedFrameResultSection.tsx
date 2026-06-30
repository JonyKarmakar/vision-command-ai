import type { RefObject } from 'react'

import type { VideoFrameExtractResponse } from '../../types/apiTypes'

type ExtractedFrameResultSectionProps = {
  videoFrameResult: VideoFrameExtractResponse | null
  videoFrameResultRef: RefObject<HTMLElement | null>
  extractedFrameUrl: string | null
  isBusy: boolean
  isDeveloperMode: boolean
  isDetectingFrame: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onClearVideoFrameResult: () => void
  onDetectExtractedFrame: () => void | Promise<void>
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function ExtractedFrameResultSection({
  videoFrameResult,
  videoFrameResultRef,
  extractedFrameUrl,
  isBusy,
  isDeveloperMode,
  isDetectingFrame,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onClearVideoFrameResult,
  onDetectExtractedFrame,
  onCopyJson,
  onDownloadJson,
}: ExtractedFrameResultSectionProps) {
  if (!videoFrameResult) {
    return null
  }

  return (
    <section className="result-grid" ref={videoFrameResultRef}>
      <div className="card">
        <h2>{isDeveloperMode ? 'Extracted Frame Result' : 'Extracted frame ready'}</h2>

        <div className={isDeveloperMode ? 'loaded-panel-actions' : 'loaded-panel-actions result-management-actions'}>
          {isDeveloperMode && (
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'extracted_frame_result',
                    copied_at: new Date().toISOString(),
                    original_filename: videoFrameResult.filename,
                    frame_filename: videoFrameResult.frame_filename,
                    timestamp_seconds: videoFrameResult.timestamp_seconds,
                    frame_index: videoFrameResult.frame_index,
                    fps: videoFrameResult.fps,
                    video_duration_seconds: videoFrameResult.video_duration_seconds,
                    result: videoFrameResult,
                  },
                  'extracted-frame-result-json',
                  'Copied Extracted Frame Result JSON to clipboard.',
                )
              }
              disabled={isBusy || !videoFrameResult}
            >
              {copiedParserLogJsonKey === 'extracted-frame-result-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'extracted-frame-result-json'
                  ? 'Copy failed'
                  : 'Copy Extracted Frame Result JSON'}
            </button>
          )}

          {isDeveloperMode && (
            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'extracted_frame_result',
                    downloaded_at: new Date().toISOString(),
                    original_filename: videoFrameResult.filename,
                    frame_filename: videoFrameResult.frame_filename,
                    timestamp_seconds: videoFrameResult.timestamp_seconds,
                    frame_index: videoFrameResult.frame_index,
                    fps: videoFrameResult.fps,
                    video_duration_seconds: videoFrameResult.video_duration_seconds,
                    result: videoFrameResult,
                  },
                  `extracted_frame_result_file-${videoFrameResult.frame_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                  'Downloaded Extracted Frame Result JSON.',
                  'download-extracted-frame-result-json',
                )
              }
              disabled={isBusy || !videoFrameResult}
              data-testid="download-extracted-frame-result-json"
            >
              {downloadedParserLogJsonKey === 'download-extracted-frame-result-json'
                ? 'Downloaded!'
                : 'Download Extracted Frame Result JSON'}
            </button>
          )}

          <button
            className="secondary-button view-clear-button"
            onClick={onClearVideoFrameResult}
            disabled={isBusy}
          >
            {isDeveloperMode ? 'Clear View' : 'Clear result'}
          </button>
        </div>

        <div className="metadata-list">
          {isDeveloperMode && (
            <>
              <p><strong>Original filename:</strong> {videoFrameResult.filename}</p>
              <p><strong>Frame filename:</strong> {videoFrameResult.frame_filename}</p>
            </>
          )}
          <p><strong>Timestamp:</strong> {videoFrameResult.timestamp_seconds}s</p>
          {isDeveloperMode && (
            <>
              <p><strong>Frame index:</strong> {videoFrameResult.frame_index}</p>
              <p><strong>FPS:</strong> {videoFrameResult.fps}</p>
            </>
          )}
          <p><strong>Video duration:</strong> {videoFrameResult.video_duration_seconds}s</p>
        </div>
      </div>

      <div className="card">
        <h2>{isDeveloperMode ? 'Extracted Frame Preview' : 'Frame preview'}</h2>
        {extractedFrameUrl && videoFrameResult && (
          <>
            <img
              className="preview-image"
              src={extractedFrameUrl}
              alt="Extracted video frame"
            />

            <div className={isDeveloperMode ? 'output-actions' : 'output-actions result-output-actions'}>
              <a href={extractedFrameUrl} target="_blank" rel="noreferrer">
                Open frame
              </a>
              <a href={extractedFrameUrl} download={videoFrameResult.frame_filename}>
                Download frame
              </a>
            </div>

            <button
              className="secondary-button frame-detection-button"
              onClick={() => void onDetectExtractedFrame()}
              disabled={isBusy || !videoFrameResult}
            >
              {isDetectingFrame ? 'Detecting frame...' : isDeveloperMode ? 'Run YOLO on Frame' : 'Detect objects'}
            </button>
          </>
        )}
      </div>
    </section>
  )
}
