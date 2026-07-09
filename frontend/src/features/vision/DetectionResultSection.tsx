import { useEffect, useState, type CSSProperties, type RefObject } from 'react'

import type { Detection, DetectionResponse } from '../../types/apiTypes'

type ObjectInventoryItem = {
  className: string
  count: number
  highestConfidence: number
  averageConfidence: number
}

type ObjectCropImageSize = {
  imageUrl: string
  width: number
  height: number
}

type SpatialDetectionSummaryItem = {
  detection: Detection
  index: number
  horizontalRegion: 'left' | 'center' | 'right'
  verticalRegion: 'top' | 'middle' | 'bottom'
  regionLabel: string
  areaPercentage: number
}

const horizontalSpatialRegions = ['left', 'center', 'right'] as const
const verticalSpatialRegions = ['top', 'middle', 'bottom'] as const

const getHorizontalSpatialRegion = (centerRatio: number): SpatialDetectionSummaryItem['horizontalRegion'] => {
  if (centerRatio < 1 / 3) {
    return 'left'
  }

  if (centerRatio > 2 / 3) {
    return 'right'
  }

  return 'center'
}

const getVerticalSpatialRegion = (centerRatio: number): SpatialDetectionSummaryItem['verticalRegion'] => {
  if (centerRatio < 1 / 3) {
    return 'top'
  }

  if (centerRatio > 2 / 3) {
    return 'bottom'
  }

  return 'middle'
}

const getSpatialRegionLabel = (
  verticalRegion: SpatialDetectionSummaryItem['verticalRegion'],
  horizontalRegion: SpatialDetectionSummaryItem['horizontalRegion'],
) => {
  if (verticalRegion === 'middle' && horizontalRegion === 'center') {
    return 'center'
  }

  return `${verticalRegion} ${horizontalRegion}`
}

const getSpatialDetectionSummaryItems = (
  detections: Detection[],
  imageSize: ObjectCropImageSize,
): SpatialDetectionSummaryItem[] => {
  const imageArea = Math.max(1, imageSize.width * imageSize.height)

  return detections.map((detection, index) => {
    const boxWidth = Math.max(1, detection.bbox.x2 - detection.bbox.x1)
    const boxHeight = Math.max(1, detection.bbox.y2 - detection.bbox.y1)
    const centerXRatio = ((detection.bbox.x1 + detection.bbox.x2) / 2) / imageSize.width
    const centerYRatio = ((detection.bbox.y1 + detection.bbox.y2) / 2) / imageSize.height
    const horizontalRegion = getHorizontalSpatialRegion(centerXRatio)
    const verticalRegion = getVerticalSpatialRegion(centerYRatio)

    return {
      detection,
      index,
      horizontalRegion,
      verticalRegion,
      regionLabel: getSpatialRegionLabel(verticalRegion, horizontalRegion),
      areaPercentage: (boxWidth * boxHeight * 100) / imageArea,
    }
  })
}

const getObjectCropPreviewStyle = (
  detection: Detection,
  imageSize: ObjectCropImageSize,
): CSSProperties => {
  const cropWidth = Math.max(1, detection.bbox.x2 - detection.bbox.x1)
  const cropHeight = Math.max(1, detection.bbox.y2 - detection.bbox.y1)

  return {
    width: `${(imageSize.width / cropWidth) * 100}%`,
    height: `${(imageSize.height / cropHeight) * 100}%`,
    transform: `translate(-${(detection.bbox.x1 / imageSize.width) * 100}%, -${(detection.bbox.y1 / imageSize.height) * 100}%)`,
  }
}

const getObjectCropPreviewAspectRatio = (detection: Detection) => {
  const cropWidth = Math.max(1, detection.bbox.x2 - detection.bbox.x1)
  const cropHeight = Math.max(1, detection.bbox.y2 - detection.bbox.y1)

  return `${cropWidth} / ${cropHeight}`
}

