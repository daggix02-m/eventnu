import { getPages } from '@/lib/actions/cms'
import { PagesClient } from '@/components/cms/PagesClient'

export default async function PagesPage() {
  let pages: Awaited<ReturnType<typeof getPages>> = []
  try {
    pages = await getPages()
  } catch (err) {
    console.error('Failed to load pages:', err)
  }
  return <PagesClient pages={pages} />
}
