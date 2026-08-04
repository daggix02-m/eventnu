import { Container } from "@/components/layout/Container";

export default function HomeLoading() {
  return (
    <>
      <section className="relative h-[614px] md:h-[768px] w-full bg-surface-container-lowest animate-pulse" />
      <section className="py-xl">
        <Container>
          <div className="h-10 w-64 bg-surface-container-high rounded mb-sm animate-pulse" />
          <div className="h-6 w-96 bg-surface-container rounded mb-lg animate-pulse" />
          <div className="flex gap-sm mb-lg animate-pulse">
            <div className="h-10 w-24 bg-surface-container-high rounded-full" />
            <div className="h-10 w-24 bg-surface-container-high rounded-full" />
            <div className="h-10 w-24 bg-surface-container-high rounded-full" />
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
      </section>
    </>
  );
}
