"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import {
  Banknote,
  Ticket,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

interface OrganizersPricingProps {
  contactUrl?: string;
}

const FREE_FEATURES = [
  "Unlimited free event listings",
  "Full discovery & search exposure",
  "Attendee RSVP management",
  "Event analytics dashboard",
  "Unlisted / private event option",
];

const PAID_FEATURES = [
  "Everything in Free, plus:",
  "Secure Telebirr & CBE Birr checkout",
  "Chapa + card payment integration",
  "Real-time sales & payout dashboard",
  "Same-day payout request available",
  "You choose who absorbs the fee",
];

export function OrganizersPricing({ contactUrl = "/contact" }: OrganizersPricingProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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
          scrollTrigger: { trigger: headerRef.current, start: "top 85%", toggleActions: "play none none none" },
        }
      );
    }
    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.children,
        { opacity: 0, y: 28, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.12,
          ease: "back.out(1.2)",
          scrollTrigger: { trigger: cardsRef.current, start: "top 82%", toggleActions: "play none none none" },
        }
      );
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative z-10 py-2xl border-t border-outline-variant/30 scroll-mt-16"
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/6 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        {/* Header */}
        <div ref={headerRef} className="text-center max-w-[42rem] mx-auto space-y-sm mb-xl">
          <div>
            <div className="inline-flex items-center gap-xs text-tertiary font-mono text-label-sm uppercase tracking-wider">
              <Banknote className="w-4 h-4" aria-hidden="true" />
              Simple, Transparent Pricing
            </div>
          </div>
          <h2 className="font-display text-[32px] md:text-[44px] font-extrabold text-white leading-tight">
            Start free. Grow with confidence.
          </h2>
          <p className="text-on-surface text-body-lg leading-relaxed">
            Listing is always free. Paid ticketing is priced per event — contact us
            for current rates, and you decide whether to pass fees on or absorb them.
          </p>
        </div>

        {/* Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-md max-w-4xl mx-auto"
        >
          {/* Free tier */}
          <div className="relative rounded-2xl border border-outline-variant/50 bg-surface-container/20 p-lg md:p-xl flex flex-col hover:border-primary/30 hover:bg-surface-container/30 transition-all duration-300 group overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/60 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

            <div className="space-y-md flex-1">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Ticket className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <span className="px-sm py-1 rounded-full bg-primary/10 border border-primary/20 font-mono text-label-sm text-primary font-semibold">
                  Free events
                </span>
              </div>

              <div>
                <div className="flex items-end gap-xs">
                  <span className="font-display text-[52px] font-extrabold text-white leading-none">0</span>
                  <span className="font-display text-[24px] font-bold text-primary mb-1">ETB</span>
                </div>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mt-1">
                  Free to list. Forever.
                </p>
              </div>

              <p className="text-on-surface text-body-md leading-relaxed border-t border-outline-variant/20 pt-md">
                Launch free events with zero platform fees — from open-entry art nights
                to running clubs to community gatherings.
              </p>

              <ul className="space-y-xs" aria-label="Free plan features">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-sm text-on-surface text-body-md">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-lg">
              <Button variant="outline" size="lg" asChild className="w-full hover:border-primary hover:bg-primary/5">
                <Link href={contactUrl} className="flex items-center justify-center gap-xs">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Paid tier */}
          <div className="relative rounded-2xl border-2 border-primary/40 bg-surface-container/30 p-lg md:p-xl flex flex-col hover:border-primary/70 hover:bg-surface-container/50 transition-all duration-300 group overflow-hidden shadow-xl shadow-primary/10">
            {/* Top gradient glow */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary"
              aria-hidden="true"
            />
            <div
              className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* "Most popular" badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-xs px-md py-1 rounded-full bg-primary border border-primary/20 font-mono text-[11px] font-bold text-on-primary uppercase tracking-wider shadow-lg shadow-primary/30">
                Paid Ticketing
              </span>
            </div>

            <div className="space-y-md flex-1 pt-sm">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Banknote className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <span className="px-sm py-1 rounded-full bg-secondary/10 border border-secondary/20 font-mono text-label-sm text-secondary font-semibold">
                  Per ticket sold
                </span>
              </div>

              <div>
                <div className="flex items-end gap-xs">
                  <span className="font-display text-[36px] md:text-[44px] font-extrabold text-white leading-none">Per-event</span>
                </div>
                <p className="font-display text-[20px] font-bold text-primary mt-1">
                  pricing on request
                </p>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider mt-1">
                  You set the ticket price. You choose who absorbs the fee.
                </p>
              </div>

              <p className="text-on-surface text-body-md leading-relaxed border-t border-outline-variant/20 pt-md">
                Accept Telebirr, CBE Birr, Chapa, and international cards. Revenue
                lands in your account within 24–48 hours of request.
              </p>

              <ul className="space-y-xs" aria-label="Paid plan features">
                {PAID_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-sm text-on-surface text-body-md">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${f.startsWith("Everything") ? "text-secondary" : "text-primary"}`}
                      aria-hidden="true"
                    />
                    <span className={f.startsWith("Everything") ? "font-semibold text-on-surface" : ""}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-lg space-y-sm">
              <Button size="lg" asChild className="w-full hover:scale-[1.02] active:scale-95 transition-all duration-200">
                <Link href={contactUrl} className="flex items-center justify-center gap-xs">
                  Start Selling Tickets
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </Button>
              <p className="text-center font-mono text-[11px] text-on-surface-variant flex items-center justify-center gap-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                No hidden fees. No monthly subscription.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-on-surface-variant text-body-md mt-xl max-w-[42rem] mx-auto">
          Need custom pricing for large-scale festivals or enterprise events?{" "}
          <Link href={contactUrl} className="text-primary hover:text-primary/80 font-semibold transition-colors underline underline-offset-4">
            Talk to our team →
          </Link>
        </p>
      </Container>
    </section>
  );
}
