'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import {
  ChevronDown,
  DollarSign,
  Shield,
  CreditCard,
  Eye,
  ArrowRight,
} from 'lucide-react'
import { Container } from '@/components/layout/Container'
import Link from 'next/link'

const CATEGORIES = ['All', 'Pricing', 'Payments', 'Check-in', 'Visibility'] as const

const FAQS = [
  {
    category: 'Pricing',
    icon: DollarSign,
    question: 'How much does it cost to list and sell tickets on Event Nu?',
    answer:
      'Listing your event is 100% free. If your event is free, there are absolutely zero hosting or registration charges. For paid events, we charge a low, flat processing fee per ticket sold, which you can choose to pass on to ticket buyers or absorb yourself.',
  },
  {
    category: 'Payments',
    icon: CreditCard,
    question: 'Which local payment options are supported for ticket buyers in Ethiopia?',
    answer:
      'We support direct checkouts via Telebirr, CBE Birr, Chapa, mobile wallets, and international credit/debit cards, giving your attendees in Addis and abroad a friction-free purchasing experience.',
  },
  {
    category: 'Payments',
    icon: CreditCard,
    question: 'How quickly do I get payouts for sold tickets?',
    answer:
      'You can request settlements during your ticket sales cycle. Revenue is deposited directly into your designated Ethiopian bank account or mobile wallet within 24 to 48 hours.',
  },
  {
    category: 'Check-in',
    icon: Shield,
    question: 'Do I need to buy special QR scanners to manage the door check-in?',
    answer:
      'No specialized hardware is required. You and your team can download the official Event Nu Organizer App on any standard iOS or Android smartphone to turn its built-in camera into a high-speed QR code ticket scanner.',
  },
  {
    category: 'Visibility',
    icon: Eye,
    question: 'Can I host hidden, private, or invite-only events?',
    answer:
      "Yes. When creating an event, you can set the visibility to 'Unlisted'. This hides it from our public discovery marketplace and lets you share the private ticket link directly with your guests via email or messaging apps.",
  },
] as const

export function OrganizersFAQ() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('All')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  useGSAP(
    () => {
      const faqItems = sectionRef.current?.querySelectorAll('.faq-item')
      if (faqItems) {
        gsap.fromTo(
          faqItems,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          },
        )
      }
    },
    { scope: sectionRef },
  )

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const categoryColors: Record<string, string> = {
    Pricing: 'text-primary border-primary/30 bg-primary/10',
    Payments: 'text-secondary border-secondary/30 bg-secondary/10',
    'Check-in': 'text-tertiary border-tertiary/30 bg-tertiary/10',
    Visibility: 'text-primary border-primary/30 bg-primary/10',
  }

  const categoryIcons: Record<string, React.ElementType> = {
    Pricing: DollarSign,
    Payments: CreditCard,
    'Check-in': Shield,
    Visibility: Eye,
  }

  const filteredFaqs = FAQS.filter(
    (faq) => activeCategory === 'All' || faq.category === activeCategory,
  )

  return (
    <section ref={sectionRef} className="relative z-10 py-2xl border-t border-outline-variant/30">
      <Container>
        <div className="max-w-[48rem] mx-auto space-y-lg">
          {/* Header */}
          <div className="text-center max-w-[48rem] mx-auto mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Frequently Asked Questions
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center justify-center gap-xs flex-wrap border-b border-outline-variant/20 pb-sm">
            {CATEGORIES.map((cat) => {
              const count =
                cat === 'All' ? FAQS.length : FAQS.filter((f) => f.category === cat).length
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat)
                    setOpenFaqIndex(null) // Reset open states on tab change
                  }}
                  className={`px-sm py-1.5 rounded-full font-mono text-label-sm font-semibold transition-all flex items-center gap-xs cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm font-bold'
                      : 'bg-surface-container/30 border border-outline-variant/35 text-on-surface-variant hover:text-white'
                  }`}
                >
                  {cat}
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* FAQS List */}
          <div className="space-y-sm min-h-[250px]">
            {filteredFaqs.map((item) => {
              // We need a stable index key since we filter lists
              const originalIndex = FAQS.findIndex((f) => f.question === item.question)
              const isOpen = openFaqIndex === originalIndex
              const CatIcon = categoryIcons[item.category]
              const catColor = categoryColors[item.category]

              return (
                <div
                  key={item.question}
                  className={`faq-item border rounded-xl overflow-hidden bg-surface-container/20 transition-all duration-300 ${
                    isOpen
                      ? 'border-primary/50 shadow-md shadow-black/30 bg-surface-container/30'
                      : 'border-outline-variant/40 hover:border-primary/25'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(originalIndex)}
                    className="w-full flex items-center justify-between p-md text-left hover:bg-surface-container/45 transition-colors duration-200 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-sm">
                      <span className={`p-2 rounded-lg border ${catColor}`}>
                        <CatIcon className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block leading-none mb-1">
                          {item.category}
                        </span>
                        <span className="font-display text-[15px] md:text-[16px] font-bold text-white pr-md">
                          {item.question}
                        </span>
                      </div>
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen
                        ? 'max-h-[300px] opacity-100 border-t border-outline-variant/15'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-md text-on-surface-variant text-body-md leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer help link */}
          <div className="text-center pt-md">
            <p className="text-on-surface-variant text-body-md">
              Have another question not answered here?{' '}
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-bold transition-colors"
              >
                Contact our support team <ArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
