import type { ReactNode } from 'react'

type CommandCardSectionProps = {
  children: ReactNode
  isDeveloperMode: boolean
}

export function CommandCardSection({ children, isDeveloperMode }: CommandCardSectionProps) {
  return (
    <section className="card command-card">
      <div className="assistant-card-heading">
        <p className="eyebrow">
          {isDeveloperMode ? 'Command Workspace' : 'AI Assistant'}
        </p>
        <h2>{isDeveloperMode ? 'Command Box' : 'Ask VisionCommand AI'}</h2>
        <p className="section-description">
          {isDeveloperMode
            ? 'Use presets, typed commands, voice input, planner tools, parser diagnostics, and command history from one workspace.'
            : 'Describe what you want to do with the uploaded media. Use natural commands or voice input to edit, inspect, or prepare outputs.'}
        </p>
      </div>

      {!isDeveloperMode && (
        <div className="assistant-example-strip" aria-label="Example assistant commands">
          <span>Try:</span>
          <code>detect objects</code>
          <code>blur person</code>
          <code>zoom left person</code>
          <code>extract frame at 1 second</code>
        </div>
      )}

      {children}
    </section>
  )
}
