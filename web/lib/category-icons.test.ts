import { describe, it, expect } from 'vitest'
import { getCategoryIcon } from './category-icons'
import {
  Star,
  Music,
  Palette,
  Moon,
  UtensilsCrossed,
  Dumbbell,
  Cpu,
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
  Laptop,
} from 'lucide-react'

describe('getCategoryIcon', () => {
  it('returns Music for "music" icon', () => {
    expect(getCategoryIcon('music')).toBe(Music)
  })

  it('returns Palette for "palette" icon', () => {
    expect(getCategoryIcon('palette')).toBe(Palette)
  })

  it('returns Moon for "moon" icon', () => {
    expect(getCategoryIcon('moon')).toBe(Moon)
  })

  it('returns UtensilsCrossed for "utensils-crossed" icon', () => {
    expect(getCategoryIcon('utensils-crossed')).toBe(UtensilsCrossed)
  })

  it('returns Dumbbell for "dumbbell" icon', () => {
    expect(getCategoryIcon('dumbbell')).toBe(Dumbbell)
  })

  it('returns Laptop for "tech" icon', () => {
    expect(getCategoryIcon('tech')).toBe(Laptop)
  })

  it('returns Trophy for "sports" icon', () => {
    expect(getCategoryIcon('sports')).toBe(Trophy)
  })

  it('returns Briefcase for "business" icon', () => {
    expect(getCategoryIcon('business')).toBe(Briefcase)
  })

  it('returns Heart for "health" icon', () => {
    expect(getCategoryIcon('health')).toBe(Heart)
  })

  it('returns GraduationCap for "education" icon', () => {
    expect(getCategoryIcon('education')).toBe(GraduationCap)
  })

  it('returns Calendar for "events" icon', () => {
    expect(getCategoryIcon('events')).toBe(Calendar)
  })

  it('returns MapPin for "venues" icon', () => {
    expect(getCategoryIcon('venues')).toBe(MapPin)
  })

  it('returns Users for "community" icon', () => {
    expect(getCategoryIcon('community')).toBe(Users)
  })

  it('returns Camera for "photography" icon', () => {
    expect(getCategoryIcon('photography')).toBe(Camera)
  })

  it('returns Mic for "podcasts" icon', () => {
    expect(getCategoryIcon('podcasts')).toBe(Mic)
  })

  it('returns Theater for "performing" icon', () => {
    expect(getCategoryIcon('performing')).toBe(Theater)
  })

  it('returns Gamepad2 for "gaming" icon', () => {
    expect(getCategoryIcon('gaming')).toBe(Gamepad2)
  })

  it('returns Leaf for "wellness" icon', () => {
    expect(getCategoryIcon('wellness')).toBe(Leaf)
  })

  it('returns Globe for "culture" icon', () => {
    expect(getCategoryIcon('culture')).toBe(Globe)
  })

  it('returns Star for "art" icon via ICON_BY_VALUE', () => {
    // "art" maps to Palette in ICON_BY_VALUE
    expect(getCategoryIcon('art')).toBe(Palette)
  })

  it('falls back to slug-based lookup', () => {
    expect(getCategoryIcon(null, 'music')).toBe(Music)
    expect(getCategoryIcon(null, 'arts-culture')).toBe(Palette)
    expect(getCategoryIcon(null, 'nightlife')).toBe(Moon)
    expect(getCategoryIcon(null, 'food-drink')).toBe(UtensilsCrossed)
    expect(getCategoryIcon(null, 'sports-fitness')).toBe(Dumbbell)
    expect(getCategoryIcon(null, 'tech-innovation')).toBe(Cpu)
  })

  it('returns Star for unknown slug', () => {
    expect(getCategoryIcon(null, 'unknown-category')).toBe(Star)
  })

  it('returns Star when both icon and slug are null', () => {
    expect(getCategoryIcon(null, null)).toBe(Star)
  })

  it('returns Star when no arguments provided', () => {
    expect(getCategoryIcon()).toBe(Star)
  })

  it('prefers icon over slug', () => {
    expect(getCategoryIcon('music', 'nightlife')).toBe(Music)
  })
})
