import Link from 'next/link'
import { Button } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { FileQuestion } from 'lucide-react'

export const metadata = {
  title: 'Page Not Found | Event Nu Admin',
}

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl overflow-hidden bg-card">
        <CardHeader className="space-y-2 text-center pb-2">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <FileQuestion className="text-muted-foreground" size={24} />
            </div>
          </div>
          <CardTitle className="font-headline text-xl font-semibold tracking-tight text-foreground">
            404 — Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <Button asChild className="w-full h-11">
            <Link href="/">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
