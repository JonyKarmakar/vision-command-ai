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
  detections: Detection[]
  detection_count: number
  annotated_filename: string
  annotated_file_url: string
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [detectionResult, setDetectionResult] = useState<DetectionResponse | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setUploadResult(null)
    setDetectionResult(null)
    setError(null)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
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

      const response = await fetch(
        `/api/vision/detect/${uploadResult.stored_filename}/annotated`,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsDetecting(false)
    }
  }

  const uploadedImageUrl = uploadResult ? `/api${uploadResult.file_url}` : null

  const annotatedImageUrl = detectionResult
    ? `/api${detectionResult.annotated_file_url}`
    : null

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">VisionCommand AI</p>
        <h1>AI Vision Detection Studio</h1>
        <p className="subtitle">
          Upload an image, send it to the FastAPI backend, run YOLO object detection,
          and view the annotated result.
        </p>
      </section>

      <section className="card">
        <h2>1. Upload Image</h2>

        <input
          className="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        {selectedFile && (
          <p className="selected-file">
            Selected: <strong>{selectedFile.name}</strong>
          </p>
        )}

        <div className="button-row">
          <button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </button>

          <button
            className="secondary-button"
            onClick={handleDetection}
            disabled={!uploadResult || isDetecting}
          >
            {isDetecting ? 'Detecting...' : 'Run YOLO Detection'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      {uploadResult && (
        <section className="result-grid">
          <div className="card">
            <h2>Upload Result</h2>
            <p><strong>Original filename:</strong> {uploadResult.original_filename}</p>
            <p><strong>Stored filename:</strong> {uploadResult.stored_filename}</p>
            <p><strong>Content type:</strong> {uploadResult.content_type}</p>
            <p><strong>Width:</strong> {uploadResult.width}px</p>
            <p><strong>Height:</strong> {uploadResult.height}px</p>
          </div>

          <div className="card">
            <h2>Original Preview</h2>
            {uploadedImageUrl && (
              <img
                className="preview-image"
                src={uploadedImageUrl}
                alt={uploadResult.original_filename}
              />
            )}
          </div>
        </section>
      )}

      {detectionResult && (
        <section className="result-grid">
          <div className="card">
            <h2>Detection Result</h2>
            <p><strong>Detection count:</strong> {detectionResult.detection_count}</p>
            <p><strong>Annotated filename:</strong> {detectionResult.annotated_filename}</p>

            {detectionResult.detections.length > 0 ? (
              <div className="detections-list">
                {detectionResult.detections.map((detection, index) => (
                  <div className="detection-item" key={`${detection.class_name}-${index}`}>
                    <strong>{index + 1}. {detection.class_name}</strong>
                    <span>Confidence: {(detection.confidence * 100).toFixed(1)}%</span>
                    <span>
                      Box: x1 {detection.bbox.x1}, y1 {detection.bbox.y1}, x2 {detection.bbox.x2}, y2 {detection.bbox.y2}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No objects detected.</p>
            )}
          </div>

          <div className="card">
            <h2>Annotated Output</h2>
            {annotatedImageUrl && (
              <img
                className="preview-image"
                src={annotatedImageUrl}
                alt="YOLO annotated output"
              />
            )}
          </div>
        </section>
      )}
    </main>
  )
}

export default App
