import type { RefObject } from 'react'

import type { BlurResponse } from '../../types/apiTypes'

type BlurResultSectionProps = {
  blurResult: BlurResponse | null
  blurResultRef: RefObject<HTMLElement | null>
  blurredImageUrl: string | null
  isBusy: boolean
  isDeveloperMode: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onClearBlurResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function BlurResultSection({
  blurResult,
  blurResultRef,
  blurredImageUrl,
  isBusy,
  isDeveloperMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onClearBlurResult,
  onCopyJson,
  onDownloadJson,
}: BlurResultSectionProps) {
  if (!blurResult) {
    return null
  }

  return (
    <section className="result-grid" ref={blurResultRef}>
      <div className="card">
        <h2>Privacy edit ready</h2>

        <div className="loaded-panel-actions">
          {isDeveloperMode && (
            <>
              <button
                className="secondary-button"
            onClick={() =>
              void onCopyJson(
                {
                  source: 'blur_result',
                  copied_at: new Date().toISOString(),
                  blurred_filename: blurResult.blurred_filename,
                  blur_box: blurResult.blur_box,
                  result: blurResult,
                },
                'blur-result-json',
                'Copied Blur Result JSON to clipboard.',
              )
            }
            disabled={isBusy || !blurResult}
          >
            {copiedParserLogJsonKey === 'blur-result-json'
              ? 'Copied!'
              : failedParserLogJsonKey === 'blur-result-json'
                ? 'Copy failed'
                : 'Copy Blur Result JSON'}
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              onDownloadJson(
                {
                  source: 'blur_result',
                  downloaded_at: new Date().toISOString(),
                  blurred_filename: blurResult.blurred_filename,
                  blur_box: blurResult.blur_box,
                  result: blurResult,
                },
                `blur_result_file-${blurResult.blurred_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                'Downloaded Blur Result JSON.',
                'download-blur-result-json',
              )
            }
            disabled={isBusy || !blurResult}
            data-testid="download-blur-result-json"
          >
            {downloadedParserLogJsonKey === 'download-blur-result-json'
              ? 'Downloaded!'
              : 'Download Blur Result JSON'}
          </button>

            </>
          )}

          <button
            className="secondary-button view-clear-button"
            onClick={onClearBlurResult}
            disabled={isBusy}
          >
            Clear View
          </button>
        </div>

        <div className="summary-box">
          <p><strong>Privacy edit:</strong> blur applied to the selected region.</p>

          {isDeveloperMode && (
            <>
              <p><strong>Blurred filename:</strong> {blurResult.blurred_filename}</p>
              <p>
                <strong>Blur box:</strong> x1 {blurResult.blur_box.x1}, y1 {blurResult.blur_box.y1}, x2 {blurResult.blur_box.x2}, y2 {blurResult.blur_box.y2}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Blurred preview</h2>
        {blurredImageUrl && blurResult && (
          <>
            <img
              className="preview-image"
              src={blurredImageUrl}
              alt="Blurred object output"
            />

            <div className="output-actions">
              <a href={blurredImageUrl} target="_blank" rel="noreferrer">
                Open blurred
              </a>
              <a href={blurredImageUrl} download={blurResult.blurred_filename}>
                Download blurred
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
