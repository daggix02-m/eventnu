"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Calendar, PenLine, Rocket, Scan } from "lucide-react";
import { Container } from "@/components/layout/Container";

const STEPS = [
  {
    icon: PenLine,
    title: "Draft & Customize",
    body: "Fill in details, select categories, upload high-res poster flyers, and configure your ticket tiers.",
  },
  {
    icon: Rocket,
    title: "Publish & Promote",
    body: "Publish to our events ecosystem. Matched active buyers are notified via push notifications and digests automatically.",
  },
  {
    icon: Scan,
    title: "Scan & Settlement",
    body: "Download the Scanning app to run validations at the gate, track checkout logs, and request payouts.",
  },
] as const;

export function OrganizersHowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

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

    if (lineRef.current) {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        { scaleY: 1, duration: 1, ease: "power2.inOut",
          scrollTrigger: { trigger: timelineRef.current, start: "top 75%", end: "top 30%", scrub: 1 }
        }
      );
    }

    if (timelineRef.current) {
      const stepItems = timelineRef.current.querySelectorAll(".step-item");
      if (stepItems.length) {
        gsap.fromTo(
          stepItems,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.15, ease: "power2.out",
            scrollTrigger: { trigger: timelineRef.current, start: "top 70%", toggleActions: "play none none reset" }
          }
        );
      }
    }
  }, { scope: sectionRef });

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative z-10 py-xl md:py-2xl border-t border-outline-variant/30 scroll-mt-16"
    >
      <Container>
        <div ref={headerRef} className="max-w-3xl mx-auto text-center space-y-md mb-lg md:mb-xl">
          <div className="inline-flex items-center gap-xs text-primary font-mono text-label-sm uppercase tracking-wider opacity-0">
            <Calendar className="w-4 h-4" /> Steps to Launch
          </div>
          <h2 className="font-display text-[32px] md:text-[44px] font-extrabold text-white leading-tight opacity-0">
            Get up and running in minutes
          </h2>
          <p className="text-on-surface text-body-lg leading-relaxed opacity-0">
            We make event setup simple. Follow our straightforward playbook to
            start selling and validating entries.
          </p>
        </div>

        <div ref={timelineRef} className="relative max-w-4xl mx-auto">
          <div
            ref={lineRef}
            className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-secondary to-tertiary origin-top"
          />
          <div className="space-y-md md:space-y-lg relative">
            {STEPS.map((step, idx) => {
              const isOdd = idx % 2 === 1;
              return (
                <div
                  key={idx}
                  className={`step-item relative flex items-start gap-sm md:gap-lg opacity-0 ${
                    isOdd ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Icon box with step number */}
                  <div
                    className={`relative z-10 w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 shadow-lg shadow-primary/10 ${
                      isOdd ? "md:ml-auto" : ""
                    }`}
                  >
                    <span className="font-display text-[20px] font-extrabold text-primary">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Step card */}
                  <div
                    className={`flex-1 bg-surface-container/40 border border-outline-variant/40 rounded-2xl p-md md:p-lg hover:border-primary/30 hover:bg-surface-container/60 transition-all duration-300 ${
                      isOdd ? "md:text-right" : ""
                    }`}
                  >
                    <div className={`flex items-center gap-xs mb-xs ${isOdd ? "md:justify-end" : ""}`}>
                      <step.icon className="w-4 h-4 text-primary" />
                      <h3 className="font-display text-body-lg font-bold text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-on-surface text-body-md leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
