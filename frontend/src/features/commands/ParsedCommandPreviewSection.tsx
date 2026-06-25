import type { RefObject } from 'react'

type ParsedCommandPreviewResult = {
  command: string
  parser_mode?: string | null
  parser_type?: string | null
  parser_version?: string | null
  parsed_command: Record<string, unknown>
}

type ParsedCommandValidationResult = {
  status: string
  validated_command: Record<string, unknown>
}

type ParsedCommandPreviewSectionProps = {
  commandParseResult: ParsedCommandPreviewResult | null
  parsedCommandValidationResult: ParsedCommandValidationResult | null
  parsedCommandPreviewRef: RefObject<HTMLDivElement | null>
  parsedCommandValidationRef: RefObject<HTMLDivElement | null>
  copiedParserLogJsonKey: string
  failedParserLogJsonKey: string
  downloadedParserLogJsonKey: string
  isBusy: boolean
  isValidatingParsedCommand: boolean
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
  onValidateParsedCommand: () => void | Promise<void>
  onClearParsedCommandPreview: () => void
  onClearParsedCommandValidation: () => void
}

export function ParsedCommandPreviewSection({
  commandParseResult,
  parsedCommandValidationResult,
  parsedCommandPreviewRef,
  parsedCommandValidationRef,
  copiedParserLogJsonKey,
  failedParserLogJsonKey,
  downloadedParserLogJsonKey,
  isBusy,
  isValidatingParsedCommand,
  onCopyJson,
  onDownloadJson,
  onValidateParsedCommand,
  onClearParsedCommandPreview,
  onClearParsedCommandValidation,
}: ParsedCommandPreviewSectionProps) {
  return (
    <>
      {commandParseResult && (
        <div className="command-parse-result" ref={parsedCommandPreviewRef}>
          <h3>Parsed Command Preview</h3>

          <div className="loaded-panel-actions">
            <button
              className="secondary-button"
              onClick={() =>
                void onCopyJson(
                  {
                    source: 'parsed_command_preview',
                    copied_at: new Date().toISOString(),
                    command: commandParseResult.command,
                    parser_mode: commandParseResult.parser_mode ?? null,
                    parser_type: commandParseResult.parser_type ?? null,
                    parser_version: commandParseResult.parser_version ?? null,
                    preview: commandParseResult,
                  },
                  'parsed-command-preview-json',
                  'Copied Parsed Command Preview JSON to clipboard.',
                )
              }
              disabled={isBusy || !commandParseResult}
            >
              {copiedParserLogJsonKey === 'parsed-command-preview-json'
                ? 'Copied!'
                : failedParserLogJsonKey === 'parsed-command-preview-json'
                  ? 'Copy failed'
                  : 'Copy Parsed Command Preview JSON'}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                onDownloadJson(
                  {
                    source: 'parsed_command_preview',
                    downloaded_at: new Date().toISOString(),
                    command: commandParseResult.command,
                    parser_mode: commandParseResult.parser_mode ?? null,
                    parser_type: commandParseResult.parser_type ?? null,
                    parser_version: commandParseResult.parser_version ?? null,
                    preview: commandParseResult,
                  },
                  `parsed_command_preview_mode-${commandParseResult.parser_mode ?? 'unknown'}_version-${(commandParseResult.parser_version ?? 'unknown').replace(/[^a-z0-9]+/gi, '-')}.json`,
                  'Downloaded Parsed Command Preview JSON.',
                  'download-parsed-command-preview-json',
                )
              }
              disabled={isBusy || !commandParseResult}
              data-testid="download-parsed-command-preview-json"
            >
              {downloadedParserLogJsonKey === 'download-parsed-command-preview-json'
                ? 'Downloaded!'
                : 'Download Parsed Command Preview JSON'}
            </button>

            <button
              className="secondary-button view-clear-button"
              onClick={onClearParsedCommandPreview}
              disabled={isBusy}
            >
              Clear View
            </button>
          </div>

          <p><strong>Original command:</strong> {commandParseResult.command}</p>
          {commandParseResult.parser_mode && (
            <p><strong>Parser mode:</strong> {commandParseResult.parser_mode}</p>
          )}
          {commandParseResult.parser_type && (
            <p><strong>Parser type:</strong> {commandParseResult.parser_type}</p>
          )}
          {commandParseResult.parser_version && (
            <p><strong>Parser version:</strong> {commandParseResult.parser_version}</p>
          )}

          <div className="parse-field-list">
            {Object.entries(commandParseResult.parsed_command).map(([key, value]) => (
              <div className="parse-field" key={key}>
                <span>{key}</span>
                <strong>{value === null || value === undefined ? 'null' : String(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {commandParseResult && (
        <div className="parsed-command-validation-panel" ref={parsedCommandValidationRef}>
          <h3>Parsed Command Validation</h3>
          <p className="small-note">
            Validate the structured JSON before it is passed to the execution layer.
          </p>

          <button
            className="secondary-button"
            onClick={() => void onValidateParsedCommand()}
            disabled={isBusy || !commandParseResult}
          >
            {isValidatingParsedCommand ? 'Validating...' : 'Validate Parsed Command'}
          </button>

          {parsedCommandValidationResult && (
            <div className="validation-result">
              <p><strong>Status:</strong> {parsedCommandValidationResult.status}</p>

              <div className="loaded-panel-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    void onCopyJson(
                      {
                        source: 'parsed_command_validation',
                        copied_at: new Date().toISOString(),
                        status: parsedCommandValidationResult.status,
                        validation: parsedCommandValidationResult,
                      },
                      'parsed-command-validation-json',
                      'Copied Parsed Command Validation JSON to clipboard.',
                    )
                  }
                  disabled={isBusy || !parsedCommandValidationResult}
                >
                  {copiedParserLogJsonKey === 'parsed-command-validation-json'
                    ? 'Copied!'
                    : failedParserLogJsonKey === 'parsed-command-validation-json'
                      ? 'Copy failed'
                      : 'Copy Validation JSON'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    onDownloadJson(
                      {
                        source: 'parsed_command_validation',
                        downloaded_at: new Date().toISOString(),
                        status: parsedCommandValidationResult.status,
                        validation: parsedCommandValidationResult,
                      },
                      `parsed_command_validation_status-${parsedCommandValidationResult.status.replace(/[^a-z0-9]+/gi, '-')}.json`,
                      'Downloaded Parsed Command Validation JSON.',
                      'download-parsed-command-validation-json',
                    )
                  }
                  disabled={isBusy || !parsedCommandValidationResult}
                  data-testid="download-parsed-command-validation-json"
                >
                  {downloadedParserLogJsonKey === 'download-parsed-command-validation-json'
                    ? 'Downloaded!'
                    : 'Download Validation JSON'}
                </button>

                <button
                  className="secondary-button view-clear-button"
                  onClick={onClearParsedCommandValidation}
                  disabled={isBusy}
                >
                  Clear View
                </button>
              </div>

              <div className="parse-field-list">
                {Object.entries(parsedCommandValidationResult.validated_command).map(([key, value]) => (
                  <div className="parse-field" key={key}>
                    <span>{key}</span>
                    <strong>{value === null || value === undefined ? 'null' : String(value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
