'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const MAX_BIO = 280

export function PersonalInfoForm({
  fullName,
  bio,
  username,
  locationText,
  website,
}: {
  fullName: string | null
  bio: string | null
  username: string | null
  locationText: string | null
  website: string | null
}) {
  const updateMe = useMutation(api.profiles.updateMe)
  const [name, setName] = useState(fullName ?? '')
  const [handle, setHandle] = useState(username ?? '')
  const [bioText, setBioText] = useState(bio ?? '')
  const [location, setLocation] = useState(locationText ?? '')
  const [site, setSite] = useState(website ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await updateMe({
        fullName: name.trim() || undefined,
        username: handle.trim() || undefined,
        bio: bioText.trim() || undefined,
        locationText: location.trim() || undefined,
        website: site.trim() || undefined,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-md rounded-2xl border border-outline-variant bg-surface-container-low p-md"
      aria-label="Edit profile details"
    >
      <h2 className="font-display text-headline-sm text-on-surface">About you</h2>

      <div className="space-y-xs">
        <Label htmlFor="profile-name">Full name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
          maxLength={100}
          placeholder="Your name"
        />
      </div>

      <div className="space-y-xs">
        <Label htmlFor="profile-username">Username</Label>
        <Input
          id="profile-username"
          value={handle}
          onChange={(e) => {
            setHandle(e.target.value)
            setSaved(false)
          }}
          maxLength={30}
          placeholder="3-30 letters, numbers, dots, or underscores"
        />
        <p className="font-body-sm text-on-surface-variant">
          Lowercase only. Used for your public profile.
        </p>
      </div>

      <div className="space-y-xs">
        <Label htmlFor="profile-bio">Bio</Label>
        <textarea
          id="profile-bio"
          value={bioText}
          onChange={(e) => {
            setBioText(e.target.value)
            setSaved(false)
          }}
          maxLength={MAX_BIO}
          rows={3}
          placeholder="A short line about you"
          className="w-full resize-y rounded-xl border border-outline-variant bg-surface-container-low px-md py-3 font-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <p className="text-right font-body-sm text-on-surface-variant">
          {bioText.length}/{MAX_BIO}
        </p>
      </div>

      <div className="grid gap-md sm:grid-cols-2">
        <div className="space-y-xs">
          <Label htmlFor="profile-location">Location</Label>
          <Input
            id="profile-location"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value)
              setSaved(false)
            }}
            maxLength={100}
            placeholder="Addis Ababa"
          />
        </div>
        <div className="space-y-xs">
          <Label htmlFor="profile-website">Website</Label>
          <Input
            id="profile-website"
            type="url"
            value={site}
            onChange={(e) => {
              setSite(e.target.value)
              setSaved(false)
            }}
            placeholder="https://…"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="font-body-sm text-error">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="font-body-sm text-primary">
          Profile saved
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Save changes
      </Button>
    </form>
  )
}
