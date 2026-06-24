import type { GeneratedOutputHistoryItem } from './generatedOutputTypes'

type GeneratedOutputItemCardProps = {
  item: GeneratedOutputHistoryItem
  isActive: boolean
  isDetailsExpanded: boolean
  isBusy: boolean
  isLoadingGeneratedOutputHistory: boolean
  onUseAsActiveImage: (item: GeneratedOutputHistoryItem) => void
  onRunYolo: (item: GeneratedOutputHistoryItem) => void
  onToggleDetails: (itemId: string) => void
  onRemove: (item: GeneratedOutputHistoryItem) => void
}

export function GeneratedOutputItemCard({
  item,
  isActive,
  isDetailsExpanded,
  isBusy,
  isLoadingGeneratedOutputHistory,
  onUseAsActiveImage,
  onRunYolo,
  onToggleDetails,
  onRemove,
}: GeneratedOutputItemCardProps) {
  const outputUrl = `/api${item.file_url}`

  return (
    <div className="generated-output-item">
      <a
        className="generated-output-thumbnail"
        href={outputUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${item.label}`}
      >
        <img src={outputUrl} alt={item.label} loading="lazy" />
      </a>

      <div className="generated-output-details">
        <span className="generated-output-action">
          {item.action.replace(/_/g, ' ')}
        </span>
        <strong>{item.label}</strong>
        <p className="generated-output-filename">{item.filename}</p>
        <p className="generated-output-summary">
          {item.created_by ?? 'Unknown'}
          {item.command_text ? ` · ${item.command_text}` : ''}
          {' · '}
          {new Date(item.created_at).toLocaleTimeString()}
        </p>

        {isActive && (
          <p className="generated-output-active-note">Active image source for commands</p>
        )}

        {isDetailsExpanded && (
          <div className="generated-output-extra-details">
            <p className="small-note">
              Source: {item.source ?? 'unknown'}
              {item.source_filename ? ` · ${item.source_filename}` : ''}
            </p>

            <div className="generated-output-metadata">
              <span className="generated-output-metadata-title">Metadata</span>
              <p><strong>Created by:</strong> {item.created_by ?? 'Unknown'}</p>
              {item.command_text && (
                <p><strong>Command:</strong> {item.command_text}</p>
              )}
              {item.result_type && (
                <p><strong>Result type:</strong> {item.result_type}</p>
              )}
              {item.execution_mode && (
                <p><strong>Mode:</strong> {item.execution_mode}</p>
              )}
              {item.parser_mode && (
                <p><strong>Parser:</strong> {item.parser_mode}</p>
              )}
              {item.planner_mode && (
                <p><strong>Planner:</strong> {item.planner_mode}</p>
              )}
              <p><strong>Created:</strong> {new Date(item.created_at).toLocaleString()}</p>
            </div>

            <div className="generated-output-lineage">
              <span className="generated-output-lineage-title">Lineage</span>
              <p>
                {(item.source ?? 'unknown') === 'outputs'
                  ? 'Generated output'
                  : 'Uploaded image'}
                {item.source_filename ? ` → ${item.source_filename}` : ''}
              </p>
              <p>
                {item.action.replace(/_/g, ' ')} → {item.filename}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="output-actions generated-output-actions">
        <a href={outputUrl} target="_blank" rel="noreferrer">
          Open
        </a>
        <a href={outputUrl} download={item.filename}>
          Download
        </a>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onUseAsActiveImage(item)}
          disabled={isBusy}
        >
          Use as Active Image
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onRunYolo(item)}
          disabled={isBusy}
        >
          Run YOLO
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onToggleDetails(item.id)}
          disabled={isBusy}
        >
          {isDetailsExpanded ? 'Hide details' : 'Details'}
        </button>

        <button
          type="button"
          className="secondary-button view-clear-button"
          onClick={() => onRemove(item)}
          disabled={isBusy || isLoadingGeneratedOutputHistory}
        >
          Remove
        </button>
      </div>
    </div>
  )
}
