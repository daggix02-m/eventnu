import type { LucideIcon } from 'lucide-react'
import {
  Music,
  Moon,
  Palette,
  Briefcase,
  Cpu,
  Utensils,
  Activity,
  Users,
  Baby,
  Compass,
  Tag,
} from 'lucide-react'

export const NEUTRAL_ICON_BG = 'bg-surface-container-high text-muted-foreground'

const iconMap: Record<string, LucideIcon> = {
  music: Music,
  moon: Moon,
  palette: Palette,
  briefcase: Briefcase,
  cpu: Cpu,
  utensils: Utensils,
  activity: Activity,
  users: Users,
  baby: Baby,
  compass: Compass,
}

interface CategoryIconProps {
  name: string | null
  size?: number
}

export function CategoryIcon({ name, size = 18 }: CategoryIconProps) {
  const Icon = iconMap[name || ''] || Tag
  return <Icon size={size} />
}
