'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type ThemePreference = 'system' | 'light' | 'dark'

export function PrivacySettings({
  privateProfile,
  emailNotifications,
  pushNotifications,
  themePreference,
}: {
  privateProfile: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  themePreference: ThemePreference
}) {
  const updateMe = useMutation(api.profiles.updateMe)
  const [privateProfileOn, setPrivateProfileOn] = useState(privateProfile)
  const [emailOn, setEmailOn] = useState(emailNotifications)
  const [pushOn, setPushOn] = useState(pushNotifications)
  const [theme, setTheme] = useState<ThemePreference>(themePreference)
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
        privateProfile: privateProfileOn,
        emailNotifications: emailOn,
        pushNotifications: pushOn,
        themePreference: theme,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save privacy settings')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-md rounded-2xl border border-outline-variant bg-surface-container-low p-md"
      aria-label="Privacy settings"
    >
      <h2 className="font-display text-headline-sm text-on-surface">Privacy & notifications</h2>

      <label className="flex items-start gap-sm">
        <Checkbox
          checked={privateProfileOn}
          onCheckedChange={(checked) => {
            setPrivateProfileOn(checked === true)
            setSaved(false)
          }}
        />
        <span>
          <span className="block font-label-md text-on-surface">Private profile</span>
          <span className="block font-body-sm text-on-surface-variant">
            Only people you follow can see your saved events and experience posts.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-sm">
        <Checkbox
          checked={emailOn}
          onCheckedChange={(checked) => {
            setEmailOn(checked === true)
            setSaved(false)
          }}
        />
        <span>
          <span className="block font-label-md text-on-surface">Email notifications</span>
          <span className="block font-body-sm text-on-surface-variant">
            Updates about events and activity on your posts.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-sm">
        <Checkbox
          checked={pushOn}
          onCheckedChange={(checked) => {
            setPushOn(checked === true)
            setSaved(false)
          }}
        />
        <span>
          <span className="block font-label-md text-on-surface">Push notifications</span>
          <span className="block font-body-sm text-on-surface-variant">
            Browser notifications when something happens.
          </span>
        </span>
      </label>

      <div className="space-y-xs">
        <Label htmlFor="theme-preference">Theme</Label>
        <select
          id="theme-preference"
          value={theme}
          onChange={(e) => {
            setTheme(e.target.value as ThemePreference)
            setSaved(false)
          }}
          className="w-full max-w-[18rem] rounded-lg border border-outline bg-surface-container-lowest px-sm py-2 font-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="system">System default</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="font-body-sm text-error">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="font-body-sm text-primary">
          Privacy settings saved
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Save settings
      </Button>
    </form>
  )
}
