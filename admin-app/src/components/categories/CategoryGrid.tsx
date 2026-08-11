import { ChevronDown, ChevronRight, Edit, GripVertical, Trash2 } from 'lucide-react'
import { CategoryIcon, NEUTRAL_ICON_BG } from './CategoryIcon'
import { CategoriesEmptyState } from './CategoriesEmptyState'
import type { CategoryViewProps } from './CategoryList'
import type { MappedCategory } from '@/lib/mappers'

function CardActions({
  category,
  onEdit,
  onDelete,
}: {
  category: MappedCategory
  onEdit: (category: MappedCategory) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-1">
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

function Count({ count, highlightThreshold }: { count: number; highlightThreshold: number }) {
  const isHighlighted = count >= highlightThreshold
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
        isHighlighted
          ? 'bg-primary/10 text-primary'
          : 'bg-surface-container-high text-muted-foreground'
      }`}
    >
      {count.toLocaleString()} Events
    </span>
  )
}

function CategoryCard({
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

  return (
    <div
      draggable
      onDragStart={(e) => view.onDragStart(e, parent.id)}
      onDragOver={(e) => view.onDragOver(e, parent.id)}
      onDragLeave={view.onDragLeave}
      onDrop={(e) => view.onDrop(e, parent.id)}
      onDragEnd={view.onDragEnd}
      className={`bg-card rounded-2xl border border-outline-variant overflow-hidden shadow-sm transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-center py-1 border-b border-outline-variant cursor-grab active:cursor-grabbing">
        <GripVertical size={14} className="text-muted-foreground" />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl ${NEUTRAL_ICON_BG} flex items-center justify-center shadow-sm`}
            >
              <CategoryIcon name={parent.icon} size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">{parent.name}</h3>
              <span className="inline-block px-2 py-0.5 bg-surface-container-high text-muted-foreground rounded text-xs font-mono mt-1">
                /{parent.slug}
              </span>
            </div>
          </div>
          <CardActions category={parent} onEdit={view.onEdit} onDelete={view.onDelete} />
        </div>

        <div className="mt-3">
          <Count count={parent.event_count} highlightThreshold={1000} />
        </div>

        {hasChildren && (
          <div className="mt-4 pt-4 border-t border-outline-variant">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {subcategories.length} Subcategories
              </span>
              <button
                onClick={() => view.onToggleExpand(parent.id)}
                className="text-muted-foreground p-0.5"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            {isExpanded ? (
              <div className="space-y-2">
                {subcategories.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between py-2 px-3 bg-surface-container-low/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md ${NEUTRAL_ICON_BG} flex items-center justify-center text-xs`}
                      >
                        <CategoryIcon name={child.icon} size={12} />
                      </div>
                      <span className="text-sm text-muted-foreground">{child.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          child.event_count >= 500
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-container-high text-muted-foreground'
                        }`}
                      >
                        {child.event_count}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => view.onEdit(child)}
                          className="p-1.5 text-muted-foreground rounded hover:bg-surface-container-high transition-colors"
                          title="Edit"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => view.onDelete(child.id)}
                          className="p-1.5 text-muted-foreground rounded hover:bg-surface-container-high transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {subcategories.slice(0, 4).map((child) => (
                  <span
                    key={child.id}
                    className="inline-block px-2 py-1 bg-surface-container-high text-muted-foreground rounded-md text-xs"
                  >
                    {child.name}
                  </span>
                ))}
                {subcategories.length > 4 && (
                  <span className="inline-block px-2 py-1 bg-surface-container-high text-muted-foreground rounded-md text-xs">
                    +{subcategories.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function CategoryGrid(view: CategoryViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {view.categories.length === 0 ? (
        <div className="col-span-full px-6 py-16 text-center bg-card rounded-2xl border border-outline-variant">
          <CategoriesEmptyState />
        </div>
      ) : (
        view.categories.map((parent) => {
          const children = view.childrenOf(parent.id)
          const hasChildren = children.length > 0
          const isExpanded = view.expanded.has(parent.id)
          return (
            <CategoryCard
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
  )
}
