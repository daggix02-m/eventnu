import { HeaderSkeleton, CardGridSkeleton } from '@/components/skeletons'

export default function AnalyticsLoading() {
  return (
    <div className="animate-ink-in space-y-6">
      <HeaderSkeleton />
      <CardGridSkeleton rows={2} />
    </div>
  )
}
