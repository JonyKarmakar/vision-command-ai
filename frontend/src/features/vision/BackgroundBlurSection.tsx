import type { BackgroundBlurResponse } from '../../types/apiTypes'

export type BackgroundBlurValues = {
  class_name: string | null
  confidence_threshold: number
  padding_ratio: number
  blur_radius: number
}

type BackgroundBlurSectionProps = {
  activeImageUrl: string | null
  activeImageLabel: string
  backgroundBlurResult: BackgroundBlurResponse | null
  backgroundBlurredImageUrl: string | null
  isBusy: boolean
  isBackgroundBlurring: boolean
  isApplied: boolean
  onApplyBackgroundBlur: (values: BackgroundBlurValues) => Promise<void>
  onClearBackgroundBlur: () => void
}

const defaultBackgroundBlurValues: BackgroundBlurValues = {
  class_name: null,
  confidence_threshold: 0.25,
  padding_ratio: 0.04,
  blur_radius: 18,
}

export function BackgroundBlurSection({
  activeImageUrl,
  activeImageLabel,
  backgroundBlurResult,
  backgroundBlurredImageUrl,
  isBusy,
  isBackgroundBlurring,
  isApplied,
  onApplyBackgroundBlur,
  onClearBackgroundBlur,
}: BackgroundBlurSectionProps) {
  if (!activeImageUrl) {
    return null
  }

  return (
    <section className="card background-blur-panel" aria-label="Detection-box background blur controls">
      <div className="background-blur-header">
        <div>
          <p className="eyebrow">Image editing</p>
          <h2>Background blur</h2>
          <p className="small-note">
            Blur the background while keeping detected object boxes sharp. This uses detection boxes only, not segmentation.
          </p>
        </div>

        <span className="background-blur-source">{activeImageLabel}</span>
      </div>

      <div className="background-blur-actions">
        <button
          className="primary-button"
          type="button"
          disabled={isBusy || isBackgroundBlurring}
          onClick={() => void onApplyBackgroundBlur(defaultBackgroundBlurValues)}
        >
          {isBackgroundBlurring ? 'Blurring...' : isApplied ? 'Applied!' : 'Blur background around objects'}
        </button>

        <button
          className="secondary-button"
          type="button"
          disabled={isBusy || isBackgroundBlurring}
          onClick={() =>
            void onApplyBackgroundBlur({
              ...defaultBackgroundBlurValues,
              class_name: 'person',
            })
          }
        >
          Keep people sharp
        </button>

        <button
          className="secondary-button"
          type="button"
          disabled={isBusy || isBackgroundBlurring}
          onClick={() =>
            void onApplyBackgroundBlur({
              ...defaultBackgroundBlurValues,
              blur_radius: 28,
            })
          }
        >
          Stronger background blur
        </button>
      </div>

      {backgroundBlurResult && backgroundBlurredImageUrl && (
        <div className="background-blur-preview">
          <div>
            <h3>Background blur ready</h3>
            <p>
              Preserved {backgroundBlurResult.detection_count} detected object box
              {backgroundBlurResult.detection_count === 1 ? '' : 'es'} · Blur radius{' '}
              {backgroundBlurResult.blur_radius.toFixed(0)}
            </p>
          </div>

          <img
            className="preview-image"
            src={backgroundBlurredImageUrl}
            alt="Background blur output"
          />

          <div className="output-actions result-output-actions">
            <a href={backgroundBlurredImageUrl} target="_blank" rel="noreferrer">
              Open background blur
            </a>
            <a
              href={backgroundBlurredImageUrl}
              download={backgroundBlurResult.background_blurred_filename}
            >
              Download background blur
            </a>
            <button
              className="secondary-button view-clear-button"
              type="button"
              onClick={onClearBackgroundBlur}
              disabled={isBusy}
            >
              Clear result
            </button>
          </div>
        </div>
      )}

      <p className="background-blur-note">
        This is a rectangular detection-box effect. Edges will not be as precise as segmentation-based background blur.
      </p>
    </section>
  )
}
