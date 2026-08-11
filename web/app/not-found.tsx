import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Page Not Found | Event Nu',
}

export default function NotFoundPage() {
  return (
    <Container className="py-xl flex flex-col items-center text-center space-y-md min-h-[60vh] justify-center">
      <h1 className="font-display text-display-lg text-primary">404</h1>
      <h2 className="font-display text-headline-md">Page Not Found</h2>
      <p className="text-on-surface-variant text-body-lg max-w-[42rem]">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Find Events</Link>
      </Button>
    </Container>
  )
}
