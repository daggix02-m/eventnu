import { Tag } from 'lucide-react'

export function CategoriesEmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
        <Tag size={28} className="text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">No categories found</p>
      <p className="text-muted-foreground text-sm mt-1">
        Create your first category to get started
      </p>
    </div>
  )
}
