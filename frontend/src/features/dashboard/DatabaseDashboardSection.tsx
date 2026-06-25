import type {
  DatabaseStats,
  DetectionLog,
  DetectionSummary,
  InferenceLog,
  InferenceSummary,
  ModelClassesResponse,
  ModelInfo,
} from '../../types/apiTypes'

type DatabaseDashboardSectionProps = {
  databaseStats: DatabaseStats | null
  modelInfo: ModelInfo | null
  modelClasses: ModelClassesResponse | null
  detectionSummary: DetectionSummary | null
  inferenceSummary: InferenceSummary | null
  inferenceLogs: InferenceLog[]
  detectionLogs: DetectionLog[]
  visibleModelClasses: string[]
  visibleClassAliases: [string, string][]
  modelClassSearch: string
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  isLoadingStats: boolean
  isLoadingModelInfo: boolean
  isLoadingModelClasses: boolean
  isLoadingDetections: boolean
  isLoadingDetectionSummary: boolean
  isLoadingInferenceLogs: boolean
  isLoadingInferenceSummary: boolean
  hasLoadedDashboardViews: boolean
  hasLoadedWorkspaceViews: boolean
  onLoadDatabaseStats: () => void
  onLoadModelInfo: () => void
  onLoadModelClasses: () => void
  onLoadDetectionLogs: () => void
  onLoadDetectionSummary: () => void
  onLoadInferenceLogs: () => void
  onLoadInferenceSummary: () => void
  onClearDashboardViews: () => void
  onClearAllWorkspaceViews: () => void
  onModelClassSearchChange: (value: string) => void
  onClearModelInfo: () => void
  onClearModelClasses: () => void
  onClearDatabaseStats: () => void
  onClearDetectionSummary: () => void
  onClearInferenceSummary: () => void
  onClearInferenceLogs: () => void
  onClearDetectionLogs: () => void
  onCopyJson: (payload: unknown, key: string, successMessage: string) => Promise<void>
  onDownloadJson: (
    payload: unknown,
    filename: string,
    successMessage: string,
    downloadKey: string,
  ) => void
}

