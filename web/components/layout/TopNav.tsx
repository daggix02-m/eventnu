"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Find Events" },
  { href: "/categories", label: "Categories" },
  { href: "/organizers", label: "For Organizers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 100);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "w-full sticky top-0 z-50 border-b border-outline-variant bg-background/80 backdrop-blur-md transition-shadow duration-200",
          scrolled && "sticky-nav-active"
        )}
      >
      <div className="flex justify-between items-center h-16 px-gutter max-w-container-max mx-auto">
        <div className="flex items-center gap-lg">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Event Nu"
              width={44}
              height={44}
              className="h-11 w-11 transition-opacity duration-200 hover:opacity-80"
              loading="eager"
            />
            <span className="sr-only">Event Nu</span>
          </Link>
          <nav className="hidden md:flex items-center gap-md">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "font-body-md text-body-md transition-colors duration-200",
                    isActive
                      ? "text-primary font-bold border-b-2 border-primary pb-1"
                      : "text-on-surface-variant hover:text-primary"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          className="md:hidden p-xs text-on-surface-variant hover:text-primary transition-colors active:scale-95"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-200",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        inert={!mobileOpen}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal={mobileOpen}
          aria-label="Menu"
          className={cn(
            "absolute top-0 right-0 h-full w-72 max-w-[80vw] bg-surface-container-low border-l border-outline-variant p-md transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex justify-between items-center mb-lg">
            <span className="font-display text-headline-md font-bold text-primary">Menu</span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-xs text-on-surface-variant hover:text-primary transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-sm">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-md py-sm rounded-lg font-body-md text-body-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-on-surface hover:bg-surface-container-high hover:text-primary"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
}
