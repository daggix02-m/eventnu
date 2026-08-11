"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

interface UseScrollRevealOptions {
  y?: number;
  duration?: number;
  delay?: number;
  start?: string;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  y = 16,
  duration = 0.5,
  delay = 0,
  start = "top 88%",
}: UseScrollRevealOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        y,
        duration,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: "play none none none",
        },
      });
    });

    return () => ctx.revert();
  }, [y, duration, delay, start]);

  return ref;
}
