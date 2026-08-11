"use client";

import { useRef, useEffect, useState, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { ArrowRight, Ticket, CheckCircle2, MapPin, Banknote } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { formatPrice, formatEventDateShort } from "@/lib/utils";
import type { Event } from "@/types";

interface OrganizersHeroProps {
  contactUrl: string;
  events: Event[];
  categoryCount: number;
}

interface PreviewEvent {
  title: string;
  date: string;
  venue: string;
  price: string;
  image?: string;
}

export function OrganizersHero({ contactUrl, events, categoryCount }: OrganizersHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const miniStatsRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const [currentPreview, setCurrentPreview] = useState(0);
  const wordsSplitRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const previews: PreviewEvent[] = events.map((event) => ({
    title: event.title,
    date: formatEventDateShort(event.start_date),
    venue: event.venue_name || "Addis Ababa",
    price: formatPrice(event.price_display, event.is_free),
    image: event.poster_url ?? undefined,
  }));

  const eventCount = events.length;
  const venueCount = new Set(events.map((e) => e.venue_name).filter(Boolean)).size;

  const STATS_MINI = [
    { value: String(eventCount), label: "Events listed" },
    { value: String(categoryCount), label: "Categories" },
    { value: "0 ETB", label: "Free to list" },
  ];

  const hasPreviews = previews.length > 0;
  const preview = previews[currentPreview % Math.max(previews.length, 1)];
  const nextPreview = previews[(currentPreview + 1) % Math.max(previews.length, 1)];

  useEffect(() => {
    if (prefersReducedMotion || !hasPreviews) return;
    const interval = setInterval(() => {
      setCurrentPreview((prev) => (prev + 1) % previews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion, hasPreviews, previews.length]);

  useLayoutEffect(() => {
    if (wordsSplitRef.current) return;
    const el = headlineRef.current;
    if (!el) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      if (!node.textContent?.trim()) return;
      const words = node.textContent.split(/\s+/);
      const fragment = document.createDocumentFragment();
      words.forEach((word, i) => {
        const span = document.createElement("span");
        span.className = "hero-word inline-block";
        span.textContent = word;
        fragment.appendChild(span);
        if (i < words.length - 1) fragment.appendChild(document.createTextNode(" "));
      });
      node.parentNode?.replaceChild(fragment, node);
    });
    wordsSplitRef.current = true;
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    const heroWords = sectionRef.current?.querySelectorAll(".hero-word");
    if (heroWords?.length) gsap.set(heroWords, { opacity: 0, y: 14 });
    gsap.set(badgeRef.current, { opacity: 0, y: 16 });
    gsap.set(subRef.current, { opacity: 0, y: 14 });
    if (ctaRef.current) gsap.set(ctaRef.current.children, { opacity: 0, y: 12 });
    if (miniStatsRef.current) gsap.set(miniStatsRef.current.children, { opacity: 0, y: 10 });
    gsap.set(mockupRef.current, { opacity: 0, x: 30, scale: 0.95 });

    tl.to(badgeRef.current, { opacity: 1, y: 0, duration: 0.4 });
    if (heroWords?.length) {
      tl.to(heroWords, { opacity: 1, y: 0, duration: 0.3, stagger: 0.018 }, "-=0.1");
    }
    tl.to(subRef.current, { opacity: 1, y: 0, duration: 0.4 }, "-=0.05");
    if (ctaRef.current) {
      tl.to(ctaRef.current.children, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08 }, "-=0.1");
    }
    if (miniStatsRef.current) {
      tl.to(miniStatsRef.current.children, { opacity: 1, y: 0, duration: 0.3, stagger: 0.06 }, "-=0.05");
    }
    tl.to(mockupRef.current, { opacity: 1, x: 0, scale: 1, duration: 0.7, ease: "power2.out" }, "-=0.5");
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 pt-xl md:pt-2xl pb-xl overflow-hidden"
      aria-label="Organizers hero section"
    >
      <div
        className="absolute top-0 left-0 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[160px] pointer-events-none -translate-x-1/3 -translate-y-1/3"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/6 rounded-full blur-[120px] pointer-events-none translate-x-1/4 translate-y-1/4"
        aria-hidden="true"
      />

      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-xl lg:gap-2xl pt-md">

          {/* LEFT — copy */}
          <div className="flex-1 space-y-lg text-left max-w-[600px]">
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-xs px-sm py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-label-sm"
            >
              <span>For organizers in Addis Ababa</span>
            </div>

            <h1
              ref={headlineRef}
              className="font-display text-[38px] leading-[1.1] md:text-[58px] lg:text-[68px] font-extrabold tracking-tight text-white"
            >
              Launch Events{" "}
              <span className="premium-gradient">That Sell Out.</span>
            </h1>

            <div ref={subRef} className="space-y-sm max-w-prose">
              <p className="text-on-surface text-[18px] md:text-[20px] leading-relaxed">
                List your event, accept local payments, and get discovered by the
                city planning its next night out &mdash; all from one place.
              </p>
              <div className="inline-flex items-center gap-xs px-sm py-2 rounded-xl bg-secondary/8 border border-secondary/20">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />
                <span className="text-secondary font-semibold text-[15px] leading-relaxed">
                  Telebirr, CBE Birr, Chapa &amp; cards &mdash; accepted at checkout.
                </span>
              </div>
            </div>

            <div ref={ctaRef} className="flex flex-wrap gap-sm pt-xs">
              <Button
                size="lg"
                asChild
                className="hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
              >
                <Link href={contactUrl} className="flex items-center gap-xs">
                  List Your First Event
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="hover:bg-primary/5 hover:border-primary active:scale-95 transition-all duration-200"
              >
                <a href="#how-it-works">How It Works</a>
              </Button>
            </div>

            <div
              ref={miniStatsRef}
              className="flex items-center gap-lg pt-xs border-t border-outline-variant/20"
              aria-label="Platform quick stats"
            >
              {STATS_MINI.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-[22px] font-extrabold text-white leading-none tabular-nums">
                    {s.value}
                  </p>
                  <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — live listings preview */}
          <div ref={mockupRef} className="flex-1 w-full max-w-[520px] relative mt-lg lg:mt-0">
            <div className="relative rounded-2xl glass-card border border-outline-variant/60 overflow-hidden p-md md:p-lg shadow-2xl shadow-black/50">
              <div
                className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/8 pointer-events-none"
                aria-hidden="true"
              />

              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-sm mb-md relative z-10">
                <div className="flex items-center gap-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" aria-hidden="true" />
                  <Image src="/logo.png" alt="Event Nu" width={794} height={672} style={{ height: '18px', width: 'auto' }} className="rounded ml-xs" />
                  <span className="font-mono text-[11px] text-on-surface-variant">eventnu.et/events</span>
                </div>
                <div className="flex items-center gap-xs px-xs py-0.5 bg-green-500/10 border border-green-500/30 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                  <span className="font-mono text-[10px] text-green-400">Listed</span>
                </div>
              </div>

              {/* Dashboard body */}
              <div className="relative z-10 space-y-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Live now on Event Nu
                  </span>
                  <span className="font-mono text-[10px] text-primary">{eventCount} listed</span>
                </div>

                {/* Featured event card */}
                <div className="rounded-xl bg-surface/60 border border-outline-variant/40 overflow-hidden ring-1 ring-primary/20">
                  <div className="flex items-center gap-sm p-sm">
                    {preview?.image ? (
                      <div className="w-14 h-14 rounded-xl bg-surface-container-highest overflow-hidden shrink-0">
                        <Image
                          src={preview.image}
                          alt={preview.title}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5 text-primary" aria-hidden="true" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-[15px] font-bold text-white truncate">{preview?.title}</h4>
                      <div className="flex items-center gap-xs text-on-surface-variant font-mono text-[11px] mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {preview?.date} &middot; {preview?.venue}
                        </span>
                      </div>
                    </div>
                    {preview && (
                      <div className="text-right shrink-0">
                        <span className="font-display text-[18px] font-extrabold text-secondary">{preview.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment pills */}
                  <div className="flex items-center gap-xs px-sm pb-sm border-t border-outline-variant/20 pt-xs">
                    {["Telebirr", "CBE Birr", "Chapa"].map((p) => (
                      <span key={p} className="px-xs py-0.5 bg-primary/10 border border-primary/20 rounded font-mono text-[9px] text-primary">
                        {p}
                      </span>
                    ))}
                    <span className="ml-auto font-mono text-[9px] text-green-400 flex items-center gap-0.5">
                      <span className="w-1 h-1 bg-green-400 rounded-full inline-block animate-pulse" aria-hidden="true" />
                      No platform fee
                    </span>
                  </div>
                </div>

                {/* Secondary event */}
                {nextPreview && (
                  <div className="rounded-xl bg-surface/30 border border-outline-variant/25 p-sm flex items-center gap-sm opacity-70">
                    {nextPreview.image ? (
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest overflow-hidden shrink-0">
                        <Image src={nextPreview.image} alt={nextPreview.title} width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                        <Ticket className="w-4 h-4 text-primary" aria-hidden="true" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-[13px] font-bold text-white/80 truncate">{nextPreview.title}</h4>
                      <p className="font-mono text-[10px] text-on-surface-variant truncate">
                        {nextPreview.date} &middot; {nextPreview.venue}
                      </p>
                    </div>
                    <span className="font-display text-[14px] font-extrabold text-secondary/70 shrink-0">{nextPreview.price}</span>
                  </div>
                )}

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-xs">
                  {[
                    { icon: Ticket, label: "Events listed", value: String(eventCount) },
                    { icon: MapPin, label: "Venues", value: String(venueCount) },
                    { icon: Banknote, label: "Platform fee", value: "0 ETB" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-lg bg-surface-container/50 border border-outline-variant/20 p-xs text-center">
                      <Icon className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" aria-hidden="true" />
                      <p className="font-display text-[13px] font-bold text-white leading-none">{value}</p>
                      <p className="font-mono text-[9px] text-on-surface-variant mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating chips */}
            <div
              className="absolute -bottom-4 -left-4 md:-bottom-5 md:-left-5 px-sm py-xs rounded-xl glass-card border border-primary/30 shadow-lg shadow-black/40 flex items-center gap-xs z-20"
              aria-hidden="true"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono text-[11px] text-primary font-bold">Free to list forever</span>
            </div>

            <div
              className="absolute -top-4 -right-2 md:-top-5 md:-right-4 px-sm py-xs rounded-xl glass-card border border-primary/30 shadow-lg shadow-black/40 flex items-center gap-xs z-20"
              aria-hidden="true"
            >
              <Banknote className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono text-[11px] text-primary font-bold">Telebirr · CBE Birr · Chapa</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
