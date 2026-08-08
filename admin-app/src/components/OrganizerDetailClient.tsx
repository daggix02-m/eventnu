'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Avatar } from '@/components/ui'
import {
  ArrowLeft,
  Globe,
  Mail,
  Users,
  Shield,
  ShieldCheck,
  XCircle,
  CheckCircle,
  Building2,
  Link as LinkIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { verifyOrganizer, unverifyOrganizer, suspendOrganizer, unsuspendOrganizer } from '@/lib/actions/organizers'
import { getOrganizerRecentEvents } from '@/lib/actions/events'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}


interface Organizer {
  profile_id: string
  organizer_name: string
  bio: string
  logo_url?: string
  website?: string
  contact_email?: string
  social_links?: any
  follower_count: number
  verified: boolean
  created_at: string
  updated_at: string
  organizer_handle: string
  profiles: {
    id: string
    username: string
    full_name: string
    email: string
    avatar_url?: string
    suspended: boolean
  }[]
}

interface OrganizerDetailClientProps {
  organizer: Organizer
  eventCount: number
}

interface EventItem {
  id: string
  title: string
  start_date: string
  status: string
}

export function OrganizerDetailClient({ organizer, eventCount }: OrganizerDetailClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const router = useRouter()
  const profile = organizer.profiles[0]

  useEffect(() => {
    let cancelled = false
    setEventsLoading(true)
    setEvents([])
    getOrganizerRecentEvents(organizer.profile_id)
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
  }, [organizer.profile_id])

  const handleVerify = async () => {
    setIsLoading(true)
    try {
      await verifyOrganizer(organizer.profile_id)
      toast.success('Organizer verified')
      router.refresh()
    } catch (err) {
      console.error('Verify error:', err)
      toast.error('Failed to verify organizer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnverify = async () => {
    setIsLoading(true)
    try {
      await unverifyOrganizer(organizer.profile_id)
      toast.success('Organizer unverified')
      router.refresh()
    } catch (err) {
      console.error('Unverify error:', err)
      toast.error('Failed to unverify organizer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuspend = async () => {
    setIsLoading(true)
    try {
      await suspendOrganizer(organizer.profile_id)
      toast.success('Organizer suspended')
      router.refresh()
    } catch (err) {
      console.error('Suspend error:', err)
      toast.error('Failed to suspend organizer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    setIsLoading(true)
    try {
      await unsuspendOrganizer(organizer.profile_id)
      toast.success('Organizer unsuspended')
      router.refresh()
    } catch (err) {
      console.error('Unsuspend error:', err)
      toast.error('Failed to unsuspend organizer')
    } finally {
      setIsLoading(false)
    }
  }

  const socialLinks = useMemo(() => {
    if (typeof organizer.social_links !== 'string') return organizer.social_links
    try {
      return JSON.parse(organizer.social_links)
    } catch {
      return {}
    }
  }, [organizer.social_links])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/organizers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Organizers
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            {organizer.logo_url ? (
              <img src={organizer.logo_url} alt="" width={64} height={64} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-bold text-2xl">
                {(organizer.organizer_name || 'O').charAt(0)}
              </div>
            )}
          </Avatar>
          <div>
            <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">{organizer.organizer_name}</h1>
            <p className="text-muted-foreground">@{organizer.organizer_handle}</p>
          </div>
        </div>
      </div>

      {/* Status & Stats */}
      <motion.div {...fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          {organizer.verified ? (
            <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
              <ShieldCheck size={10} className="mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <Shield size={10} className="mr-1" />
              Unverified
            </Badge>
          )}
          <p className="text-xs text-muted-foreground mt-1">Verification</p>
        </Card>
        <Card className="p-4">
          {profile?.suspended ? (
            <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>
          ) : (
            <Badge className="text-xs bg-success/10 text-success border-success/20">
              <CheckCircle size={10} className="mr-1" />
              Active
            </Badge>
          )}
          <p className="text-xs text-muted-foreground mt-1">Status</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users size={16} />
            <span className="text-2xl font-bold text-foreground">{organizer.follower_count}</span>
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

      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">Bio</p>
              <p className="text-sm text-foreground mt-1">{organizer.bio || 'No bio provided.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">Contact Email</p>
                <div className="flex items-center gap-1 mt-1">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {organizer.contact_email || profile?.email || 'N/A'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">Website</p>
                <div className="flex items-center gap-1 mt-1">
                  <Globe size={14} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{organizer.website || 'N/A'}</span>
                </div>
              </div>
            </div>
            {socialLinks && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-semibold mb-2">Social Links</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-xs text-foreground hover:bg-surface-container-highest transition-colors"
                    >
                      <LinkIcon size={12} />
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
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
            <p className="text-sm text-muted-foreground">No events created.</p>
          ) : (
            <div className="divide-y divide-outline-variant">
              {events.map((event) => (
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

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Actions</h2>
          <div className="flex flex-wrap items-center gap-3">
            {organizer.verified ? (
              <Button
                onClick={handleUnverify}
                disabled={isLoading}
                variant="outline"
                className="text-warning border-warning/30 hover:bg-warning/10"
              >
                <Shield size={16} className="mr-2" />
                Unverify
              </Button>
            ) : (
              <Button
                onClick={handleVerify}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ShieldCheck size={16} className="mr-2" />
                Verify
              </Button>
            )}
            {profile?.suspended ? (
              <Button
                onClick={handleUnsuspend}
                disabled={isLoading}
                className="bg-success hover:bg-success/90 text-white"
              >
                <CheckCircle size={16} className="mr-2" />
                Unsuspend
              </Button>
            ) : (
              <Button
                onClick={handleSuspend}
                disabled={isLoading}
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <XCircle size={16} className="mr-2" />
                Suspend
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
