import Link from "next/link";
import Image from "next/image";
import { Mail, Instagram, Send, ArrowUpRight } from "lucide-react";

const exploreLinks = [
  { href: "/", label: "Find Events" },
  { href: "/categories", label: "Categories" },
  { href: "/organizers", label: "For Organizers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const connectLinks = [
  { href: "mailto:event.nua@gmail.com", label: "event.nua@gmail.com", icon: Mail },
  {
    href: "https://www.instagram.com/event_nu?igsh=eWxocTA3Yno4OXN0",
    label: "@event_nu",
    icon: Instagram,
  },
  {
    href: "https://t.me/Event_Nu",
    label: "@Event_Nu",
    icon: Send,
  },
];

const legalLinks = [
  { href: "/info/privacy-policy", label: "Privacy Policy" },
  { href: "/info/terms-of-service", label: "Terms of Service" },
  { href: "/info/community-guidelines", label: "Community Guidelines" },
];

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest">
      <div
        className="h-px w-full"
        style={{
          background:
            "repeating-linear-gradient(90deg, var(--color-primary) 0px, var(--color-primary) 4px, transparent 4px, transparent 8px, var(--color-secondary) 8px, var(--color-secondary) 12px, transparent 12px, transparent 16px)",
          opacity: 0.4,
        }}
        aria-hidden="true"
      />

      <div className="max-w-container-max mx-auto px-gutter py-2xl">
        {/* Statement + contact split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-xl md:gap-2xl">
          <div className="md:col-span-7 space-y-md">
            <Link href="/" className="inline-flex items-center gap-sm">
              <Image
                src="/logo.png"
                alt="Event Nu"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-headline-md text-primary font-bold">
                Event Nu
              </span>
            </Link>
            <h2 className="font-display text-[28px] md:text-[40px] font-extrabold leading-tight text-on-background">
              Discover live experiences in Addis Ababa.{" "}
              <span className="text-primary">All events in one place.</span>
            </h2>
          </div>

          <div className="md:col-span-5 md:justify-self-end md:text-right">
            <p className="text-label-sm text-secondary uppercase tracking-wider">
              Contact
            </p>
            <nav
              className="mt-sm flex flex-col gap-sm md:items-end"
              aria-label="Contact links"
            >
              {connectLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex items-center gap-sm text-body-md text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Explore — giant nav list */}
        <nav
          className="mt-xl border-t border-outline-variant"
          aria-label="Explore links"
        >
          {exploreLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group flex items-center justify-between border-b border-outline-variant py-sm md:py-md transition-colors"
            >
              <span className="font-display text-2xl md:text-3xl font-bold text-on-surface-variant group-hover:text-primary transition-colors">
                {link.label}
              </span>
              <ArrowUpRight className="w-6 h-6 md:w-7 md:h-7 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>
          ))}
        </nav>

        {/* Bottom bar */}
        <div className="pt-lg mt-xl flex flex-col sm:flex-row items-center justify-between gap-md">
          <p className="text-tertiary text-label-sm">
            &copy; {new Date().getFullYear()} Event Nu Ecosystem. All rights
            reserved.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-sm gap-y-sm"
            aria-label="Legal links"
          >
            {legalLinks.map((link, i) => (
              <span key={link.label} className="flex items-center">
                {i > 0 && (
                  <span
                    className="text-on-surface-variant/40 select-none mx-sm"
                    aria-hidden="true"
                  >
                    &middot;
                  </span>
                )}
                <Link
                  href={link.href}
                  className="text-on-surface-variant hover:text-primary transition-colors text-label-sm"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
