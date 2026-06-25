import type { RefObject } from 'react'

import type { VideoMultiFrameExtractResponse } from '../../types/apiTypes'

type MultiFrameExtractionResultSectionProps = {
  videoMultiFrameResult: VideoMultiFrameExtractResponse | null
  videoMultiFrameResultRef: RefObject<HTMLElement | null>
  isBusy: boolean
  isDetectingMultipleFrames: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onClearVideoMultiFrameResult: () => void
  onDetectMultipleVideoFrames: () => void | Promise<void>
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function MultiFrameExtractionResultSection({
  videoMultiFrameResult,
  videoMultiFrameResultRef,
  isBusy,
  isDetectingMultipleFrames,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onClearVideoMultiFrameResult,
  onDetectMultipleVideoFrames,
  onCopyJson,
  onDownloadJson,
}: MultiFrameExtractionResultSectionProps) {
  if (!videoMultiFrameResult) {
    return null
  }

  return (
    <section className="card" ref={videoMultiFrameResultRef}>
      <h2>Multi-Frame Extraction Result</h2>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
              {
                source: 'multi_frame_extraction_result',
                copied_at: new Date().toISOString(),
                original_filename: videoMultiFrameResult.filename,
                start_seconds: videoMultiFrameResult.start_seconds,
                end_seconds: videoMultiFrameResult.end_seconds,
                interval_seconds: videoMultiFrameResult.interval_seconds,
                frame_count: videoMultiFrameResult.frame_count,
                fps: videoMultiFrameResult.fps,
                video_duration_seconds: videoMultiFrameResult.video_duration_seconds,
                frames: videoMultiFrameResult.frames,
                result: videoMultiFrameResult,
              },
              'multi-frame-result-json',
              'Copied Multi-Frame Result JSON to clipboard.',
            )
          }
          disabled={isBusy || !videoMultiFrameResult}
        >
          {copiedParserLogJsonKey === 'multi-frame-result-json'
            ? 'Copied!'
            : failedParserLogJsonKey === 'multi-frame-result-json'
              ? 'Copy failed'
              : 'Copy Multi-Frame Result JSON'}
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            onDownloadJson(
              {
                source: 'multi_frame_extraction_result',
                downloaded_at: new Date().toISOString(),
                original_filename: videoMultiFrameResult.filename,
                start_seconds: videoMultiFrameResult.start_seconds,
                end_seconds: videoMultiFrameResult.end_seconds,
                interval_seconds: videoMultiFrameResult.interval_seconds,
                frame_count: videoMultiFrameResult.frame_count,
                fps: videoMultiFrameResult.fps,
                video_duration_seconds: videoMultiFrameResult.video_duration_seconds,
                frames: videoMultiFrameResult.frames,
                result: videoMultiFrameResult,
              },
              `multi_frame_result_file-${videoMultiFrameResult.filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
              'Downloaded Multi-Frame Result JSON.',
              'download-multi-frame-result-json',
            )
          }
          disabled={isBusy || !videoMultiFrameResult}
          data-testid="download-multi-frame-result-json"
        >
          {downloadedParserLogJsonKey === 'download-multi-frame-result-json'
            ? 'Downloaded!'
            : 'Download Multi-Frame Result JSON'}
        </button>

        <button
          className="secondary-button view-clear-button"
          onClick={onClearVideoMultiFrameResult}
          disabled={isBusy}
        >
          Clear View
        </button>
      </div>

      <div className="summary-box">
        <p><strong>Original filename:</strong> {videoMultiFrameResult.filename}</p>
        <p><strong>Start:</strong> {videoMultiFrameResult.start_seconds}s</p>
        <p><strong>End:</strong> {videoMultiFrameResult.end_seconds}s</p>
        <p><strong>Interval:</strong> {videoMultiFrameResult.interval_seconds}s</p>
        <p><strong>Extracted frames:</strong> {videoMultiFrameResult.frame_count}</p>
        <p><strong>FPS:</strong> {videoMultiFrameResult.fps}</p>
        <p><strong>Video duration:</strong> {videoMultiFrameResult.video_duration_seconds}s</p>
      </div>

      <div className="button-row multiframe-detection-actions">
        <button
          className="secondary-button"
          onClick={() => void onDetectMultipleVideoFrames()}
          disabled={isBusy || !videoMultiFrameResult}
        >
          {isDetectingMultipleFrames ? 'Detecting frames...' : 'Run YOLO on Extracted Frames'}
        </button>
      </div>

      <div className="frame-gallery">
        {videoMultiFrameResult.frames.map((frame) => {
          const frameUrl = `/api${frame.frame_file_url}`

          return (
            <div className="frame-card" key={frame.frame_filename}>
              <img
                className="preview-image"
                src={frameUrl}
                alt={`Extracted frame at ${frame.timestamp_seconds}s`}
              />

              <div className="metadata-list">
                <p><strong>Timestamp:</strong> {frame.timestamp_seconds}s</p>
                <p><strong>Frame index:</strong> {frame.frame_index}</p>
              </div>

              <div className="output-actions">
                <a href={frameUrl} target="_blank" rel="noreferrer">
                  Open frame
                </a>
                <a href={frameUrl} download={frame.frame_filename}>
                  Download frame
                </a>

                <button
                  className="secondary-button"
                  onClick={() =>
                    void onCopyJson(
                      {
                        source: 'extracted_frame_gallery_item',
                        copied_at: new Date().toISOString(),
                        original_video_filename: videoMultiFrameResult.filename,
                        frame_filename: frame.frame_filename,
                        frame_file_url: frame.frame_file_url,
                        timestamp_seconds: frame.timestamp_seconds,
                        frame_index: frame.frame_index,
                        frame,
                      },
                      `extracted-frame-json-${frame.frame_filename}`,
                      'Copied Extracted Frame JSON to clipboard.',
                    )
                  }
                  disabled={isBusy}
                >
                  {copiedParserLogJsonKey === `extracted-frame-json-${frame.frame_filename}`
                    ? 'Copied!'
                    : failedParserLogJsonKey === `extracted-frame-json-${frame.frame_filename}`
                      ? 'Copy failed'
                      : 'Copy Frame JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    onDownloadJson(
                      {
                        source: 'extracted_frame_gallery_item',
                        downloaded_at: new Date().toISOString(),
                        original_video_filename: videoMultiFrameResult.filename,
                        frame_filename: frame.frame_filename,
                        frame_file_url: frame.frame_file_url,
                        timestamp_seconds: frame.timestamp_seconds,
                        frame_index: frame.frame_index,
                        frame,
                      },
                      `extracted_frame_json-${frame.frame_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                      'Downloaded Extracted Frame JSON.',
                      `download-extracted-frame-json-${frame.frame_filename}`,
                    )
                  }
                  disabled={isBusy}
                >
                  {downloadedParserLogJsonKey === `download-extracted-frame-json-${frame.frame_filename}`
                    ? 'Downloaded!'
                    : 'Download Frame JSON'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
