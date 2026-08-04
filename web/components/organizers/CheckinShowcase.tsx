"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { QrCode, Wifi, Shield, Zap } from "lucide-react";
import { Container } from "@/components/layout/Container";

const FEATURES = [
  { icon: Zap, title: "50+ scans per minute", body: "Sub-second optical detection keeps queues moving. No delays, no bottlenecks." },
  { icon: Shield, title: "Fraud-proof validation", body: "Automated duplicate pass blocking with instant flag alerts at the gate." },
  { icon: Wifi, title: "Offline fallback mode", body: "Local cache preserves check-in data when the mobile network drops." },
] as const;

export function OrganizersCheckinShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (textRef.current) {
      gsap.fromTo(
        textRef.current.children,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: textRef.current, start: "top 80%", toggleActions: "play none none reset" }
        }
      );
    }

    if (mockupRef.current) {
      gsap.fromTo(
        mockupRef.current,
        { opacity: 0, x: 20, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: "power2.out",
          scrollTrigger: { trigger: mockupRef.current, start: "top 80%", toggleActions: "play none none reset" }
        }
      );
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative z-10 py-2xl border-t border-outline-variant/30 bg-surface-dim/40">
      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-xl">
          <div ref={textRef} className="flex-1 space-y-md text-left">
            <div className="inline-flex items-center gap-xs px-sm py-1 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20 font-mono text-[11px] uppercase tracking-wider opacity-0">
              <QrCode className="w-4 h-4" />
              Door Management
            </div>
            <h2 className="font-display text-[32px] md:text-[44px] font-extrabold text-white leading-tight opacity-0">
              Zero bottlenecks.
              <br />
              Fast, reliable entry scanning.
            </h2>
            <p className="text-on-surface text-body-lg leading-relaxed opacity-0">
              Say goodbye to queues. Scan 50+ tickets per minute with our organizer
              app. Process code validations offline, sync tickets in real-time
              across multiple devices, and handle gate lookup effortlessly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm pt-sm opacity-0">
              {FEATURES.map((f) => (
                <div key={f.title} className="p-sm rounded-xl bg-surface-container/30 border border-outline-variant/20 hover:border-tertiary/30 transition-colors duration-200">
                  <f.icon className="w-5 h-5 text-tertiary mb-xs" />
                  <h4 className="font-display text-body-md font-bold text-white mb-1">{f.title}</h4>
                  <p className="text-on-surface text-[13px] leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div ref={mockupRef} className="flex-1 w-full flex justify-center opacity-0">
            <div className="relative w-[320px] md:w-[380px] h-[500px] rounded-[36px] border-[8px] border-surface-container-high bg-background shadow-2xl p-sm flex flex-col justify-between overflow-hidden">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-zinc-800" />
              </div>

              <div className="flex flex-col items-center justify-between h-full pt-6 pb-2 text-center select-none relative">
                <div className="space-y-xs pt-4">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">
                    Gate Entrance 1
                  </span>
                  <h4 className="font-display text-body-md font-bold text-white">
                    Event Nu Entry App
                  </h4>
                </div>

                <div className="relative w-44 aspect-square rounded-2xl bg-zinc-950 border border-outline-variant/30 flex items-center justify-center p-sm overflow-hidden">
                  <div className="absolute left-0 w-full h-[2px] bg-green-500/80 shadow-[0_0_12px_#22c55e] top-1/2 -translate-y-1/2" />
                  <QrCode className="w-24 h-24 text-zinc-700 opacity-60" />
                </div>

                <div className="w-full px-sm pb-4">
                  <div className="p-sm bg-green-950/20 border border-green-500/30 rounded-xl space-y-1">
                    <div className="flex items-center justify-center gap-xs text-green-400 font-bold text-body-md">
                      <Shield className="w-4 h-4" /> Valid Ticket
                    </div>
                    <span className="block text-[10px] text-on-surface-variant font-mono">
                      Abel Solomon &mdash; VIP Pass
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}