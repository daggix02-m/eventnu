'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/lib/actions/cms'
import { getErrorMessage } from '@/lib/errors'
import { toast } from 'sonner'

interface Announcement {
  id: string
  title: string
  message?: string | null
  link_url?: string | null
  link_text?: string | null
  is_active: boolean
  created_at: string
}

export function AnnouncementsClient({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    message: '',
    link_url: '',
    link_text: '',
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) {
      toast.error('Title is required')
      return
    }
    setLoading(true)
    try {
      await createAnnouncement(form)
      toast.success('Announcement created')
      setForm({ title: '', message: '', link_url: '', link_text: '', is_active: true })
      router.refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create announcement'))
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (item: Announcement) => {
    try {
      await updateAnnouncement(item.id, { is_active: !item.is_active })
      toast.success('Announcement updated')
      router.refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update announcement'))
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteTarget(null)
    try {
      await deleteAnnouncement(id)
      toast.success('Announcement deleted')
      router.refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete announcement'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
        <p className="text-muted-foreground">Manage homepage banners and announcements.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">New Announcement</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
          <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="Link URL" />
          <Input value={form.link_text} onChange={(e) => setForm({ ...form, link_text: e.target.value })} placeholder="Link text" />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-input"
          />
          <label htmlFor="is_active" className="text-sm font-medium">Active</label>
        </div>
        <Button type="submit" disabled={loading}>
          <Plus size={18} className="mr-2" />
          {loading ? 'Creating...' : 'Create Announcement'}
        </Button>
      </form>

      <div className="bg-card rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-high border-b border-outline-variant">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Title</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No announcements yet.</td>
              </tr>
            )}
            {announcements.map((item) => (
              <tr key={item.id} className="border-b border-outline-variant last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.message}</p>
                </td>
                <td className="px-4 py-3">
                  {item.is_active ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(item)}
                      aria-label={item.is_active ? `Deactivate ${item.title}` : `Activate ${item.title}`}
                    >
                      {item.is_active ? <X size={16} /> : <Check size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(item.id)}
                      aria-label={`Delete ${item.title}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete announcement?"
        description="Delete this announcement? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  )
}
