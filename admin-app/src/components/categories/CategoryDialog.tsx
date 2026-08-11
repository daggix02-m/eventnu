'use client'

import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { MappedCategory } from '@/lib/mappers'

export interface CategoryForm {
  name: string
  slug: string
  parent_id: string
  icon: string
  sort_order: number
}

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: MappedCategory | null
  categories: MappedCategory[]
  isLoading: boolean
  onSubmit: (values: CategoryForm) => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  categories,
  isLoading,
  onSubmit,
}: CategoryDialogProps) {
  const [form, setForm] = useState<CategoryForm>({
    name: '',
    slug: '',
    parent_id: '',
    icon: '',
    sort_order: 0,
  })

  useEffect(() => {
    if (open) {
      setForm({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        parent_id: category?.parent_id || '',
        icon: category?.icon || '',
        sort_order: category?.sort_order ?? 0,
      })
    }
  }, [open, category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-outline-variant shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl font-semibold text-foreground">
            {category ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Category Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Music & Entertainment"
              required
              className="h-11 rounded-xl border-outline-variant focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">URL Slug</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                /
              </span>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="category-slug"
                required
                className="h-11 rounded-xl border-outline-variant focus:border-primary focus:ring-primary/20 pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Parent Category</label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary focus:ring-primary/20 outline-none"
            >
              <option value="">None — Create as Main Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Icon Name</label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="music, moon..."
                className="h-11 rounded-xl border-outline-variant focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Sort Order</label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="h-11 rounded-xl border-outline-variant focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground font-semibold h-11 px-6 rounded-xl"
            >
              <Save size={16} className="mr-2" />
              {isLoading ? 'Saving...' : category ? 'Update' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 rounded-xl border-outline-variant"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
