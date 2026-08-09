'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Avatar } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  ArrowLeft,
  Mail,
  Calendar,
  Users,
  Heart,
  MessageSquare,
  Shield,
  ShieldCheck,
  XCircle,
  Bell,
  Send,
} from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { fadeUp } from '@/lib/motion'
import { suspendUser, unsuspendUser, banUser } from '@/lib/actions/users'
import { sendNotification } from '@/lib/actions/notifications'
import { getOrganizerRecentEvents } from '@/lib/actions/events'

interface Profile {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  suspended: boolean
  created_at: string
  updated_at: string
}

interface Stats {
  eventCount: number
  likeCount: number
  followCount: number
  commentCount: number
}

interface UserDetailClientProps {
  profile: Profile
  role: string | null
  stats: Stats | null
  currentAdminId: string | null
}

interface EventItem {
  id: string
  title: string
  start_date: string
  status: string
}

export function UserDetailClient({ profile, role, stats, currentAdminId }: UserDetailClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [recentEvents, setRecentEvents] = useState<EventItem[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showNotificationForm, setShowNotificationForm] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationBody, setNotificationBody] = useState('')
  const router = useRouter()
  const isCurrentAdmin = profile.id === currentAdminId

  useEffect(() => {
    let cancelled = false
    setEventsLoading(true)
    setRecentEvents([])
    getOrganizerRecentEvents(profile.id)
      .then((items) => {
        if (!cancelled) setRecentEvents(items)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEventsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [profile.id])

  const handleSuspend = async () => {
    setIsLoading(true)
    try {
      await suspendUser(profile.id)
      toast.success('User suspended')
      setShowSuspendDialog(false)
      router.refresh()
    } catch (err) {
      console.error('Suspend error:', err)
      toast.error('Failed to suspend user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    setIsLoading(true)
    try {
      await unsuspendUser(profile.id)
      toast.success('User unsuspended')
      router.refresh()
    } catch (err) {
      console.error('Unsuspend error:', err)
      toast.error('Failed to unsuspend user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBan = async () => {
    setIsLoading(true)
    try {
      await banUser(profile.id)
      toast.success('User banned')
      router.refresh()
    } catch (err) {
      console.error('Ban error:', err)
      toast.error('Failed to ban user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      toast.error('Please fill in both title and body')
      return
    }
    setIsLoading(true)
    try {
      await sendNotification({
        userId: profile.id,
        type: 'admin',
        title: notificationTitle,
        body: notificationBody,
      })
      toast.success('Notification sent')
      setNotificationTitle('')
      setNotificationBody('')
      setShowNotificationForm(false)
    } catch (err) {
      console.error('Notification error:', err)
      toast.error('Failed to send notification')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Users
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" width={64} height={64} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-2xl">
                {(profile.full_name || profile.username || 'U').charAt(0)}
              </div>
            )}
          </Avatar>
          <div>
            <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">{profile.full_name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            <div className="flex items-center gap-2 mt-1">
              <Mail size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{profile.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <motion.div {...fadeUp} className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          {profile.suspended ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <XCircle size={20} className="text-destructive" />
              </div>
              <div>
                <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>
                <p className="text-xs text-muted-foreground mt-1">Status</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <ShieldCheck size={20} className="text-success" />
              </div>
              <div>
                <Badge className="text-xs bg-success/10 text-success border-success/20">
                  <ShieldCheck size={10} className="mr-1" />
                  Active
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Status</p>
              </div>
            </>
          )}
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground capitalize">{role || 'user'}</p>
            <p className="text-xs text-muted-foreground">Role</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
            <Calendar size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{format(new Date(profile.created_at), 'MMM d, yyyy')}</p>
            <p className="text-xs text-muted-foreground">Joined</p>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar size={16} />
              <span className="text-xs uppercase tracking-tight font-semibold">Events</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.eventCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Heart size={16} />
              <span className="text-xs uppercase tracking-tight font-semibold">Likes</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.likeCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users size={16} />
              <span className="text-xs uppercase tracking-tight font-semibold">Follows</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.followCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MessageSquare size={16} />
              <span className="text-xs uppercase tracking-tight font-semibold">Comments</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.commentCount}</p>
          </Card>
        </motion.div>
      )}

      {/* Profile Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Profile Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">Full Name</p>
              <p className="text-sm text-foreground">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">Email</p>
              <p className="text-sm text-foreground">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">Username</p>
              <p className="text-sm text-foreground">@{profile.username}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">User ID</p>
              <p className="text-sm text-muted-foreground font-mono text-xs">{profile.id}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Actions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Actions</h2>
          <div className="flex flex-wrap items-center gap-3">
            {isCurrentAdmin ? (
              <p className="text-sm text-muted-foreground">
                This is your account. You cannot suspend or ban yourself.
              </p>
            ) : profile.suspended ? (
              <Button
                onClick={handleUnsuspend}
                disabled={isLoading}
                className="bg-success hover:bg-success/90 text-white"
              >
                <ShieldCheck size={16} className="mr-2" />
                Unsuspend User
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setShowSuspendDialog(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="text-warning border-warning/30 hover:bg-warning/10"
                >
                  <Shield size={16} className="mr-2" />
                  Suspend User
                </Button>
                <Button
                  onClick={() => setShowBanDialog(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <XCircle size={16} className="mr-2" />
                  Ban User
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowNotificationForm(!showNotificationForm)}
              disabled={isLoading}
              variant="outline"
            >
              <Bell size={16} className="mr-2" />
              Send Notification
            </Button>
          </div>

          {showNotificationForm && (
            <div className="mt-4 p-4 bg-surface rounded-xl border border-outline-variant space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Notification title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Body</label>
                <textarea
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm min-h-[80px] resize-none"
                  placeholder="Notification message..."
                />
              </div>
              <Button
                onClick={handleSendNotification}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send size={14} className="mr-2" />
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Organized Events</h2>
          {eventsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events created.</p>
          ) : (
            <div className="divide-y divide-outline-variant">
              {recentEvents.map((event) => (
                <div key={event.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.start_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs ${
                      event.status === 'published'
                        ? 'bg-success/10 text-success border-success/20'
                        : event.status === 'pending_review'
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Suspend Dialog */}
      {showSuspendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSuspendDialog(false)} />
          <div className="relative bg-card rounded-2xl shadow-sm border border-outline-variant p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-foreground mb-2">Suspend User</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to suspend <strong>{profile.full_name}</strong>? They will be unable to access the platform.
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSuspend}
                disabled={isLoading}
                className="bg-warning hover:bg-warning/90 text-white"
              >
                {isLoading ? 'Suspending...' : 'Confirm Suspend'}
              </Button>
              <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showBanDialog}
        onOpenChange={(open) => {
          if (!open) setShowBanDialog(false)
        }}
        title="Ban user?"
        description="Are you sure you want to ban this user? This will suspend their account permanently."
        confirmLabel="Ban"
        destructive
        loading={isLoading}
        onConfirm={handleBan}
      />
    </div>
  )
}
