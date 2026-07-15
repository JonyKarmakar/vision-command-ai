import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, RefObject } from 'react'

import type { VideoObjectDetectionResponse, VideoUploadResponse } from '../../types/apiTypes'

function formatVideoTimestamp(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return '0.0s'
  }

  const safeSeconds = Math.max(0, seconds)

  if (safeSeconds < 60) {
    return `${safeSeconds.toFixed(1)}s`
  }

  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds - minutes * 60

  return `${minutes}:${remainingSeconds.toFixed(1).padStart(4, '0')}`
}

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
  const [isVideoAnalysisReportDownloaded, setIsVideoAnalysisReportDownloaded] = useState(false)

  const isAnnotatedVideoDownloaded =
    downloadedAnnotatedVideoFilename === videoObjectDetectionResult?.annotated_video_filename

  const videoObjectTimeline = useMemo(() => {
    if (!videoObjectDetectionResult) {
      return []
    }

    const timelineByClass = new Map<
      string,
      {
        className: string
        firstSeenSeconds: number
        lastSeenSeconds: number
        frameCount: number
        detectionCount: number
        highestConfidence: number
      }
    >()

    for (const frame of videoObjectDetectionResult.frames) {
      const classesInFrame = new Set<string>()

      for (const detection of frame.detections) {
        const existingTimeline = timelineByClass.get(detection.class_name) ?? {
          className: detection.class_name,
          firstSeenSeconds: frame.timestamp_seconds,
          lastSeenSeconds: frame.timestamp_seconds,
          frameCount: 0,
          detectionCount: 0,
          highestConfidence: 0,
        }

        existingTimeline.firstSeenSeconds = Math.min(
          existingTimeline.firstSeenSeconds,
          frame.timestamp_seconds,
        )
        existingTimeline.lastSeenSeconds = Math.max(
          existingTimeline.lastSeenSeconds,
          frame.timestamp_seconds,
        )
        existingTimeline.detectionCount += 1
        existingTimeline.highestConfidence = Math.max(
          existingTimeline.highestConfidence,
          detection.confidence,
        )

        timelineByClass.set(detection.class_name, existingTimeline)
        classesInFrame.add(detection.class_name)
      }

      for (const className of classesInFrame) {
        const existingTimeline = timelineByClass.get(className)

        if (existingTimeline) {
          existingTimeline.frameCount += 1
        }
      }
    }

    return [...timelineByClass.values()].sort(
      (firstItem, secondItem) =>
        firstItem.firstSeenSeconds - secondItem.firstSeenSeconds ||
        secondItem.detectionCount - firstItem.detectionCount,
    )
  }, [videoObjectDetectionResult])

  const videoKeyMoments = useMemo(() => {
    if (!videoObjectDetectionResult) {
      return []
    }

    const momentBySecond = new Map<
      number,
      {
        second: number
        detectionCount: number
        classNames: Set<string>
        highestConfidence: number
      }
    >()

    for (const frame of videoObjectDetectionResult.frames) {
      if (frame.detection_count === 0) {
        continue
      }

      const second = Math.floor(frame.timestamp_seconds)
      const existingMoment = momentBySecond.get(second) ?? {
        second,
        detectionCount: 0,
        classNames: new Set<string>(),
        highestConfidence: 0,
      }

      existingMoment.detectionCount += frame.detection_count

      for (const detection of frame.detections) {
        existingMoment.classNames.add(detection.class_name)
        existingMoment.highestConfidence = Math.max(
          existingMoment.highestConfidence,
          detection.confidence,
        )
      }

      momentBySecond.set(second, existingMoment)
    }

    return [...momentBySecond.values()]
      .sort((firstMoment, secondMoment) => firstMoment.second - secondMoment.second)
      .slice(0, 8)
      .map((moment) => ({
        ...moment,
        classNames: [...moment.classNames].sort(),
      }))
  }, [videoObjectDetectionResult])

  const videoKeyframes = useMemo(() => {
    if (!videoObjectDetectionResult) {
      return []
    }

    const bestFrameBySecond = new Map<
      number,
      {
        frameFilename: string
        frameFileUrl: string
        timestampSeconds: number
        detectionCount: number
        classNames: string[]
        highestConfidence: number
      }
    >()

    for (const frame of videoObjectDetectionResult.frames) {
      if (frame.detection_count === 0) {
        continue
      }

      const second = Math.floor(frame.timestamp_seconds)
      const classNames = [...new Set(frame.detections.map((detection) => detection.class_name))]
        .sort()
        .slice(0, 5)
      const highestConfidence = frame.detections.reduce(
        (highest, detection) => Math.max(highest, detection.confidence),
        0,
      )

      const candidateFrame = {
        frameFilename: frame.frame_filename,
        frameFileUrl: frame.frame_file_url,
        timestampSeconds: frame.timestamp_seconds,
        detectionCount: frame.detection_count,
        classNames,
        highestConfidence,
      }

      const existingFrame = bestFrameBySecond.get(second)

      if (
        !existingFrame ||
        candidateFrame.detectionCount > existingFrame.detectionCount ||
        (candidateFrame.detectionCount === existingFrame.detectionCount &&
          candidateFrame.highestConfidence > existingFrame.highestConfidence)
      ) {
        bestFrameBySecond.set(second, candidateFrame)
      }
    }

    return [...bestFrameBySecond.values()]
      .sort((firstFrame, secondFrame) => firstFrame.timestampSeconds - secondFrame.timestampSeconds)
      .slice(0, 6)
  }, [videoObjectDetectionResult])

  const videoActivitySummary = useMemo(() => {
    if (!videoObjectDetectionResult || videoObjectTimeline.length === 0) {
      return null
    }

    const topClasses = [...videoObjectDetectionResult.class_summary].sort(
      (firstClass, secondClass) =>
        secondClass.frame_count - firstClass.frame_count ||
        secondClass.detection_count - firstClass.detection_count,
    )
    const topClassNames = topClasses.slice(0, 4).map((item) => item.class_name)
    const mainClass = topClasses[0]
    const personTimeline = videoObjectTimeline.find((item) => item.className === 'person')
    const sportsBallTimeline = videoObjectTimeline.find(
      (item) => item.className === 'sports ball',
    )
    const firstMoment = videoKeyMoments[0]
    const lastMoment = videoKeyMoments[videoKeyMoments.length - 1]

    const headline =
      personTimeline && sportsBallTimeline
        ? 'The video appears to show people and a sports ball across the scene. The main visual pattern is people appearing through most of the clip, with the sports ball detected during part of the action.'
        : personTimeline
          ? 'The video appears to focus mainly on people. People are detected across much of the clip, based on the processed video frames.'
          : `The video appears to contain ${topClassNames.join(', ')} based on object detections across the processed frames.`

    const points = [
      mainClass
        ? `Most frequent detected class: ${mainClass.class_name}, seen in ${mainClass.frame_count} of ${videoObjectDetectionResult.processed_frame_count} processed frame(s).`
        : 'No dominant object class was detected.',
      topClassNames.length > 0
        ? `Detected object classes include: ${topClassNames.join(', ')}.`
        : 'No object classes were available for summary.',
      personTimeline
        ? `People appear from ${formatVideoTimestamp(personTimeline.firstSeenSeconds)} to ${formatVideoTimestamp(personTimeline.lastSeenSeconds)}.`
        : 'No person class was detected in the processed frames.',
      firstMoment && lastMoment
        ? `Detections are present from ${formatVideoTimestamp(firstMoment.second)} to ${formatVideoTimestamp(lastMoment.second)} in the key moments view.`
        : 'No key moments were available from the detection results.',
    ]

    return {
      headline,
      points,
    }
  }, [videoKeyMoments, videoObjectDetectionResult, videoObjectTimeline])

  const videoPrivacyReview = useMemo(() => {
    if (!videoObjectDetectionResult) {
      return null
    }

    const privacyRelevantClassNames = new Set([
      'person',
      'cell phone',
      'laptop',
      'keyboard',
      'book',
      'tv',
      'backpack',
      'handbag',
      'suitcase',
    ])

    const detectedPrivacyClasses = videoObjectDetectionResult.class_summary.filter((item) =>
      privacyRelevantClassNames.has(item.class_name),
    )

    const personSummary = videoObjectDetectionResult.class_summary.find(
      (item) => item.class_name === 'person',
    )
    const personTimeline = videoObjectTimeline.find((item) => item.className === 'person')
    const hasPeople = Boolean(personSummary)

    const reviewLevel = hasPeople
      ? 'Review before sharing'
      : detectedPrivacyClasses.length > 0
        ? 'Check context before sharing'
        : 'Low visible privacy risk'

    const headline = hasPeople
      ? 'People are visible in the detected video frames, so this video should be reviewed before external sharing.'
      : detectedPrivacyClasses.length > 0
        ? 'Some objects that may reveal context are visible, so review the video before sharing it outside the intended audience.'
        : 'No people or common privacy-relevant object classes were detected in the processed frames.'

    const points = [
      personSummary
        ? `People detected in ${personSummary.frame_count} of ${videoObjectDetectionResult.processed_frame_count} processed frame(s).`
        : 'No person class was detected in the processed frames.',
      personTimeline
        ? `Person detections appear from ${formatVideoTimestamp(personTimeline.firstSeenSeconds)} to ${formatVideoTimestamp(personTimeline.lastSeenSeconds)}.`
        : 'No person timeline was available.',
      detectedPrivacyClasses.length > 0
        ? `Privacy-relevant detected classes: ${detectedPrivacyClasses.map((item) => item.class_name).join(', ')}.`
        : 'No common privacy-relevant classes were detected.',
      'Review the original and annotated video before sharing because object detection may miss details or include false positives.',
    ]

    return {
      reviewLevel,
      headline,
      points,
    }
  }, [videoObjectDetectionResult, videoObjectTimeline])

  const videoAnalysisMarkdownReport = useMemo(() => {
    if (!videoUploadResult || !videoObjectDetectionResult) {
      return null
    }

    const classSummaryMarkdown =
      videoObjectDetectionResult.class_summary.length > 0
        ? videoObjectDetectionResult.class_summary
            .map(
              (item) =>
                `- ${item.class_name}: detected in ${item.frame_count} of ${videoObjectDetectionResult.processed_frame_count} processed frame(s); ${item.detection_count} total box(es); highest confidence ${Math.round(item.highest_confidence * 100)}%`,
            )
            .join('\n')
        : '- No object classes matched the current detection settings.'

    const activitySummaryMarkdown = videoActivitySummary
      ? [
          videoActivitySummary.headline,
          '',
          ...videoActivitySummary.points.map((point) => `- ${point}`),
        ].join('\n')
      : 'No activity summary was available.'

    const privacyReviewMarkdown = videoPrivacyReview
      ? [
          `Review level: ${videoPrivacyReview.reviewLevel}`,
          '',
          videoPrivacyReview.headline,
          '',
          ...videoPrivacyReview.points.map((point) => `- ${point}`),
        ].join('\n')
      : 'No privacy review was available.'

    const keyframeGalleryMarkdown =
      videoKeyframes.length > 0
        ? videoKeyframes
            .map(
              (frame) =>
                `- ${formatVideoTimestamp(frame.timestampSeconds)}: ${frame.detectionCount} box(es); classes: ${frame.classNames.join(', ')}; highest confidence ${Math.round(frame.highestConfidence * 100)}%; frame URL: ${frame.frameFileUrl}`,
            )
            .join('\n')
        : '- No keyframes were available.'

    const timelineMarkdown =
      videoObjectTimeline.length > 0
        ? videoObjectTimeline
            .map(
              (item) =>
                `- ${item.className}: ${formatVideoTimestamp(item.firstSeenSeconds)} to ${formatVideoTimestamp(item.lastSeenSeconds)}; seen in ${item.frameCount} frame(s); ${item.detectionCount} total box(es); highest confidence ${Math.round(item.highestConfidence * 100)}%`,
            )
            .join('\n')
        : '- No object timeline was available.'

    const keyMomentsMarkdown =
      videoKeyMoments.length > 0
        ? videoKeyMoments
            .map(
              (moment) =>
                `- ${formatVideoTimestamp(moment.second)}: ${moment.classNames.join(', ')}; ${moment.detectionCount} box(es); highest confidence ${Math.round(moment.highestConfidence * 100)}%`,
            )
            .join('\n')
        : '- No key moments were available.'

    return [
      '# Video Analysis Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Video Overview',
      '',
      `- Original filename: ${videoUploadResult.original_filename}`,
      `- Stored filename: ${videoUploadResult.stored_filename}`,
      `- Duration: ${videoUploadResult.metadata.duration_seconds ?? 'Unknown'} seconds`,
      `- Resolution: ${videoUploadResult.metadata.width ?? 'Unknown'} x ${videoUploadResult.metadata.height ?? 'Unknown'}`,
      `- FPS: ${videoUploadResult.metadata.fps ?? 'Unknown'}`,
      `- Frame count: ${videoUploadResult.metadata.frame_count ?? 'Unknown'}`,
      '',
      '## Detection Settings',
      '',
      `- Processing mode: ${videoObjectDetectionResult.interval_seconds < 0.1 ? 'Frame-level video detection' : `Sampled every ${videoObjectDetectionResult.interval_seconds.toFixed(2)} seconds`}`,
      `- Confidence threshold: ${Math.round(videoObjectDetectionResult.confidence_threshold * 100)}%`,
      `- Class filter: ${videoObjectDetectionResult.class_filter ?? 'All classes'}`,
      `- Processed frames: ${videoObjectDetectionResult.processed_frame_count}`,
      `- Total detections: ${videoObjectDetectionResult.detection_count}`,
      '',
      '## Annotated Video Output',
      '',
      `- Annotated video filename: ${videoObjectDetectionResult.annotated_video_filename}`,
      `- Annotated video URL: ${videoObjectDetectionResult.annotated_video_file_url}`,
      '',
      '## Object Summary',
      '',
      classSummaryMarkdown,
      '',
      '## Activity Summary',
      '',
      activitySummaryMarkdown,
      '',
      '## Privacy Review',
      '',
      privacyReviewMarkdown,
      '',
      '## Keyframe Gallery',
      '',
      keyframeGalleryMarkdown,
      '',
      '## Object Timeline',
      '',
      timelineMarkdown,
      '',
      '## Key Moments',
      '',
      keyMomentsMarkdown,
      '',
      '## Limitations',
      '',
      '- This report is generated from object detection results and frontend summary logic.',
      '- It does not identify people.',
      '- It does not detect faces.',
      '- It does not infer emotions, intentions, or private activities.',
      '- It does not include persistent object tracking IDs.',
      '- Low-confidence detections may include false positives.',
      '',
    ].join('\n')
  }, [
    videoActivitySummary,
    videoKeyframes,
    videoKeyMoments,
    videoObjectDetectionResult,
    videoObjectTimeline,
    videoPrivacyReview,
    videoUploadResult,
  ])

  const handleDownloadVideoAnalysisReport = () => {
    if (!videoAnalysisMarkdownReport || !videoUploadResult) {
      return
    }

    const blob = new Blob([videoAnalysisMarkdownReport], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeVideoName = videoUploadResult.original_filename
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()

    link.href = url
    link.download = `video-analysis-report-${safeVideoName || 'video'}-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setIsVideoAnalysisReportDownloaded(true)
    window.setTimeout(() => setIsVideoAnalysisReportDownloaded(false), 2000)
  }

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

              {videoActivitySummary && (
                <section className="video-activity-summary-panel">
                  <div>
                    <p className="eyebrow">Video understanding</p>
                    <h3>Activity summary</h3>
                    <p className="video-activity-summary-headline">
                      {videoActivitySummary.headline}
                    </p>
                  </div>

                  <div className="video-activity-summary-list">
                    {videoActivitySummary.points.map((point) => (
                      <p key={point}>{point}</p>
                    ))}
                  </div>

                  <p className="small-note">
                    This summary is grounded in detected object classes, timestamps, and key moments. It does not identify people, infer emotions, or make private activity claims.
                  </p>
                </section>
              )}

              {videoPrivacyReview && (
                <section className="video-privacy-review-panel">
                  <div className="video-privacy-review-header">
                    <div>
                      <p className="eyebrow">Video privacy</p>
                      <h3>Privacy sharing review</h3>
                      <p className="video-privacy-review-headline">
                        {videoPrivacyReview.headline}
                      </p>
                    </div>

                    <span className="video-privacy-review-badge">
                      {videoPrivacyReview.reviewLevel}
                    </span>
                  </div>

                  <div className="video-privacy-review-list">
                    {videoPrivacyReview.points.map((point) => (
                      <p key={point}>{point}</p>
                    ))}
                  </div>

                  <p className="small-note">
                    This review is based only on detected object classes and timestamps. It does not identify people, detect faces, infer emotions, or make private activity claims.
                  </p>
                </section>
              )}

              {videoKeyframes.length > 0 && (
                <section className="video-keyframe-gallery-panel">
                  <div>
                    <p className="eyebrow">Video keyframes</p>
                    <h3>Keyframe gallery</h3>
                    <p className="small-note">
                      Representative frames selected from detection-rich moments in the processed video.
                    </p>
                  </div>

                  <div className="video-keyframe-gallery-grid">
                    {videoKeyframes.map((frame) => (
                      <article className="video-keyframe-card" key={frame.frameFilename}>
                        <img
                          src={`/api${frame.frameFileUrl}`}
                          alt={`Detected video frame at ${formatVideoTimestamp(frame.timestampSeconds)}`}
                        />

                        <div className="video-keyframe-card-body">
                          <strong>{formatVideoTimestamp(frame.timestampSeconds)}</strong>
                          <span>{frame.detectionCount} detected box(es)</span>
                          <span>{frame.classNames.join(', ')}</span>
                          <span>Highest confidence {Math.round(frame.highestConfidence * 100)}%</span>
                        </div>
                      </article>
                    ))}
                  </div>

                  <p className="small-note">
                    Keyframes are selected from processed frames with detections. They are representative evidence, not a full tracking sequence.
                  </p>
                </section>
              )}

              {videoAnalysisMarkdownReport && (
                <section className="video-analysis-report-panel">
                  <div>
                    <p className="eyebrow">Video report</p>
                    <h3>Video analysis report</h3>
                    <p className="small-note">
                      Export the current video detection, annotated output, activity summary,
                      privacy review, keyframe gallery, object timeline, and key moments as a Markdown report.
                    </p>
                  </div>

                  <div className="output-actions result-output-actions">
                    <button
                      className="secondary-button"
                      onClick={handleDownloadVideoAnalysisReport}
                      disabled={isBusy}
                    >
                      {isVideoAnalysisReportDownloaded ? 'Downloaded!' : 'Download Markdown report'}
                    </button>
                  </div>
                </section>
              )}

              {videoObjectTimeline.length > 0 && (
                <section className="video-object-timeline-panel">
                  <div>
                    <p className="eyebrow">Video timeline</p>
                    <h3>Object timeline</h3>
                    <p className="small-note">
                      First seen and last seen times are based on processed video frames.
                    </p>
                  </div>

                  <div className="video-object-timeline-list">
                    {videoObjectTimeline.map((item) => (
                      <div className="video-object-timeline-item" key={item.className}>
                        <strong>{item.className}</strong>
                        <span>
                          {formatVideoTimestamp(item.firstSeenSeconds)} to{' '}
                          {formatVideoTimestamp(item.lastSeenSeconds)}
                        </span>
                        <span>
                          Seen in {item.frameCount} frame(s) · {item.detectionCount} total box(es)
                        </span>
                        <span>
                          Highest confidence {Math.round(item.highestConfidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {videoKeyMoments.length > 0 && (
                <section className="video-key-moments-panel">
                  <div>
                    <p className="eyebrow">Video timeline</p>
                    <h3>Key moments</h3>
                    <p className="small-note">
                      A compact view of seconds where detections were present.
                    </p>
                  </div>

                  <div className="video-key-moments-list">
                    {videoKeyMoments.map((moment) => (
                      <div className="video-key-moment-item" key={moment.second}>
                        <strong>{formatVideoTimestamp(moment.second)}</strong>
                        <span>{moment.classNames.join(', ')}</span>
                        <span>
                          {moment.detectionCount} box(es) · highest confidence{' '}
                          {Math.round(moment.highestConfidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
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
