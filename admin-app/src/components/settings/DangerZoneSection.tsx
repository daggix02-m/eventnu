'use client'

import { Button } from '@/components/ui'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Trash2, RefreshCw } from 'lucide-react'
import { SettingsCard } from './SettingsCard'

export function DangerZoneSection() {
  const router = useRouter()

  const handleClearCache = () => {
    router.refresh()
    toast.success('Cache cleared')
  }

  return (
    <SettingsCard icon={Trash2} title="Danger Zone" subtitle="System operations" danger>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Clear cache</p>
            <p className="text-xs text-muted-foreground">Refresh all server-side data</p>
          </div>
          <Button variant="outline" onClick={handleClearCache}>
            <RefreshCw size={16} className="mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>
    </SettingsCard>
  )
}
