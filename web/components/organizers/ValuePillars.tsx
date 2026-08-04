"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import {
  Zap,
  Wallet,
  Sparkle,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { Container } from "@/components/layout/Container";

const PILLARS = [
  {
    icon: Wallet,
    iconColor: "text-primary",
    title: "Instant Ticketing",
    body: "Set up free or paid events in under 60 seconds. Configure tiers, upload your poster, and go live with zero technical friction.",
  },
  {
    icon: Sparkle,
    iconColor: "text-secondary",
    title: "Algorithmic Discovery",
    body: "Your events are automatically pushed to thousands of active searchers based on interests, past behavior, and location in Addis Ababa.",
  },
  {
    icon: CreditCard,
    iconColor: "text-tertiary",
    title: "Local Payment Gateways",
    body: "Accept Telebirr, CBE Birr, Chapa, and international credit and debit cards. Every checkout method your audience already uses.",
  },
  {
    icon: BarChart3,
    iconColor: "text-primary",
    title: "Real-Time Analytics",
    body: "Insights into ticket buyer origins, demographics, referral pathways, and payout logs&mdash;all in one real-time cockpit.",
  },
] as const;

export function OrganizersValuePillars() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%", toggleActions: "play none none reset" }
        }
      );
    }

    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 24, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: { each: 0.08, from: "start", grid: "auto" }, ease: "back.out(1.4)",
          scrollTrigger: { trigger: gridRef.current, start: "top 80%", toggleActions: "play none none reset" }
        }
      );
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative z-10 py-2xl">
      <Container>
        <div ref={headerRef} className="text-center max-w-3xl mx-auto space-y-sm mb-xl">
          <div className="inline-flex items-center gap-xs text-secondary font-mono text-label-sm uppercase tracking-wider">
            <Zap className="w-4 h-4" /> Why Choose Event Nu
          </div>
          <h2 className="font-display text-[32px] md:text-[44px] font-extrabold text-white leading-tight">
            Powerful tools built to simplify event hosting
          </h2>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-md max-w-4xl mx-auto">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="p-lg bg-surface-container/20 border border-outline-variant/40 rounded-2xl flex flex-col hover:border-primary/40 hover:bg-surface-container/40 transition-all duration-300 relative group overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-[3px] h-0 bg-gradient-to-b from-primary to-secondary group-hover:h-full transition-all duration-500" />
              <div className="space-y-md pl-sm">
                <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <pillar.icon className={`w-7 h-7 ${pillar.iconColor}`} />
                </div>
                <h3 className="font-display text-body-lg font-bold text-white">
                  {pillar.title}
                </h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">
                  {pillar.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}