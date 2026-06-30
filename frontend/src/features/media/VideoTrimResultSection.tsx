import type { RefObject } from 'react'

import type { VideoTrimResponse } from '../../types/apiTypes'

type VideoTrimResultSectionProps = {
  videoTrimResult: VideoTrimResponse | null
  videoTrimResultRef: RefObject<HTMLElement | null>
  trimmedVideoUrl: string | null
  isBusy: boolean
  isDeveloperMode: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onClearVideoTrimResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function VideoTrimResultSection({
  videoTrimResult,
  videoTrimResultRef,
  trimmedVideoUrl,
  isBusy,
  isDeveloperMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onClearVideoTrimResult,
  onCopyJson,
  onDownloadJson,
}: VideoTrimResultSectionProps) {
  if (!videoTrimResult) {
    return null
  }

  return (
    <section className="result-grid" ref={videoTrimResultRef}>
      <div className="card">
        <h2>{isDeveloperMode ? 'Trimmed Video Result' : 'Trimmed video ready'}</h2>

        <div className={isDeveloperMode ? 'loaded-panel-actions' : 'loaded-panel-actions result-management-actions'}>
          {isDeveloperMode && (
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'video_trim_result',
                    copied_at: new Date().toISOString(),
                    original_filename: videoTrimResult.filename,
                    trimmed_filename: videoTrimResult.trimmed_filename,
                    start_seconds: videoTrimResult.start_seconds,
                    end_seconds: videoTrimResult.end_seconds,
                    duration_seconds: videoTrimResult.duration_seconds,
                    metadata: videoTrimResult.metadata,
                    result: videoTrimResult,
                  },
                  'video-trim-result-json',
                  'Copied Video Trim Result JSON to clipboard.',
                )
              }
              disabled={isBusy || !videoTrimResult}
            >
              {copiedParserLogJsonKey === 'video-trim-result-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'video-trim-result-json'
                  ? 'Copy failed'
                  : 'Copy Video Trim Result JSON'}
            </button>
          )}

          {isDeveloperMode && (
            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'video_trim_result',
                    downloaded_at: new Date().toISOString(),
                    original_filename: videoTrimResult.filename,
                    trimmed_filename: videoTrimResult.trimmed_filename,
                    start_seconds: videoTrimResult.start_seconds,
                    end_seconds: videoTrimResult.end_seconds,
                    duration_seconds: videoTrimResult.duration_seconds,
                    metadata: videoTrimResult.metadata,
                    result: videoTrimResult,
                  },
                  `video_trim_result_file-${videoTrimResult.trimmed_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                  'Downloaded Video Trim Result JSON.',
                  'download-video-trim-result-json',
                )
              }
              disabled={isBusy || !videoTrimResult}
              data-testid="download-video-trim-result-json"
            >
              {downloadedParserLogJsonKey === 'download-video-trim-result-json'
                ? 'Downloaded!'
                : 'Download Video Trim Result JSON'}
            </button>
          )}

          <button
            className="secondary-button view-clear-button"
            onClick={onClearVideoTrimResult}
            disabled={isBusy}
          >
            {isDeveloperMode ? 'Clear View' : 'Clear result'}
          </button>
        </div>

        <div className="metadata-list">
          {isDeveloperMode && (
            <>
              <p><strong>Original filename:</strong> {videoTrimResult.filename}</p>
              <p><strong>Trimmed filename:</strong> {videoTrimResult.trimmed_filename}</p>
            </>
          )}
          <p><strong>Start:</strong> {videoTrimResult.start_seconds}s</p>
          <p><strong>End:</strong> {videoTrimResult.end_seconds}s</p>
          <p><strong>Trim duration:</strong> {videoTrimResult.duration_seconds}s</p>
          {isDeveloperMode && (
            <>
              <p><strong>Readable:</strong> {videoTrimResult.metadata.is_readable ? 'Yes' : 'No'}</p>
              <p><strong>Width:</strong> {videoTrimResult.metadata.width ?? 'Unknown'}</p>
              <p><strong>Height:</strong> {videoTrimResult.metadata.height ?? 'Unknown'}</p>
              <p><strong>FPS:</strong> {videoTrimResult.metadata.fps ?? 'Unknown'}</p>
              <p><strong>Frame count:</strong> {videoTrimResult.metadata.frame_count ?? 'Unknown'}</p>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>{isDeveloperMode ? 'Trimmed Video Preview' : 'Trimmed preview'}</h2>
        {trimmedVideoUrl && videoTrimResult && (
          <>
            <video className="preview-video" src={trimmedVideoUrl} controls />

            <div className={isDeveloperMode ? 'output-actions' : 'output-actions result-output-actions'}>
              <a href={trimmedVideoUrl} target="_blank" rel="noreferrer">
                Open trimmed video
              </a>
              <a href={trimmedVideoUrl} download={videoTrimResult.trimmed_filename}>
                Download trimmed video
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
