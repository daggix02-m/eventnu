"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

interface OrganizersCTAProps {
  contactUrl: string;
}

const PAYMENT_LOGOS = ["CBE Birr", "Telebirr", "Chapa"];

export function OrganizersCTA({ contactUrl }: OrganizersCTAProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const paymentRowRef = useRef<HTMLDivElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.set(cardRef.current, { opacity: 0, scale: 0.96 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: { trigger: cardRef.current, start: "top 85%", toggleActions: "play none none reset" },
    });

    tl.to(cardRef.current, { opacity: 1, scale: 1, duration: 0.5 });
    tl.from(logoRef.current, { opacity: 0, y: 12, duration: 0.3 }, "-=0.3");
    tl.from(headlineRef.current, { opacity: 0, y: 16, duration: 0.4 }, "-=0.2");
    tl.from(bodyRef.current, { opacity: 0, y: 10, duration: 0.35 }, "-=0.15");
    if (paymentRowRef.current) {
      tl.from(paymentRowRef.current.children, { opacity: 0, y: 8, duration: 0.3, stagger: 0.06 }, "-=0.1");
    }
    if (ctaGroupRef.current) {
      tl.from(ctaGroupRef.current.children, { opacity: 0, y: 10, duration: 0.3, stagger: 0.08 }, "-=0.1");
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative z-10 py-2xl border-t border-outline-variant/30">
      <Container>
        <div ref={cardRef} className="relative rounded-3xl overflow-hidden bg-surface-container border border-outline-variant/40 p-lg md:p-2xl max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-surface-container to-secondary/10 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] bg-primary/15 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-xl">
              <div className="flex-1 space-y-lg text-center lg:text-left">
                <div ref={logoRef} className="flex justify-center lg:justify-start">
                  <Image
                    src="/logo.png"
                    alt="Event Nu"
                    width={56}
                    height={56}
                    className="rounded-2xl shadow-lg shadow-primary/20"
                  />
                </div>

                <h2 ref={headlineRef} className="font-display text-[32px] md:text-[44px] font-extrabold text-white leading-tight">
                  Ready to Sell Out Your Next Event?
                </h2>
                <p ref={bodyRef} className="text-on-surface text-[18px] leading-relaxed max-w-prose">
                  Connect with active audiences in Addis Ababa. Accept payments via
                  CBE Birr, Telebirr, Chapa, and international cards.
                </p>

                <div ref={paymentRowRef} className="flex items-center gap-sm pt-sm justify-center lg:justify-start flex-wrap">
                  {PAYMENT_LOGOS.map((name) => (
                    <div key={name} className="flex items-center gap-xs px-sm py-2 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="font-mono text-label-sm text-primary">{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div ref={ctaGroupRef} className="flex flex-col gap-sm shrink-0">
                <Button
                  size="lg"
                  asChild
                  className="hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Link
                    href={contactUrl}
                    className="flex items-center gap-xs"
                  >
                    Start Publishing Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="hover:bg-primary/5 hover:border-primary active:scale-95 transition-all duration-200"
                >
                  <Link href={contactUrl} className="flex items-center gap-xs">
                    <MessageCircle className="w-5 h-5" />
                    Talk to Sales
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
