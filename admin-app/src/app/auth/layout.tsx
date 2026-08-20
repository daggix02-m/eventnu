import type { ReactNode } from 'react'

function LogoBlock() {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className="w-12 h-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-headline font-bold text-lg shadow-sm">
        En
      </div>
      <div className="text-left">
        <h1 className="font-headline text-xl font-semibold text-foreground tracking-tight">
          Event Nu
        </h1>
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Admin · Addissuite
        </p>
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <div className="w-full max-w-md">
        <LogoBlock />
        {children}
        <p className="text-center text-xs text-muted-foreground mt-6">Admin access only.</p>
      </div>
    </div>
  )
}
