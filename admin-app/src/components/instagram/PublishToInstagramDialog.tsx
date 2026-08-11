'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button, Textarea } from '@/components/ui'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'
import { getInstagramStatus, publishEventToInstagram } from '@/lib/actions/instagram'
import { Instagram, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_CAPTION = 2200

function buildCaption(title: string, description: string, venue: string) {
  const parts = [title.trim()]
  if (venue.trim()) parts.push(`📍 ${venue.trim()}`)
  if (description.trim()) parts.push('', description.trim())
  return parts.join('\n').slice(0, MAX_CAPTION)
}

export function PublishToInstagramDialog({
  eventId,
  title,
  description,
  venueName,
  imageCount,
  instaPermalink,
}: {
  eventId: string
  title: string
  description: string
  venueName: string
  imageCount: number
  instaPermalink?: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState(() => buildCaption(title, description, venueName))
  const [publishedLink, setPublishedLink] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCaption(buildCaption(title, description, venueName))
    setPublishedLink(null)
    let active = true
    getInstagramStatus()
      .then((s) => {
        if (active) setConnected(Boolean(s))
      })
      .catch(() => {
        if (active) setConnected(false)
      })
    return () => {
      active = false
    }
  }, [open, title, description, venueName])

  const handlePublish = async () => {
    try {
      setLoading(true)
      const result = await publishEventToInstagram(eventId, caption)
      const link = result?.instaPermalink
      setPublishedLink(link ?? null)
      toast.success('Published to Instagram')
      router.refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to publish to Instagram'))
    } finally {
      setLoading(false)
    }
  }

  const canPublish = imageCount > 0
  const overLimit = caption.length > MAX_CAPTION

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={!canPublish}
          className="gap-2 border-outline-variant"
          title={
            !canPublish ? 'Add at least one image to publish to Instagram' : 'Publish to Instagram'
          }
        >
          <Instagram size={16} />
          Publish to IG
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram size={16} className="text-[#E1306C]" />
            Publish to Instagram
          </DialogTitle>
          <DialogDescription>
            This post will appear on the connected Instagram account with up to 10 images as a
            carousel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-tr from-[#FFDC80] via-[#F77737] to-[#E1306C] flex-shrink-0 flex items-center justify-center">
              <Instagram size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{title || 'Untitled event'}</p>
              <p className="text-xs text-muted-foreground">
                {imageCount} image{imageCount === 1 ? '' : 's'} · carousel
              </p>
            </div>
          </div>

          <label className="block text-xs font-medium text-muted-foreground" htmlFor="ig-caption">
            Caption
          </label>
          <Textarea
            id="ig-caption"
            rows={6}
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION + 200))}
            aria-invalid={overLimit}
            className="resize-none"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Edit the caption before publishing</span>
            <span className={cn('tabular-nums', overLimit ? 'text-destructive font-semibold' : '')}>
              {caption.length}/{MAX_CAPTION}
            </span>
          </div>
        </div>

        {instaPermalink && !publishedLink && (
          <a
            href={instaPermalink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Already on Instagram <ExternalLink size={12} />
          </a>
        )}

        {publishedLink ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={40} className="text-success" />
            <p className="text-sm font-semibold text-foreground">Published to Instagram</p>
            <a
              href={publishedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-tr from-[#F77737] to-[#E1306C] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              <Instagram size={16} />
              View on Instagram
              <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <DialogFooter className="gap-2 sm:justify-between">
            {!connected && (
              <p className="text-xs text-muted-foreground self-center">
                Instagram not connected. Connect it in Settings.
              </p>
            )}
            <Button
              onClick={handlePublish}
              disabled={loading || !connected || overLimit}
              className="gap-2 bg-gradient-to-tr from-[#F77737] to-[#E1306C] hover:opacity-90 text-white"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Instagram size={16} />}
              {loading ? 'Publishing…' : 'Publish now'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
