import type { RefObject } from 'react'

import type { UploadResponse } from '../../types/apiTypes'

type ImageUploadResultSectionProps = {
  uploadResult: UploadResponse | null
  uploadedImageUrl: string | null
  uploadResultRef: RefObject<HTMLElement | null>
  isBusy: boolean
  isDeveloperMode: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onClearUploadResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function ImageUploadResultSection({
  uploadResult,
  uploadedImageUrl,
  uploadResultRef,
  isBusy,
  isDeveloperMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onClearUploadResult,
  onCopyJson,
  onDownloadJson,
}: ImageUploadResultSectionProps) {
  if (!uploadResult) {
    return null
  }

  return (
    <section className="result-grid" ref={uploadResultRef}>
      <div className="card">
        <h2>Image workspace ready</h2>

        <div className={isDeveloperMode ? 'loaded-panel-actions' : 'loaded-panel-actions result-management-actions'}>
          {isDeveloperMode && (
            <>
              <button
                className="secondary-button"
            onClick={() =>
              void onCopyJson(
                {
                  source: 'image_upload_result',
                  copied_at: new Date().toISOString(),
                  original_filename: uploadResult.original_filename,
                  stored_filename: uploadResult.stored_filename,
                  content_type: uploadResult.content_type,
                  width: uploadResult.width,
                  height: uploadResult.height,
                  file_url: uploadResult.file_url,
                  result: uploadResult,
                },
                'image-upload-result-json',
                'Copied Image Upload Result JSON to clipboard.',
              )
            }
            disabled={isBusy || !uploadResult}
          >
            {copiedParserLogJsonKey === 'image-upload-result-json'
              ? 'Copied!'
              : failedParserLogJsonKey === 'image-upload-result-json'
                ? 'Copy failed'
                : 'Copy Image Upload Result JSON'}
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              onDownloadJson(
                {
                  source: 'image_upload_result',
                  downloaded_at: new Date().toISOString(),
                  original_filename: uploadResult.original_filename,
                  stored_filename: uploadResult.stored_filename,
                  content_type: uploadResult.content_type,
                  width: uploadResult.width,
                  height: uploadResult.height,
                  file_url: uploadResult.file_url,
                  result: uploadResult,
                },
                `image_upload_result_file-${uploadResult.original_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                'Downloaded Image Upload Result JSON.',
                'download-image-upload-result-json',
              )
            }
            disabled={isBusy || !uploadResult}
            data-testid="download-image-upload-result-json"
          >
            {downloadedParserLogJsonKey === 'download-image-upload-result-json'
              ? 'Downloaded!'
              : 'Download Image Upload Result JSON'}
          </button>

            </>
          )}

          <button
            className="secondary-button view-clear-button"
            onClick={onClearUploadResult}
            disabled={isBusy}
          >
            {isDeveloperMode ? 'Clear View' : 'Clear result'}
          </button>
        </div>

        <div className="metadata-list">
          {isDeveloperMode ? (
            <p><strong>Image:</strong> {uploadResult.original_filename}</p>
          ) : (
            <p><strong>Status:</strong> Ready for object detection and editing.</p>
          )}

          <p><strong>Size:</strong> {uploadResult.width}px × {uploadResult.height}px</p>

          {isDeveloperMode && (
            <>
              <p><strong>Stored filename:</strong> {uploadResult.stored_filename}</p>
              <p><strong>Content type:</strong> {uploadResult.content_type}</p>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Current image</h2>
        {uploadedImageUrl && (
          <>
            <img
              className="preview-image"
              src={uploadedImageUrl}
              alt={uploadResult.original_filename}
            />

            <div className={isDeveloperMode ? 'output-actions' : 'output-actions result-output-actions'}>
              <a href={uploadedImageUrl} target="_blank" rel="noreferrer">
                {isDeveloperMode ? 'Open original' : 'Open image'}
              </a>
              <a href={uploadedImageUrl} download={uploadResult.original_filename}>
                {isDeveloperMode ? 'Download original' : 'Download image'}
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
