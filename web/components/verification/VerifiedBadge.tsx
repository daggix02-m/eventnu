import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Gold verification seal. Rendered next to a profile or organizer name once an
 * account has been verified by the admin (the silent surprise upgrade).
 */
export function VerifiedBadge({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <span
      title="Verified by Event Nu"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 font-mono font-bold uppercase tracking-wider text-amber-300',
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        className,
      )}
    >
      <BadgeCheck className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      Verified
    </span>
  )
}
