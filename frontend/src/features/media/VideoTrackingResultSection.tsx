import type { RefObject } from 'react'

import type { VideoTrackingResponse } from '../../types/apiTypes'

type TrackingFrame = VideoTrackingResponse['frames'][number]

type VideoTrackingResultSectionProps = {
  videoTrackingResult: VideoTrackingResponse | null
  videoTrackingResultRef: RefObject<HTMLHeadingElement | null>
  isBusy: boolean
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  onClearVideoTrackingResult: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

function buildTrackingFrameClassSummary(frame: TrackingFrame) {
  return frame.detections.reduce<Record<string, number>>((summary, detection) => {
    summary[detection.class_name] = (summary[detection.class_name] ?? 0) + 1
    return summary
  }, {})
}

function buildTrackingTimeline(videoTrackingResult: VideoTrackingResponse) {
  return videoTrackingResult.frames.map((frame) => ({
    timestamp_seconds: frame.timestamp_seconds,
    frame_index: frame.frame_index,
    detection_count: frame.detection_count,
    track_ids: Array.from(new Set(frame.detections.map((detection) => detection.track_id))),
    class_summary: buildTrackingFrameClassSummary(frame),
    annotated_frame_filename: frame.annotated_frame_filename,
    annotated_frame_file_url: frame.annotated_frame_file_url,
  }))
}

export function VideoTrackingResultSection({
  videoTrackingResult,
  videoTrackingResultRef,
  isBusy,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  onClearVideoTrackingResult,
  onCopyJson,
  onDownloadJson,
}: VideoTrackingResultSectionProps) {
  if (!videoTrackingResult) {
    return null
  }

  return (
    <section className="card">
      <h2 ref={videoTrackingResultRef}>Video Tracking Result</h2>

      <div className="loaded-panel-actions">
        <button
          className="secondary-button"
          onClick={() =>
            void onCopyJson(
              {
                source: 'video_tracking_result',
                copied_at: new Date().toISOString(),
                filename: videoTrackingResult.filename,
                frame_count: videoTrackingResult.frame_count,
                track_count: videoTrackingResult.track_count,
                start_seconds: videoTrackingResult.start_seconds,
                end_seconds: videoTrackingResult.end_seconds,
                interval_seconds: videoTrackingResult.interval_seconds,
                max_distance_pixels: videoTrackingResult.max_distance_pixels,
                class_filter: videoTrackingResult.class_filter,
                tracks: videoTrackingResult.tracks,
                frames: videoTrackingResult.frames,
                result: videoTrackingResult,
              },
              'video-tracking-result-json',
              'Copied Video Tracking Result JSON to clipboard.',
            )
          }
          disabled={isBusy || !videoTrackingResult}
        >
          {copiedParserLogJsonKey === 'video-tracking-result-json'
            ? 'Copied!'
            : failedParserLogJsonKey === 'video-tracking-result-json'
              ? 'Copy failed'
              : 'Copy Video Tracking Result JSON'}
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            onDownloadJson(
              {
                source: 'video_tracking_result',
                downloaded_at: new Date().toISOString(),
                filename: videoTrackingResult.filename,
                frame_count: videoTrackingResult.frame_count,
                track_count: videoTrackingResult.track_count,
                start_seconds: videoTrackingResult.start_seconds,
                end_seconds: videoTrackingResult.end_seconds,
                interval_seconds: videoTrackingResult.interval_seconds,
                max_distance_pixels: videoTrackingResult.max_distance_pixels,
                class_filter: videoTrackingResult.class_filter,
                tracks: videoTrackingResult.tracks,
                frames: videoTrackingResult.frames,
                result: videoTrackingResult,
              },
              `video_tracking_result_file-${videoTrackingResult.filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
              'Downloaded Video Tracking Result JSON.',
              'download-video-tracking-result-json',
            )
          }
          disabled={isBusy || !videoTrackingResult}
          data-testid="download-video-tracking-result-json"
        >
          {downloadedParserLogJsonKey === 'download-video-tracking-result-json'
            ? 'Downloaded!'
            : 'Download Video Tracking Result JSON'}
        </button>

        <button
          className="secondary-button view-clear-button"
          onClick={onClearVideoTrackingResult}
          disabled={isBusy}
        >
          Clear View
        </button>
      </div>

      <div className="summary-box">
        <p><strong>Video:</strong> {videoTrackingResult.filename}</p>
        <p><strong>Frames processed:</strong> {videoTrackingResult.frame_count}</p>
        <p><strong>Tracks found:</strong> {videoTrackingResult.track_count}</p>
        <p><strong>Range:</strong> {videoTrackingResult.start_seconds}s to {videoTrackingResult.end_seconds}s</p>
        <p><strong>Interval:</strong> {videoTrackingResult.interval_seconds}s</p>
        <p><strong>Max distance:</strong> {videoTrackingResult.max_distance_pixels}px</p>
        <p><strong>Class filter:</strong> {videoTrackingResult.class_filter ?? 'All classes'}</p>
      </div>

      {videoTrackingResult.tracks.length > 0 ? (
        <div className="track-summary-list">
          <h3>Track Summary</h3>

          {videoTrackingResult.tracks.map((track) => (
            <div className="track-summary-item" key={track.track_id}>
              <div>
                <strong>Track {track.track_id}: {track.class_name}</strong>
                <p>{track.observation_count} observation(s)</p>
              </div>

              <div>
                <span>{track.first_timestamp_seconds}s → {track.last_timestamp_seconds}s</span>
                <span>Max confidence: {(track.max_confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No tracks found.</p>
      )}

      <div className="video-timeline">
        <h3>Tracking Timeline</h3>

        <div className="loaded-panel-actions">
          <button
            className="secondary-button"
            onClick={() =>
              void onCopyJson(
                {
                  source: 'video_tracking_timeline',
                  copied_at: new Date().toISOString(),
                  filename: videoTrackingResult.filename,
                  frame_count: videoTrackingResult.frame_count,
                  track_count: videoTrackingResult.track_count,
                  start_seconds: videoTrackingResult.start_seconds,
                  end_seconds: videoTrackingResult.end_seconds,
                  interval_seconds: videoTrackingResult.interval_seconds,
                  max_distance_pixels: videoTrackingResult.max_distance_pixels,
                  class_filter: videoTrackingResult.class_filter,
                  timeline: buildTrackingTimeline(videoTrackingResult),
                },
                'video-tracking-timeline-json',
                'Copied Video Tracking Timeline JSON to clipboard.',
              )
            }
            disabled={isBusy || !videoTrackingResult}
          >
            {copiedParserLogJsonKey === 'video-tracking-timeline-json'
              ? 'Copied!'
              : failedParserLogJsonKey === 'video-tracking-timeline-json'
                ? 'Copy failed'
                : 'Copy Video Tracking Timeline JSON'}
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              onDownloadJson(
                {
                  source: 'video_tracking_timeline',
                  downloaded_at: new Date().toISOString(),
                  filename: videoTrackingResult.filename,
                  frame_count: videoTrackingResult.frame_count,
                  track_count: videoTrackingResult.track_count,
                  start_seconds: videoTrackingResult.start_seconds,
                  end_seconds: videoTrackingResult.end_seconds,
                  interval_seconds: videoTrackingResult.interval_seconds,
                  max_distance_pixels: videoTrackingResult.max_distance_pixels,
                  class_filter: videoTrackingResult.class_filter,
                  timeline: buildTrackingTimeline(videoTrackingResult),
                },
                `video_tracking_timeline_file-${videoTrackingResult.filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                'Downloaded Video Tracking Timeline JSON.',
                'download-video-tracking-timeline-json',
              )
            }
            disabled={isBusy || !videoTrackingResult}
            data-testid="download-video-tracking-timeline-json"
          >
            {downloadedParserLogJsonKey === 'download-video-tracking-timeline-json'
              ? 'Downloaded!'
              : 'Download Video Tracking Timeline JSON'}
          </button>
        </div>

        {videoTrackingResult.frames.map((frame, index) => (
          <div className="timeline-item" key={`${frame.frame_filename}-tracking`}>
            <div className="timeline-index">
              <span>{index + 1}</span>
            </div>

            <div className="timeline-content">
              <div className="timeline-header">
                <strong>{frame.timestamp_seconds}s</strong>
                <span>{frame.detection_count} tracked detection(s)</span>
              </div>

              {frame.annotated_frame_file_url && (
                <div className="tracking-frame-preview">
                  <img
                    src={`/api${frame.annotated_frame_file_url}`}
                    alt={`Annotated tracking frame at ${frame.timestamp_seconds}s`}
                  />

                  <div className="output-actions">
                    <a
                      href={`/api${frame.annotated_frame_file_url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open tracked frame
                    </a>

                    {frame.annotated_frame_filename && (
                      <a
                        href={`/api${frame.annotated_frame_file_url}`}
                        download={frame.annotated_frame_filename}
                      >
                        Download tracked frame
                      </a>
                    )}

                    <button
                      className="secondary-button"
                      onClick={() =>
                        void onCopyJson(
                          {
                            source: 'tracking_timeline_frame_item',
                            copied_at: new Date().toISOString(),
                            video_filename: videoTrackingResult.filename,
                            timestamp_seconds: frame.timestamp_seconds,
                            frame_index: frame.frame_index,
                            frame_filename: frame.frame_filename,
                            frame_file_url: frame.frame_file_url,
                            detection_count: frame.detection_count,
                            track_ids: Array.from(new Set(frame.detections.map((detection) => detection.track_id))),
                            class_summary: buildTrackingFrameClassSummary(frame),
                            detections: frame.detections,
                            annotated_frame_filename: frame.annotated_frame_filename,
                            annotated_frame_file_url: frame.annotated_frame_file_url,
                            frame,
                          },
                          `tracking-frame-json-${frame.frame_filename}`,
                          'Copied Tracking Frame JSON to clipboard.',
                        )
                      }
                      disabled={isBusy}
                    >
                      {copiedParserLogJsonKey === `tracking-frame-json-${frame.frame_filename}`
                        ? 'Copied!'
                        : failedParserLogJsonKey === `tracking-frame-json-${frame.frame_filename}`
                          ? 'Copy failed'
                          : 'Copy Frame JSON'}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        onDownloadJson(
                          {
                            source: 'tracking_timeline_frame_item',
                            downloaded_at: new Date().toISOString(),
                            video_filename: videoTrackingResult.filename,
                            timestamp_seconds: frame.timestamp_seconds,
                            frame_index: frame.frame_index,
                            frame_filename: frame.frame_filename,
                            frame_file_url: frame.frame_file_url,
                            detection_count: frame.detection_count,
                            track_ids: Array.from(new Set(frame.detections.map((detection) => detection.track_id))),
                            class_summary: buildTrackingFrameClassSummary(frame),
                            detections: frame.detections,
                            annotated_frame_filename: frame.annotated_frame_filename,
                            annotated_frame_file_url: frame.annotated_frame_file_url,
                            frame,
                          },
                          `tracking_frame_json-${frame.frame_filename.replace(/[^a-z0-9]+/gi, '-')}.json`,
                          'Downloaded Tracking Frame JSON.',
                          `download-tracking-frame-json-${frame.frame_filename}`,
                        )
                      }
                      disabled={isBusy}
                    >
                      {downloadedParserLogJsonKey === `download-tracking-frame-json-${frame.frame_filename}`
                        ? 'Downloaded!'
                        : 'Download Frame JSON'}
                    </button>
                  </div>
                </div>
              )}

              {frame.detections.length > 0 ? (
                <div className="tracking-detection-list">
                  {frame.detections.map((detection) => (
                    <span key={`${frame.frame_filename}-${detection.track_id}`}>
                      Track {detection.track_id}: {detection.class_name} ({(detection.confidence * 100).toFixed(1)}%)
                    </span>
                  ))}
                </div>
              ) : (
                <p>No tracked detections in this frame.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
