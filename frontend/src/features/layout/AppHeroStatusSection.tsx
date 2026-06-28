type AppHeroStatusSectionProps = {
  isBusy: boolean
  statusMessage: string
}

export function AppHeroStatusSection({ isBusy, statusMessage }: AppHeroStatusSectionProps) {
  return (
    <>
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
    </>
  )
}
