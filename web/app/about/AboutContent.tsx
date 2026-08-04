"use client";

import Link from "next/link";
import Image from "next/image";
import { Ticket, BarChart3, Users, Zap, Shield, Check } from "lucide-react";

const valueCards = [
  {
    icon: Users,
    title: "Community First",
    description: "Building bridges between local talent and global audiences.",
    imageUrl: "/images/events/july-13-19/feta-socity.png",
  },
  {
    icon: Zap,
    title: "Radical Simplicity",
    description: "Removing every friction point between you and the experience.",
    imageUrl: "/images/events/july-01-05/utopia-night.png",
  },
  {
    icon: Shield,
    title: "Trust & Security",
    description: "Enterprise-grade security for every single ticket issued.",
    imageUrl: "/images/events/july-20-26/bloom-week.png",
  },
];

export function AboutContent() {
  return (
    <div className="max-w-container-max mx-auto px-gutter py-xl space-y-xl">
      {/* Section 1: Mission Statement Hero */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3c0091] to-[#6d3bd7] p-lg text-center md:text-left flex flex-col md:flex-row items-center gap-lg">
        <div className="relative z-10 flex-1">
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-white mb-sm">
            All Addis events,
            <br />
            one place.
          </h1>
          <p className="font-body-lg text-body-lg text-[#e9ddff] max-w-2xl">
            Event Nu is the rhythmic pulse of Addis Ababa&apos;s social scene. We curate the most vibrant experiences, from underground jazz sessions to high-energy festivals, ensuring you never miss a beat.
          </p>
          <div className="mt-md">
            <Link
              href="/"
              className="bg-white text-on-primary-container font-bold px-lg py-sm rounded-full active:scale-95 transition-transform hover:shadow-lg"
            >
              Explore Now
            </Link>
          </div>
        </div>
        <div className="relative z-10 hidden md:block w-64 h-64 rounded-xl rotate-3 overflow-hidden shadow-2xl border-4 border-white/20">
          <Image
            src="/images/events/july-20-26/night-shift.png"
            alt="Addis Ababa nightlife"
            fill
            className="object-cover"
            sizes="256px"
          />
        </div>
      </section>

      {/* Section 2: Audience Value Propositions */}
      <section className="grid md:grid-cols-2 gap-md">
        {/* Attendees Card */}
        <div className="bg-surface-container-low border border-outline-variant p-md rounded-xl flex flex-col h-full hover:bg-surface-container-high transition-colors">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-sm">
            <Ticket className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-headline-md text-headline-md text-primary mb-xs">For Attendees</h3>
          <p className="font-body-md text-body-md text-on-surface-variant flex-grow mb-md">
            Discover hand-picked events tailored to your vibe. Enjoy seamless ticket booking, instant
            digital entry, and personalized reminders so the fun starts before you even arrive.
          </p>
          <ul className="space-y-xs">
            <li className="flex items-center gap-xs font-label-sm text-label-sm text-tertiary">
              <Check className="w-4 h-4" /> Instant QR Tickets
            </li>
            <li className="flex items-center gap-xs font-label-sm text-label-sm text-tertiary">
              <Check className="w-4 h-4" /> Curated Discovery
            </li>
          </ul>
        </div>

        {/* Organizers Card */}
        <div className="bg-surface-container-low border border-outline-variant p-md rounded-xl flex flex-col h-full hover:bg-surface-container-high transition-colors">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-sm">
            <BarChart3 className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="font-headline-md text-headline-md text-secondary mb-xs">For Organizers</h3>
          <p className="font-body-md text-body-md text-on-surface-variant flex-grow mb-md">
            Scale your impact with professional tools. Manage ticket sales, track real-time analytics,
            and reach a dedicated community of event-seekers in the heart of Addis.
          </p>
          <ul className="space-y-xs">
            <li className="flex items-center gap-xs font-label-sm text-label-sm text-secondary">
              <Check className="w-4 h-4" /> Detailed Analytics
            </li>
            <li className="flex items-center gap-xs font-label-sm text-label-sm text-secondary">
              <Check className="w-4 h-4" /> Fast Payouts
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: Core Values */}
      <section className="text-center">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-lg">Our Core Values</h2>
        <div className="grid md:grid-cols-3 gap-lg">
          {valueCards.map((value) => (
            <div key={value.title} className="group">
              <div className="mb-sm overflow-hidden rounded-xl aspect-square glass-card relative flex items-center justify-center">
                <Image
                  src={value.imageUrl}
                  alt={value.title}
                  fill
                  className="object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <value.icon className="w-12 h-12 text-white relative z-10" strokeWidth={1.5} />
              </div>
              <h4 className="font-headline-md text-body-lg font-bold text-on-surface">
                {value.title}
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs px-sm">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: CTA */}
      <section className="bg-surface-container-highest rounded-xl p-lg text-center border border-outline-variant">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
          Ready to find your next move?
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-md">
          Join thousands of others discovering the best of Addis Ababa every day.
        </p>
        <div className="flex flex-wrap justify-center gap-sm">
          <Link
            href="/"
            className="inline-block bg-primary text-on-primary font-bold px-lg py-sm rounded-lg active:scale-95 transition-all"
          >
            Start Discovering
          </Link>
          <Link
            href="/contact"
            className="inline-block border border-primary text-primary font-bold px-lg py-sm rounded-lg active:scale-95 transition-all hover:bg-primary/5"
          >
            Partner With Us
          </Link>
        </div>
      </section>
    </div>
  );
}