type DetectionResultSectionProps = {
  detectionResult: DetectionResponse | null
  detectionResultRef: RefObject<HTMLHeadingElement | null>
  annotatedImageUrl: string | null
  objectCropImageUrl: string | null
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
  objectCropImageUrl,
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
  const [objectCropImageSize, setObjectCropImageSize] = useState<ObjectCropImageSize | null>(null)

  useEffect(() => {
    if (!objectCropImageUrl) {
      return undefined
    }

    const image = new Image()

    image.onload = () => {
      setObjectCropImageSize({
        imageUrl: objectCropImageUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      setObjectCropImageSize((currentSize) =>
        currentSize?.imageUrl === objectCropImageUrl ? null : currentSize,
      )
    }

    image.src = objectCropImageUrl

    return () => {
      image.onload = null
      image.onerror = null
    }
  }, [objectCropImageUrl])

  const loadedObjectCropImageSize =
    objectCropImageSize?.imageUrl === objectCropImageUrl ? objectCropImageSize : null

  if (!detectionResult) {
    return null
  }

  const objectInventory = Object.values(
    filteredDetections.reduce<Record<string, ObjectInventoryItem>>((inventory, detection) => {
      const className = detection.class_name
      const confidence = detection.confidence
      const currentItem = inventory[className]

      if (!currentItem) {
        inventory[className] = {
          className,
          count: 1,
          highestConfidence: confidence,
          averageConfidence: confidence,
        }

        return inventory
      }

      const nextCount = currentItem.count + 1

      inventory[className] = {
        ...currentItem,
        count: nextCount,
        highestConfidence: Math.max(currentItem.highestConfidence, confidence),
        averageConfidence: (
          (currentItem.averageConfidence * currentItem.count) + confidence
        ) / nextCount,
      }

      return inventory
    }, {}),
  ).sort((leftItem, rightItem) => (
    rightItem.count - leftItem.count ||
    rightItem.highestConfidence - leftItem.highestConfidence ||
    leftItem.className.localeCompare(rightItem.className)
  ))

  const visibleClassCount = objectInventory.length

  const spatialDetectionItems = loadedObjectCropImageSize
    ? getSpatialDetectionSummaryItems(filteredDetections, loadedObjectCropImageSize)
    : []

  const spatialRegionCount = new Set(
    spatialDetectionItems.map((item) => item.regionLabel),
  ).size

  const largestSpatialDetection = spatialDetectionItems.reduce<SpatialDetectionSummaryItem | null>(
    (largestItem, item) =>
      !largestItem || item.areaPercentage > largestItem.areaPercentage ? item : largestItem,
    null,
  )

  const mostConfidentSpatialDetection = spatialDetectionItems.reduce<SpatialDetectionSummaryItem | null>(
    (mostConfidentItem, item) =>
      !mostConfidentItem || item.detection.confidence > mostConfidentItem.detection.confidence
        ? item
        : mostConfidentItem,
    null,
  )

  const personSpatialDetectionCount = filteredDetections.filter(
    (detection) => detection.class_name === 'person',
  ).length

  const horizontalDistribution = horizontalSpatialRegions.map((region) => ({
    region,
    count: spatialDetectionItems.filter((item) => item.horizontalRegion === region).length,
  }))

  const verticalDistribution = verticalSpatialRegions.map((region) => ({
    region,
    count: spatialDetectionItems.filter((item) => item.verticalRegion === region).length,
  }))

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

        {objectInventory.length > 0 && (
          <div className="object-inventory-panel" aria-label="Object inventory summary">
            <div className="object-inventory-header">
              <div>
                <h3>Object inventory</h3>
                <p>
                  Class-level summary for the detections currently visible after filters.
                </p>
              </div>

              <span className="object-inventory-total">
                {visibleClassCount} class{visibleClassCount === 1 ? '' : 'es'}
              </span>
            </div>

            <div className="object-inventory-grid">
              {objectInventory.map((item) => (
                <div className="object-inventory-item" key={item.className}>
                  <div className="object-inventory-item-header">
                    <strong>{item.className}</strong>
                    <span>
                      {item.count} object{item.count === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="object-inventory-metrics">
                    <span>
                      <strong>Highest</strong>
                      {(item.highestConfidence * 100).toFixed(1)}%
                    </span>
                    <span>
                      <strong>Average</strong>
                      {(item.averageConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredDetections.length > 0 && (
          <div className="spatial-summary-panel" aria-label="Spatial image summary">
            <div className="spatial-summary-header">
              <div>
                <h3>Spatial image summary</h3>
                <p>
                  Position summary for the detections currently visible after filters.
                </p>
              </div>

              {spatialDetectionItems.length > 0 && (
                <span className="object-inventory-total">
                  {spatialRegionCount} region{spatialRegionCount === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {!objectCropImageUrl && (
              <p className="small-note">
                Spatial summary needs an available source image URL.
              </p>
            )}

            {objectCropImageUrl && !loadedObjectCropImageSize && (
              <p className="small-note">
                Loading spatial summary...
              </p>
            )}

            {loadedObjectCropImageSize && spatialDetectionItems.length > 0 && (
              <>
                <div className="spatial-summary-insights">
                  {mostConfidentSpatialDetection && (
                    <div className="spatial-summary-insight">
                      <span>Most confident</span>
                      <strong>
                        {mostConfidentSpatialDetection.detection.class_name} in {mostConfidentSpatialDetection.regionLabel}
                      </strong>
                      <p>
                        {(mostConfidentSpatialDetection.detection.confidence * 100).toFixed(1)}% confidence
                      </p>
                    </div>
                  )}

                  {largestSpatialDetection && (
                    <div className="spatial-summary-insight">
                      <span>Largest region</span>
                      <strong>
                        {largestSpatialDetection.detection.class_name} in {largestSpatialDetection.regionLabel}
                      </strong>
                      <p>
                        {largestSpatialDetection.areaPercentage.toFixed(1)}% of image area
                      </p>
                    </div>
                  )}

                  <div className="spatial-summary-insight">
                    <span>Privacy focus</span>
                    <strong>
                      {personSpatialDetectionCount > 0
                        ? `${personSpatialDetectionCount} person detection${personSpatialDetectionCount === 1 ? '' : 's'} visible`
                        : 'No person detections visible'}
                    </strong>
                    <p>
                      Use this as a quick signal before cropping, blurring, or sharing.
                    </p>
                  </div>
                </div>

                <div className="spatial-summary-distribution">
                  <div>
                    <h4>Horizontal position</h4>
                    <div className="spatial-summary-region-list">
                      {horizontalDistribution.map((item) => (
                        <span key={item.region}>
                          <strong>{item.region}</strong>
                          {item.count}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4>Vertical position</h4>
                    <div className="spatial-summary-region-list">
                      {verticalDistribution.map((item) => (
                        <span key={item.region}>
                          <strong>{item.region}</strong>
                          {item.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="spatial-summary-object-list">
                  {spatialDetectionItems.map((item) => (
                    <div className="spatial-summary-object" key={`${item.detection.class_name}-${item.index}`}>
                      <strong>{item.index + 1}. {item.detection.class_name}</strong>
                      <span>{item.regionLabel}</span>
                      <small>{item.areaPercentage.toFixed(1)}% area</small>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {filteredDetections.length > 0 && (
          <div className="object-crop-gallery-panel" aria-label="Object crop gallery">
            <div className="object-crop-gallery-header">
              <div>
                <h3>Object crop gallery</h3>
                <p>
                  Visual previews for the detections currently visible after filters.
                </p>
              </div>

              <span className="object-inventory-total">
                {filteredDetections.length} crop{filteredDetections.length === 1 ? '' : 's'}
              </span>
            </div>

            {!objectCropImageUrl && (
              <p className="small-note">
                Crop previews need an available source image URL.
              </p>
            )}

            {objectCropImageUrl && !loadedObjectCropImageSize && (
              <p className="small-note">
                Loading object crop previews...
              </p>
            )}

            {objectCropImageUrl && loadedObjectCropImageSize && (
              <div className="object-crop-gallery-grid">
                {filteredDetections.map((detection, index) => (
                  <div className="object-crop-gallery-item" key={`${detection.class_name}-${index}`}>
                    <div
                      className="object-crop-gallery-preview"
                      style={{ aspectRatio: getObjectCropPreviewAspectRatio(detection) }}
                    >
                      <img
                        src={objectCropImageUrl}
                        alt={`${detection.class_name} crop preview`}
                        style={getObjectCropPreviewStyle(detection, loadedObjectCropImageSize)}
                      />
                    </div>

                    <div className="object-crop-gallery-details">
                      <strong>{index + 1}. {detection.class_name}</strong>
                      <span>{(detection.confidence * 100).toFixed(1)}% confidence</span>
                    </div>

                    <div className="object-crop-gallery-actions">
                      <button
                        className="crop-button"
                        onClick={() => void onCropDetection(detection)}
                        disabled={isBusy}
                      >
                        {isCropping ? 'Cropping...' : 'Crop'}
                      </button>

                      <button
                        className="blur-button"
                        onClick={() => void onBlurDetection(detection)}
                        disabled={isBusy}
                      >
                        {isBlurring ? 'Blurring...' : 'Blur'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
            <p className="small-note crop-selected-class-note">
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
