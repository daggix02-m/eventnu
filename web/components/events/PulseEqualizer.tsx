"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PulseEqualizerProps {
  className?: string;
  barCount?: number;
}

const barAnimations = [
  "pulse-eq-1 1.8s",
  "pulse-eq-2 2.1s",
  "pulse-eq-3 1.5s",
  "pulse-eq-4 2.4s",
  "pulse-eq-5 1.7s",
  "pulse-eq-6 2.0s",
  "pulse-eq-7 1.6s",
];

export function PulseEqualizer({ className, barCount = 7 }: PulseEqualizerProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className={cn("flex items-end gap-[3px] h-12", className)}
      aria-hidden="true"
      role="presentation"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className="equalizer-bar"
          style={
            prefersReducedMotion
              ? { height: "50%" }
              : {
                  animation: barAnimations[i % barAnimations.length],
                  animationDelay: `${i * 0.12}s`,
                }
          }
        />
      ))}
    </div>
  );
}
