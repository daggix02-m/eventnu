'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function PrivacySettings({
  privateProfile,
  emailNotifications,
  pushNotifications,
}: {
  privateProfile: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}) {
  const updateMe = useMutation(api.profiles.updateMe)
  const [privateProfileOn, setPrivateProfileOn] = useState(privateProfile)
  const [emailOn, setEmailOn] = useState(emailNotifications)
  const [pushOn, setPushOn] = useState(pushNotifications)
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
        <Label>Theme</Label>
        <div className="flex items-center gap-sm">
          <select
            disabled
            className="w-full max-w-[18rem] cursor-not-allowed rounded-lg border border-outline bg-surface-container-lowest px-sm py-2 font-body-md text-on-surface opacity-50"
          >
            <option>System default</option>
          </select>
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
            Coming soon
          </span>
        </div>
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
