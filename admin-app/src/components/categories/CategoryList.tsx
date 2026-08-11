import { ChevronDown, ChevronRight, Edit, GripVertical, Trash2 } from 'lucide-react'
import { CategoryIcon, NEUTRAL_ICON_BG } from './CategoryIcon'
import { CategoriesEmptyState } from './CategoriesEmptyState'
import type { MappedCategory } from '@/lib/mappers'

export interface CategoryViewProps {
  categories: MappedCategory[]
  childrenOf: (parentId: string) => MappedCategory[]
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  draggingId: string | null
  dragOverId: string | null
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent, id: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onEdit: (category: MappedCategory) => void
  onDelete: (id: string) => void
}

const COLS = 'grid grid-cols-[auto_1fr_180px_140px_80px] gap-4 px-6'

function RowActions({
  category,
  onEdit,
  onDelete,
}: {
  category: MappedCategory
  onEdit: (category: MappedCategory) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => onEdit(category)}
        className="p-2 text-muted-foreground rounded-lg hover:bg-surface-container-high transition-colors"
        title="Edit"
      >
        <Edit size={14} />
      </button>
      <button
        onClick={() => onDelete(category.id)}
        className="p-2 text-muted-foreground rounded-lg hover:bg-surface-container-high transition-colors"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function Slug({ slug }: { slug: string }) {
  return (
    <div className="text-center">
      <span className="inline-block px-3 py-1 bg-surface-container-high text-muted-foreground rounded-lg text-xs font-mono">
        /{slug}
      </span>
    </div>
  )
}

function Count({ count, highlightThreshold }: { count: number; highlightThreshold: number }) {
  const isHighlighted = count >= highlightThreshold
  return (
    <div className="text-center">
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          isHighlighted
            ? 'bg-primary/10 text-primary'
            : 'bg-surface-container-high text-muted-foreground'
        }`}
      >
        {count.toLocaleString()} Events
      </span>
    </div>
  )
}

function EmptyCategories() {
  return <CategoriesEmptyState />
}

function ParentRow({
  parent,
  subcategories,
  hasChildren,
  isExpanded,
  ...view
}: {
  parent: MappedCategory
  subcategories: MappedCategory[]
  hasChildren: boolean
  isExpanded: boolean
} & CategoryViewProps) {
  const isDragging = view.draggingId === parent.id
  const isDragOver = view.dragOverId === parent.id

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => view.onDragStart(e, parent.id)}
        onDragOver={(e) => view.onDragOver(e, parent.id)}
        onDragLeave={view.onDragLeave}
        onDrop={(e) => view.onDrop(e, parent.id)}
        onDragEnd={view.onDragEnd}
        className={`${COLS} py-4 items-center transition-all ${isDragging ? 'opacity-50' : ''} ${
          isDragOver ? 'bg-surface-container-low border-t-2 border-primary' : ''
        }`}
      >
        <div className="flex items-center justify-center w-6">
          <GripVertical
            size={14}
            className="text-muted-foreground cursor-grab active:cursor-grabbing"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => view.onToggleExpand(parent.id)}
            className={`text-muted-foreground p-0.5 ${!hasChildren ? 'invisible' : ''}`}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div
            className={`w-10 h-10 rounded-xl ${NEUTRAL_ICON_BG} flex items-center justify-center shadow-sm`}
          >
            <CategoryIcon name={parent.icon} />
          </div>
          <span className="font-semibold text-foreground text-sm">{parent.name}</span>
        </div>

        <Slug slug={parent.slug} />
        <Count count={parent.event_count} highlightThreshold={1000} />
        <div className="text-right">
          <RowActions category={parent} onEdit={view.onEdit} onDelete={view.onDelete} />
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="bg-surface-container-low/30">
          {subcategories.map((child) => (
            <div
              key={child.id}
              className={`${COLS} py-3 items-center border-t border-outline-variant`}
            >
              <div className="w-6" />
              <div className="flex items-center gap-3 pl-10">
                <div
                  className={`w-8 h-8 rounded-lg ${NEUTRAL_ICON_BG} flex items-center justify-center text-xs shadow-sm`}
                >
                  <CategoryIcon name={child.icon} size={16} />
                </div>
                <span className="text-sm text-muted-foreground">{child.name}</span>
              </div>
              <Slug slug={child.slug} />
              <Count count={child.event_count} highlightThreshold={500} />
              <div className="text-right">
                <RowActions category={child} onEdit={view.onEdit} onDelete={view.onDelete} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryList(view: CategoryViewProps) {
  return (
    <div className="bg-card rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
      <div className={`${COLS} py-3 bg-surface-container-low border-b border-outline-variant`}>
        <div className="w-6" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Category Name & Icon
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
          Slug
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
          Event Count
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
          Actions
        </span>
      </div>

      <div className="divide-y divide-outline-variant">
        {view.categories.length === 0 ? (
          <EmptyCategories />
        ) : (
          view.categories.map((parent) => {
            const children = view.childrenOf(parent.id)
            const hasChildren = children.length > 0
            const isExpanded = view.expanded.has(parent.id)
            return (
              <ParentRow
                key={parent.id}
                parent={parent}
                subcategories={children}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                {...view}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
