'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Filter, List, LayoutGrid, Plus } from 'lucide-react'
import { CategoryDialog, type CategoryForm } from './CategoryDialog'
import { CategoryList, type CategoryViewProps } from './CategoryList'
import { CategoryGrid } from './CategoryGrid'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '@/lib/actions/categories'
import { categoriesKeys, useCategories } from '@/lib/api/categories'
import { getErrorMessage } from '@/lib/errors'
import { toast } from 'sonner'
import type { MappedCategory } from '@/lib/mappers'

interface CategoriesClientProps {
  initialCategories: MappedCategory[]
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const queryClient = useQueryClient()
  const { data } = useCategories(initialCategories)
  const categories = data ?? []
  const refreshCategories = () => queryClient.invalidateQueries({ queryKey: categoriesKeys })
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MappedCategory | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filteredCategories = search
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase()),
      )
    : categories

  const rootCategories = filteredCategories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)

  const childrenOf = (parentId: string) =>
    filteredCategories
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)

  const toggleExpand = (id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggingId(categoryId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', categoryId)
  }

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggingId !== categoryId) {
      setDragOverId(categoryId)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverId(null)

    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) {
      setDraggingId(null)
      return
    }

    const sourceCat = categories.find((c) => c.id === sourceId)
    const targetCat = categories.find((c) => c.id === targetId)

    if (!sourceCat || !targetCat || sourceCat.parent_id !== targetCat.parent_id) {
      setDraggingId(null)
      return
    }

    const siblings = categories
      .filter((c) => c.parent_id === sourceCat.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order)

    const sourceIndex = siblings.findIndex((c) => c.id === sourceId)
    const targetIndex = siblings.findIndex((c) => c.id === targetId)

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggingId(null)
      return
    }

    const [moved] = siblings.splice(sourceIndex, 1)
    siblings.splice(targetIndex, 0, moved)

    const updates = siblings.map((cat, index) => ({
      id: cat.id,
      sort_order: (index + 1) * 10,
    }))

    queryClient.setQueryData<MappedCategory[]>(
      categoriesKeys,
      categories.map((cat) => {
        const update = updates.find((u) => u.id === cat.id)
        return update ? { ...cat, sort_order: update.sort_order } : cat
      }),
    )

    setIsLoading(true)
    try {
      await reorderCategories(updates)
      await refreshCategories()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reorder categories'))
      await refreshCategories()
    } finally {
      setIsLoading(false)
      setDraggingId(null)
    }
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: MappedCategory) => {
    setEditingCategory(category)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (form: CategoryForm) => {
    setIsLoading(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: form.name,
          slug: form.slug,
          parent_id: form.parent_id || null,
          icon: form.icon || null,
          sort_order: form.sort_order,
        })
      } else {
        await createCategory({
          name: form.name,
          slug: form.slug,
          parent_id: form.parent_id || null,
          icon: form.icon || null,
          sort_order: form.sort_order,
        })
      }
      setIsDialogOpen(false)
      await refreshCategories()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save category'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    setDeleteTarget(null)
    setIsLoading(true)
    try {
      await deleteCategory(categoryId)
      await refreshCategories()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete category'))
    } finally {
      setIsLoading(false)
    }
  }

  const viewProps: CategoryViewProps = {
    categories: rootCategories,
    childrenOf,
    expanded: expandedParents,
    onToggleExpand: toggleExpand,
    draggingId,
    dragOverId,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onDragEnd: handleDragEnd,
    onEdit: openEditDialog,
    onDelete: setDeleteTarget,
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">
              Category Management
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Organize and manage the event classification hierarchy for your enterprise suite.
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-primary text-primary-foreground font-semibold h-11 px-6 rounded-xl text-sm shadow-md shadow-primary/20"
          >
            <Plus size={16} className="mr-2" />
            Create Main Category
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-card rounded-2xl border border-outline-variant p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Quick find..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-surface-container-high border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-surface border border-outline-variant rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-surface-container-high text-primary' : 'text-muted-foreground'}`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-surface-container-high text-primary' : 'text-muted-foreground'}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Display */}
        {viewMode === 'list' ? <CategoryList {...viewProps} /> : <CategoryGrid {...viewProps} />}

        <CategoryDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          category={editingCategory}
          categories={categories}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      </div>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete category?"
        description="Delete this category? This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={isLoading}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </>
  )
}
