"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import {
  Zap,
  Wallet,
  Search,
  BarChart3,
  CreditCard,
  Instagram,
} from "lucide-react";
import { Container } from "@/components/layout/Container";

const PILLARS = [
  {
    icon: Wallet,
    iconColor: "text-primary",
    iconBg: "bg-primary/10 border-primary/20",
    accentColor: "from-primary/20 to-transparent",
    borderHover: "hover:border-primary/40",
    title: "Instant Ticketing",
    body: "Set up free or paid events in under 60 seconds. Configure tiers, upload your poster, and go live with zero technical friction.",
    featured: true,
  },
  {
    icon: Search,
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10 border-secondary/20",
    accentColor: "from-secondary/20 to-transparent",
    borderHover: "hover:border-secondary/40",
    title: "Algorithmic Discovery",
    body: "Your events appear for people searching by interest and location in Addis Ababa.",
    featured: false,
  },
  {
    icon: CreditCard,
    iconColor: "text-tertiary",
    iconBg: "bg-tertiary/10 border-tertiary/20",
    accentColor: "from-tertiary/20 to-transparent",
    borderHover: "hover:border-tertiary/40",
    title: "Local Payment Gateways",
    body: "Accept Telebirr, CBE Birr, Chapa, and international cards. Every checkout method your audience already uses.",
    featured: false,
  },
  {
    icon: BarChart3,
    iconColor: "text-primary",
    iconBg: "bg-primary/10 border-primary/20",
    accentColor: "from-primary/20 to-transparent",
    borderHover: "hover:border-primary/40",
    title: "Real-Time Analytics",
    body: "Insights into ticket buyer origins, demographics, referral pathways, and payout logs—all in one real-time cockpit.",
    featured: false,
  },
  {
    icon: Instagram,
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10 border-secondary/20",
    accentColor: "from-secondary/20 to-transparent",
    borderHover: "hover:border-secondary/40",
    title: "Instagram Publishing",
    body: "Publish events directly to your Instagram feed from the platform. One click promotion that reaches your existing audience without leaving Event Nu.",
    featured: false,
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
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%", toggleActions: "play none none none" },
        }
      );
    }
    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.querySelectorAll(".pillar-card"),
        { opacity: 0, y: 28, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: { each: 0.1, from: "start" },
          ease: "back.out(1.3)",
          scrollTrigger: { trigger: gridRef.current, start: "top 80%", toggleActions: "play none none none" },
        }
      );
    }
  }, { scope: sectionRef });

  const featuredPillar = PILLARS.find((p) => p.featured)!;
  const regularPillars = PILLARS.filter((p) => !p.featured);

  return (
    <section ref={sectionRef} className="relative z-10 py-2xl">
      <Container>
        <div ref={headerRef} className="text-center max-w-[48rem] mx-auto space-y-sm mb-xl">
          <div>
            <div className="inline-flex items-center gap-xs text-secondary font-mono text-label-sm uppercase tracking-wider">
              <Zap className="w-4 h-4" aria-hidden="true" /> Why Choose Event Nu
            </div>
          </div>
          <h2 className="font-display text-[32px] md:text-[44px] font-extrabold text-white leading-tight">
            Powerful tools built for every Addis event creator
          </h2>
          <p className="text-on-surface text-body-lg leading-relaxed">
            From intimate art nights to large-scale concerts — everything you need in one place.
          </p>
        </div>

        {/* Bento grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md auto-rows-auto">
          {/* Featured card — spans 2 cols on md+ */}
          <div
            className={`pillar-card md:col-span-2 lg:col-span-2 relative p-lg md:p-xl bg-surface-container/20 border border-outline-variant/40 rounded-2xl flex flex-col gap-md ${featuredPillar.borderHover} hover:bg-surface-container/35 transition-all duration-300 group overflow-hidden opacity-0`}
          >
            {/* Gradient sweep on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${featuredPillar.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              aria-hidden="true"
            />
            {/* Left accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-primary via-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />

            <div className="relative z-10 flex items-start gap-lg">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 ${featuredPillar.iconBg}`}>
                <featuredPillar.icon className={`w-8 h-8 ${featuredPillar.iconColor}`} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-[22px] md:text-[26px] font-extrabold text-white mb-xs">
                  {featuredPillar.title}
                </h3>
                <p className="text-on-surface text-body-lg leading-relaxed">{featuredPillar.body}</p>
              </div>
            </div>

            {/* Feature highlights row */}
            <div className="relative z-10 flex flex-wrap gap-xs pt-sm border-t border-outline-variant/20">
              {["Free events", "Paid tiers", "Live in 60s", "Custom poster"].map((tag) => (
                <span
                  key={tag}
                  className="px-xs py-0.5 rounded-md bg-primary/10 border border-primary/20 font-mono text-[11px] text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Regular cards */}
          {regularPillars.map((pillar) => (
            <div
              key={pillar.title}
              className={`pillar-card relative p-lg bg-surface-container/20 border border-outline-variant/40 rounded-2xl flex flex-col ${pillar.borderHover} hover:bg-surface-container/35 transition-all duration-300 group overflow-hidden opacity-0`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${pillar.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                aria-hidden="true"
              />
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-current to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-400" aria-hidden="true" />

              <div className="relative z-10 space-y-md">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${pillar.iconBg}`}>
                  <pillar.icon className={`w-6 h-6 ${pillar.iconColor}`} aria-hidden="true" />
                </div>
                <h3 className="font-display text-[18px] font-bold text-white">{pillar.title}</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">{pillar.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}