import Link from 'next/link'
import { FileText, Megaphone, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CMSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
        <p className="text-muted-foreground">Manage content on the public discovery site.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/cms/pages">
          <Card className="hover:bg-surface-container-high/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-secondary">
                <FileText size={20} />
              </div>
              <CardTitle className="text-lg">Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and edit informational pages like About, Privacy, and Terms.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/cms/announcements">
          <Card className="hover:bg-surface-container-high/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-secondary">
                <Megaphone size={20} />
              </div>
              <CardTitle className="text-lg">Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Publish banners and announcements on the public site.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/cms/contact">
          <Card className="hover:bg-surface-container-high/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-secondary">
                <MessageSquare size={20} />
              </div>
              <CardTitle className="text-lg">Contact Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View messages submitted through the public contact form.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
