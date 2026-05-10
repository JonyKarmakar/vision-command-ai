import { useState } from 'react'
import './App.css'

type UploadResponse = {
  message: string
  original_filename: string
  stored_filename: string
  content_type: string
  width: number
  height: number
  storage_path: string
  file_url: string
}

type Detection = {
  class_id: number
  class_name: string
  confidence: number
  bbox: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

type DetectionResponse = {
  filename: string
  confidence_threshold: number
  class_filter: string | null
  detections: Detection[]
  detection_count: number
  annotated_filename: string
  annotated_file_url: string
}

type CropResponse = {
  filename: string
  class_name?: string
  confidence_threshold?: number
  selected_detection?: Detection
  cropped_filename: string
  cropped_file_url: string
  crop_box: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

type BlurResponse = {
  filename: string
  blurred_filename: string
  blurred_file_url: string
  blur_box: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

type CommandResponse = {
  command: string
  parsed_command: {
    action: string
    class_name: string | null
  }
  result_type: 'annotated_detection' | 'crop_by_class' | 'blur_by_class'
  result: DetectionResponse | CropResponse | BlurResponse
}

type CommandLog = {
  timestamp: string
  filename: string
  command: string
  confidence_threshold: number
  parsed_action: string
  parsed_class: string | null
  result_type: string
}

type SpeechRecognitionEventLike = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [detectionResult, setDetectionResult] = useState<DetectionResponse | null>(null)
  const [cropResult, setCropResult] = useState<CropResponse | null>(null)
  const [blurResult, setBlurResult] = useState<BlurResponse | null>(null)

  const [confidenceThreshold, setConfidenceThreshold] = useState(30)
  const [selectedClass, setSelectedClass] = useState('all')
  const [classOptions, setClassOptions] = useState<string[]>([])

  const [commandText, setCommandText] = useState('')
  const [commandResult, setCommandResult] = useState<CommandResponse | null>(null)
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([])

  const [lastDetectionThreshold, setLastDetectionThreshold] = useState<number | null>(null)
  const [lastDetectionClass, setLastDetectionClass] = useState<string | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [isBlurring, setIsBlurring] = useState(false)
  const [isRunningCommand, setIsRunningCommand] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const [statusMessage, setStatusMessage] = useState<string>('Ready to upload an image.')
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setUploadResult(null)
    setDetectionResult(null)
    setCropResult(null)
    setBlurResult(null)
    setCommandResult(null)
    setSelectedClass('all')
    setClassOptions([])
    setLastDetectionThreshold(null)
    setLastDetectionClass(null)
    setError(null)
    setStatusMessage(file ? `Selected ${file.name}. Ready to upload.` : 'Ready to upload an image.')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose an image first.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      setIsUploading(true)
      setError(null)
      setDetectionResult(null)
      setCropResult(null)
      setBlurResult(null)
      setCommandResult(null)
      setSelectedClass('all')
      setClassOptions([])
      setLastDetectionThreshold(null)
      setLastDetectionClass(null)
      setStatusMessage('Uploading image to backend...')

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const data: UploadResponse = await response.json()
      setUploadResult(data)
      setStatusMessage('Upload complete. You can now run YOLO detection or type a command.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDetection = async () => {
    if (!uploadResult) {
      setError('Please upload an image first.')
      return
    }

    try {
      setIsDetecting(true)
      setError(null)
      setCropResult(null)
      setBlurResult(null)
      setCommandResult(null)
      setStatusMessage('Running YOLO detection. This may take a few seconds...')

      const backendThreshold = confidenceThreshold / 100
      const queryParams = new URLSearchParams({
        confidence_threshold: String(backendThreshold),
      })

      if (selectedClass !== 'all') {
        queryParams.set('class_filter', selectedClass)
      }

      const response = await fetch(
        `/api/vision/detect/${uploadResult.stored_filename}/annotated?${queryParams.toString()}`,
        {
          method: 'POST',
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Detection failed')
      }

      const data: DetectionResponse = await response.json()
      setDetectionResult(data)
      setLastDetectionThreshold(confidenceThreshold)
      setLastDetectionClass(selectedClass)
      setClassOptions((previousClasses) =>
        Array.from(
          new Set([
            ...previousClasses,
            ...data.detections.map((detection) => detection.class_name),
          ]),
        ).sort(),
      )
      setStatusMessage(`Detection complete. Found ${data.detection_count} object(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Detection failed.')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleCrop = async (detection: Detection) => {
    if (!uploadResult) {
      setError('Please upload an image first.')
      return
    }

    try {
      setIsCropping(true)
      setError(null)
      setCommandResult(null)
      setStatusMessage(`Cropping selected ${detection.class_name}...`)

      const response = await fetch(
        `/api/vision/crop/${uploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(detection.bbox),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Crop failed')
      }

      const data: CropResponse = await response.json()
      setCropResult(data)
      setStatusMessage('Crop complete. Cropped output is ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Crop failed.')
    } finally {
      setIsCropping(false)
    }
  }

  const handleBlur = async (detection: Detection) => {
    if (!uploadResult) {
      setError('Please upload an image first.')
      return
    }

    try {
      setIsBlurring(true)
      setError(null)
      setCommandResult(null)
      setStatusMessage(`Blurring selected ${detection.class_name}...`)

      const response = await fetch(
        `/api/vision/blur/${uploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(detection.bbox),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Blur failed')
      }

      const data: BlurResponse = await response.json()
      setBlurResult(data)
      setStatusMessage('Blur complete. Blurred output is ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Blur failed.')
    } finally {
      setIsBlurring(false)
    }
  }

  const handleCropByClass = async () => {
    if (!uploadResult) {
      setError('Please upload an image first.')
      return
    }

    if (selectedClass === 'all') {
      setError('Please select a specific class before using crop by class.')
      return
    }

    try {
      setIsCropping(true)
      setError(null)
      setCommandResult(null)
      setStatusMessage(`Cropping best ${selectedClass} by class...`)

      const response = await fetch(
        `/api/vision/crop-by-class/${uploadResult.stored_filename}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            class_name: selectedClass,
            confidence_threshold: confidenceThreshold / 100,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Crop by class failed')
      }

      const data: CropResponse = await response.json()
      setCropResult(data)
      setStatusMessage(`Crop by class complete. Best ${selectedClass} crop is ready.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Crop by class failed.')
    } finally {
      setIsCropping(false)
    }
  }

  const handleVoiceCommand = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('Voice command is not supported in this browser. Please type the command instead.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)
    setError(null)
    setStatusMessage('Listening for a voice command...')

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setCommandText(transcript)
      setStatusMessage(`Heard: "${transcript}". You can now run the command.`)
    }

    recognition.onerror = () => {
      setError('Could not recognize the voice command. Please try again or type the command.')
      setStatusMessage('Voice command failed.')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleLoadCommandLogs = async () => {
    try {
      setIsLoadingLogs(true)
      setError(null)
      setStatusMessage('Loading command history...')

      const response = await fetch('/api/commands/logs?limit=10')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Could not load command history')
      }

      const data: { count: number; logs: CommandLog[] } = await response.json()
      setCommandLogs(data.logs)
      setStatusMessage(`Loaded ${data.count} recent command log(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Could not load command history.')
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const handleCommand = async () => {
    if (!uploadResult) {
      setError('Please upload an image before running a command.')
      return
    }

    if (!commandText.trim()) {
      setError('Please type a command, for example: crop person.')
      return
    }

    try {
      setIsRunningCommand(true)
      setError(null)
      setStatusMessage(`Running command: "${commandText}"...`)

      const response = await fetch('/api/commands/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: uploadResult.stored_filename,
          command: commandText,
          confidence_threshold: confidenceThreshold / 100,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Command failed')
      }

      const data: CommandResponse = await response.json()
      setCommandResult(data)

      if (data.result_type === 'annotated_detection') {
        const result = data.result as DetectionResponse
        setDetectionResult(result)
        setCropResult(null)
        setBlurResult(null)
        setSelectedClass('all')
        setLastDetectionThreshold(confidenceThreshold)
        setLastDetectionClass('all')
        setClassOptions((previousClasses) =>
          Array.from(
            new Set([
              ...previousClasses,
              ...result.detections.map((detection) => detection.class_name),
            ]),
          ).sort(),
        )
      }

      if (data.result_type === 'crop_by_class') {
        const result = data.result as CropResponse
        setCropResult(result)
        setBlurResult(null)
      }

      if (data.result_type === 'blur_by_class') {
        const result = data.result as BlurResponse
        setBlurResult(result)
        setCropResult(null)
      }

      setStatusMessage(`Command complete: "${commandText}".`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatusMessage('Command failed.')
    } finally {
      setIsRunningCommand(false)
    }
  }

  const uploadedImageUrl = uploadResult ? `/api${uploadResult.file_url}` : null

  const annotatedImageUrl = detectionResult
    ? `/api${detectionResult.annotated_file_url}`
    : null

  const croppedImageUrl = cropResult
    ? `/api${cropResult.cropped_file_url}`
    : null

  const blurredImageUrl = blurResult
    ? `/api${blurResult.blurred_file_url}`
    : null

  const availableClasses = classOptions

  const filteredDetections = detectionResult
    ? detectionResult.detections.filter(
        (detection) =>
          detection.confidence * 100 >= confidenceThreshold &&
          (selectedClass === 'all' || detection.class_name === selectedClass),
      )
    : []

  const isBusy =
    isUploading ||
    isDetecting ||
    isCropping ||
    isBlurring ||
    isRunningCommand ||
    isLoadingLogs ||
    isListening

  const thresholdChangedAfterDetection =
    detectionResult !== null &&
    lastDetectionThreshold !== null &&
    confidenceThreshold !== lastDetectionThreshold

  const classChangedAfterDetection =
    detectionResult !== null &&
    lastDetectionClass !== null &&
    selectedClass !== lastDetectionClass

  const filtersChangedAfterDetection =
    thresholdChangedAfterDetection || classChangedAfterDetection

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">VisionCommand AI</p>
        <h1>AI Vision Detection Studio</h1>
        <p className="subtitle">
          Upload an image, run YOLO object detection, crop or blur detected objects, and use text or voice commands.
        </p>
      </section>

      <section className="status-card">
        <span className={isBusy ? 'status-dot active' : 'status-dot'} />
        <p>{statusMessage}</p>
      </section>

      <section className="card">
        <h2>1. Upload Image</h2>

        <input
          className="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isBusy}
        />

        {selectedFile && (
          <p className="selected-file">
            Selected: <strong>{selectedFile.name}</strong>
          </p>
        )}

        <div className="button-row">
          <button onClick={handleUpload} disabled={isBusy || !selectedFile}>
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </button>

          <button
            className="secondary-button"
            onClick={handleDetection}
            disabled={!uploadResult || isBusy}
          >
            {isDetecting ? 'Detecting...' : 'Run YOLO Detection'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      {uploadResult && (
        <section className="card command-card">
          <h2>Command Box</h2>
          <p className="small-note">
            Try commands like <strong>detect objects</strong>, <strong>crop person</strong>, <strong>crop bottle</strong>, or <strong>blur person</strong>.
          </p>

          <div className="command-row">
            <input
              className="command-input"
              type="text"
              value={commandText}
              placeholder="Type a command, for example: crop person"
              onChange={(event) => setCommandText(event.target.value)}
              disabled={isBusy}
            />

            <button onClick={handleCommand} disabled={isBusy || !commandText.trim()}>
              {isRunningCommand ? 'Running...' : 'Run Command'}
            </button>

            <button
              className="voice-button"
              onClick={handleVoiceCommand}
              disabled={isBusy}
            >
              {isListening ? 'Listening...' : 'Voice Command'}
            </button>
          </div>

          <div className="button-row command-history-actions">
            <button
              className="secondary-button"
              onClick={handleLoadCommandLogs}
              disabled={isBusy}
            >
              {isLoadingLogs ? 'Loading history...' : 'Load Command History'}
            </button>
          </div>

          {commandResult && (
            <div className="command-result">
              <p><strong>Parsed action:</strong> {commandResult.parsed_command.action}</p>
              {commandResult.parsed_command.class_name && (
                <p><strong>Parsed class:</strong> {commandResult.parsed_command.class_name}</p>
              )}
              <p><strong>Result type:</strong> {commandResult.result_type}</p>
            </div>
          )}

          {commandLogs.length > 0 && (
            <div className="command-history">
              <h3>Recent Command History</h3>

              {commandLogs.map((log, index) => (
                <div className="command-log-item" key={`${log.timestamp}-${index}`}>
                  <div>
                    <strong>{log.command}</strong>
                    <p>{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <span>{log.parsed_action}</span>
                    {log.parsed_class && <span> · {log.parsed_class}</span>}
                    <span> · {(log.confidence_threshold * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {uploadResult && (
        <section className="result-grid">
          <div className="card">
            <h2>2. Upload Result</h2>
            <div className="metadata-list">
              <p><strong>Original filename:</strong> {uploadResult.original_filename}</p>
              <p><strong>Stored filename:</strong> {uploadResult.stored_filename}</p>
              <p><strong>Content type:</strong> {uploadResult.content_type}</p>
              <p><strong>Width:</strong> {uploadResult.width}px</p>
              <p><strong>Height:</strong> {uploadResult.height}px</p>
            </div>
          </div>

          <div className="card">
            <h2>Original Preview</h2>
            {uploadedImageUrl && (
              <>
                <img
                  className="preview-image"
                  src={uploadedImageUrl}
                  alt={uploadResult.original_filename}
                />

                <div className="output-actions">
                  <a href={uploadedImageUrl} target="_blank" rel="noreferrer">
                    Open original
                  </a>
                  <a href={uploadedImageUrl} download={uploadResult.original_filename}>
                    Download original
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {detectionResult && (
        <section className="result-grid">
          <div className="card">
            <h2>3. Detection Result</h2>

            <div className="summary-box">
              <p><strong>Total detections:</strong> {detectionResult.detection_count}</p>
              <p><strong>Visible after filter:</strong> {filteredDetections.length}</p>
              <p><strong>Annotated filename:</strong> {detectionResult.annotated_filename}</p>
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
                onChange={(event) => setConfidenceThreshold(Number(event.target.value))}
              />
              <div className="filter-hints">
                <span>Show more</span>
                <span>Show stronger detections</span>
              </div>

              {filtersChangedAfterDetection && (
                <p className="rerun-hint">
                  Filter changed. Run YOLO Detection again to update the annotated image.
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
                onChange={(event) => setSelectedClass(event.target.value)}
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
                onClick={handleCropByClass}
                disabled={isBusy || selectedClass === 'all'}
              >
                {isCropping ? 'Cropping...' : 'Crop best selected class'}
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
                    <span>
                      Box: x1 {detection.bbox.x1}, y1 {detection.bbox.y1}, x2 {detection.bbox.x2}, y2 {detection.bbox.y2}
                    </span>
                    <div className="detection-actions">
                      <button
                        className="crop-button"
                        onClick={() => handleCrop(detection)}
                        disabled={isBusy}
                      >
                        {isCropping ? 'Cropping...' : 'Crop this object'}
                      </button>

                      <button
                        className="blur-button"
                        onClick={() => handleBlur(detection)}
                        disabled={isBusy}
                      >
                        {isBlurring ? 'Blurring...' : 'Blur this object'}
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
            <h2>Annotated Output</h2>
            <p className="small-note">
              The annotated image is generated using the selected confidence threshold and class filter.
            </p>
            {annotatedImageUrl && detectionResult && (
              <>
                <img
                  className="preview-image"
                  src={annotatedImageUrl}
                  alt="YOLO annotated output"
                />

                <div className="output-actions">
                  <a href={annotatedImageUrl} target="_blank" rel="noreferrer">
                    Open annotated
                  </a>
                  <a href={annotatedImageUrl} download={detectionResult.annotated_filename}>
                    Download annotated
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {cropResult && (
        <section className="result-grid">
          <div className="card">
            <h2>4. Crop Result</h2>
            <div className="summary-box">
              {cropResult.class_name && (
                <p><strong>Crop by class:</strong> {cropResult.class_name}</p>
              )}

              {cropResult.selected_detection && (
                <p>
                  <strong>Selected confidence:</strong> {(cropResult.selected_detection.confidence * 100).toFixed(1)}%
                </p>
              )}

              <p><strong>Cropped filename:</strong> {cropResult.cropped_filename}</p>
              <p>
                <strong>Crop box:</strong> x1 {cropResult.crop_box.x1}, y1 {cropResult.crop_box.y1}, x2 {cropResult.crop_box.x2}, y2 {cropResult.crop_box.y2}
              </p>
            </div>
          </div>

          <div className="card">
            <h2>Cropped Output</h2>
            {croppedImageUrl && cropResult && (
              <>
                <img
                  className="preview-image"
                  src={croppedImageUrl}
                  alt="Cropped object output"
                />

                <div className="output-actions">
                  <a href={croppedImageUrl} target="_blank" rel="noreferrer">
                    Open crop
                  </a>
                  <a href={croppedImageUrl} download={cropResult.cropped_filename}>
                    Download crop
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {blurResult && (
        <section className="result-grid">
          <div className="card">
            <h2>5. Blur Result</h2>
            <div className="summary-box">
              <p><strong>Blurred filename:</strong> {blurResult.blurred_filename}</p>
              <p>
                <strong>Blur box:</strong> x1 {blurResult.blur_box.x1}, y1 {blurResult.blur_box.y1}, x2 {blurResult.blur_box.x2}, y2 {blurResult.blur_box.y2}
              </p>
            </div>
          </div>

          <div className="card">
            <h2>Blurred Output</h2>
            {blurredImageUrl && blurResult && (
              <>
                <img
                  className="preview-image"
                  src={blurredImageUrl}
                  alt="Blurred object output"
                />

                <div className="output-actions">
                  <a href={blurredImageUrl} target="_blank" rel="noreferrer">
                    Open blurred
                  </a>
                  <a href={blurredImageUrl} download={blurResult.blurred_filename}>
                    Download blurred
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </main>
  )
}

export default App
