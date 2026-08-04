'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from 'company-design-system'
import { Button } from 'company-design-system'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  getInstagramStatus,
  startInstagramConnect,
  setInstagramSync,
  setInstagramAutoPublish,
  disconnectInstagram,
} from '@/lib/actions/instagram'
import { Instagram, Loader2, ExternalLink, Unplug } from 'lucide-react'

export interface InstagramStatus {
  igUserId: string
  igUsername: string
  tokenExpiresAt: number
  syncEnabled: boolean
  autoPublish: boolean
  lastSyncedAt: number | null
  connectedAt: number
}

export function InstagramSettingsCard({
  initialStatus,
  notice,
  errorNotice,
}: {
  initialStatus: InstagramStatus | null
  notice?: string | null
  errorNotice?: string | null
}) {
  const [status, setStatus] = useState<InstagramStatus | null>(initialStatus)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (notice) toast.success(notice)
    if (errorNotice) toast.error(errorNotice)
  }, [notice, errorNotice])

  const refresh = useCallback(async () => {
    setStatus(await getInstagramStatus())
  }, [])

  const handleConnect = async () => {
    setBusy('connect')
    try {
      const url = await startInstagramConnect()
      if (!url) {
        toast.error('Instagram is not configured yet')
        return
      }
      window.location.href = url
    } catch (err: any) {
      toast.error(err.message || 'Failed to start connection')
    } finally {
      setBusy(null)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Instagram? Imported posts stay on the site.')) return
    setBusy('disconnect')
    try {
      await disconnectInstagram()
      await refresh()
      toast.success('Instagram disconnected')
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect')
    } finally {
      setBusy(null)
    }
  }

  const handleSync = async (enabled: boolean) => {
    setBusy('sync')
    try {
      await setInstagramSync(enabled)
      await refresh()
      toast.success(enabled ? 'IG to site sync enabled' : 'IG to site sync disabled')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setBusy(null)
    }
  }

  const handleAuto = async (enabled: boolean) => {
    setBusy('auto')
    try {
      await setInstagramAutoPublish(enabled)
      await refresh()
      toast.success(enabled ? 'Publishing to Instagram enabled' : 'Publishing to Instagram disabled')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setBusy(null)
    }
  }

  const expired = status ? status.tokenExpiresAt < Date.now() : false
  const expiresLabel = status
    ? new Date(status.tokenExpiresAt).toLocaleDateString()
    : ''

  return (
    <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[#FFDC80] via-[#F77737] to-[#E1306C]">
            <Instagram size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Instagram
            </h3>
            <p className="text-xs text-muted-foreground">
              Sync & publish events through Instagram
            </p>
          </div>
        </div>
      </div>

      {!status ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect Event Nu&apos;s Instagram account to auto-publish its posts
            as events on the site, and to publish events to Instagram.
          </p>
          <Button
            onClick={handleConnect}
            disabled={busy === 'connect'}
            className="gap-2 bg-gradient-to-tr from-[#F77737] to-[#E1306C] hover:opacity-90 text-white"
          >
            {busy === 'connect' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Instagram size={16} />
            )}
            Connect Instagram
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FFDC80] via-[#F77737] to-[#E1306C] flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  @{(status.igUsername[0] || 'n').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">@{status.igUsername}</p>
                <p className="text-[11px] text-muted-foreground">
                  {expired ? (
                    <span className="text-destructive font-medium">
                      Token expired {expiresLabel} · reconnect
                    </span>
                  ) : (
                    <>Token expires {expiresLabel}</>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={busy === 'disconnect'}
              className="gap-1.5 text-destructive border-destructive/40"
            >
              {busy === 'disconnect' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Unplug size={14} />
              )}
              Disconnect
            </Button>
          </div>

          <div className="space-y-3 border-t border-outline-variant pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Auto-import posts</p>
                <p className="text-xs text-muted-foreground">
                  New Instagram posts become published events automatically
                </p>
              </div>
              <Switch
                checked={status.syncEnabled}
                disabled={busy === 'sync'}
                onCheckedChange={handleSync}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Publish to Instagram</p>
                <p className="text-xs text-muted-foreground">
                  Allow publishing site events to Instagram from the event page
                </p>
              </div>
              <Switch
                checked={status.autoPublish}
                disabled={busy === 'auto'}
                onCheckedChange={handleAuto}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`https://www.instagram.com/${status.igUsername}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              View account <ExternalLink size={12} />
            </a>
            {status.lastSyncedAt && (
              <span className="text-[11px] text-muted-foreground">
                Last synced {new Date(status.lastSyncedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
