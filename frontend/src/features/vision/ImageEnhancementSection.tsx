import type { EnhanceResponse } from '../../types/apiTypes'

export type ImageEnhancementValues = {
  brightness: number
  contrast: number
  saturation: number
  sharpness: number
}

type ImageEnhancementSectionProps = {
  activeImageUrl: string | null
  activeImageLabel: string
  enhanceResult: EnhanceResponse | null
  enhancedImageUrl: string | null
  isBusy: boolean
  isEnhancing: boolean
  isApplied: boolean
  onApplyEnhancement: (values: ImageEnhancementValues) => Promise<void>
  onClearEnhancement: () => void
}

const defaultEnhancementValues: ImageEnhancementValues = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  sharpness: 1,
}

export function ImageEnhancementSection({
  activeImageUrl,
  activeImageLabel,
  enhanceResult,
  enhancedImageUrl,
  isBusy,
  isEnhancing,
  isApplied,
  onApplyEnhancement,
  onClearEnhancement,
}: ImageEnhancementSectionProps) {
  if (!activeImageUrl) {
    return null
  }

  return (
    <section className="card image-enhancement-panel" aria-label="Basic image enhancement controls">
      <div className="image-enhancement-header">
        <div>
          <p className="eyebrow">Image editing</p>
          <h2>Basic image enhancement</h2>
          <p className="small-note">
            Apply lightweight brightness, contrast, saturation, and sharpness adjustments to the active image.
          </p>
        </div>

        <span className="image-enhancement-source">{activeImageLabel}</span>
      </div>

      <ImageEnhancementControls
        isBusy={isBusy}
        isEnhancing={isEnhancing}
        isApplied={isApplied}
        onApplyEnhancement={onApplyEnhancement}
      />

      {enhanceResult && enhancedImageUrl && (
        <div className="image-enhancement-preview">
          <div>
            <h3>Enhanced image ready</h3>
            <p>
              Brightness {enhanceResult.adjustments.brightness.toFixed(2)} · Contrast{' '}
              {enhanceResult.adjustments.contrast.toFixed(2)} · Saturation{' '}
              {enhanceResult.adjustments.saturation.toFixed(2)} · Sharpness{' '}
              {enhanceResult.adjustments.sharpness.toFixed(2)}
            </p>
          </div>

          <img
            className="preview-image"
            src={enhancedImageUrl}
            alt="Enhanced image output"
          />

          <div className="output-actions result-output-actions">
            <a href={enhancedImageUrl} target="_blank" rel="noreferrer">
              Open enhanced
            </a>
            <a href={enhancedImageUrl} download={enhanceResult.enhanced_filename}>
              Download enhanced
            </a>
            <button
              className="secondary-button view-clear-button"
              type="button"
              onClick={onClearEnhancement}
              disabled={isBusy}
            >
              Clear result
            </button>
          </div>
        </div>
      )}

      <p className="image-enhancement-note">
        These edits are basic image processing adjustments. They do not add new visual information or perform generative editing.
      </p>
    </section>
  )
}

function ImageEnhancementControls({
  isBusy,
  isEnhancing,
  isApplied,
  onApplyEnhancement,
}: {
  isBusy: boolean
  isEnhancing: boolean
  isApplied: boolean
  onApplyEnhancement: (values: ImageEnhancementValues) => Promise<void>
}) {
  const values = defaultEnhancementValues

  return (
    <div className="image-enhancement-controls">
      <div className="image-enhancement-preset-grid">
        <button
          className="secondary-button"
          type="button"
          disabled={isBusy || isEnhancing}
          onClick={() =>
            void onApplyEnhancement({
              ...values,
              brightness: 1.12,
              contrast: 1.12,
            })
          }
        >
          {isEnhancing ? 'Applying...' : isApplied ? 'Applied!' : 'Improve brightness and contrast'}
        </button>

        <button
          className="secondary-button"
          type="button"
          disabled={isBusy || isEnhancing}
          onClick={() =>
            void onApplyEnhancement({
              ...values,
              saturation: 1.12,
            })
          }
        >
          Improve saturation
        </button>

        <button
          className="secondary-button"
          type="button"
          disabled={isBusy || isEnhancing}
          onClick={() =>
            void onApplyEnhancement({
              ...values,
              sharpness: 1.45,
            })
          }
        >
          Sharpen image
        </button>

        <button
          className="primary-button"
          type="button"
          disabled={isBusy || isEnhancing}
          onClick={() =>
            void onApplyEnhancement({
              brightness: 1.1,
              contrast: 1.12,
              saturation: 1.08,
              sharpness: 1.35,
            })
          }
        >
          Auto enhance
        </button>
      </div>
    </div>
  )
}
