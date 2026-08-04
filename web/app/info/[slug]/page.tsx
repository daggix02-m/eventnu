import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { getPageBySlug } from "@/lib/api/events";
import { sanitizeHtml } from "@/lib/sanitize";

export const revalidate = 60;

interface InfoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: InfoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  return {
    title: page ? `${page.title} | Event Nu` : "Page Not Found | Event Nu",
  };
}

export default async function InfoPage({ params }: InfoPageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <>
      {page.hero_image_url && (
        <section className="relative h-[320px] md:h-[400px] w-full overflow-hidden">
          <Image
            src={page.hero_image_url}
            alt={page.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </section>
      )}
      <Container className="py-xl space-y-md">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg">{page.title}</h1>
        {page.subtitle && (
          <p className="text-on-surface-variant text-body-lg">{page.subtitle}</p>
        )}
        <div
          className="prose prose-invert prose-lg max-w-none font-body-lg text-on-surface-variant leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body_html ?? "") }}
        />
      </Container>
    </>
  );
}
