import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, RefObject } from 'react'

import type { VideoObjectDetectionResponse, VideoUploadResponse } from '../../types/apiTypes'

type VideoUploadFoundationSectionProps = {
  selectedVideoFile: File | null
  videoUploadResult: VideoUploadResponse | null
  videoObjectDetectionResult: VideoObjectDetectionResponse | null
  uploadedVideoUrl: string | null
  videoUploadResultRef: RefObject<HTMLElement | null>
  trimStartSeconds: number
  trimEndSeconds: number
  confidenceThreshold: number
  selectedClass: string
  classOptions: string[]
  isBusy: boolean
  isUploadingVideo: boolean
  isTrimmingVideo: boolean
  isDetectingVideoObjects: boolean
  isDeveloperMode: boolean
  showUploadCard?: boolean
  showWorkspacePanels?: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onVideoFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onVideoUpload: () => void
  onVideoTrim: () => void
  onDetectVideoObjects: () => void
  onConfidenceThresholdChange: (value: number) => void
  onSelectedClassChange: (value: string) => void
  onTrimStartSecondsChange: (value: number) => void
  onTrimEndSecondsChange: (value: number) => void
  onClearVideoUploadResult: () => void
  onClearVideoObjectDetectionResult: () => void
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
  videoObjectDetectionResult,
  uploadedVideoUrl,
  videoUploadResultRef,
  trimStartSeconds,
  trimEndSeconds,
  confidenceThreshold,
  selectedClass,
  classOptions,
  isBusy,
  isUploadingVideo,
  isTrimmingVideo,
  isDetectingVideoObjects,
  isDeveloperMode,
  showUploadCard = true,
  showWorkspacePanels = true,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onVideoFileChange,
  onVideoUpload,
  onVideoTrim,
  onDetectVideoObjects,
  onConfidenceThresholdChange,
  onSelectedClassChange,
  onTrimStartSecondsChange,
  onTrimEndSecondsChange,
  onClearVideoUploadResult,
  onClearVideoObjectDetectionResult,
  onCopyJson,
  onDownloadJson,
}: VideoUploadFoundationSectionProps) {
  const selectedVideoPreviewUrl = useMemo(
    () => (showUploadCard && selectedVideoFile ? URL.createObjectURL(selectedVideoFile) : null),
    [selectedVideoFile, showUploadCard],
  )

  const [downloadedAnnotatedVideoFilename, setDownloadedAnnotatedVideoFilename] = useState<string | null>(null)

  const isAnnotatedVideoDownloaded =
    downloadedAnnotatedVideoFilename === videoObjectDetectionResult?.annotated_video_filename

  useEffect(() => {
    return () => {
      if (selectedVideoPreviewUrl) {
        URL.revokeObjectURL(selectedVideoPreviewUrl)
      }
    }
  }, [selectedVideoPreviewUrl])

  return (
    <>
      {showUploadCard && (
        <section className="card">
        <p className="eyebrow">Video workspace</p>
        <h2>Or upload a video</h2>
        <p className="small-note">
          Add a video to preview, trim, extract frames, run detection, and prepare video analysis workflows.
        </p>

        <div className="file-picker-panel">
          <input
            id="video-upload-input"
            className="visually-hidden-file-input"
            type="file"
            accept="video/*"
            onChange={onVideoFileChange}
            disabled={isBusy}
          />

          <label
            className={isBusy ? 'file-picker-button disabled' : 'file-picker-button'}
            htmlFor="video-upload-input"
            aria-disabled={isBusy}
          >
            Choose video
          </label>

          <div className="file-picker-copy">
            <span>{selectedVideoFile ? 'Selected video' : 'No video selected yet'}</span>
            <strong>{selectedVideoFile ? selectedVideoFile.name : 'Choose a video to start'}</strong>
          </div>

          {selectedVideoPreviewUrl && (
            <video
              className="file-picker-preview-video"
              src={selectedVideoPreviewUrl}
              muted
              controls
            />
          )}
        </div>

        <div className="button-row">
          <button onClick={onVideoUpload} disabled={isBusy || !selectedVideoFile}>
            {isUploadingVideo ? 'Uploading video...' : 'Upload video'}
          </button>

          <button
            className="secondary-button"
            onClick={onDetectVideoObjects}
            disabled={isBusy || !videoUploadResult}
          >
            {isDetectingVideoObjects ? 'Detecting video objects...' : 'Detect video objects'}
          </button>
        </div>
        </section>
      )}

      {showWorkspacePanels && videoUploadResult && (
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
                  {isDeveloperMode ? 'Clear View' : 'Clear result'}
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

                  <div className={isDeveloperMode ? 'output-actions' : 'output-actions result-output-actions'}>
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

          <section className="card video-detection-controls-card">
            <p className="eyebrow">Video analysis controls</p>
            <h2>Video object detection settings</h2>
            <p className="small-note">
              These settings control Detect video objects for the uploaded video.
            </p>

            <div className="video-detection-controls-grid">
              <label>
                Confidence threshold: <strong>{confidenceThreshold}%</strong>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={confidenceThreshold}
                  onChange={(event) => onConfidenceThresholdChange(Number(event.target.value))}
                  disabled={isBusy}
                />
              </label>

              <label>
                Class filter
                <select
                  value={selectedClass}
                  onChange={(event) => onSelectedClassChange(event.target.value)}
                  disabled={isBusy || classOptions.length === 0}
                >
                  <option value="all">
                    {classOptions.length === 0
                      ? 'Run detection once to see detected classes'
                      : 'All detected classes'}
                  </option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
                {classOptions.length === 0 && (
                  <span className="small-note">
                    Class filtering becomes available after the first video object detection run.
                  </span>
                )}
              </label>
            </div>

            <div className="button-row">
              <button
                className="secondary-button"
                onClick={onDetectVideoObjects}
                disabled={isBusy || !videoUploadResult}
              >
                {isDetectingVideoObjects ? 'Detecting video objects...' : 'Detect video objects'}
              </button>

              <button
                className="secondary-button"
                onClick={() => {
                  onConfidenceThresholdChange(30)
                  onSelectedClassChange('all')
                }}
                disabled={isBusy || (confidenceThreshold === 30 && selectedClass === 'all')}
              >
                Reset detection settings
              </button>
            </div>
          </section>

          {videoObjectDetectionResult && (
            <section className="card">
              <p className="eyebrow">Video analysis</p>
              <h2>Video object detection</h2>
              <p className="small-note">
                Processed {videoObjectDetectionResult.processed_frame_count} video frame(s)
                across the uploaded video.
              </p>

              <div className="metadata-list">
                <p><strong>Detections:</strong> {videoObjectDetectionResult.detection_count}</p>
                <p>
                  <strong>Processing mode:</strong>{' '}
                  {videoObjectDetectionResult.interval_seconds < 0.1
                    ? 'Frame-level video detection'
                    : `Sampled every ${videoObjectDetectionResult.interval_seconds.toFixed(2)}s`}
                </p>
                <p><strong>Confidence threshold:</strong> {Math.round(videoObjectDetectionResult.confidence_threshold * 100)}%</p>
                <p><strong>Class filter:</strong> {videoObjectDetectionResult.class_filter ?? 'All classes'}</p>
              </div>

              <div className="generated-video-preview">
                <h3>Annotated video output</h3>
                <p className="small-note">
                  Bounding boxes are drawn on processed video frames where detections were available.
                </p>

                <video
                  className="preview-video"
                  src={`/api${videoObjectDetectionResult.annotated_video_file_url}`}
                  controls
                />

                <div className="output-actions result-output-actions">
                  <a
                    href={`/api${videoObjectDetectionResult.annotated_video_file_url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open annotated video
                  </a>
                  <a
                    href={`/api${videoObjectDetectionResult.annotated_video_file_url}`}
                    download={videoObjectDetectionResult.annotated_video_filename}
                    onClick={() => {
                      const downloadedFilename = videoObjectDetectionResult.annotated_video_filename
                      setDownloadedAnnotatedVideoFilename(downloadedFilename)

                      window.setTimeout(() => {
                        setDownloadedAnnotatedVideoFilename((currentFilename) =>
                          currentFilename === downloadedFilename ? null : currentFilename,
                        )
                      }, 2000)
                    }}
                  >
                    {isAnnotatedVideoDownloaded ? 'Downloaded!' : 'Download annotated video'}
                  </a>
                </div>
              </div>

              {videoObjectDetectionResult.class_summary.length > 0 ? (
                <>
                  <p className="small-note video-object-summary-note">
                    Object counts are based on frame-level YOLO detections. Low-confidence classes may include false positives.
                  </p>

                  <div className="video-object-summary-list">
                    {videoObjectDetectionResult.class_summary.map((item) => (
                      <div className="video-object-summary-item" key={item.class_name}>
                        <strong>{item.class_name}</strong>
                        <div className="video-object-summary-details">
                          <span>
                            Detected in {item.frame_count} of {videoObjectDetectionResult.processed_frame_count} processed frame(s)
                          </span>
                          <span>
                            {item.detection_count} total box(es) · highest confidence {Math.round(item.highest_confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="small-note">No objects matched the current detection settings.</p>
              )}

              <div className="output-actions result-output-actions">
                <button
                  className="secondary-button"
                  onClick={onClearVideoObjectDetectionResult}
                  disabled={isBusy}
                >
                  Clear video object detection
                </button>
              </div>
            </section>
          )}

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
