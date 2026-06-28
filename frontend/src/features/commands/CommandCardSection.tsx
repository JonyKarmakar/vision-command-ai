import type { ReactNode } from 'react'

type CommandCardSectionProps = {
  children: ReactNode
}

export function CommandCardSection({ children }: CommandCardSectionProps) {
  return (
    <section className="card command-card">
      <h2>Command Box</h2>
      <p className="section-description">
        Use presets, typed commands, voice input, planner tools, parser diagnostics, and command history from one workspace.
      </p>

      {children}
    </section>
  )
}
