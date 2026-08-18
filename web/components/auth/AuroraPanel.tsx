'use client'

export function AuroraPanel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="aurora-bg absolute inset-0" />
      <div className="absolute inset-0 bg-background/60" />
      {children}
    </div>
  )
}
