import { getPages } from '@/lib/actions/cms'
import { PagesClient } from '@/components/cms/PagesClient'
import { logError } from '@/lib/logger'

export default async function PagesPage() {
  let pages: Awaited<ReturnType<typeof getPages>> = []
  try {
    pages = await getPages()
  } catch (err) {
    logError('admin/cms/pages', err)
  }
  return <PagesClient pages={pages} />
}
