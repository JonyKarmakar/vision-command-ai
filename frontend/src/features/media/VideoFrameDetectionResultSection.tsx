import type { RefObject } from 'react'

import type { VideoFrameDetectionResponse } from '../../types/apiTypes'

type VideoFrameDetectionResultSectionProps = {
  videoFrameDetectionResult: VideoFrameDetectionResponse | null
  videoFrameDetectionResultRef: RefObject<HTMLElement | null>
  annotatedFrameUrl: string | null
  isBusy: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onClearVideoFrameDetectionResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function VideoFrameDetectionResultSection({
  videoFrameDetectionResult,
  videoFrameDetectionResultRef,
  annotatedFrameUrl,
  isBusy,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onClearVideoFrameDetectionResult,
  onCopyJson,
  onDownloadJson,
}: VideoFrameDetectionResultSectionProps) {
  if (!videoFrameDetectionResult) {
    return null
  }

  return (
    <section className="result-grid" ref={videoFrameDetectionResultRef}>
      <div className="card">
        <h2>Video Frame Detection Result</h2>

        <div className="loaded-panel-actions">
          <button
            className="secondary-button"
            onClick={() =>
              void onCopyJson(
                {
                  source: 'video_frame_detection_result',
                  copied_at: new Date().toISOString(),
                  frame_filename: videoFrameDetectionResult.frame_filename,
                  detection_count: videoFrameDetectionResult.detection_count,
                  annotated_frame_filename: videoFrameDetectionResult.annotated_frame_filename,
                  annotated_frame_file_url: videoFrameDetectionResult.annotated_frame_file_url,
                  detections: videoFrameDetectionResult.detections,
                  result: videoFrameDetectionResult,
                },
                'video-frame-detection-result-json',
                'Copied Video Frame Detection Result JSON to clipboard.',
              )
            }
            disabled={isBusy || !videoFrameDetectionResult}
          >
            {copiedParserLogJsonKey === 'video-frame-detection-result-json'
              ? 'Copied!'
              : failedParserLogJsonKey === 'video-frame-detection-result-json'
                ? 'Copy failed'
                : 'Copy Video Frame Detection Result JSON'}
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              onDownloadJson(
                {
                  source: 'video_frame_detection_result',
                  downloaded_at: new Date().toISOString(),
                  frame_filename: videoFrameDetectionResult.frame_filename,
                  detection_count: videoFrameDetectionResult.detection_count,
                  annotated_frame_filename: videoFrameDetectionResult.annotated_frame_filename,
                  annotated_frame_file_url: videoFrameDetectionResult.annotated_frame_file_url,
                  detections: videoFrameDetectionResult.detections,
                  result: videoFrameDetectionResult,
                },
                `video_frame_detection_result_file-${videoFrameDetectionResult.frame_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                'Downloaded Video Frame Detection Result JSON.',
                'download-video-frame-detection-result-json',
              )
            }
            disabled={isBusy || !videoFrameDetectionResult}
            data-testid="download-video-frame-detection-result-json"
          >
            {downloadedParserLogJsonKey === 'download-video-frame-detection-result-json'
              ? 'Downloaded!'
              : 'Download Video Frame Detection Result JSON'}
          </button>

          <button
            className="secondary-button view-clear-button"
            onClick={onClearVideoFrameDetectionResult}
            disabled={isBusy}
          >
            Clear View
          </button>
        </div>

        <div className="summary-box">
          <p><strong>Frame filename:</strong> {videoFrameDetectionResult.frame_filename}</p>
          <p><strong>Detection count:</strong> {videoFrameDetectionResult.detection_count}</p>
          <p><strong>Annotated frame:</strong> {videoFrameDetectionResult.annotated_frame_filename}</p>
        </div>

        {videoFrameDetectionResult.detections.length > 0 ? (
          <div className="detections-list">
            {videoFrameDetectionResult.detections.map((detection, index) => (
              <div className="detection-item" key={`${detection.class_name}-${index}`}>
                <div className="detection-header">
                  <strong>{index + 1}. {detection.class_name}</strong>
                  <span className="confidence-badge">
                    {(detection.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <span>
                  Box: x1 {detection.bbox.x1}, y1 {detection.bbox.y1}, x2 {detection.bbox.x2}, y2 {detection.bbox.y2}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>No objects detected in this frame.</p>
        )}
      </div>

      <div className="card">
        <h2>Annotated Frame Preview</h2>
        {annotatedFrameUrl && videoFrameDetectionResult && (
          <>
            <img
              className="preview-image"
              src={annotatedFrameUrl}
              alt="Annotated extracted video frame"
            />

            <div className="output-actions">
              <a href={annotatedFrameUrl} target="_blank" rel="noreferrer">
                Open annotated frame
              </a>
              <a href={annotatedFrameUrl} download={videoFrameDetectionResult.annotated_frame_filename}>
                Download annotated frame
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