export function DatabaseDashboardSection({
  databaseStats,
  modelInfo,
  modelClasses,
  detectionSummary,
  inferenceSummary,
  inferenceLogs,
  detectionLogs,
  visibleModelClasses,
  visibleClassAliases,
  modelClassSearch,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  isLoadingStats,
  isLoadingModelInfo,
  isLoadingModelClasses,
  isLoadingDetections,
  isLoadingDetectionSummary,
  isLoadingInferenceLogs,
  isLoadingInferenceSummary,
  hasLoadedDashboardViews,
  hasLoadedWorkspaceViews,
  onLoadDatabaseStats,
  onLoadModelInfo,
  onLoadModelClasses,
  onLoadDetectionLogs,
  onLoadDetectionSummary,
  onLoadInferenceLogs,
  onLoadInferenceSummary,
  onClearDashboardViews,
  onClearAllWorkspaceViews,
  onModelClassSearchChange,
  onClearModelInfo,
  onClearModelClasses,
  onClearDatabaseStats,
  onClearDetectionSummary,
  onClearInferenceSummary,
  onClearInferenceLogs,
  onClearDetectionLogs,
  onCopyJson,
  onDownloadJson,
}: DatabaseDashboardSectionProps) {
  return (
    <section className="card database-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Database Dashboard</h2>
          <p className="small-note">
            View PostgreSQL-backed project statistics.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            className="secondary-button"
            onClick={onLoadDatabaseStats}
            disabled={isBusy}
          >
            {isLoadingStats ? 'Loading stats...' : 'Load Database Stats'}
          </button>

          <button
            className="secondary-button"
            onClick={onLoadModelInfo}
            disabled={isBusy}
          >
            {isLoadingModelInfo ? 'Loading model...' : 'Load Model Info'}
          </button>

          <button
            type="button"
            onClick={onLoadModelClasses}
            disabled={isLoadingModelClasses}
          >
            {isLoadingModelClasses ? 'Loading classes...' : 'Load Supported Classes'}
          </button>

          <button
            className="secondary-button"
            onClick={onLoadDetectionLogs}
            disabled={isBusy}
          >
            {isLoadingDetections ? 'Loading detections...' : 'Load Detection History'}
          </button>

          <button
            className="secondary-button"
            onClick={onLoadDetectionSummary}
            disabled={isBusy}
          >
            {isLoadingDetectionSummary ? 'Loading summary...' : 'Load Detection Summary'}
          </button>

          <button
            className="secondary-button"
            onClick={onLoadInferenceLogs}
            disabled={isBusy}
          >
            {isLoadingInferenceLogs ? 'Loading inference logs...' : 'Load Inference Logs'}
          </button>

          <button
            className="secondary-button"
            onClick={onLoadInferenceSummary}
            disabled={isBusy}
          >
            {isLoadingInferenceSummary ? 'Loading inference summary...' : 'Load Inference Summary'}
          </button>

          <button
            className="secondary-button"
            onClick={onClearDashboardViews}
            disabled={isBusy || !hasLoadedDashboardViews}
          >
            Clear Dashboard Views
          </button>

          <button
            className="secondary-button danger-button"
            onClick={onClearAllWorkspaceViews}
            disabled={isBusy || !hasLoadedWorkspaceViews}
          >
            Clear All Workspace Views
          </button>
        </div>
      </div>

      {modelInfo && (
        <div className="model-info-panel">
          <div className="view-panel-header">
            <h3>Model Information</h3>
            <button
              className="secondary-button view-clear-button"
              onClick={onClearModelInfo}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <div className="model-info-grid">
            <div className="stat-item">
              <span>Model</span>
              <strong>{modelInfo.model_name}</strong>
            </div>

            <div className="stat-item">
              <span>Task</span>
              <strong>{modelInfo.task}</strong>
            </div>

            <div className="stat-item">
              <span>Framework</span>
              <strong>{modelInfo.framework}</strong>
            </div>

            <div className="stat-item">
              <span>Backend</span>
              <strong>{modelInfo.backend}</strong>
            </div>

            <div className="stat-item">
              <span>Version</span>
              <strong>{modelInfo.version}</strong>
            </div>
          </div>

          <div className="supported-actions">
            <h4>Supported Actions</h4>
            <div className="action-tags">
              {modelInfo.supported_actions.map((action) => (
                <span key={action}>{action}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {modelClasses && (
        <section className="result-card model-classes-card">
          <div className="model-classes-header">
            <div>
              <h3>Supported Model Classes</h3>
              <p>
                The current model can detect {modelClasses.class_count} object class(es).
                Use these names in crop, blur, detect, and tracking commands.
              </p>
            </div>
            <div className="view-panel-header-actions">
              <span className="model-class-count">{modelClasses.class_count} classes</span>
              <button
                className="secondary-button view-clear-button"
                onClick={onClearModelClasses}
                disabled={isBusy}
              >
                Clear View
              </button>
            </div>
          </div>

          <label className="model-class-search">
            Search classes or aliases
            <input
              type="search"
              value={modelClassSearch}
              onChange={(event) => onModelClassSearchChange(event.target.value)}
              placeholder="Try bike, phone, person, car..."
            />
          </label>

          <div className="model-class-list">
            {visibleModelClasses.length > 0 ? (
              visibleModelClasses.map((className) => (
                <span key={className} className="model-class-pill">
                  {className}
                </span>
              ))
            ) : (
              <p className="empty-state">No supported class matched your search.</p>
            )}
          </div>

          <div className="model-alias-section">
            <h4>Common aliases</h4>
            <p>
              These words are normalized to supported YOLO class names before detection.
            </p>

            <div className="model-alias-list">
              {visibleClassAliases.length > 0 ? (
                visibleClassAliases.slice(0, 50).map(([alias, className]) => (
                  <span key={`${alias}-${className}`} className="model-alias-pill">
                    <code>{alias}</code>
                    <span>→</span>
                    <strong>{className}</strong>
                  </span>
                ))
              ) : (
                <p className="empty-state">No alias matched your search.</p>
              )}
            </div>

            {visibleClassAliases.length > 50 && (
              <p className="helper-text">
                Showing first 50 alias matches. Refine the search to narrow the list.
              </p>
            )}
          </div>
        </section>
      )}

      {databaseStats && (
        <>
          <div className="loaded-panel-actions">
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'database_statistics',
                    copied_at: new Date().toISOString(),
                    status: databaseStats.status,
                    media_files_count: databaseStats.media_files_count,
                    command_logs_count: databaseStats.command_logs_count,
                    generated_outputs_count: databaseStats.generated_outputs_count,
                    result: databaseStats,
                  },
                  'database-stats-json',
                  'Copied Database Stats JSON to clipboard.',
                )
              }
              disabled={isBusy || !databaseStats}
            >
              {copiedParserLogJsonKey === 'database-stats-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'database-stats-json'
                  ? 'Copy failed'
                  : 'Copy Database Stats JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'database_statistics',
                    downloaded_at: new Date().toISOString(),
                    status: databaseStats.status,
                    media_files_count: databaseStats.media_files_count,
                    command_logs_count: databaseStats.command_logs_count,
                    generated_outputs_count: databaseStats.generated_outputs_count,
                    result: databaseStats,
                  },
                  `database_stats_media-${databaseStats.media_files_count}_commands-${databaseStats.command_logs_count}_outputs-${databaseStats.generated_outputs_count}.json`,
                  'Downloaded Database Stats JSON.',
                  'download-database-stats-json',
                )
              }
              disabled={isBusy || !databaseStats}
              data-testid="download-database-stats-json"
            >
              {downloadedParserLogJsonKey === 'download-database-stats-json'
                ? 'Downloaded!'
                : 'Download Database Stats JSON'}
            </button>

            <button
              className="secondary-button view-clear-button"
              onClick={onClearDatabaseStats}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span>Status</span>
              <strong>{databaseStats.status}</strong>
            </div>

            <div className="stat-item">
              <span>Uploaded media</span>
              <strong>{databaseStats.media_files_count}</strong>
            </div>

            <div className="stat-item">
              <span>Command logs</span>
              <strong>{databaseStats.command_logs_count}</strong>
            </div>

            <div className="stat-row">
              <span>Generated outputs</span>
              <strong>{databaseStats.generated_outputs_count}</strong>
            </div>
          </div>
        </>
      )}

      {detectionSummary && (
        <div className="detection-summary">
          <div className="view-panel-header">
            <h3>Detection Summary</h3>
            <button
              className="secondary-button view-clear-button"
              onClick={onClearDetectionSummary}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <div className="summary-total">
            <span>Total stored detections</span>
            <strong>{detectionSummary.total_detections}</strong>
          </div>

          {detectionSummary.classes.length > 0 ? (
            <div className="summary-class-list">
              {detectionSummary.classes.map((item) => (
                <div className="summary-class-item" key={item.class_name}>
                  <div>
                    <strong>{item.class_name}</strong>
                    <p>{item.count} detection(s)</p>
                  </div>

                  <div>
                    <span>Avg: {(item.average_confidence * 100).toFixed(1)}%</span>
                    <span>Max: {(item.max_confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No detection summary available yet. Run YOLO detection first.</p>
          )}
        </div>
      )}

      {inferenceSummary && (
        <div className="inference-summary">
          <div className="view-panel-header">
            <h3>Inference Summary</h3>
            <button
              className="secondary-button view-clear-button"
              onClick={onClearInferenceSummary}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <div className="loaded-panel-actions">
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'inference_summary',
                    copied_at: new Date().toISOString(),
                    status: inferenceSummary.status,
                    total_inferences: inferenceSummary.total_inferences,
                    average_inference_time_ms: inferenceSummary.average_inference_time_ms,
                    max_inference_time_ms: inferenceSummary.max_inference_time_ms,
                    total_detections: inferenceSummary.total_detections,
                    average_detections_per_run: inferenceSummary.average_detections_per_run,
                    by_endpoint: inferenceSummary.by_endpoint,
                    result: inferenceSummary,
                  },
                  'inference-summary-json',
                  'Copied Inference Summary JSON to clipboard.',
                )
              }
              disabled={isBusy || !inferenceSummary}
            >
              {copiedParserLogJsonKey === 'inference-summary-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'inference-summary-json'
                  ? 'Copy failed'
                  : 'Copy Inference Summary JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'inference_summary',
                    downloaded_at: new Date().toISOString(),
                    status: inferenceSummary.status,
                    total_inferences: inferenceSummary.total_inferences,
                    average_inference_time_ms: inferenceSummary.average_inference_time_ms,
                    max_inference_time_ms: inferenceSummary.max_inference_time_ms,
                    total_detections: inferenceSummary.total_detections,
                    average_detections_per_run: inferenceSummary.average_detections_per_run,
                    by_endpoint: inferenceSummary.by_endpoint,
                    result: inferenceSummary,
                  },
                  `inference_summary_runs-${inferenceSummary.total_inferences}_detections-${inferenceSummary.total_detections}.json`,
                  'Downloaded Inference Summary JSON.',
                  'download-inference-summary-json',
                )
              }
              disabled={isBusy || !inferenceSummary}
              data-testid="download-inference-summary-json"
            >
              {downloadedParserLogJsonKey === 'download-inference-summary-json'
                ? 'Downloaded!'
                : 'Download Inference Summary JSON'}
            </button>
          </div>

          <div className="inference-summary-grid">
            <div className="stat-item">
              <span>Total runs</span>
              <strong>{inferenceSummary.total_inferences}</strong>
            </div>

            <div className="stat-item">
              <span>Avg time</span>
              <strong>{inferenceSummary.average_inference_time_ms.toFixed(2)} ms</strong>
            </div>

            <div className="stat-item">
              <span>Max time</span>
              <strong>{inferenceSummary.max_inference_time_ms.toFixed(2)} ms</strong>
            </div>

            <div className="stat-item">
              <span>Total detections</span>
              <strong>{inferenceSummary.total_detections}</strong>
            </div>

            <div className="stat-item">
              <span>Avg detections/run</span>
              <strong>{inferenceSummary.average_detections_per_run.toFixed(2)}</strong>
            </div>
          </div>

          {inferenceSummary.by_endpoint.length > 0 ? (
            <div className="summary-class-list">
              {inferenceSummary.by_endpoint.map((item) => (
                <div className="summary-class-item" key={item.source_endpoint}>
                  <div>
                    <strong>{item.source_endpoint}</strong>
                    <p>{item.run_count} run(s)</p>
                  </div>

                  <div>
                    <span>Avg time: {item.average_inference_time_ms.toFixed(2)} ms</span>
                    <span>Max time: {item.max_inference_time_ms.toFixed(2)} ms</span>
                    <span>Total detections: {item.total_detections}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No inference summary available yet. Run YOLO detection first.</p>
          )}
        </div>
      )}

      {inferenceLogs.length > 0 && (
        <div className="inference-history">
          <div className="view-panel-header">
            <h3>Recent Model Inference Logs</h3>
            <button
              className="secondary-button view-clear-button"
              onClick={onClearInferenceLogs}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          {inferenceLogs.map((log, index) => (
            <div className="inference-log-item" key={`${log.filename}-${log.created_at}-${index}`}>
              <div>
                <strong>{log.model_name}</strong>
                <p>{new Date(log.created_at).toLocaleString()}</p>
                <p>{log.filename}</p>
              </div>

              <div className="inference-log-meta">
                <span>Endpoint: {log.source_endpoint}</span>
                <span>Detections: {log.detection_count}</span>
                <span>Inference time: {log.inference_time_ms.toFixed(2)} ms</span>
                <span>Threshold: {(log.confidence_threshold * 100).toFixed(0)}%</span>
                {log.class_filter && <span>Class filter: {log.class_filter}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {detectionLogs.length > 0 && (
        <div className="detection-history">
          <div className="view-panel-header">
            <h3>Recent Detection History</h3>
            <button
              className="secondary-button view-clear-button"
              onClick={onClearDetectionLogs}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          {detectionLogs.map((detection, index) => (
            <div className="detection-log-item" key={`${detection.filename}-${detection.created_at}-${index}`}>
              <div>
                <strong>{detection.class_name}</strong>
                <p>{new Date(detection.created_at).toLocaleString()}</p>
                <p>{detection.filename}</p>
              </div>

              <div className="detection-log-meta">
                <span>Confidence: {(detection.confidence * 100).toFixed(1)}%</span>
                <span>Threshold: {(detection.confidence_threshold * 100).toFixed(0)}%</span>
                <span>Source: {detection.source_endpoint}</span>
                {detection.class_filter && <span>Filter: {detection.class_filter}</span>}
                <span>
                  Box: x1 {detection.bbox.x1}, y1 {detection.bbox.y1}, x2 {detection.bbox.x2}, y2 {detection.bbox.y2}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
