import type { Metadata } from "next";
import { ExperiencesClient } from "@/components/experiences/ExperiencesClient";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Experiences | Event Nu",
  description: "Share what you experienced at events in Addis Ababa and read others' stories.",
};

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  return (
    <Container className="py-xl">
      <ExperiencesClient eventSlug={event} />
    </Container>
  );
}
