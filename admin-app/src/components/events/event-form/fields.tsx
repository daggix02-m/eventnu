import type { ReactNode } from 'react'

export function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-outline-variant pb-3 mb-5">
      <span className="font-mono text-[10px] tracking-widest text-primary">{index}</span>
      <h3 className="font-headline text-base font-semibold text-foreground">{title}</h3>
    </div>
  )
}

export function SubSectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2 pb-2 mb-3">
      <span className="font-mono text-[10px] tracking-widest text-primary">{index}</span>
      <h4 className="font-headline text-sm font-semibold text-foreground">{title}</h4>
    </div>
  )
}

export function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
