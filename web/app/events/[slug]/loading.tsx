export default function EventLoading() {
  return (
    <div className="min-h-screen bg-background">
      <p className="sr-only" role="status" aria-live="polite">
        Loading event…
      </p>
      {/* Hero skeleton */}
      <div className="relative w-full h-[380px] sm:h-[460px] md:h-[540px] lg:h-[600px] bg-surface-container-highest animate-pulse" />
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-lg space-y-lg" aria-hidden="true">
        <div className="space-y-sm">
          <div className="h-8 w-3/4 bg-surface-container-high rounded animate-pulse" />
          <div className="h-5 w-1/2 bg-surface-container rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div className="md:col-span-2 space-y-md">
            <div className="h-40 bg-surface-container rounded-xl animate-pulse" />
            <div className="h-60 bg-surface-container rounded-xl animate-pulse" />
          </div>
          <div className="space-y-md">
            <div className="h-32 bg-surface-container rounded-xl animate-pulse" />
            <div className="h-48 bg-surface-container rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
