type BeforeAfterComparisonSectionProps = {
  beforeImageUrl: string | null
  afterImageUrl: string | null
  afterLabel: string
  afterDescription: string
  afterFilename: string | null
}

export function BeforeAfterComparisonSection({
  beforeImageUrl,
  afterImageUrl,
  afterLabel,
  afterDescription,
  afterFilename,
}: BeforeAfterComparisonSectionProps) {
  if (!beforeImageUrl || !afterImageUrl) {
    return null
  }

  return (
    <section className="card before-after-comparison-panel" aria-label="Before and after comparison">
      <div className="before-after-comparison-header">
        <div>
          <p className="eyebrow">Image review</p>
          <h2>Before and after comparison</h2>
          <p className="small-note">
            Compare the current source image with the latest generated image result.
          </p>
        </div>

        <span className="before-after-comparison-badge">{afterLabel}</span>
      </div>

      <div className="before-after-comparison-grid">
        <div className="before-after-comparison-item">
          <div className="before-after-comparison-title">
            <strong>Before</strong>
            <span>Current source image</span>
          </div>

          <img
            className="before-after-comparison-image"
            src={beforeImageUrl}
            alt="Before comparison source"
          />

          <a href={beforeImageUrl} target="_blank" rel="noreferrer">
            Open before
          </a>
        </div>

        <div className="before-after-comparison-item">
          <div className="before-after-comparison-title">
            <strong>After</strong>
            <span>{afterDescription}</span>
          </div>

          <img
            className="before-after-comparison-image"
            src={afterImageUrl}
            alt={`${afterLabel} comparison result`}
          />

          <div className="before-after-comparison-actions">
            <a href={afterImageUrl} target="_blank" rel="noreferrer">
              Open after
            </a>

            {afterFilename && (
              <a href={afterImageUrl} download={afterFilename}>
                Download after
              </a>
            )}
          </div>
        </div>
      </div>

      <p className="before-after-comparison-note">
        This visual comparison helps review generated outputs. It does not judge image correctness automatically.
      </p>
    </section>
  )
}
