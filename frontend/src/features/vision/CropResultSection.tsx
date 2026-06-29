import type { RefObject } from 'react'

import type { CropResponse } from '../../types/apiTypes'

type CropResultSectionProps = {
  cropResult: CropResponse | null
  cropResultRef: RefObject<HTMLElement | null>
  croppedImageUrl: string | null
  isBusy: boolean
  isDeveloperMode: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onClearCropResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function CropResultSection({
  cropResult,
  cropResultRef,
  croppedImageUrl,
  isBusy,
  isDeveloperMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onClearCropResult,
  onCopyJson,
  onDownloadJson,
}: CropResultSectionProps) {
  if (!cropResult) {
    return null
  }

  return (
    <section className="result-grid" ref={cropResultRef}>
      <div className="card">
        <h2>Cropped image ready</h2>

        <div className="loaded-panel-actions">
          {isDeveloperMode && (
            <>
              <button
                className="secondary-button"
            onClick={() =>
              void onCopyJson(
                {
                  source: 'crop_result',
                  copied_at: new Date().toISOString(),
                  class_name: cropResult.class_name ?? null,
                  cropped_filename: cropResult.cropped_filename,
                  crop_box: cropResult.crop_box,
                  selected_detection: cropResult.selected_detection ?? null,
                  result: cropResult,
                },
                'crop-result-json',
                'Copied Crop Result JSON to clipboard.',
              )
            }
            disabled={isBusy || !cropResult}
          >
            {copiedParserLogJsonKey === 'crop-result-json'
              ? 'Copied!'
              : failedParserLogJsonKey === 'crop-result-json'
                ? 'Copy failed'
                : 'Copy Crop Result JSON'}
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              onDownloadJson(
                {
                  source: 'crop_result',
                  downloaded_at: new Date().toISOString(),
                  class_name: cropResult.class_name ?? null,
                  cropped_filename: cropResult.cropped_filename,
                  crop_box: cropResult.crop_box,
                  selected_detection: cropResult.selected_detection ?? null,
                  result: cropResult,
                },
                `crop_result_class-${(cropResult.class_name ?? 'manual').replace(/[^a-z0-9]+/gi, '-')}_file-${cropResult.cropped_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                'Downloaded Crop Result JSON.',
                'download-crop-result-json',
              )
            }
            disabled={isBusy || !cropResult}
            data-testid="download-crop-result-json"
          >
            {downloadedParserLogJsonKey === 'download-crop-result-json'
              ? 'Downloaded!'
              : 'Download Crop Result JSON'}
          </button>

            </>
          )}

          <button
            className="secondary-button view-clear-button"
            onClick={onClearCropResult}
            disabled={isBusy}
          >
            Clear View
          </button>
        </div>

        <div className="summary-box">
          <p>
            <strong>Crop:</strong>{' '}
            {cropResult.class_name
              ? `focused on ${cropResult.class_name}`
              : 'created from the selected region'}
          </p>

          {cropResult.selected_detection && (
            <p>
              <strong>Selected confidence:</strong> {(cropResult.selected_detection.confidence * 100).toFixed(1)}%
            </p>
          )}

          {isDeveloperMode && (
            <>
              <p><strong>Cropped filename:</strong> {cropResult.cropped_filename}</p>
              <p>
                <strong>Crop box:</strong> x1 {cropResult.crop_box.x1}, y1 {cropResult.crop_box.y1}, x2 {cropResult.crop_box.x2}, y2 {cropResult.crop_box.y2}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Cropped preview</h2>
        {croppedImageUrl && cropResult && (
          <>
            <img
              className="preview-image"
              src={croppedImageUrl}
              alt="Cropped object output"
            />

            <div className="output-actions">
              <a href={croppedImageUrl} target="_blank" rel="noreferrer">
                Open crop
              </a>
              <a href={croppedImageUrl} download={cropResult.cropped_filename}>
                Download crop
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
