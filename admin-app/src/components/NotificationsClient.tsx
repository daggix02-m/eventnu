'use client'

import { useState, useEffect } from 'react'
import { Button } from 'company-design-system'
import { Card } from 'company-design-system'
import { Badge } from 'company-design-system'
import { Input } from '@/components/ui/input'
import {
  Send,
  Bell,
  Check,
  AlertTriangle,
  Info,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { sendNotification } from '@/lib/actions/notifications'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
  profiles?: {
    id: string
    username: string
    full_name: string
  }[]
}

interface NotificationsClientProps {
  initialNotifications: Notification[]
  initialCount: number
  initialPage: number
}

export function NotificationsClient({
  initialNotifications,
  initialCount,
  initialPage,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [count, setCount] = useState(initialCount)
  const [page, setPage] = useState(initialPage)
  const [isLoading, setIsLoading] = useState(false)
  const [composeMode, setComposeMode] = useState(false)
  const [form, setForm] = useState({
    type: 'announcement',
    title: '',
    body: '',
    broadcast: true,
    userId: '',
  })
  const router = useRouter()

  useEffect(() => {
    setNotifications(initialNotifications)
    setCount(initialCount)
    setPage(initialPage)
  }, [initialNotifications, initialCount, initialPage])

  const perPage = 20
  const totalPages = Math.ceil(count / perPage)

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    router.push(`/notifications?page=${newPage}`)
  }

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
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send notification')
    } finally {
      setIsLoading(false)
    }
  }

  const typeIcons: Record<string, any> = {
    announcement: Megaphone,
    warning: AlertTriangle,
    info: Info,
    friend_request: User,
    event_cancelled: Bell,
    event_rejected: Bell,
  }

  const typeColors: Record<string, string> = {
    announcement: 'bg-surface-container-high text-muted-foreground',
    warning: 'bg-surface-container-high text-muted-foreground',
    info: 'bg-surface-container-high text-muted-foreground',
    friend_request: 'bg-surface-container-high text-muted-foreground',
    event_cancelled: 'bg-surface-container-high text-muted-foreground',
    event_rejected: 'bg-surface-container-high text-muted-foreground',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Broadcast notifications to users.</p>
        </div>
        <Button
          onClick={() => setComposeMode(!composeMode)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Send size={16} className="mr-2" />
          {composeMode ? 'Cancel' : 'Compose'}
        </Button>
      </div>

      {/* Compose Form */}
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
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
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

      {/* Notification History */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-outline-variant">
          <h3 className="text-lg font-bold text-foreground">Notification History</h3>
          <p className="text-sm text-muted-foreground">All sent notifications</p>
        </div>
        <div className="divide-y divide-outline-variant">
          {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
              <Bell size={20} className="text-muted-foreground" />
            </div>
            <p>No notifications sent yet.</p>
          </div>
          ) : (
            notifications.map((notification) => {
              const TypeIcon = typeIcons[notification.type] || Info
              return (
                <div
                  key={notification.id}
                  className="p-4 flex items-start gap-4 hover:bg-surface-container-low transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[notification.type] || 'bg-muted text-muted-foreground'}`}>
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
                      <span>{format(new Date(notification.created_at), 'MMM d, yyyy HH:mm')}</span>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
            <p className="text-sm text-muted-foreground">
              Showing {((page || 1) - 1) * perPage + 1} - {Math.min((page || 1) * perPage, count)} of {count}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange((page || 1) - 1)}
                disabled={(page || 1) <= 1}
                className="p-2 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium">
                {page || 1} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange((page || 1) + 1)}
                disabled={(page || 1) >= totalPages}
                className="p-2 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
