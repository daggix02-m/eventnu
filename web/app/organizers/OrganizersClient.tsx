"use client";

import { OrganizersHero } from "@/components/organizers/HeroSection";
import { OrganizersStatBand } from "@/components/organizers/StatBand";
import { OrganizersValuePillars } from "@/components/organizers/ValuePillars";
import { OrganizersCheckinShowcase } from "@/components/organizers/CheckinShowcase";
import { OrganizersHowItWorks } from "@/components/organizers/HowItWorks";
import { OrganizersTestimonials } from "@/components/organizers/Testimonials";
import { OrganizersFAQ } from "@/components/organizers/FAQSection";
import { OrganizersCTA } from "@/components/organizers/CTASection";

interface OrganizersClientProps {
  contactUrl?: string;
}

export function OrganizersClient({
  contactUrl = "/contact",
}: OrganizersClientProps) {
  return (
    <div className="relative min-h-screen bg-background text-on-background overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" />
      <div className="absolute top-[400px] right-[-200px] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[200px] left-[-150px] w-[500px] h-[500px] bg-tertiary/10 rounded-full blur-[100px] pointer-events-none" />

      <OrganizersHero contactUrl={contactUrl} />
      <OrganizersStatBand />
      <OrganizersValuePillars />
      <OrganizersCheckinShowcase />
      <OrganizersHowItWorks />
      <OrganizersTestimonials />
      <OrganizersFAQ />
      <OrganizersCTA contactUrl={contactUrl} />
    </div>
  );
}
