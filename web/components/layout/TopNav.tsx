"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthButton } from "@/components/auth/AuthButton";

const navItems = [
  { href: "/", label: "Find Events" },
  { href: "/categories", label: "Categories" },
  { href: "/organizers", label: "For Organizers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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

  return (
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
              width={794}
              height={672}
              style={{ height: '44px', width: 'auto' }}
              className="transition-opacity duration-200 hover:opacity-80"
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

        <div className="hidden md:block">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
