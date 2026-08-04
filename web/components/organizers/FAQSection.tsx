"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { ChevronDown, HelpCircle, DollarSign, Shield, CreditCard, Eye } from "lucide-react";
import { Container } from "@/components/layout/Container";

const FAQS = [
  {
    category: "Pricing",
    icon: DollarSign,
    question: "How much does it cost to list and sell tickets on Event Nu?",
    answer:
      "Listing your event is 100% free. If your event is free, there are absolutely zero hosting or registration charges. For paid events, we charge a low, flat processing fee per ticket sold, which you can choose to pass on to ticket buyers or absorb yourself.",
  },
  {
    category: "Payments",
    icon: CreditCard,
    question:
      "Which local payment options are supported for ticket buyers in Ethiopia?",
    answer:
      "We support direct checkouts via Telebirr, CBE Birr, Chapa, mobile wallets, and international credit/debit cards, giving your attendees in Addis and abroad a friction-free purchasing experience.",
  },
  {
    category: "Payments",
    icon: CreditCard,
    question: "How quickly do I get payouts for sold tickets?",
    answer:
      "We offer some of the fastest payouts in the market. You can request settlements during your ticket sales cycle. Revenue is deposited directly into your designated Ethiopian bank account or mobile wallet within 24 to 48 hours.",
  },
  {
    category: "Check-in",
    icon: Shield,
    question:
      "Do I need to buy special QR scanners to manage the door check-in?",
    answer:
      "No specialized hardware is required. You and your team can download the official Event Nu Organizer App on any standard iOS or Android smartphone to turn its built-in camera into a high-speed QR code ticket scanner.",
  },
  {
    category: "Visibility",
    icon: Eye,
    question: "Can I host hidden, private, or invite-only events?",
    answer:
      "Yes. When creating an event, you can set the visibility to 'Unlisted'. This hides it from our public discovery marketplace and lets you share the private ticket link directly with your guests via email or messaging apps.",
  },
] as const;

export function OrganizersFAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    const faqItems = sectionRef.current?.querySelectorAll(".faq-item");
    if (faqItems) {
      gsap.fromTo(
        faqItems,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%", toggleActions: "play none none reset" }
        }
      );
    }
  }, { scope: sectionRef });

  const toggleFaq = (index: number) => {
    const isOpen = openFaqIndex === index;
    const targetIdx = isOpen ? -1 : index;
    setOpenFaqIndex(targetIdx);
  };

  const categoryColors: Record<string, string> = {
    Pricing: "text-primary border-primary/30 bg-primary/10",
    Payments: "text-secondary border-secondary/30 bg-secondary/10",
    "Check-in": "text-tertiary border-tertiary/30 bg-tertiary/10",
    Visibility: "text-primary border-primary/30 bg-primary/10",
  };

  const categoryIcons: Record<string, React.ElementType> = {
    Pricing: DollarSign,
    Payments: CreditCard,
    "Check-in": Shield,
    Visibility: Eye,
  };

  return (
    <section ref={sectionRef} className="relative z-10 py-2xl border-t border-outline-variant/30">
      <Container>
        <div className="max-w-3xl mx-auto space-y-lg">
          <div className="text-center space-y-sm">
            <div className="inline-flex items-center gap-xs text-tertiary font-mono text-label-sm uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" /> Help Center
            </div>
            <h2 className="font-display text-[32px] md:text-[44px] font-extrabold text-white leading-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-sm">
            {FAQS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              const CatIcon = categoryIcons[item.category];
              const catColor = categoryColors[item.category];

              return (
                <div
                  key={idx}
                  className={`faq-item border rounded-xl overflow-hidden bg-surface-container/20 transition-all duration-300 opacity-0 ${
                    isOpen
                      ? "border-primary/40 shadow-[0_0_20px_rgba(192,132,252,0.1)]"
                      : "border-outline-variant/40 hover:border-primary/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-md text-left hover:bg-surface-container/40 transition-colors duration-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-sm">
                      <span className={`p-1.5 rounded-lg text-[10px] font-mono border ${catColor}`}>
                        <CatIcon className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block leading-none mb-1">
                          {item.category}
                        </span>
                        <span className="font-display text-body-md font-bold text-white pr-md">
                          {item.question}
                        </span>
                      </div>
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  <div
                    ref={(el) => { answerRefs.current[idx] = el; }}
                    className="overflow-hidden"
                    style={{ height: isOpen ? "auto" : "0px" }}
                  >
                    <div className="p-md pt-0 border-t border-outline-variant/20 text-on-surface-variant text-body-md leading-relaxed">
                      {item.answer}
                    </div>
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