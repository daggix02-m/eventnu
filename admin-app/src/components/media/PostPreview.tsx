'use client'

import { cn } from '@/lib/utils'
import { ASPECT_OPTIONS, filterStyle, PickedImage } from './ImagePicker'
import {
  Bookmark,
  Camera,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Image as ImageIcon,
} from 'lucide-react'

export function PostPreview({
  images,
  aspectRatio,
  caption,
  venueName,
  isFree,
}: {
  images: PickedImage[]
  aspectRatio: string
  caption: string
  venueName?: string
  isFree?: boolean
}) {
  const cover = images[0]
  const aspect = ASPECT_OPTIONS.find((a) => a.id === aspectRatio) ?? ASPECT_OPTIONS[0]
  const overLimit = caption.length > 2200

  return (
    <div className="rounded-3xl border border-outline-variant bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFDC80] via-[#F77737] to-[#E1306C] flex items-center justify-center">
          <Camera size={15} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">event.nua</p>
          <p className="text-[10px] text-muted-foreground">Addis Ababa</p>
        </div>
        <MoreHorizontal size={16} className="ml-auto text-muted-foreground shrink-0" />
      </div>

      <div
        className={cn(
          'relative w-full overflow-hidden bg-surface-container-high',
          aspect.className,
        )}
      >
        {cover ? (
          <img
            src={cover.url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ filter: filterStyle(cover.filter) }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon size={32} />
            <p className="text-xs">No images yet</p>
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-[10px] px-2 py-0.5 font-medium">
            1/{images.length}
          </div>
        )}
      </div>

      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-3">
          <Heart size={18} className="text-foreground" />
          <MessageCircle size={18} className="text-foreground" />
          <Send size={18} className="text-foreground" />
          <Bookmark size={18} className="ml-auto text-foreground" />
        </div>
        <p className="text-[10px] text-muted-foreground">1,024 likes</p>
        <p className="text-xs leading-relaxed">
          <span className="font-semibold">event.nua </span>
          {caption.trim() || 'Your caption will appear here…'}
        </p>
        <p
          className={cn(
            'text-[10px] font-medium tabular-nums',
            overLimit ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {caption.length}/2200
        </p>
        {venueName && (
          <p className="text-xs text-muted-foreground">
            {venueName}
            {isFree ? ' · Free' : ''}
          </p>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center gap-1.5 px-4 pb-3">
          {images.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className={cn(
                'w-9 h-9 rounded-md overflow-hidden border-2',
                i === 0 ? 'border-primary' : 'border-transparent opacity-70',
              )}
            >
              <img
                src={img.url}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ filter: filterStyle(img.filter) }}
              />
            </div>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {images.length} images · carousel
          </span>
        </div>
      )}
    </div>
  )
}
