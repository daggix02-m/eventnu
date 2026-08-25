export default function OrganizerLoading() {
  return (
    <div className="min-h-screen bg-background">
      <p className="sr-only" role="status" aria-live="polite">
        Loading organizer profile…
      </p>
      {/* Banner skeleton */}
      <div className="h-48 sm:h-64 bg-surface-container-highest animate-pulse" />
      {/* Profile skeleton */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 space-y-lg"
        aria-hidden="true"
      >
        <div className="flex items-end gap-md">
          <div className="w-32 h-32 rounded-full bg-surface-container-high border-4 border-background animate-pulse" />
          <div className="space-y-sm pb-2">
            <div className="h-7 w-48 bg-surface-container-high rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface-container rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden animate-pulse"
            >
              <div className="h-44 bg-surface-container-high" />
              <div className="p-md space-y-sm">
                <div className="h-5 w-3/4 bg-surface-container-high rounded" />
                <div className="h-4 w-1/2 bg-surface-container-high rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
