import { ListSkeleton } from '@/components/skeletons'

export default function NotificationsLoading() {
  return <ListSkeleton rows={5} action={false} />
}
