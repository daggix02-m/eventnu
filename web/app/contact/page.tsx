import { Container } from '@/components/layout/Container'
import { ContactForm } from '@/components/contact/ContactForm'
import { Mail, MapPin, Phone, MessageCircle, Send } from 'lucide-react'
import Link from 'next/link'
import { SITE } from '@/lib/site'

export const metadata = {
  title: 'Contact | Event Nu',
  description: 'Get in touch with the Event Nu team.',
}

export const revalidate = 300
export const dynamic = 'force-static'

export default function ContactPage() {
  return (
    <Container className="py-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
        <div className="space-y-lg">
          <div className="space-y-sm">
            <h1 className="font-display text-display-lg-mobile md:text-display-lg">Contact Us</h1>
            <p className="text-on-surface-variant text-body-lg">
              Have a question, partnership idea, or feedback? We would love to hear from you. We
              usually reply within 1–2 business days.
            </p>
          </div>

          <div className="space-y-md">
            <div className="flex items-start gap-md">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase">Email</p>
                <Link
                  href={`mailto:${SITE.email}`}
                  className="text-on-surface text-body-md hover:text-primary transition-colors"
                >
                  {SITE.email}
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-md">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-sm">
                <p className="font-mono text-label-sm text-on-surface-variant uppercase">Phone</p>
                <div className="flex flex-col gap-xs">
                  {SITE.phones.map((phone) => (
                    <div key={phone.tel} className="flex items-center gap-sm">
                      <Link
                        href={`tel:${phone.tel}`}
                        className="text-on-surface text-body-md hover:text-primary transition-colors"
                      >
                        {phone.label}
                      </Link>
                      <Link
                        href={`https://wa.me/${phone.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                        className="text-on-surface-variant hover:text-secondary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`https://t.me/+${phone.tel.replace(/^\+/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Telegram"
                        className="text-on-surface-variant hover:text-secondary transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-md">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-mono text-label-sm text-on-surface-variant uppercase">Address</p>
                <p className="text-on-surface text-body-md">{SITE.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-lg bg-surface-container-high border border-outline-variant rounded-xl">
          <h2 className="font-display text-headline-md mb-md">Send a Message</h2>
          <ContactForm />
        </div>
      </div>
    </Container>
  )
}
