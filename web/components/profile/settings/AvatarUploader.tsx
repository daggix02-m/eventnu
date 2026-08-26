'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { compressImage, AVATAR_MAX_DIMENSION } from '@eventnu/image'
import { Camera, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function AvatarUploader({
  avatarUrl,
  avatarStorageId,
  fullName,
}: {
  avatarUrl: string | null
  avatarStorageId: string | null
  fullName: string | null
}) {
  const getUploadUrl = useMutation(api.events.write.generateUploadUrl)
  const updateMe = useMutation(api.profiles.updateMe)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = (fullName ?? 'U')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError('Choose a PNG, JPEG, or WebP image')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const fileToUpload = await compressImage(file, { maxDimension: AVATAR_MAX_DIMENSION })
      const uploadUrl = await getUploadUrl()
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': fileToUpload.type },
        body: fileToUpload,
      })
      if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status})`)
      const { storageId } = await res.json()
      if (!storageId) throw new Error('Upload failed')
      await updateMe({ avatarStorageId: storageId as string })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update photo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-md">
      <h2 className="font-display text-headline-sm text-on-surface">Profile photo</h2>
      <div className="mt-md flex items-center gap-md">
        <Avatar className="h-20 w-20">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName ?? 'Profile'} /> : null}
          <AvatarFallback className="text-headline-md">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-xs">
          <label htmlFor="avatar-upload" className="inline-flex cursor-pointer items-center gap-xs">
            <Button asChild size="sm" variant="outline">
              <span>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="h-4 w-4" aria-hidden="true" />
                )}
                {busy ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Add a photo'}
              </span>
            </Button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </label>
          {error && (
            <p role="alert" className="font-body-sm text-error">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
