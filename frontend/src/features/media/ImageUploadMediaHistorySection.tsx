import { useEffect, useMemo } from 'react'
import type { ChangeEvent } from 'react'

import type { MediaFileLog, UploadResponse } from '../../types/apiTypes'

type ImageUploadMediaHistorySectionProps = {
  selectedFile: File | null
  uploadResult: UploadResponse | null
  mediaFiles: MediaFileLog[]
  isBusy: boolean
  isUploading: boolean
  isDetecting: boolean
  isLoadingMediaFiles: boolean
  error: string | null
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onUpload: () => void
  onDetection: () => void
  onLoadMediaFiles: () => void
  onClearMediaHistory: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
  onUseMediaFile: (mediaFile: MediaFileLog) => void
}

export function ImageUploadMediaHistorySection({
  selectedFile,
  uploadResult,
  mediaFiles,
  isBusy,
  isUploading,
  isDetecting,
  isLoadingMediaFiles,
  error,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onFileChange,
  onUpload,
  onDetection,
  onLoadMediaFiles,
  onClearMediaHistory,
  onCopyJson,
  onDownloadJson,
  onUseMediaFile,
}: ImageUploadMediaHistorySectionProps) {
  const selectedImagePreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  )

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl)
      }
    }
  }, [selectedImagePreviewUrl])

  return (
    <>
      <section className="card">
        <p className="eyebrow">Start workspace</p>
        <h2>Upload an image</h2>
        <p className="small-note">
          Start with an image, then ask VisionCommand AI to detect, edit, zoom, blur, crop, or inspect it.
        </p>

        <div className="file-picker-panel">
          <input
            id="image-upload-input"
            className="visually-hidden-file-input"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={isBusy}
          />

          <label
            className={isBusy ? 'file-picker-button disabled' : 'file-picker-button'}
            htmlFor="image-upload-input"
            aria-disabled={isBusy}
          >
            Choose image
          </label>

          <div className="file-picker-copy">
            <span>{selectedFile ? 'Selected image' : 'No image selected yet'}</span>
            <strong>{selectedFile ? selectedFile.name : 'Choose an image to start'}</strong>
          </div>

          {selectedImagePreviewUrl && (
            <img
              className="file-picker-preview-image"
              src={selectedImagePreviewUrl}
              alt={`Selected preview for ${selectedFile?.name ?? 'image'}`}
            />
          )}
        </div>

        <div className="button-row">
          <button onClick={onUpload} disabled={isBusy || !selectedFile}>
            {isUploading ? 'Uploading...' : 'Upload image'}
          </button>

          <button
            className="secondary-button"
            onClick={onDetection}
            disabled={!uploadResult || isBusy}
          >
            {isDetecting ? 'Detecting...' : 'Detect objects'}
          </button>
        </div>

        <div className="button-row media-history-actions">
          <button
            className="secondary-button"
            onClick={onLoadMediaFiles}
            disabled={isBusy}
          >
            {isLoadingMediaFiles ? 'Loading media history...' : 'Load recent uploads'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      {mediaFiles.length > 0 && (
        <section className="card media-history">
          <div className="view-panel-header">
            <h2>Uploaded Media History</h2>
            <button
              className="secondary-button view-clear-button"
              onClick={onClearMediaHistory}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <div className="loaded-panel-actions">
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'uploaded_media_history',
                    copied_at: new Date().toISOString(),
                    media_count: mediaFiles.length,
                    items: mediaFiles.map((mediaFile) => ({
                      original_filename: mediaFile.original_filename,
                      stored_filename: mediaFile.stored_filename,
                      content_type: mediaFile.content_type,
                      width: mediaFile.width,
                      height: mediaFile.height,
                      created_at: mediaFile.created_at,
                      file_url: mediaFile.file_url,
                      media_url: `/api${mediaFile.file_url}`,
                      media_file: mediaFile,
                    })),
                  },
                  'uploaded-media-history-json',
                  'Copied Uploaded Media History JSON to clipboard.',
                )
              }
              disabled={isBusy || mediaFiles.length === 0}
            >
              {copiedParserLogJsonKey === 'uploaded-media-history-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'uploaded-media-history-json'
                  ? 'Copy failed'
                  : 'Copy Uploaded Media History JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'uploaded_media_history',
                    downloaded_at: new Date().toISOString(),
                    media_count: mediaFiles.length,
                    items: mediaFiles.map((mediaFile) => ({
                      original_filename: mediaFile.original_filename,
                      stored_filename: mediaFile.stored_filename,
                      content_type: mediaFile.content_type,
                      width: mediaFile.width,
                      height: mediaFile.height,
                      created_at: mediaFile.created_at,
                      file_url: mediaFile.file_url,
                      media_url: `/api${mediaFile.file_url}`,
                      media_file: mediaFile,
                    })),
                  },
                  `uploaded_media_history_count-${mediaFiles.length}.json`,
                  'Downloaded Uploaded Media History JSON.',
                  'download-uploaded-media-history-json',
                )
              }
              disabled={isBusy || mediaFiles.length === 0}
              data-testid="download-uploaded-media-history-json"
            >
              {downloadedParserLogJsonKey === 'download-uploaded-media-history-json'
                ? 'Downloaded!'
                : 'Download Uploaded Media History JSON'}
            </button>
          </div>

          {mediaFiles.map((mediaFile) => {
            const mediaUrl = `/api${mediaFile.file_url}`

            return (
              <div className="media-log-item" key={mediaFile.stored_filename}>
                <div>
                  <strong>{mediaFile.original_filename}</strong>
                  <p>{new Date(mediaFile.created_at).toLocaleString()}</p>
                  <p>
                    {mediaFile.width}px × {mediaFile.height}px · {mediaFile.content_type}
                  </p>
                  <p className="stored-name">{mediaFile.stored_filename}</p>
                </div>

                <div className="output-actions">
                  <button
                    className="history-use-button"
                    onClick={() => onUseMediaFile(mediaFile)}
                    disabled={isBusy}
                  >
                    Use this image
                  </button>

                  <a href={mediaUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                  <a href={mediaUrl} download={mediaFile.original_filename}>
                    Download
                  </a>
                </div>
              </div>
            )
          })}
        </section>
      )}
    </>
  )
}
