'use client'

import { useState } from 'react'
import { Button } from 'company-design-system'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Music,
  Moon,
  Palette,
  Briefcase,
  Cpu,
  Utensils,
  Activity,
  Users,
  Baby,
  Compass,
  Tag,
  Filter,
  List,
  LayoutGrid,
} from 'lucide-react'
import { createCategory, updateCategory, deleteCategory, reorderCategories } from '@/lib/actions/categories'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  icon: string | null
  sort_order: number
  event_count: number
}

interface CategoriesClientProps {
  initialCategories: Category[]
}

const iconMap: Record<string, React.ReactNode> = {
  music: <Music size={18} />,
  moon: <Moon size={18} />,
  palette: <Palette size={18} />,
  briefcase: <Briefcase size={18} />,
  cpu: <Cpu size={18} />,
  utensils: <Utensils size={18} />,
  activity: <Activity size={18} />,
  users: <Users size={18} />,
  baby: <Baby size={18} />,
  compass: <Compass size={18} />,
}

// Neutral icon background - theme aware
const NEUTRAL_ICON_BG = 'bg-surface-container-high text-muted-foreground'

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    parent_id: '',
    icon: '',
    sort_order: 0,
  })
  const router = useRouter()

  const filteredCategories = search
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
      )
    : categories

  const rootCategories = filteredCategories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)

  const getChildren = (parentId: string) =>
    filteredCategories
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedParents)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedParents(newSet)
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
    
    if (!sourceCat || !targetCat) {
      setDraggingId(null)
      return
    }

    if (sourceCat.parent_id !== targetCat.parent_id) {
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

    const newCategories = categories.map((cat) => {
      const update = updates.find((u) => u.id === cat.id)
      if (update) {
        return { ...cat, sort_order: update.sort_order }
      }
      return cat
    })
    setCategories(newCategories)

    setIsLoading(true)
    try {
      await reorderCategories(updates)
      router.refresh()
    } catch (err) {
      console.error('Reorder error:', err)
      setCategories(initialCategories)
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
    setForm({ name: '', slug: '', parent_id: '', icon: '', sort_order: 0 })
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id || '',
      icon: category.icon || '',
      sort_order: category.sort_order,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      router.refresh()
    } catch (err) {
      console.error('Category save error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Delete this category?')) return
    setIsLoading(true)
    try {
      await deleteCategory(categoryId)
      router.refresh()
    } catch (err) {
      console.error('Category delete error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Category Management</h1>
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
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Quick find..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-surface-container-high border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer">
              <option>All Statuses</option>
              <option>Active</option>
              <option>Archived</option>
            </select>
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
      {viewMode === 'list' ? (
        /* List View - Table */
        <div className="bg-card rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[auto_1fr_180px_140px_80px] gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant">
            <div className="w-6" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category Name & Icon</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Slug</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Event Count</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-outline-variant">
            {rootCategories.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
                  <Tag size={28} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No categories found</p>
                <p className="text-muted-foreground text-sm mt-1">Create your first category to get started</p>
              </div>
            ) : (
              rootCategories.map((parent) => {
                const children = getChildren(parent.id)
                const hasChildren = children.length > 0
                const isExpanded = expandedParents.has(parent.id)
                const Icon = iconMap[parent.icon || ''] || <Tag size={18} />
                const isHighlighted = parent.event_count >= 1000
                const isDragging = draggingId === parent.id
                const isDragOver = dragOverId === parent.id

                return (
                  <div key={parent.id}>
                    {/* Parent Row */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, parent.id)}
                      onDragOver={(e) => handleDragOver(e, parent.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, parent.id)}
                      onDragEnd={handleDragEnd}
                      className={`grid grid-cols-[auto_1fr_180px_140px_80px] gap-4 px-6 py-4 items-center transition-all ${
                        isDragging ? 'opacity-50' : ''
                      } ${isDragOver ? 'bg-surface-container-low border-t-2 border-primary' : ''}`}
                    >
                      {/* Drag Handle */}
                      <div className="flex items-center justify-center w-6">
                        <GripVertical
                          size={14}
                          className="text-muted-foreground cursor-grab active:cursor-grabbing"
                        />
                      </div>

                      {/* Name & Icon */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleExpand(parent.id)}
                          className={`text-muted-foreground p-0.5 ${!hasChildren ? 'invisible' : ''}`}
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <div className={`w-10 h-10 rounded-xl ${NEUTRAL_ICON_BG} flex items-center justify-center shadow-sm`}>
                          {Icon}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{parent.name}</span>
                      </div>

                      {/* Slug */}
                      <div className="text-center">
                        <span className="inline-block px-3 py-1 bg-surface-container-high text-muted-foreground rounded-lg text-xs font-mono">
                          /{parent.slug}
                        </span>
                      </div>

                      {/* Event Count */}
                      <div className="text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          isHighlighted
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-container-high text-muted-foreground'
                        }`}>
                          {parent.event_count.toLocaleString()} Events
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditDialog(parent)}
                            className="p-2 text-muted-foreground rounded-lg hover:bg-surface-container-high transition-colors"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(parent.id)}
                            className="p-2 text-muted-foreground rounded-lg hover:bg-surface-container-high transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Children Rows */}
                    {isExpanded && hasChildren && (
                      <div className="bg-surface-container-low/30">
                        {children.map((child) => {
                          const childIcon = iconMap[child.icon || ''] || <Tag size={16} />
                          const childHighlighted = child.event_count >= 500

                          return (
                            <div
                              key={child.id}
                              className="grid grid-cols-[auto_1fr_180px_140px_80px] gap-4 px-6 py-3 items-center border-t border-outline-variant"
                            >
                              <div className="w-6" />
                              <div className="flex items-center gap-3 pl-10">
                                <div className={`w-8 h-8 rounded-lg ${NEUTRAL_ICON_BG} flex items-center justify-center text-xs shadow-sm`}>
                                  {childIcon}
                                </div>
                                <span className="text-sm text-muted-foreground">{child.name}</span>
                              </div>
                              <div className="text-center">
                                <span className="inline-block px-3 py-1 bg-surface-container-high text-muted-foreground rounded-lg text-xs font-mono">
                                  /{child.slug}
                                </span>
                              </div>
                              <div className="text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  childHighlighted
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-surface-container-high text-muted-foreground'
                                }`}>
                                  {child.event_count.toLocaleString()} Events
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => openEditDialog(child)}
                                    className="p-2 text-muted-foreground rounded-lg hover:bg-surface-container-high transition-colors"
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(child.id)}
                                    className="p-2 text-muted-foreground rounded-lg hover:bg-surface-container-high transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : (
        /* Grid View - Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rootCategories.length === 0 ? (
            <div className="col-span-full px-6 py-16 text-center bg-card rounded-2xl border border-outline-variant">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
                <Tag size={28} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No categories found</p>
              <p className="text-muted-foreground text-sm mt-1">Create your first category to get started</p>
            </div>
          ) : (
            rootCategories.map((parent) => {
              const children = getChildren(parent.id)
              const hasChildren = children.length > 0
              const isExpanded = expandedParents.has(parent.id)
              const Icon = iconMap[parent.icon || ''] || <Tag size={20} />
              const isHighlighted = parent.event_count >= 1000
              const isDragging = draggingId === parent.id

              return (
                <div
                  key={parent.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, parent.id)}
                  onDragOver={(e) => handleDragOver(e, parent.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, parent.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-card rounded-2xl border border-outline-variant overflow-hidden shadow-sm transition-all ${
                    isDragging ? 'opacity-50' : ''
                  }`}
                >
                  {/* Drag Handle Bar */}
                  <div className="flex items-center justify-center py-1 border-b border-outline-variant cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-muted-foreground" />
                  </div>

                  {/* Card Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${NEUTRAL_ICON_BG} flex items-center justify-center shadow-sm`}>
                          {Icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{parent.name}</h3>
                          <span className="inline-block px-2 py-0.5 bg-surface-container-high text-muted-foreground rounded text-xs font-mono mt-1">
                            /{parent.slug}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditDialog(parent)}
                          className="p-2 text-muted-foreground rounded-lg hover:bg-surface-container-high transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(parent.id)}
                          className="p-2 text-muted-foreground rounded-lg hover:bg-surface-container-high transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Event Count */}
                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        isHighlighted
                          ? 'bg-primary/10 text-primary'
                          : 'bg-surface-container-high text-muted-foreground'
                      }`}>
                        {parent.event_count.toLocaleString()} Events
                      </span>
                    </div>

                    {/* Subcategories */}
                    {hasChildren && (
                      <div className="mt-4 pt-4 border-t border-outline-variant">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {children.length} Subcategories
                          </span>
                          <button
                            onClick={() => toggleExpand(parent.id)}
                            className="text-muted-foreground p-0.5"
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </div>
                        
                        {isExpanded && (
                          <div className="space-y-2">
                            {children.map((child) => {
                              const childIcon = iconMap[child.icon || ''] || <Tag size={12} />
                              const childHighlighted = child.event_count >= 500

                              return (
                                <div key={child.id} className="flex items-center justify-between py-2 px-3 bg-surface-container-low/30 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-md ${NEUTRAL_ICON_BG} flex items-center justify-center text-xs`}>
                                      {childIcon}
                                    </div>
                                    <span className="text-sm text-muted-foreground">{child.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      childHighlighted
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-surface-container-high text-muted-foreground'
                                    }`}>
                                      {child.event_count}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        onClick={() => openEditDialog(child)}
                                        className="p-1.5 text-muted-foreground rounded hover:bg-surface-container-high transition-colors"
                                        title="Edit"
                                      >
                                        <Edit size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(child.id)}
                                        className="p-1.5 text-muted-foreground rounded hover:bg-surface-container-high transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        {!isExpanded && (
                          <div className="flex flex-wrap gap-1.5">
                            {children.slice(0, 4).map((child) => (
                              <span key={child.id} className="inline-block px-2 py-1 bg-surface-container-high text-muted-foreground rounded-md text-xs">
                                {child.name}
                              </span>
                            ))}
                            {children.length > 4 && (
                              <span className="inline-block px-2 py-1 bg-surface-container-high text-muted-foreground rounded-md text-xs">
                                +{children.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-outline-variant shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              {editingCategory ? 'Edit Category' : 'Create Category'}
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/</span>
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
                {isLoading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-11 px-6 rounded-xl border-outline-variant"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
