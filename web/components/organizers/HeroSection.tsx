"use client";

import { useRef, useEffect, useState, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Sparkles, ArrowRight, MapPin } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

interface OrganizersHeroProps {
  contactUrl: string;
}

const EVENT_PREVIEWS = [
  {
    title: "Hip Hop Night",
    date: "Jun 25, 2026",
    price: "500 ETB",
    ticketsLeft: 42,
    image: "/images/events/june-22-28/hiphop.png",
  },
  {
    title: "Utopia Night",
    date: "Jul 3, 2026",
    price: "Free",
    ticketsLeft: 128,
    image: "/images/events/july-01-05/utopia-night.png",
  },
  {
    title: "Unity in Beats",
    date: "Jul 18, 2026",
    price: "350 ETB",
    ticketsLeft: 17,
    image: "/images/events/july-13-19/unity-in-beats.png",
  },
];

export function OrganizersHero({ contactUrl }: OrganizersHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subLine1Ref = useRef<HTMLParagraphElement>(null);
  const subLine2Ref = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const [currentPreview, setCurrentPreview] = useState(0);
  const wordsSplitRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setCurrentPreview((prev) => (prev + 1) % EVENT_PREVIEWS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  useLayoutEffect(() => {
    if (wordsSplitRef.current) return;
    const el = headlineRef.current;
    if (!el) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    textNodes.forEach((node) => {
      if (!node.textContent?.trim()) return;
      const words = node.textContent.split(/\s+/);
      const fragment = document.createDocumentFragment();
      words.forEach((word, i) => {
        const span = document.createElement("span");
        span.className = "hero-word";
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
    if (heroWords?.length) {
      gsap.set(heroWords, { opacity: 0, y: 10 });
    }
    gsap.set(badgeRef.current, { opacity: 0, y: 16 });
    gsap.set(subLine1Ref.current, { opacity: 0, y: 12 });
    gsap.set(subLine2Ref.current, { opacity: 0, y: 12 });
    if (ctaRef.current) gsap.set(ctaRef.current.children, { opacity: 0, y: 12 });
    gsap.set(mockupRef.current, { opacity: 0, scale: 0.92 });

    if (badgeRef.current) {
      tl.to(badgeRef.current, { opacity: 1, y: 0, duration: 0.4 });
    }

    if (heroWords?.length) {
      tl.to(heroWords, { opacity: 1, y: 0, duration: 0.35, stagger: 0.02 }, "-=0.15");
    }

    if (subLine1Ref.current) {
      tl.to(subLine1Ref.current, { opacity: 1, y: 0, duration: 0.4 });
    }

    if (subLine2Ref.current) {
      tl.to(subLine2Ref.current, { opacity: 1, y: 0, duration: 0.4 }, "-=0.1");
    }

    if (ctaRef.current) {
      tl.to(ctaRef.current.children, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08 }, "-=0.1");
    }

    if (mockupRef.current) {
      tl.to(mockupRef.current, { opacity: 1, scale: 1, duration: 0.7 }, "-=0.3");
    }

    if (blobRef.current) {
      gsap.to(blobRef.current, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          scrub: 1,
        },
      });
    }
  }, { scope: sectionRef });

  const preview = EVENT_PREVIEWS[currentPreview];
  const otherPreviews = EVENT_PREVIEWS.filter((_, i) => i !== currentPreview);

  return (
    <section ref={sectionRef} className="relative z-10 pt-2xl md:pt-3xl pb-xl overflow-hidden">
      <div
        ref={blobRef}
        className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/2 -translate-x-1/2"
      />
      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-xl pt-lg">
          <div className="flex-1 space-y-lg text-left pt-md">
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-xs px-sm py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-label-sm opacity-0"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Addis Event Platform</span>
            </div>

            <h1
              ref={headlineRef}
              className="font-display text-[36px] leading-[1.15] md:text-[56px] lg:text-[64px] font-extrabold tracking-tight text-white opacity-0"
            >
              Your Event.{" "}
              <span className="premium-gradient">
                Addis Ababa&rsquo;s Audience.
              </span>
            </h1>

            <div className="space-y-sm max-w-prose">
              <p ref={subLine1Ref} className="text-on-surface text-[18px] leading-relaxed opacity-0">
                Sell tickets, scan doors, reach thousands of active event-goers in Ethiopia.
              </p>
              <div
                ref={subLine2Ref}
                className="inline-flex items-center gap-xs px-sm py-2 rounded-xl bg-secondary/5 border border-secondary/20 opacity-0"
              >
                <Sparkles className="w-4 h-4 text-secondary shrink-0" />
                <span className="text-secondary font-semibold text-[16px] leading-relaxed">
                  Telebirr, CBE Birr, Chapa &mdash; every payment your audience already uses.
                </span>
              </div>
            </div>

            <div ref={ctaRef} className="flex flex-wrap gap-sm pt-sm">
              <Button
                size="lg"
                asChild
                className="hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
              >
                <Link
                  href={contactUrl}
                  className="flex items-center gap-xs"
                >
                  List Your First Event
                  <ArrowRight className="w-5 h-5" />
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
          </div>

          <div ref={mockupRef} className="flex-1 relative w-full opacity-0">
            <div className="relative w-full aspect-[4/3] rounded-2xl glass-card border border-outline-variant/60 overflow-hidden group p-lg flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 opacity-60 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-sm relative z-10">
                <div className="flex items-center gap-sm">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  <Image
                    src="/logo.png"
                    alt="Event Nu"
                    width={20}
                    height={20}
                    className="rounded ml-xs"
                  />
                  <span className="font-mono text-label-sm text-on-surface-variant">
                    event_feed
                  </span>
                </div>
                <div className="px-sm py-1 bg-primary/20 text-primary font-mono text-[10px] rounded-full border border-primary/20">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-center gap-sm py-md">
                <div className="rounded-xl bg-surface/60 border border-outline-variant/40 overflow-hidden transition-all duration-500 ring-1 ring-primary/20">
                  <div className="flex items-center justify-between px-sm py-2 bg-surface-dim/40 border-b border-outline-variant/20">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Featured Event
                    </span>
                    <span className="font-mono text-[9px] text-primary">
                      {currentPreview + 1} / {EVENT_PREVIEWS.length}
                    </span>
                  </div>
                  <div className="p-sm">
                    <div className="flex items-center gap-sm">
                      <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center overflow-hidden shrink-0">
                        <Image
                          src={preview.image}
                          alt=""
                          width={56}
                          height={56}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-body-lg font-bold text-white truncate">
                          {preview.title}
                        </h4>
                        <div className="flex items-center gap-xs text-on-surface-variant font-mono text-[11px]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{preview.date}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-display text-[20px] font-extrabold text-secondary">
                          {preview.price}
                        </span>
                        <span className="block font-mono text-[10px] text-on-surface-variant">
                          {preview.ticketsLeft} left
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-xs mt-sm pt-sm border-t border-outline-variant/20">
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md font-mono text-[9px] text-primary">
                        Telebirr
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md font-mono text-[9px] text-primary">
                        CBE Birr
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md font-mono text-[9px] text-primary">
                        Card
                      </span>
                      <span className="ml-auto font-mono text-[9px] text-green-400">
                        183 watching
                      </span>
                    </div>
                  </div>
                </div>

                {otherPreviews.slice(0, 1).map((other) => (
                  <div key={other.title} className="rounded-xl bg-surface/40 border border-outline-variant/30 overflow-hidden opacity-70">
                    <div className="flex items-center gap-sm p-sm">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-higher flex items-center justify-center overflow-hidden shrink-0">
                        <Image
                          src={other.image}
                          alt=""
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-body-md font-bold text-white/80 truncate">
                          {other.title}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-display text-body-md font-extrabold text-secondary/70">
                          {other.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between relative z-10 pt-sm border-t border-outline-variant/30">
                <div className="flex items-center gap-xs">
                  <span className="px-2 py-0.5 bg-surface-dim/80 border border-outline-variant/40 rounded-md font-mono text-[9px] text-on-surface-variant">
                    CBE Birr
                  </span>
                  <span className="px-2 py-0.5 bg-surface-dim/80 border border-outline-variant/40 rounded-md font-mono text-[9px] text-on-surface-variant">
                    Telebirr
                  </span>
                  <span className="px-2 py-0.5 bg-surface-dim/80 border border-outline-variant/40 rounded-md font-mono text-[9px] text-on-surface-variant">
                    Chapa
                  </span>
                </div>
                <span className="font-mono text-[9px] text-on-surface-variant">
                  {preview.ticketsLeft} tickets remaining
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}