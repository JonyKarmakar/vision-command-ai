import type { RefObject } from 'react'

type ParsedCommand = {
  action: string
  class_name?: string | null
}

type CommandResult = {
  parser_mode: string
  parser_type?: string | null
  parser_version?: string | null
  parsed_command: ParsedCommand
  result_type: string
  result: unknown
}

type ZoomResult = {
  filename: string
  source?: string | null
  zoomed_filename: string
  zoomed_file_url: string
  class_name: string
  target_scope?: string | null
  zoom_box: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  output_size: {
    width: number
    height: number
  }
}

type CommandResultSectionProps = {
  commandResult: CommandResult | null
  commandResultRef: RefObject<HTMLDivElement | null>
  activeGeneratedImageFilename: string | null
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  isDeveloperMode: boolean
  onCopyJson: (
    data: unknown,
    key: string,
    successMessage?: string,
  ) => void | Promise<void>
  onDownloadJson: (
    data: unknown,
    filename: string,
    successMessage: string,
    downloadKey?: string,
  ) => void
  onClearCommandResult: () => void
  onDetectZoomedImage: (result: ZoomResult) => void | Promise<void>
}

export function CommandResultSection({
  commandResult,
  commandResultRef,
  activeGeneratedImageFilename,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  isDeveloperMode,
  onCopyJson,
  onDownloadJson,
  onClearCommandResult,
  onDetectZoomedImage,
}: CommandResultSectionProps) {
  if (!commandResult) {
    return null
  }

  return (
    <div className="command-result" ref={commandResultRef}>
      <h3>Assistant result</h3>

      <div className={isDeveloperMode ? 'loaded-panel-actions' : 'loaded-panel-actions result-management-actions'}>
        {isDeveloperMode && (
          <>
            <button
              className="secondary-button"
          onClick={() =>
            void onCopyJson(
              {
                source: 'command_result',
                copied_at: new Date().toISOString(),
                parser_mode: commandResult.parser_mode,
                parser_type: commandResult.parser_type ?? null,
                parser_version: commandResult.parser_version ?? null,
                parsed_action: commandResult.parsed_command.action,
                result_type: commandResult.result_type,
                result: commandResult,
              },
              'command-result-json',
              'Copied Command Result JSON to clipboard.',
            )
          }
          disabled={isBusy || !commandResult}
        >
          {copiedParserLogJsonKey === 'command-result-json'
            ? 'Copied!'
            : failedParserLogJsonKey === 'command-result-json'
              ? 'Copy failed'
              : 'Copy Command Result JSON'}
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            onDownloadJson(
              {
                source: 'command_result',
                downloaded_at: new Date().toISOString(),
                parser_mode: commandResult.parser_mode,
                parser_type: commandResult.parser_type ?? null,
                parser_version: commandResult.parser_version ?? null,
                parsed_action: commandResult.parsed_command.action,
                result_type: commandResult.result_type,
                result: commandResult,
              },
              `command_result_action-${commandResult.parsed_command.action.replace(/[^a-z0-9]+/gi, '-')}_result-${commandResult.result_type.replace(/[^a-z0-9]+/gi, '-')}.json`,
              'Downloaded Command Result JSON.',
              'download-command-result-json',
            )
          }
          disabled={isBusy || !commandResult}
          data-testid="download-command-result-json"
        >
          {downloadedParserLogJsonKey === 'download-command-result-json'
            ? 'Downloaded!'
            : 'Download Command Result JSON'}
        </button>

          </>
        )}

        <button
          className="secondary-button view-clear-button"
          onClick={onClearCommandResult}
          disabled={isBusy}
        >
          {isDeveloperMode ? 'Clear View' : 'Clear result'}
        </button>
      </div>

      {isDeveloperMode && (
        <>
          <p><strong>Parser mode:</strong> {commandResult.parser_mode}</p>
          {commandResult.parser_type && (
            <p><strong>Parser type:</strong> {commandResult.parser_type}</p>
          )}
          {commandResult.parser_version && (
            <p><strong>Parser version:</strong> {commandResult.parser_version}</p>
          )}
          <p><strong>Parsed action:</strong> {commandResult.parsed_command.action}</p>
          {commandResult.parsed_command.class_name && (
            <p><strong>Parsed class:</strong> {commandResult.parsed_command.class_name}</p>
          )}
          <p><strong>Result type:</strong> {commandResult.result_type}</p>
        </>
      )}

      {commandResult.result_type === 'zoom_by_class' && (
        <div className="command-result-output">
          {(() => {
            const result = commandResult.result as ZoomResult
            const zoomOriginalSource =
              result.source ??
              (activeGeneratedImageFilename === result.filename ? 'outputs' : 'uploads')
            const zoomOriginalFileUrl =
              zoomOriginalSource === 'outputs'
                ? `/media/outputs/${encodeURIComponent(result.filename)}`
                : `/media/uploads/${encodeURIComponent(result.filename)}`

            return (
              <>
                <p><strong>Zoomed object:</strong> {result.class_name}</p>
                {result.target_scope && (
                  <p><strong>Target:</strong> {result.target_scope}</p>
                )}

                {isDeveloperMode && (
                  <>
                    <p><strong>Zoomed file:</strong> {result.zoomed_filename}</p>
                    <p>
                      <strong>Zoom box:</strong>{' '}
                      x1={Math.round(result.zoom_box.x1)}, y1={Math.round(result.zoom_box.y1)},{' '}
                      x2={Math.round(result.zoom_box.x2)}, y2={Math.round(result.zoom_box.y2)}
                    </p>
                    <p>
                      <strong>Output size:</strong>{' '}
                      {result.output_size.width} × {result.output_size.height}
                    </p>
                  </>
                )}

                <div className={isDeveloperMode ? 'loaded-panel-actions' : 'loaded-panel-actions result-output-actions'}>
                  <a
                    className="secondary-button zoom-image-action-link"
                    href={result.zoomed_file_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open zoomed image
                  </a>

                  <a
                    className="secondary-button zoom-image-action-link"
                    href={result.zoomed_file_url}
                    download={result.zoomed_filename}
                  >
                    Download zoomed image
                  </a>

                  <button
                    type="button"
                    className="secondary-button zoom-image-action-link"
                    onClick={() => void onDetectZoomedImage(result)}
                  >
                    {isDeveloperMode ? 'Detect objects in zoomed image' : 'Detect objects'}
                  </button>
                </div>

                <div className="zoom-comparison-grid">
                  <div className="zoom-original-card">
                    <div className="zoom-card-header">
                      <span>Original</span>
                      <strong>Zoom region</strong>
                    </div>

                    <div className="zoom-original-frame">
                      <img
                        src={zoomOriginalFileUrl}
                        alt={`Original ${result.class_name}`}
                      />
                      <span
                        className="zoom-region-box"
                        style={{
                          left: `${(result.zoom_box.x1 / result.output_size.width) * 100}%`,
                          top: `${(result.zoom_box.y1 / result.output_size.height) * 100}%`,
                          width: `${((result.zoom_box.x2 - result.zoom_box.x1) / result.output_size.width) * 100}%`,
                          height: `${((result.zoom_box.y2 - result.zoom_box.y1) / result.output_size.height) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="zoomed-image-card">
                    <div className="zoom-card-header">
                      <span>Zoomed output</span>
                      <strong>{result.class_name}</strong>
                    </div>

                    <div className="zoomed-image-frame">
                      <img
                        src={result.zoomed_file_url}
                        alt={`Zoomed ${result.class_name}`}
                      />
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
