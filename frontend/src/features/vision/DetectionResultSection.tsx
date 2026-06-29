import type { RefObject } from 'react'

import type { Detection, DetectionResponse } from '../../types/apiTypes'

type DetectionResultSectionProps = {
  detectionResult: DetectionResponse | null
  detectionResultRef: RefObject<HTMLHeadingElement | null>
  annotatedImageUrl: string | null
  filteredDetections: Detection[]
  availableClasses: string[]
  confidenceThreshold: number
  selectedClass: string
  filtersChangedAfterDetection: boolean
  isBusy: boolean
  isCropping: boolean
  isBlurring: boolean
  isDeveloperMode: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onConfidenceThresholdChange: (value: number) => void
  onSelectedClassChange: (value: string) => void
  onCropByClass: () => void | Promise<void>
  onCropDetection: (detection: Detection) => void | Promise<void>
  onBlurDetection: (detection: Detection) => void | Promise<void>
  onClearDetectionResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function DetectionResultSection({
  detectionResult,
  detectionResultRef,
  annotatedImageUrl,
  filteredDetections,
  availableClasses,
  confidenceThreshold,
  selectedClass,
  filtersChangedAfterDetection,
  isBusy,
  isCropping,
  isBlurring,
  isDeveloperMode,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onConfidenceThresholdChange,
  onSelectedClassChange,
  onCropByClass,
  onCropDetection,
  onBlurDetection,
  onClearDetectionResult,
  onCopyJson,
  onDownloadJson,
}: DetectionResultSectionProps) {
  if (!detectionResult) {
    return null
  }

  return (
    <section className="result-grid">
      <div className="card">
        <h2 ref={detectionResultRef}>Detected objects</h2>

        <div className={isDeveloperMode ? 'loaded-panel-actions' : 'loaded-panel-actions result-management-actions'}>
          {isDeveloperMode && (
            <>
              <button
                className="secondary-button"
            onClick={() =>
              void onCopyJson(
                {
                  source: 'image_detection_result',
                  copied_at: new Date().toISOString(),
                  confidence_threshold: confidenceThreshold,
                  selected_class: selectedClass,
                  visible_detection_count: filteredDetections.length,
                  total_detection_count: detectionResult.detection_count,
                  annotated_filename: detectionResult.annotated_filename,
                  result: detectionResult,
                  visible_detections: filteredDetections,
                },
                'detection-result-json',
                'Copied Detection Result JSON to clipboard.',
              )
            }
            disabled={isBusy || !detectionResult}
          >
            {copiedParserLogJsonKey === 'detection-result-json'
              ? 'Copied!'
              : failedParserLogJsonKey === 'detection-result-json'
                ? 'Copy failed'
                : 'Copy Detection Result JSON'}
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              onDownloadJson(
                {
                  source: 'image_detection_result',
                  downloaded_at: new Date().toISOString(),
                  confidence_threshold: confidenceThreshold,
                  selected_class: selectedClass,
                  visible_detection_count: filteredDetections.length,
                  total_detection_count: detectionResult.detection_count,
                  annotated_filename: detectionResult.annotated_filename,
                  result: detectionResult,
                  visible_detections: filteredDetections,
                },
                `detection_result_count-${detectionResult.detection_count}_visible-${filteredDetections.length}_class-${selectedClass.replace(/[^a-z0-9]+/gi, '-')}.json`,
                'Downloaded Detection Result JSON.',
                'download-detection-result-json',
              )
            }
            disabled={isBusy || !detectionResult}
            data-testid="download-detection-result-json"
          >
            {downloadedParserLogJsonKey === 'download-detection-result-json'
              ? 'Downloaded!'
              : 'Download Detection Result JSON'}
          </button>

            </>
          )}

          <button
            className="secondary-button view-clear-button"
            onClick={onClearDetectionResult}
            disabled={isBusy}
          >
            {isDeveloperMode ? 'Clear View' : 'Clear result'}
          </button>
        </div>

        <div className="summary-box">
          <p><strong>Total detections:</strong> {detectionResult.detection_count}</p>
          <p><strong>Visible after filter:</strong> {filteredDetections.length}</p>

          {isDeveloperMode && (
            <p><strong>Annotated filename:</strong> {detectionResult.annotated_filename}</p>
          )}
        </div>

        <div className="filter-box">
          <label htmlFor="confidence-threshold">
            Confidence threshold: <strong>{confidenceThreshold}%</strong>
          </label>
          <input
            id="confidence-threshold"
            type="range"
            min="0"
            max="100"
            step="5"
            value={confidenceThreshold}
            onChange={(event) => onConfidenceThresholdChange(Number(event.target.value))}
          />
          <div className="filter-hints">
            <span>Show more</span>
            <span>Show stronger detections</span>
          </div>

          {filtersChangedAfterDetection && (
            <p className="rerun-hint">
              Filter changed. Detect objects again to update the annotated image.
            </p>
          )}
        </div>

        <div className="filter-box">
          <label htmlFor="class-filter">
            Class filter
          </label>
          <select
            id="class-filter"
            value={selectedClass}
            onChange={(event) => onSelectedClassChange(event.target.value)}
          >
            <option value="all">All classes</option>
            {availableClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>

          <button
            className="class-crop-button"
            onClick={() => void onCropByClass()}
            disabled={isBusy || selectedClass === 'all'}
          >
            {isCropping
              ? 'Cropping...'
              : isDeveloperMode
                ? 'Crop best selected class'
                : 'Crop selected class'}
          </button>

          {selectedClass === 'all' && (
            <p className="small-note">
              Select a specific class to crop the best object of that class.
            </p>
          )}
        </div>

        {filteredDetections.length > 0 ? (
          <div className="detections-list">
            {filteredDetections.map((detection, index) => (
              <div className="detection-item" key={`${detection.class_name}-${index}`}>
                <div className="detection-header">
                  <strong>{index + 1}. {detection.class_name}</strong>
                  <span className="confidence-badge">
                    {(detection.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                {isDeveloperMode && (
                  <span>
                    Box: x1 {detection.bbox.x1}, y1 {detection.bbox.y1}, x2 {detection.bbox.x2}, y2 {detection.bbox.y2}
                  </span>
                )}
                <div className="detection-actions result-item-actions">
                  <button
                    className="crop-button"
                    onClick={() => void onCropDetection(detection)}
                    disabled={isBusy}
                  >
                    {isCropping
                      ? 'Cropping...'
                      : isDeveloperMode
                        ? 'Crop this object'
                        : 'Crop object'}
                  </button>

                  <button
                    className="blur-button"
                    onClick={() => void onBlurDetection(detection)}
                    disabled={isBusy}
                  >
                    {isBlurring
                      ? 'Blurring...'
                      : isDeveloperMode
                        ? 'Blur this object'
                        : 'Blur object'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No detections match the selected confidence threshold and class filter.</p>
        )}
      </div>

      <div className="card">
        <h2>Detection preview</h2>
        <p className="small-note">
          This preview shows the detected objects using the selected confidence threshold and class filter.
        </p>
        {annotatedImageUrl && detectionResult && (
          <>
            <img
              className="preview-image"
              src={annotatedImageUrl}
              alt="YOLO annotated output"
            />

            <div className={isDeveloperMode ? 'output-actions' : 'output-actions result-output-actions'}>
              <a href={annotatedImageUrl} target="_blank" rel="noreferrer">
                {isDeveloperMode ? 'Open annotated' : 'Open detection preview'}
              </a>
              <a href={annotatedImageUrl} download={detectionResult.annotated_filename}>
                {isDeveloperMode ? 'Download annotated' : 'Download detection preview'}
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
