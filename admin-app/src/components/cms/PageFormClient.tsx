'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createPage, updatePage } from '@/lib/actions/cms'
import { toast } from 'sonner'

interface PageFormClientProps {
  initialData?: {
    id: string
    slug: string
    title: string
    subtitle?: string | null
    body_html?: string | null
    hero_image_url?: string | null
    is_published: boolean
    sort_order: number
  }
}

export function PageFormClient({ initialData }: PageFormClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    slug: initialData?.slug ?? '',
    title: initialData?.title ?? '',
    subtitle: initialData?.subtitle ?? '',
    body: initialData?.body_html ?? '',
    hero_image_url: initialData?.hero_image_url ?? '',
    is_published: initialData?.is_published ?? false,
    sort_order: initialData?.sort_order ?? 0,
  })

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.slug || !form.title) {
      toast.error('Slug and title are required')
      return
    }

    setLoading(true)
    try {
      if (initialData) {
        await updatePage(initialData.id, form)
        toast.success('Page updated')
      } else {
        await createPage(form)
        toast.success('Page created')
      }
      router.push('/cms/pages')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save page')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{initialData ? 'Edit Page' : 'New Page'}</h1>
        <p className="text-muted-foreground">Create content for the public discovery site.</p>
      </div>

      <div className="space-y-4 bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="About Us" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <Input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="about-us" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Subtitle</label>
          <Input value={form.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} placeholder="Optional subtitle" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Hero Image URL</label>
          <Input value={form.hero_image_url} onChange={(e) => updateField('hero_image_url', e.target.value)} placeholder="https://..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Body (HTML)</label>
          <textarea
            value={form.body}
            onChange={(e) => updateField('body', e.target.value)}
            rows={12}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
            placeholder="<p>Page content...</p>"
          />
          <p className="text-xs text-muted-foreground">Use HTML. A rich text editor can be added later.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort Order</label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              id="is_published"
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => updateField('is_published', e.target.checked)}
              className="w-4 h-4 rounded border-input"
            />
            <label htmlFor="is_published" className="text-sm font-medium">Published</label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Page' : 'Create Page'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/cms/pages')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
