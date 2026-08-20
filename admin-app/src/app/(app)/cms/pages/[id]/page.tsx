import { notFound } from 'next/navigation'
import { getPageById } from '@/lib/actions/cms'
import { PageFormClient } from '@/components/cms/PageFormClient'
import { logError } from '@/lib/logger'

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let page: Awaited<ReturnType<typeof getPageById>> = null
  try {
    page = await getPageById(id)
  } catch (err) {
    logError('admin/cms/pages/[id]', err)
  }

  if (!page) notFound()
  return <PageFormClient initialData={page} />
}
