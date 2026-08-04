import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  highlight?: boolean
  trend?: string | null
  delay?: number
}

export function StatCard({ label, value, icon: Icon, highlight, trend, delay = 0 }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-card p-6 rounded-2xl shadow-sm border border-outline-variant hover:shadow-md transition-all group animate-fade-in',
        highlight && 'border-warning/50 ring-1 ring-warning/20'
      )}
      style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-surface-container-high text-muted-foreground transition-colors">
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-destructive font-bold text-xs flex items-center gap-1">
            {trend}
          </span>
        )}
        {highlight && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold tracking-tight text-foreground">{value.toLocaleString()}</p>
    </div>
  )
}
