'use client'

import { OrganizersHero } from '@/components/organizers/HeroSection'
import { OrganizersTrustBar } from '@/components/organizers/TrustBar'
import { OrganizersValuePillars } from '@/components/organizers/ValuePillars'
import { OrganizersStatBand, type OrganizerStat } from '@/components/organizers/StatBand'
import { OrganizersHowItWorks } from '@/components/organizers/HowItWorks'
import { OrganizersPricing } from '@/components/organizers/PricingSection'
import { OrganizersCheckinShowcase } from '@/components/organizers/CheckinShowcase'
import { OrganizersShowcase } from '@/components/organizers/Testimonials'
import { OrganizersFAQ } from '@/components/organizers/FAQSection'
import { OrganizersCTA } from '@/components/organizers/CTASection'
import type { Event } from '@/types'

interface OrganizersClientProps {
  contactUrl?: string
  events: Event[]
  categoryCount: number
  stats: OrganizerStat[]
}

export function OrganizersClient({
  contactUrl = '/contact',
  events,
  categoryCount,
  stats,
}: OrganizersClientProps) {
  return (
    <div className="relative min-h-screen bg-background text-on-background overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* Background Decorative Blobs */}
      <div
        className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2"
        aria-hidden="true"
      />
      <div
        className="absolute top-[400px] right-[-200px] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[200px] left-[-150px] w-[500px] h-[500px] bg-tertiary/10 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      <OrganizersHero contactUrl={contactUrl} events={events} categoryCount={categoryCount} />
      <OrganizersTrustBar />
      <OrganizersValuePillars />
      <OrganizersStatBand stats={stats} />
      <OrganizersHowItWorks />
      <OrganizersPricing contactUrl={contactUrl} />
      <OrganizersCheckinShowcase />
      <OrganizersShowcase contactUrl={contactUrl} events={events} />
      <OrganizersFAQ />
      <OrganizersCTA contactUrl={contactUrl} />
    </div>
  )
}
