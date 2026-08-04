import { getPages } from '@/lib/actions/cms'
import { PagesClient } from '@/components/cms/PagesClient'

export default async function PagesPage() {
  const pages = await getPages()
  return <PagesClient pages={pages} />
}
