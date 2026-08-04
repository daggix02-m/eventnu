"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { useEffect, useState } from "react";

const STATS = [
  { icon: Calendar, value: 30000, label: "Attenders", suffix: "+", prefix: "" },
  { icon: TrendingUp, value: 500, label: "Events Hosted", suffix: "+", prefix: "" },
  { icon: DollarSign, value: 98, label: "Payout Satisfaction", suffix: "%", prefix: "" },
];

function AnimatedCounter({ target, suffix, prefix }: { target: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    tweenRef.current = gsap.to(
      {},
      {
        duration: 2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 90%",
          toggleActions: "play none none reset",
        },
        onUpdate() {
          if (tweenRef.current) {
            const progress = tweenRef.current.progress();
            setCount(Math.round(target * Math.min(progress, 1)));
          }
        },
      }
    );
    return () => { tweenRef.current?.kill(); };
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export function OrganizersStatBand() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.children,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 90%", toggleActions: "play none none reset" }
        }
      );
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative z-10 py-md border-y border-outline-variant/30 bg-gradient-to-r from-primary/5 via-surface-container-low/40 to-secondary/5">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md py-sm">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-center gap-md justify-center md:justify-start opacity-0">
              <div className="p-sm rounded-2xl bg-surface-container-high/60 border border-outline-variant/30">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-[32px] md:text-[40px] font-extrabold text-white leading-none">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </h3>
                <p className="text-on-surface-variant font-mono text-label-sm uppercase tracking-wider pt-1">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}