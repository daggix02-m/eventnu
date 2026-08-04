import { notFound } from 'next/navigation'
import { getPageById } from '@/lib/actions/cms'
import { PageFormClient } from '@/components/cms/PageFormClient'

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = await getPageById(id)
  if (!page) notFound()
  return <PageFormClient initialData={page} />
}
