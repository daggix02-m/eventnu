import { Badge, type BadgeProps } from '@/components/ui/badge'

interface StatusBadgeProps {
  value: string
  labels?: Record<string, string>
  variants: Record<string, BadgeProps['variant']>
}

export function StatusBadge({ value, labels, variants }: StatusBadgeProps) {
  return (
    <Badge variant={variants[value] ?? 'outline'} className="text-xs capitalize">
      {labels?.[value] ?? value.replace(/_/g, ' ')}
    </Badge>
  )
}
