import type { ChangeEvent, RefObject } from 'react'

import type { VideoUploadResponse } from '../../types/apiTypes'

type VideoUploadFoundationSectionProps = {
  selectedVideoFile: File | null
  videoUploadResult: VideoUploadResponse | null
  uploadedVideoUrl: string | null
  videoUploadResultRef: RefObject<HTMLElement | null>
  trimStartSeconds: number
  trimEndSeconds: number
  isBusy: boolean
  isUploadingVideo: boolean
  isTrimmingVideo: boolean
  isDeveloperMode: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onVideoFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onVideoUpload: () => void
  onVideoTrim: () => void
  onTrimStartSecondsChange: (value: number) => void
  onTrimEndSecondsChange: (value: number) => void
  onClearVideoUploadResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function VideoUploadFoundationSection({
  selectedVideoFile,
  videoUploadResult,
  uploadedVideoUrl,
  videoUploadResultRef,
  trimStartSeconds,
  trimEndSeconds,
  isBusy,
  isUploadingVideo,
  isTrimmingVideo,
  isDeveloperMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onVideoFileChange,
  onVideoUpload,
  onVideoTrim,
  onTrimStartSecondsChange,
  onTrimEndSecondsChange,
  onClearVideoUploadResult,
  onCopyJson,
  onDownloadJson,
}: VideoUploadFoundationSectionProps) {
  return (
    <>
      <section className="card">
        <p className="eyebrow">Video workspace</p>
        <h2>Or upload a video</h2>
        <p className="small-note">
          Add a video to preview, trim, extract frames, run detection, and prepare video analysis workflows.
        </p>

        <input
          className="file-input"
          type="file"
          accept="video/*"
          onChange={onVideoFileChange}
          disabled={isBusy}
        />

        {selectedVideoFile && (
          <p className="selected-file">
            Selected video: <strong>{selectedVideoFile.name}</strong>
          </p>
        )}

        <div className="button-row">
          <button onClick={onVideoUpload} disabled={isBusy || !selectedVideoFile}>
            {isUploadingVideo ? 'Uploading video...' : 'Upload video'}
          </button>
        </div>
      </section>

      {videoUploadResult && (
        <>
          <section className="result-grid" ref={videoUploadResultRef}>
            <div className="card">
              <h2>Video workspace ready</h2>

              <div className="loaded-panel-actions">
                {isDeveloperMode && (
                  <>
                    <button
                      className="secondary-button"
                  onClick={() =>
                    void onCopyJson(
                      {
                        source: 'video_upload_result',
                        copied_at: new Date().toISOString(),
                        original_filename: videoUploadResult.original_filename,
                        stored_filename: videoUploadResult.stored_filename,
                        content_type: videoUploadResult.content_type,
                        file_size_bytes: videoUploadResult.file_size_bytes,
                        metadata: videoUploadResult.metadata,
                        result: videoUploadResult,
                      },
                      'video-upload-result-json',
                      'Copied Video Upload Result JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !videoUploadResult}
                >
                  {copiedParserLogJsonKey === 'video-upload-result-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'video-upload-result-json'
                      ? 'Copy failed'
                      : 'Copy Video Upload Result JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    onDownloadJson(
                      {
                        source: 'video_upload_result',
                        downloaded_at: new Date().toISOString(),
                        original_filename: videoUploadResult.original_filename,
                        stored_filename: videoUploadResult.stored_filename,
                        content_type: videoUploadResult.content_type,
                        file_size_bytes: videoUploadResult.file_size_bytes,
                        metadata: videoUploadResult.metadata,
                        result: videoUploadResult,
                      },
                      `video_upload_result_file-${videoUploadResult.original_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                      'Downloaded Video Upload Result JSON.',
                      'download-video-upload-result-json',
                    )
                  }
                  disabled={isBusy || !videoUploadResult}
                  data-testid="download-video-upload-result-json"
                >
                  {downloadedParserLogJsonKey === 'download-video-upload-result-json'
                    ? 'Downloaded!'
                    : 'Download Video Upload Result JSON'}
                </button>

                  </>
                )}

                <button
                  className="secondary-button view-clear-button"
                  onClick={onClearVideoUploadResult}
                  disabled={isBusy}
                >
                  Clear View
                </button>
              </div>

              <div className="metadata-list">
                <p><strong>Video:</strong> {videoUploadResult.original_filename}</p>
                <p><strong>Duration:</strong> {videoUploadResult.metadata.duration_seconds ? `${videoUploadResult.metadata.duration_seconds}s` : 'Unknown'}</p>
                <p><strong>Resolution:</strong> {videoUploadResult.metadata.width ?? 'Unknown'} × {videoUploadResult.metadata.height ?? 'Unknown'}</p>
                <p><strong>FPS:</strong> {videoUploadResult.metadata.fps ?? 'Unknown'}</p>

                {isDeveloperMode && (
                  <>
                    <p><strong>Stored filename:</strong> {videoUploadResult.stored_filename}</p>
                    <p><strong>Content type:</strong> {videoUploadResult.content_type}</p>
                    <p><strong>File size:</strong> {videoUploadResult.file_size_bytes} bytes</p>
                    <p><strong>Readable:</strong> {videoUploadResult.metadata.is_readable ? 'Yes' : 'No'}</p>
                    <p><strong>Frame count:</strong> {videoUploadResult.metadata.frame_count ?? 'Unknown'}</p>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <h2>Current video</h2>
              {uploadedVideoUrl && videoUploadResult && (
                <>
                  <video className="preview-video" src={uploadedVideoUrl} controls />

                  <div className="output-actions">
                    <a href={uploadedVideoUrl} target="_blank" rel="noreferrer">
                      Open video
                    </a>
                    <a href={uploadedVideoUrl} download={videoUploadResult.original_filename}>
                      Download video
                    </a>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="card video-trim-card">
            <h2>Trim Video</h2>
            <p className="small-note">
              Select a start and end time in seconds. The backend will create a browser-playable trimmed MP4.
            </p>

            <div className="trim-input-grid">
              <label>
                Start seconds
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={trimStartSeconds}
                  onChange={(event) => onTrimStartSecondsChange(Number(event.target.value))}
                  disabled={isBusy}
                />
              </label>

              <label>
                End seconds
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={trimEndSeconds}
                  onChange={(event) => onTrimEndSecondsChange(Number(event.target.value))}
                  disabled={isBusy}
                />
              </label>
            </div>

            <button onClick={onVideoTrim} disabled={isBusy || !videoUploadResult}>
              {isTrimmingVideo ? 'Trimming video...' : 'Trim Video'}
            </button>
          </section>
        </>
      )}
    </>
  )
}
