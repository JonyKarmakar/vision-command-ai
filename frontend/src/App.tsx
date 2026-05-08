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

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
    setUploadResult(null)
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

  const uploadedImageUrl = uploadResult
    ? `/api${uploadResult.file_url}`
    : null

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">VisionCommand AI</p>
        <h1>AI Vision Upload Studio</h1>
        <p className="subtitle">
          Upload an image and send it to the FastAPI backend. The backend saves the image and returns image metadata.
        </p>
      </section>

      <section className="card">
        <h2>Upload Image</h2>

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

        <button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>

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
            <h2>Preview</h2>
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
    </main>
  )
}

export default App
