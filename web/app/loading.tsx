import { Container } from "@/components/layout/Container";

export default function Loading() {
  return (
    <Container className="py-xl space-y-xl">
      <p className="sr-only" role="status" aria-live="polite">
        Loading content…
      </p>
      <div className="space-y-sm" aria-hidden="true">
        <div className="h-10 w-72 bg-surface-container-high rounded animate-pulse" />
        <div className="h-6 w-96 max-w-full bg-surface-container rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden animate-pulse">
            <div className="h-48 bg-surface-container-high" />
            <div className="p-md space-y-sm">
              <div className="h-5 w-3/4 bg-surface-container-high rounded" />
              <div className="h-4 w-1/2 bg-surface-container-high rounded" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
