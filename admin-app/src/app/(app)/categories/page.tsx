import { getCategories } from '@/lib/actions/categories'
import { CategoriesClient } from '@/components/categories/CategoriesClient'
import { logError } from '@/lib/logger'

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  try {
    categories = await getCategories()
  } catch (err) {
    logError('admin/categories', err)
  }

  return <CategoriesClient initialCategories={categories} />
}
