import {
  Music,
  Palette,
  Moon,
  UtensilsCrossed,
  Dumbbell,
  Cpu,
  Laptop,
  Trophy,
  Briefcase,
  Heart,
  GraduationCap,
  Calendar,
  MapPin,
  Users,
  Camera,
  Mic,
  Theater,
  Gamepad2,
  Leaf,
  Globe,
  Star,
  type LucideIcon,
} from 'lucide-react'

const ICON_BY_VALUE: Record<string, LucideIcon> = {
  music: Music,
  palette: Palette,
  moon: Moon,
  'utensils-crossed': UtensilsCrossed,
  dumbbell: Dumbbell,
  cpu: Cpu,
  tech: Laptop,
  art: Palette,
  sports: Trophy,
  business: Briefcase,
  health: Heart,
  education: GraduationCap,
  events: Calendar,
  venues: MapPin,
  community: Users,
  photography: Camera,
  podcasts: Mic,
  performing: Theater,
  gaming: Gamepad2,
  fitness: Dumbbell,
  wellness: Leaf,
  culture: Globe,
}

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  music: Music,
  'arts-culture': Palette,
  nightlife: Moon,
  'food-drink': UtensilsCrossed,
  'sports-fitness': Dumbbell,
  'tech-innovation': Cpu,
  default: Star,
}

export function getCategoryIcon(icon?: string | null, slug?: string | null): LucideIcon {
  if (icon && ICON_BY_VALUE[icon]) return ICON_BY_VALUE[icon]
  if (slug && ICON_BY_SLUG[slug]) return ICON_BY_SLUG[slug]
  return Star
}
