import { getCategories } from '@/lib/actions/categories'
import { CategoriesClient } from '@/components/CategoriesClient'

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  try {
    categories = await getCategories()
  } catch (err) {
    console.error('Failed to load categories:', err)
  }

  return (
    <CategoriesClient
      initialCategories={categories}
    />
  )
}
