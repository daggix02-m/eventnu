import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { getPageBySlug } from "@/lib/api/events";
import { sanitizeHtml } from "@/lib/sanitize";
import { LEGAL_PAGES, LEGAL_PAGE_SLUGS } from "../legal";

export const revalidate = 60;

interface InfoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: InfoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  const legal = LEGAL_PAGES[slug];
  const title = page?.title ?? legal?.title;
  return {
    title: title ? `${title} | Event Nu` : "Page Not Found | Event Nu",
  };
}

export default async function InfoPage({ params }: InfoPageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  const legal = LEGAL_PAGES[slug];

  if (!page && !legal) {
    notFound();
  }

  const title = page?.title ?? legal!.title;
  const subtitle = page?.subtitle ?? legal!.subtitle;
  const bodyHtml = page?.body_html ?? legal!.bodyHtml;
  const heroImage = page?.hero_image_url ?? null;

  return (
    <>
      {heroImage && (
        <section className="relative h-[320px] md:h-[400px] w-full overflow-hidden">
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </section>
      )}
      <Container className="py-xl space-y-md">
        <Link
          href="/"
          className="inline-flex items-center gap-xs font-mono text-label-sm text-on-surface-variant uppercase tracking-wider hover:text-primary transition-colors"
        >
          <span aria-hidden="true">←</span> Back to home
        </Link>
        <h1 className="font-display text-display-lg-mobile md:text-display-lg">{title}</h1>
        {subtitle && (
          <p className="text-on-surface-variant text-body-lg">{subtitle}</p>
        )}
        <div
          className="prose prose-invert prose-lg max-w-none font-body-lg text-on-surface-variant leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml ?? "") }}
        />
        {LEGAL_PAGE_SLUGS.length > 0 && (
          <nav className="pt-lg mt-lg border-t border-outline-variant/30" aria-label="Related pages">
            <h2 className="font-display text-headline-md text-on-surface mb-sm">Also read</h2>
            <ul className="flex flex-wrap gap-xs">
              {LEGAL_PAGE_SLUGS.filter((s) => s !== slug).map((s) => (
                <li key={s}>
                  <Link
                    href={`/info/${s}`}
                    className="inline-block px-sm py-1.5 rounded-full border border-outline-variant/40 bg-surface-container-low font-mono text-label-sm text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {LEGAL_PAGES[s].title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </Container>
    </>
  );
}
