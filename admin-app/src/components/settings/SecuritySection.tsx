'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { changePassword } from '@/lib/actions/auth'
import { getErrorMessage } from '@/lib/errors'
import { Lock } from 'lucide-react'
import { SettingsCard } from './SettingsCard'

export function SecuritySection() {
  const [isLoading, setIsLoading] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error('Please fill in all password fields')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordForm.new.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwordForm.current === passwordForm.new) {
      toast.error('New password must be different from current password')
      return
    }

    setIsLoading(true)
    try {
      const result = await changePassword(passwordForm.current, passwordForm.new)
      if (result.ok) {
        toast.success('Password changed successfully')
        setPasswordForm({ current: '', new: '', confirm: '' })
      } else {
        const messages: Record<string, string> = {
          invalid_current_password: 'Current password is incorrect',
          rate_limited: 'Too many failed attempts. Please try again later.',
          not_authenticated: 'Please sign in again to change your password.',
        }
        toast.error(messages[result.reason] || 'Failed to change password')
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to change password'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SettingsCard icon={Lock} title="Security" subtitle="Update your password">
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Current Password</label>
          <Input
            type="password"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
            placeholder="Enter current password"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">New Password</label>
            <Input
              type="password"
              value={passwordForm.new}
              onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
              placeholder="Min 8 characters"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <div className="pt-2">
          <Button type="submit" variant="outline" disabled={isLoading}>
            <Lock size={16} className="mr-2" />
            {isLoading ? 'Changing...' : 'Change Password'}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Must be at least 8 characters. You will remain signed in after changing.
          </p>
        </div>
      </form>
    </SettingsCard>
  )
}
