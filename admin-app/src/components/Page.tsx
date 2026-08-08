import { cn } from '@/lib/utils'

export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('animate-ink-in space-y-8', className)}>{children}</div>
}

export function PageHeader({
  title,
  description,
  folio,
  actions,
}: {
  title: string
  description?: string
  folio?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && <p className="text-muted-foreground mt-1.5">{description}</p>}
        {folio && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1.5">
            {folio}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
