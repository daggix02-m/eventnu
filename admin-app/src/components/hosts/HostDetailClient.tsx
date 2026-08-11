'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button, Card, Badge, Textarea } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  CheckCircle,
  Trash2,
  Users,
} from 'lucide-react'
import { formatDate } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { fadeUp } from '@/lib/motion'
import { updateHost, updateHostStatus, deleteHost } from '@/lib/actions/hosts'
import { getHostRecentEvents } from '@/lib/actions/events'

const hostTypeLabels: Record<string, string> = {
  registered_org: 'Registered Org',
  community_organizer: 'Community',
  venue: 'Venue',
}

interface Host {
  id: string
  name: string
  slug: string
  host_type: string
  description: string
  contact_email?: string
  contact_phone?: string
  website?: string
  location_text?: string
  logo_url?: string
  verified: boolean
  status: string
  follower_count: number
  created_at: string
  updated_at: string
}

interface HostDetailClientProps {
  host: Host
  eventCount: number
}

interface EventItem {
  id: string
  title: string
  start_date: string
  status: string
}

export function HostDetailClient({ host, eventCount }: HostDetailClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [form, setForm] = useState({
    name: host.name,
    slug: host.slug,
    host_type: host.host_type,
    description: host.description,
    contact_email: host.contact_email || '',
    contact_phone: host.contact_phone || '',
    website: host.website || '',
    location_text: host.location_text || '',
    logo_url: host.logo_url || '',
  })
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    setEventsLoading(true)
    setEvents([])
    getHostRecentEvents(host.id)
      .then((items) => {
        if (!cancelled) setEvents(items)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEventsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [host.id])

  const handleSuspend = async () => {
    setShowSuspendDialog(false)
    setIsLoading(true)
    try {
      await updateHostStatus(host.id, 'suspended', 'suspend_host')
      toast.success('Host suspended')
      router.refresh()
    } catch (err) {
      console.error('Suspend error:', err)
      toast.error(getErrorMessage(err, 'Failed to suspend host'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    setIsLoading(true)
    try {
      await updateHostStatus(host.id, 'active', 'unsuspend_host')
      toast.success('Host activated')
      router.refresh()
    } catch (err) {
      console.error('Unsuspend error:', err)
      toast.error(getErrorMessage(err, 'Failed to activate host'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setShowDeleteDialog(false)
    setIsLoading(true)
    try {
      await deleteHost(host.id)
      toast.success('Host deleted')
      router.push('/hosts')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error(getErrorMessage(err, 'Failed to delete host'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateHost(host.id, {
        name: form.name,
        slug: form.slug,
        host_type: form.host_type,
        description: form.description,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        website: form.website,
        location_text: form.location_text,
        logo_url: form.logo_url,
      })
      toast.success('Host updated')
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      console.error('Update error:', err)
      toast.error(getErrorMessage(err, 'Failed to update host'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/hosts"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Hosts
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
              {host.logo_url ? (
                <img
                  src={host.logo_url}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 size={28} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">
                {host.name}
              </h1>
              <p className="text-muted-foreground">{host.slug}</p>
            </div>
          </div>
        </div>

        {/* Status & Stats */}
        <motion.div {...fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <Badge
              className={`text-xs ${
                host.status === 'active'
                  ? 'bg-success/10 text-success border-success/20'
                  : host.status === 'suspended'
                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {host.status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Status</p>
          </Card>
          <Card className="p-4">
            {host.verified ? (
              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                <ShieldCheck size={10} className="mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Unverified
              </Badge>
            )}
            <p className="text-xs text-muted-foreground mt-1">Verification</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users size={16} />
              <span className="text-2xl font-bold text-foreground">{host.follower_count}</span>
            </div>
            <p className="text-xs text-muted-foreground">Followers</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Building2 size={16} />
              <span className="text-2xl font-bold text-foreground">{eventCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Events</p>
          </Card>
        </motion.div>

        {/* Details Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Host Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">
                  Type
                </p>
                <p className="text-sm text-foreground">
                  {hostTypeLabels[host.host_type] || host.host_type}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">
                  Created
                </p>
                <p className="text-sm text-foreground">{formatDate(host.created_at)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">
                  Description
                </p>
                <p className="text-sm text-foreground mt-1">
                  {host.description || 'No description provided.'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">
                  Location
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{host.location_text || 'N/A'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">
                  Contact Email
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{host.contact_email || 'N/A'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">
                  Phone
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{host.contact_phone || 'N/A'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">
                  Website
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Globe size={14} className="text-muted-foreground" />
                  {host.website ? (
                    <a
                      href={host.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {host.website}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Events ({eventCount})</h2>
            {eventsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events hosted.</p>
            ) : (
              <div className="divide-y divide-outline-variant">
                {events.map((event) => (
                  <div key={event.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.start_date)}
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

        {/* Actions & Edit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Actions</h2>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {host.status === 'active' ? (
                <Button
                  onClick={() => setShowSuspendDialog(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="text-warning border-warning/30 hover:bg-warning/10"
                >
                  <Shield size={16} className="mr-2" />
                  Suspend
                </Button>
              ) : (
                <Button
                  onClick={handleUnsuspend}
                  disabled={isLoading}
                  className="bg-success hover:bg-success/90 text-white"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Activate
                </Button>
              )}
              <Button
                onClick={() => setIsEditing(!isEditing)}
                disabled={isLoading}
                variant="outline"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Host'}
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </div>

            {isEditing && (
              <form
                onSubmit={handleEditSubmit}
                className="space-y-4 p-4 bg-surface rounded-xl border border-outline-variant"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={form.host_type}
                    onChange={(e) => setForm({ ...form, host_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-background text-sm"
                  >
                    <option value="registered_org">Registered Org</option>
                    <option value="community_organizer">Community Organizer</option>
                    <option value="venue">Venue</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="min-h-[80px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <Input
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      value={form.location_text}
                      onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo URL</label>
                  <Input
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
      <ConfirmDialog
        open={showSuspendDialog}
        onOpenChange={(open) => {
          if (!open) setShowSuspendDialog(false)
        }}
        title="Suspend host?"
        description="Are you sure you want to suspend this host?"
        confirmLabel="Suspend"
        destructive
        loading={isLoading}
        onConfirm={handleSuspend}
      />
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) setShowDeleteDialog(false)
        }}
        title="Delete host?"
        description="Are you sure you want to delete this host? This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={isLoading}
        onConfirm={handleDelete}
      />
    </>
  )
}
