export default function ScheduleLoading() {
  return (
    <div className="min-h-screen bg-background">
      <p className="sr-only" role="status" aria-live="polite">
        Loading schedule…
      </p>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-xl space-y-lg" aria-hidden="true">
        <div className="h-8 w-48 bg-surface-container-high rounded animate-pulse" />
        <div className="flex gap-sm">
          <div className="h-10 w-24 bg-surface-container rounded-full animate-pulse" />
          <div className="h-10 w-24 bg-surface-container rounded-full animate-pulse" />
          <div className="h-10 w-24 bg-surface-container rounded-full animate-pulse" />
        </div>
        <div className="space-y-md">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-md p-md bg-surface-container rounded-xl animate-pulse">
              <div className="w-20 h-20 bg-surface-container-high rounded-lg shrink-0" />
              <div className="flex-1 space-y-sm">
                <div className="h-5 w-3/4 bg-surface-container-high rounded" />
                <div className="h-4 w-1/2 bg-surface-container-high rounded" />
                <div className="h-3 w-1/3 bg-surface-container rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
