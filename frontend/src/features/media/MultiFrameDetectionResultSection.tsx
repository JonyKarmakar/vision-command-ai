import type { RefObject } from 'react'

import type { VideoMultiFrameDetectionResponse } from '../../types/apiTypes'

type MultiFrameDetectionFrame = VideoMultiFrameDetectionResponse['frames'][number]

type MultiFrameDetectionResultSectionProps = {
  videoMultiFrameDetectionResult: VideoMultiFrameDetectionResponse | null
  videoMultiFrameDetectionResultRef: RefObject<HTMLElement | null>
  isBusy: boolean
  isDeveloperMode: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  formatFrameTimestamp: (frameFilename: string) => string
  getFrameClassSummary: (detections: MultiFrameDetectionFrame['detections']) => string
  onClearVideoMultiFrameDetectionResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

function buildFrameClassSummary(frame: MultiFrameDetectionFrame) {
  return frame.detections.reduce<Record<string, number>>((summary, detection) => {
    summary[detection.class_name] = (summary[detection.class_name] ?? 0) + 1
    return summary
  }, {})
}

export function MultiFrameDetectionResultSection({
  videoMultiFrameDetectionResult,
  videoMultiFrameDetectionResultRef,
  isBusy,
  isDeveloperMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  formatFrameTimestamp,
  getFrameClassSummary,
  onClearVideoMultiFrameDetectionResult,
  onCopyJson,
  onDownloadJson,
}: MultiFrameDetectionResultSectionProps) {
  if (!videoMultiFrameDetectionResult) {
    return null
  }

  return (
    <section className="card" ref={videoMultiFrameDetectionResultRef}>
      <h2>{isDeveloperMode ? 'Multi-Frame Detection Result' : 'Frame detection results'}</h2>

      <div className={isDeveloperMode ? 'loaded-panel-actions' : 'loaded-panel-actions result-management-actions'}>
        {isDeveloperMode && (
          <button
            className="secondary-button"
            onClick={() =>
              void onCopyJson(
                {
                  source: 'multi_frame_detection_result',
                  copied_at: new Date().toISOString(),
                  frame_count: videoMultiFrameDetectionResult.frame_count,
                  confidence_threshold: videoMultiFrameDetectionResult.confidence_threshold,
                  class_filter: videoMultiFrameDetectionResult.class_filter,
                  frames: videoMultiFrameDetectionResult.frames,
                  result: videoMultiFrameDetectionResult,
                },
                'multi-frame-detection-result-json',
                'Copied Multi-Frame Detection Result JSON to clipboard.',
              )
            }
            disabled={isBusy || !videoMultiFrameDetectionResult}
          >
            {copiedParserLogJsonKey === 'multi-frame-detection-result-json'
              ? 'Copied!'
              : failedParserLogJsonKey === 'multi-frame-detection-result-json'
                ? 'Copy failed'
                : 'Copy Multi-Frame Detection Result JSON'}
          </button>
        )}

        {isDeveloperMode && (
          <button
            className="secondary-button"
            onClick={() =>
              onDownloadJson(
                {
                  source: 'multi_frame_detection_result',
                  downloaded_at: new Date().toISOString(),
                  frame_count: videoMultiFrameDetectionResult.frame_count,
                  confidence_threshold: videoMultiFrameDetectionResult.confidence_threshold,
                  class_filter: videoMultiFrameDetectionResult.class_filter,
                  frames: videoMultiFrameDetectionResult.frames,
                  result: videoMultiFrameDetectionResult,
                },
                `multi_frame_detection_result_frames-${videoMultiFrameDetectionResult.frame_count}.json`,
                'Downloaded Multi-Frame Detection Result JSON.',
                'download-multi-frame-detection-result-json',
              )
            }
            disabled={isBusy || !videoMultiFrameDetectionResult}
            data-testid="download-multi-frame-detection-result-json"
          >
            {downloadedParserLogJsonKey === 'download-multi-frame-detection-result-json'
              ? 'Downloaded!'
              : 'Download Multi-Frame Detection Result JSON'}
          </button>
        )}

        <button
          className="secondary-button view-clear-button"
          onClick={onClearVideoMultiFrameDetectionResult}
          disabled={isBusy}
        >
          {isDeveloperMode ? 'Clear View' : 'Clear result'}
        </button>
      </div>

      <div className="summary-box">
        <p><strong>Processed frames:</strong> {videoMultiFrameDetectionResult.frame_count}</p>
        <p><strong>Confidence threshold:</strong> {(videoMultiFrameDetectionResult.confidence_threshold * 100).toFixed(0)}%</p>
        <p><strong>Class filter:</strong> {videoMultiFrameDetectionResult.class_filter ?? 'All classes'}</p>
      </div>

      <div className="video-timeline">
        <h3>{isDeveloperMode ? 'Video Detection Timeline' : 'Detection timeline'}</h3>

        {videoMultiFrameDetectionResult.frames.map((frame, index) => (
          <div className="timeline-item" key={`${frame.frame_filename}-timeline`}>
            <div className="timeline-index">
              <span>{index + 1}</span>
            </div>

            <div className="timeline-content">
              <div className="timeline-header">
                <strong>{formatFrameTimestamp(frame.frame_filename)}</strong>
                <span>{frame.detection_count} detection(s)</span>
              </div>

              <p>{getFrameClassSummary(frame.detections)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="frame-gallery">
        {videoMultiFrameDetectionResult.frames.map((frame) => {
          const annotatedFrameUrl = `/api${frame.annotated_frame_file_url}`

          return (
            <div className="frame-card" key={frame.annotated_frame_filename}>
              <img
                className="preview-image"
                src={annotatedFrameUrl}
                alt={`Annotated frame ${frame.frame_filename}`}
              />

              <div className="metadata-list">
                {isDeveloperMode && (
                  <p><strong>Frame:</strong> {frame.frame_filename}</p>
                )}
                <p><strong>Detections:</strong> {frame.detection_count}</p>
              </div>

              {frame.detections.length > 0 ? (
                <div className="detections-list compact-detections">
                  {frame.detections.map((detection, index) => (
                    <div className="detection-item" key={`${frame.frame_filename}-${index}`}>
                      <div className="detection-header">
                        <strong>{index + 1}. {detection.class_name}</strong>
                        <span className="confidence-badge">
                          {(detection.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No objects detected in this frame.</p>
              )}

              <div className={isDeveloperMode ? 'output-actions' : 'output-actions result-output-actions'}>
                <a href={annotatedFrameUrl} target="_blank" rel="noreferrer">
                  {isDeveloperMode ? 'Open annotated frame' : 'Open detection frame'}
                </a>
                <a href={annotatedFrameUrl} download={frame.annotated_frame_filename}>
                  {isDeveloperMode ? 'Download annotated frame' : 'Download detection frame'}
                </a>

                {isDeveloperMode && (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      void onCopyJson(
                        {
                          source: 'multi_frame_detection_gallery_item',
                          copied_at: new Date().toISOString(),
                          frame_filename: frame.frame_filename,
                          detection_count: frame.detection_count,
                          class_summary: buildFrameClassSummary(frame),
                          detections: frame.detections,
                          annotated_frame_filename: frame.annotated_frame_filename,
                          annotated_frame_file_url: frame.annotated_frame_file_url,
                          frame,
                        },
                        `multi-frame-detection-frame-json-${frame.frame_filename}`,
                        'Copied Detection Frame JSON to clipboard.',
                      )
                    }
                    disabled={isBusy}
                  >
                    {copiedParserLogJsonKey === `multi-frame-detection-frame-json-${frame.frame_filename}`
                      ? 'Copied!'
                      : failedParserLogJsonKey === `multi-frame-detection-frame-json-${frame.frame_filename}`
                        ? 'Copy failed'
                        : 'Copy Frame JSON'}
                  </button>
                )}

                {isDeveloperMode && (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      onDownloadJson(
                        {
                          source: 'multi_frame_detection_gallery_item',
                          downloaded_at: new Date().toISOString(),
                          frame_filename: frame.frame_filename,
                          detection_count: frame.detection_count,
                          class_summary: buildFrameClassSummary(frame),
                          detections: frame.detections,
                          annotated_frame_filename: frame.annotated_frame_filename,
                          annotated_frame_file_url: frame.annotated_frame_file_url,
                          frame,
                        },
                        `multi_frame_detection_frame_json-${frame.frame_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                        'Downloaded Detection Frame JSON.',
                        `download-multi-frame-detection-frame-json-${frame.frame_filename}`,
                      )
                    }
                    disabled={isBusy}
                  >
                    {downloadedParserLogJsonKey === `download-multi-frame-detection-frame-json-${frame.frame_filename}`
                      ? 'Downloaded!'
                      : 'Download Frame JSON'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
