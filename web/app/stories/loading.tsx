import { Skeleton } from '@/components/ui/skeleton'

export default function StoriesLoading() {
  return (
    <div className="mx-auto w-full max-w-[52rem] space-y-lg" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
      <Skeleton className="h-12 w-44 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}
