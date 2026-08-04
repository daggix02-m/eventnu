"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Users, Quote } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const TESTIMONIALS = [
  {
    quote:
      "We shifted all our event checkouts to Event Nu and saw instant Telebirr checkout options translate into higher conversions.",
    author: "Yonas B.",
    role: "Nightlife Promoter",
  },
  {
    quote:
      "The offline local sync on the entry app saved our team during the concert door scan. Zero dropouts and zero duplicate entry attempts.",
    author: "Marta K.",
    role: "Music Festival Director",
  },
  {
    quote:
      "Settlement payouts are incredibly reliable. We requested ticket funds on Friday morning and had them in our CBE bank account by Friday evening.",
    author: "Elias T.",
    role: "Art Exhibition Curator",
  },
] as const;

export function OrganizersTestimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: headerRef.current, start: "top 85%", toggleActions: "play none none reset" }
        }
      );
    }

    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 80%", toggleActions: "play none none reset" }
        }
      );
    }
  }, { scope: sectionRef });

  useEffect(() => {
    if (prefersReducedMotion) return;
    startRotation();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [prefersReducedMotion]);

  const startRotation = () => {
    if (prefersReducedMotion) return;
    intervalRef.current = setInterval(() => {
      setHighlighted((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
  };

  const selectTestimonial = (idx: number) => {
    setHighlighted(idx);
    if (intervalRef.current) clearInterval(intervalRef.current);
    startRotation();
  };

  return (
    <section ref={sectionRef} className="relative z-10 py-2xl border-t border-outline-variant/30 bg-surface-container-lowest/30">
      <Container>
        <div ref={headerRef} className="text-center max-w-3xl mx-auto space-y-sm mb-xl">
          <div className="inline-flex items-center gap-xs text-secondary font-mono text-label-sm uppercase tracking-wider opacity-0">
            <Users className="w-4 h-4" /> Event Creators
          </div>
          <h2 className="font-display text-[32px] md:text-[44px] font-extrabold text-white leading-tight opacity-0">
            Trusted by creators in Addis Ababa
          </h2>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {TESTIMONIALS.map((t, idx) => {
            const isFeatured = idx === highlighted;
            return (
              <div
                key={t.author}
                role="button"
                tabIndex={0}
                onClick={() => selectTestimonial(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectTestimonial(idx);
                  }
                }}
                onMouseEnter={() => {
                  if (intervalRef.current) clearInterval(intervalRef.current);
                }}
                onMouseLeave={startRotation}
                className={`p-lg rounded-2xl flex flex-col justify-between relative cursor-pointer transition-all duration-500 opacity-0 ${
                  isFeatured
                    ? "bg-surface-container/40 border-2 border-secondary/40 shadow-lg shadow-secondary/5 scale-[1.02]"
                    : "bg-surface-container/20 border border-outline-variant/30 hover:border-secondary/20 scale-100"
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center">
                    <Quote className="w-4 h-4 text-secondary" />
                  </div>
                )}
                <Quote className={`w-6 h-6 mb-sm ${isFeatured ? "text-secondary" : "text-outline-variant"}`} />
                <p className={`text-body-md italic leading-relaxed mb-md ${isFeatured ? "text-on-surface" : "text-on-surface-variant"}`}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <h4 className="font-display text-body-md font-bold text-white">
                    {t.author}
                  </h4>
                  <p className={`font-mono text-label-sm uppercase tracking-wider ${isFeatured ? "text-secondary" : "text-primary"}`}>
                    {t.role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}