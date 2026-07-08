import type { ReactNode } from 'react'

type CommandCardSectionProps = {
  children: ReactNode
  isDeveloperMode: boolean
}

export function CommandCardSection({ children, isDeveloperMode }: CommandCardSectionProps) {
  return (
    <section
      className={`card command-card ${
        isDeveloperMode ? 'developer-command-card' : 'assistant-command-card'
      }`}
    >
      <div className="assistant-card-heading">
        <p className="eyebrow">
          {isDeveloperMode ? 'Command Workspace' : 'AI Assistant'}
        </p>
        <h2>{isDeveloperMode ? 'Command Box' : 'Ask VisionCommand AI'}</h2>
        <p className="section-description">
          {isDeveloperMode
            ? 'Use presets, typed commands, voice input, planner tools, parser diagnostics, and command history from one workspace.'
            : 'Tell the assistant what to do with the current image or video. Type naturally, use voice, or choose a quick action.'}
        </p>
      </div>

      {!isDeveloperMode && (
        <>
          <div className="assistant-flow-hints" aria-label="Assistant workflow">
            <span>1. Current media is ready</span>
            <span>2. Ask or speak a command</span>
            <span>3. Review the result</span>
          </div>

          <div className="assistant-example-strip" aria-label="Example assistant commands">
            <span>Try:</span>
            <code>detect objects</code>
            <code>blur all people</code>
            <code>zoom into the biggest person</code>
            <code>extract frame at 1 second</code>
          </div>
        </>
      )}

      {children}
    </section>
  )
}
