import { ListSkeleton } from '@/components/shared/skeletons'

export default function NotificationsLoading() {
  return <ListSkeleton rows={5} action={false} />
}
