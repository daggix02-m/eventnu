'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Send,
  Bell,
  Check,
  AlertTriangle,
  Info,
  Megaphone,
  User,
  Users,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { Button, Card, Badge, Input, Select } from '@/components/ui'
import { PageHeader } from '@/components/Page'
import { Pagination, EmptyState, useListFilters } from '@/components/list'
import { formatDateTime } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useNotifications, notificationsKeys } from '@/lib/api/notifications'
import { sendNotification } from '@/lib/actions/notifications'
import { toast } from 'sonner'
import type { MappedNotification } from '@/lib/mappers'

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'friend_request', label: 'Friend Request' },
  { value: 'event_cancelled', label: 'Event Cancelled' },
  { value: 'event_rejected', label: 'Event Rejected' },
]

const readOptions = [
  { value: 'all', label: 'All' },
  { value: 'false', label: 'Unread' },
  { value: 'true', label: 'Read' },
]

interface NotificationsClientProps {
  initialNotifications: MappedNotification[]
  initialCount: number
  initialPage: number
  initialFilters?: { search?: string; type?: string; read?: string }
}

export function NotificationsClient({
  initialNotifications,
  initialCount,
  initialPage,
  initialFilters = {},
}: NotificationsClientProps) {
  const queryClient = useQueryClient()
  const { filters, update, setPage, searchInput, setSearchInput } = useListFilters({
    basePath: '/notifications',
    initial: { page: initialPage, ...initialFilters },
    defaults: { page: 1, search: '', type: 'all', read: 'all' },
  })

  const { data, isFetching } = useNotifications(filters, { notifications: initialNotifications, count: initialCount })
  const notifications = data?.items ?? []
  const count = data?.total ?? 0
  const totalPages = Math.ceil(count / 20)

  const [isLoading, setIsLoading] = useState(false)
  const [composeMode, setComposeMode] = useState(false)
  const [form, setForm] = useState({
    type: 'announcement',
    title: '',
    body: '',
    broadcast: true,
    userId: '',
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: notificationsKeys })

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await sendNotification({
        userId: form.broadcast ? null : form.userId,
        type: form.type,
        title: form.title,
        body: form.body,
      })
      toast.success('Notification sent!')
      setComposeMode(false)
      setForm({
        type: 'announcement',
        title: '',
        body: '',
        broadcast: true,
        userId: '',
      })
      await refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send notification'))
    } finally {
      setIsLoading(false)
    }
  }

  const typeIcons: Record<string, LucideIcon> = {
    announcement: Megaphone,
    warning: AlertTriangle,
    info: Info,
    friend_request: User,
    event_cancelled: Bell,
    event_rejected: Bell,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Broadcast notifications to users."
        actions={
          <Button onClick={() => setComposeMode(!composeMode)}>
            <Send size={16} className="mr-2" />
            {composeMode ? 'Cancel' : 'Compose'}
          </Button>
        }
      />

      {composeMode && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Compose Notification</h3>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.broadcast}
                  onChange={() => setForm({ ...form, broadcast: true })}
                  className="w-4 h-4"
                />
                <Users size={14} />
                Broadcast to all users
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={!form.broadcast}
                  onChange={() => setForm({ ...form, broadcast: false })}
                  className="w-4 h-4"
                />
                <User size={14} />
                Specific user
              </label>
            </div>

            {!form.broadcast && (
              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <Input
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  placeholder="Enter user UUID"
                  required={!form.broadcast}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm"
              >
                <option value="announcement">Announcement</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Notification title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm min-h-[100px] resize-none"
                placeholder="Enter your message..."
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isLoading}>
                <Send size={16} className="mr-2" />
                {isLoading ? 'Sending...' : 'Send Notification'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setComposeMode(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-surface-container-high rounded-md border border-outline-variant px-3 py-2 flex-1 min-w-[200px] focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
          <Search size={16} className="text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-muted-foreground outline-none"
          />
        </div>
        <Select
          value={filters.type ?? 'all'}
          onChange={(e) => update('type', e.target.value)}
          className="w-auto min-w-[140px]"
        >
          {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select
          value={filters.read ?? 'all'}
          onChange={(e) => update('read', e.target.value)}
          className="w-auto min-w-[120px]"
        >
          {readOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-outline-variant">
          <h3 className="text-lg font-bold text-foreground">Notification History</h3>
          <p className="text-sm text-muted-foreground">All sent notifications</p>
        </div>
        <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="divide-y divide-outline-variant">
            {notifications.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications found." description="Try adjusting your filters." />
            ) : (
              notifications.map((notification) => {
                const TypeIcon = typeIcons[notification.type] || Info
                return (
                  <div
                    key={notification.id}
                    className="p-4 flex items-start gap-4 hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high text-muted-foreground flex items-center justify-center flex-shrink-0">
                      <TypeIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">{notification.title}</p>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{notification.body}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDateTime(notification.created_at)}</span>
                        {notification.profiles && notification.profiles.length > 0 ? (
                          <span>To: {notification.profiles[0].full_name || notification.profiles[0].username}</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Users size={10} />
                            Broadcast
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {notification.read ? (
                        <Badge className="text-xs bg-success/10 text-success border-success/20">
                          <Check size={10} className="mr-1" />
                          Read
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Unread
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
        <Pagination page={filters.page ?? 1} totalPages={totalPages} count={count} onPageChange={setPage} />
      </Card>
    </div>
  )
}
