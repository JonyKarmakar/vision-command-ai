type AppHeroStatusSectionProps = {
  isBusy: boolean
  statusMessage: string
}

export function AppHeroStatusSection({ isBusy, statusMessage }: AppHeroStatusSectionProps) {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">VisionCommand AI</p>
        <h1>VisionCommand AI Assistant</h1>
        <p className="subtitle">
          Upload images or videos, ask with text or voice, and run AI-powered detection, editing, and workflow tools from one assistant workspace.
        </p>
      </section>

      <section className="status-card">
        <span className={isBusy ? 'status-dot active' : 'status-dot'} />
        <p>{statusMessage}</p>
      </section>
    </>
  )
}
