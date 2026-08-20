'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import { useConvexAuth } from '@convex-dev/auth/react'
import { LogIn, CalendarDays, Users, Megaphone, Plus, Loader2 } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { VerifiedBadge } from '@/components/verification/VerifiedBadge'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.'
}

function formatTsShort(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

export function OrganizerDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  const me = useQuery(api.profiles.getMe)
  const organizer = useQuery(api.organizers.getMine)
  const isManaged = organizer?.managementMode === 'organizer_managed'
  const settings = useQuery(api.organizerSettings.get, isManaged ? undefined : 'skip')
  const events = useQuery(api.events.read.listMine, me && isManaged ? {} : 'skip')

  const updateOrganizer = useMutation(api.organizers.update)
  const resubmitApplication = useMutation(api.organizers.resubmit)
  const updateSettings = useMutation(api.organizerSettings.update)
  const createEvent = useMutation(api.events.write.createSelf)

  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')

  const [eventForm, setEventForm] = useState({
    title: '',
    startDate: '',
    venueName: '',
    description: '',
  })
  const [savingEvent, setSavingEvent] = useState(false)
  const [eventErr, setEventErr] = useState('')

  if (authLoading) {
    return (
      <Container className="py-lg">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </Container>
    )
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-lg">
        <div className="mx-auto w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center sm:p-8">
          <Megaphone className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <h1 className="mt-sm font-display text-headline-md text-on-surface">
            Sign in to manage your events
          </h1>
          <p className="mt-xs font-body-md text-on-surface-variant">
            Create an organizer profile to list and promote your events across Addis.
          </p>
          <Button className="mt-lg" onClick={() => openAuth()}>
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
        </div>
      </Container>
    )
  }

  if (me?.role !== 'organizer' || !organizer) {
    return (
      <Container className="py-lg">
        <div className="mx-auto w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center sm:p-8">
          <Megaphone className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <h1 className="mt-sm font-display text-headline-md text-on-surface">
            You don&apos;t have an organizer profile yet
          </h1>
          <p className="mt-xs font-body-md text-on-surface-variant">
            <a href="/auth" className="text-primary hover:underline">
              Create an organizer account
            </a>{' '}
            to list events.
          </p>
        </div>
      </Container>
    )
  }

  if (!isManaged) {
    return (
      <Container className="py-lg">
        <div className="mx-auto w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center sm:p-8">
          <h1 className="font-display text-headline-md text-on-surface">
            {organizer.organizerName}
          </h1>
          <p className="mt-xs font-body-md text-on-surface-variant">
            This organizer profile is managed by the Event Nu team. Contact us to make changes.
          </p>
        </div>
      </Container>
    )
  }

  if (organizer.applicationStatus === 'pending_review') {
    return (
      <Container className="py-lg">
        <div className="mx-auto w-full max-w-[34rem] rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center sm:p-8">
          <Megaphone className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
          <h1 className="mt-sm font-display text-headline-md text-on-surface">
            Your application is under review
          </h1>
          <p className="mt-xs font-body-md text-on-surface-variant">
            The Event Nu team will review your organizer details before you can publish events.
          </p>
        </div>
      </Container>
    )
  }

  if (organizer.applicationStatus === 'rejected') {
    return (
      <Container className="py-lg">
        <div className="mx-auto w-full max-w-[34rem] rounded-2xl border border-error/30 bg-surface-container-low p-6 text-center sm:p-8">
          <h1 className="font-display text-headline-md text-on-surface">
            Application not approved
          </h1>
          <p className="mt-xs font-body-md text-on-surface-variant">
            {organizer.rejectionReason ||
              'Please update your organizer details and resubmit for review.'}
          </p>
          <Button className="mt-lg" onClick={() => resubmitApplication({})}>
            Resubmit application
          </Button>
        </div>
      </Container>
    )
  }

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileErr('')
    setProfileMsg('')
    const form = new FormData(e.currentTarget)
    const fields: Record<string, string | undefined> = {}
    for (const key of [
      'organizerName',
      'organizerHandle',
      'bio',
      'website',
      'contactEmail',
    ] as const) {
      const value = String(form.get(key) ?? '').trim()
      fields[key] = value || undefined
    }
    try {
      await updateOrganizer({ profileId: me._id, ...fields })
      setProfileMsg('Saved.')
    } catch (err) {
      setProfileErr(describeError(err))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!eventForm.title.trim() || !eventForm.startDate) {
      setEventErr('Please add a title and start date.')
      return
    }
    setSavingEvent(true)
    setEventErr('')
    try {
      await createEvent({
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || undefined,
        startDate: new Date(eventForm.startDate).getTime(),
        venueName: eventForm.venueName.trim() || undefined,
        actionType: 'open_entry',
      })
      setEventForm({ title: '', startDate: '', venueName: '', description: '' })
    } catch (err) {
      setEventErr(describeError(err))
    } finally {
      setSavingEvent(false)
    }
  }

  const toggleSetting = async (field: string, value: unknown) => {
    try {
      await updateSettings({ [field]: value })
    } catch {
      /* settings error surfaced next render */
    }
  }

  return (
    <Container className="py-lg">
      <div className="mx-auto w-full max-w-[52rem] space-y-lg">
        {/* Header */}
        <header className="flex flex-wrap items-center gap-md rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 font-display text-headline-md text-primary">
            {(organizer.organizerName ?? 'O').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-sm">
              <h1 className="font-display text-headline-md text-on-surface">
                {organizer.organizerName}
              </h1>
              {me.verified && <VerifiedBadge />}
            </div>
            {organizer.organizerHandle && (
              <p className="font-mono text-label-sm text-on-surface-variant">
                @{organizer.organizerHandle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-high px-3 py-1.5 text-xs font-semibold">
              <Users className="h-3.5 w-3.5 text-primary" />
              {organizer.followerCount} followers
            </span>
          </div>
        </header>

        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Events
            </TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Events */}
          <TabsContent value="events" className="space-y-md">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-6">
              <h2 className="font-display text-lg font-bold text-on-surface">New event</h2>
              <form onSubmit={handleCreateEvent} className="mt-md space-y-md">
                <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                  <div className="space-y-sm">
                    <Label htmlFor="ev-title">Title</Label>
                    <Input
                      id="ev-title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Event title"
                      required
                    />
                  </div>
                  <div className="space-y-sm">
                    <Label htmlFor="ev-date">Start date</Label>
                    <Input
                      id="ev-date"
                      type="datetime-local"
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm((f) => ({ ...f, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-sm">
                    <Label htmlFor="ev-venue">Venue</Label>
                    <Input
                      id="ev-venue"
                      value={eventForm.venueName}
                      onChange={(e) => setEventForm((f) => ({ ...f, venueName: e.target.value }))}
                      placeholder="Venue name"
                    />
                  </div>
                  <div className="space-y-sm">
                    <Label htmlFor="ev-desc">Description</Label>
                    <Input
                      id="ev-desc"
                      value={eventForm.description}
                      onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Short description"
                    />
                  </div>
                </div>
                {eventErr && <p className="text-body-md text-error">{eventErr}</p>}
                <Button type="submit" disabled={savingEvent}>
                  {savingEvent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {savingEvent ? 'Submitting…' : 'Submit for review'}
                </Button>
              </form>
            </div>

            <div className="space-y-md">
              <h2 className="font-display text-lg font-bold text-on-surface">Your events</h2>
              {events === undefined ? (
                <Skeleton className="h-40 w-full rounded-2xl" />
              ) : events.length === 0 ? (
                <p className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center text-body-md text-on-surface-variant">
                  No events yet. Submit your first event above.
                </p>
              ) : (
                <ul className="space-y-sm">
                  {events.map(
                    (event: FunctionReturnType<typeof api.events.read.listMine>[number]) => (
                      <li
                        key={event._id}
                        className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-on-surface">{event.title}</p>
                          <p className="font-mono text-label-sm text-on-surface-variant">
                            {formatTsShort(event.startDate)} · {event.venueName}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-surface-container-high px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          {event.status}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            <form
              onSubmit={handleSaveProfile}
              className="space-y-md rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-6"
            >
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                <div className="space-y-sm">
                  <Label htmlFor="p-name">Organizer name</Label>
                  <Input
                    id="p-name"
                    name="organizerName"
                    defaultValue={organizer.organizerName}
                    required
                  />
                </div>
                <div className="space-y-sm">
                  <Label htmlFor="p-handle">Handle</Label>
                  <Input
                    id="p-handle"
                    name="organizerHandle"
                    defaultValue={organizer.organizerHandle ?? ''}
                    placeholder="yourhandle"
                  />
                </div>
                <div className="space-y-sm sm:col-span-2">
                  <Label htmlFor="p-bio">Bio</Label>
                  <Input
                    id="p-bio"
                    name="bio"
                    defaultValue={organizer.bio ?? ''}
                    placeholder="A short description"
                  />
                </div>
                <div className="space-y-sm">
                  <Label htmlFor="p-website">Website</Label>
                  <Input
                    id="p-website"
                    name="website"
                    defaultValue={organizer.website ?? ''}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-sm">
                  <Label htmlFor="p-email">Contact email</Label>
                  <Input
                    id="p-email"
                    name="contactEmail"
                    type="email"
                    defaultValue={organizer.contactEmail ?? ''}
                  />
                </div>
              </div>
              {profileErr && <p className="text-body-md text-error">{profileErr}</p>}
              {profileMsg && <p className="text-body-md text-primary">{profileMsg}</p>}
              <Button type="submit" disabled={savingProfile}>
                {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                {savingProfile ? 'Saving…' : 'Save profile'}
              </Button>
            </form>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="space-y-sm rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-6">
              {settings === undefined ? (
                <Skeleton className="h-40 w-full rounded-2xl" />
              ) : (
                <>
                  <label className="flex items-start gap-sm text-body-md text-on-surface">
                    <Checkbox
                      checked={settings?.hideLikeCount ?? false}
                      onCheckedChange={(c) => toggleSetting('hideLikeCount', c === true)}
                    />
                    <span>
                      <span className="block font-medium">Hide like count</span>
                      <span className="text-on-surface-variant">
                        Don&apos;t show like counts on my events.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-sm text-body-md text-on-surface">
                    <Checkbox
                      checked={settings?.notificationInApp ?? true}
                      onCheckedChange={(c) => toggleSetting('notificationInApp', c === true)}
                    />
                    <span>
                      <span className="block font-medium">In-app notifications</span>
                      <span className="text-on-surface-variant">
                        Get notified in Event Nu about your events.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-sm text-body-md text-on-surface">
                    <Checkbox
                      checked={settings?.notificationEmail ?? true}
                      onCheckedChange={(c) => toggleSetting('notificationEmail', c === true)}
                    />
                    <span>
                      <span className="block font-medium">Email notifications</span>
                      <span className="text-on-surface-variant">
                        Get emailed about your events.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-sm text-body-md text-on-surface">
                    <Checkbox
                      checked={settings?.archiveEvents ?? false}
                      onCheckedChange={(c) => toggleSetting('archiveEvents', c === true)}
                    />
                    <span>
                      <span className="block font-medium">Auto-archive past events</span>
                      <span className="text-on-surface-variant">
                        Move ended events out of your active list.
                      </span>
                    </span>
                  </label>
                  <div className="grid grid-cols-1 gap-md pt-sm sm:grid-cols-2">
                    <div className="space-y-sm">
                      <Label htmlFor="s-tags">Tags</Label>
                      <select
                        id="s-tags"
                        className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 text-body-md text-on-surface"
                        value={settings?.tagSetting ?? 'allow'}
                        onChange={(e) => toggleSetting('tagSetting', e.target.value)}
                      >
                        <option value="allow">Allow tags</option>
                        <option value="block">Block tags</option>
                      </select>
                    </div>
                    <div className="space-y-sm">
                      <Label htmlFor="s-mentions">Mentions</Label>
                      <select
                        id="s-mentions"
                        className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 text-body-md text-on-surface"
                        value={settings?.mentionSetting ?? 'allow'}
                        onChange={(e) => toggleSetting('mentionSetting', e.target.value)}
                      >
                        <option value="allow">Allow mentions</option>
                        <option value="approve">Approve mentions</option>
                        <option value="block">Block mentions</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  )
}
