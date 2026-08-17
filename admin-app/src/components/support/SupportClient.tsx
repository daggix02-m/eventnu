'use client'

import { useState, Fragment } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card, Textarea } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { formatDate } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { supportKeys, useSupportTickets } from '@/lib/api/support'
import {
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Mail,
  ExternalLink,
  BookOpen,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  X,
  MessageCircle,
} from 'lucide-react'
import { createSupportTicket, closeSupportTicket } from '@/lib/actions/support'

const faqs = [
  {
    question: 'How do I approve pending events?',
    answer:
      'Navigate to the Events page, filter by "Pending Review" status, and click on any event to view details. Use the action menu to publish or reject events.',
  },
  {
    question: 'How do I handle user reports?',
    answer:
      'Go to Reports & Moderation. Select a report from the list to view details. You can dismiss the report, warn the user, or take action on the reported content.',
  },
  {
    question: 'How do I set up an organizer?',
    answer:
      'On the Organizers page, you can manage organizer profiles. Organizers can create and manage their own events through self-service.',
  },
  {
    question: 'How do I verify an organizer?',
    answer:
      'On the Organizers page, find the organizer and click the verify icon. Verified organizers get a badge and can access additional features.',
  },
  {
    question: 'How do I send a broadcast notification?',
    answer:
      'Go to Notifications and click "Compose". Select "Broadcast to all users", enter your title and message, and click Send.',
  },
  {
    question: 'What is the moderation log?',
    answer:
      'The moderation log is an audit trail of all admin actions taken on the platform. Every publish, reject, suspend, and delete action is recorded for accountability.',
  },
]

const quickLinks = [
  { label: 'Events', href: '/events', icon: Activity, description: 'Manage events' },
  { label: 'Reports', href: '/reports', icon: Shield, description: 'Review reports' },
  { label: 'Users', href: '/users', icon: MessageSquare, description: 'Manage users' },
  { label: 'Documentation', href: '#', icon: BookOpen, description: 'Admin guide' },
]

interface Ticket {
  id: string
  admin_id: string
  subject: string
  message: string
  priority: string
  status: string
  created_at: string
  updated_at: string
}

interface SupportClientProps {
  initialTickets: Ticket[]
}

const priorityColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
  critical: 'destructive',
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  open: 'secondary',
  in_progress: 'default',
  resolved: 'default',
  closed: 'secondary',
}

export function SupportClient({ initialTickets = [] }: SupportClientProps) {
  const queryClient = useQueryClient()
  const { data } = useSupportTickets(initialTickets)
  const tickets = data ?? []
  const refreshTickets = () => queryClient.invalidateQueries({ queryKey: supportKeys })
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'medium',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [isClosingTicket, setIsClosingTicket] = useState<string | null>(null)

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setIsSubmitting(true)
    try {
      await createSupportTicket({
        subject: contactForm.subject,
        message: contactForm.message,
        priority: contactForm.priority,
      })
      toast.success('Support ticket submitted!')
      setContactForm({ subject: '', message: '', priority: 'medium' })
      await refreshTickets()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit ticket'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseTicket = async (ticketId: string) => {
    setIsClosingTicket(ticketId)
    try {
      await closeSupportTicket(ticketId)
      toast.success('Ticket closed')
      await refreshTickets()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to close ticket'))
    } finally {
      setIsClosingTicket(null)
    }
  }

  const systemStatus = [
    { name: 'API', status: 'operational', icon: CheckCircle },
    { name: 'Database', status: 'operational', icon: CheckCircle },
    { name: 'Storage', status: 'operational', icon: CheckCircle },
    { name: 'Auth', status: 'operational', icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-semibold text-foreground tracking-tight">
          Support
        </h1>
        <p className="text-muted-foreground mt-1">Help center, FAQ, and contact support.</p>
      </div>

      {/* System Status Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-foreground">All systems operational</span>
          </div>
          <div className="flex items-center gap-4">
            {systemStatus.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.name} className="flex items-center gap-1.5">
                  <Icon size={14} className="text-success" />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - FAQ & Contact */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAQ Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <HelpCircle size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
                <p className="text-sm text-muted-foreground">Common questions and answers</p>
              </div>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, index) => {
                const isExpanded = expandedFaq === index
                return (
                  <div
                    key={index}
                    className="border border-outline-variant rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-container-low transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-foreground">{faq.question}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-11">
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* My Tickets Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <MessageCircle size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">My Tickets</h2>
                <p className="text-sm text-muted-foreground">
                  {tickets.length > 0
                    ? `${tickets.length} ticket${tickets.length === 1 ? '' : 's'} submitted`
                    : 'No tickets yet'}
                </p>
              </div>
            </div>

            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                You haven&apos;t submitted any tickets yet. Use the contact form below to get help.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                        Subject
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                        Priority
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => {
                      const isExpanded = expandedTicket === ticket.id
                      return (
                        <Fragment key={ticket.id}>
                          <tr
                            key={`${ticket.id}-row`}
                            className="border-b border-outline-variant/50 hover:bg-surface-container-low cursor-pointer"
                            onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                          >
                            <td className="py-2.5 px-3">
                              <p className="text-foreground font-medium text-xs">
                                {ticket.subject}
                              </p>
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant={priorityColors[ticket.priority] || 'default'}>
                                {ticket.priority}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant={statusColors[ticket.status] || 'secondary'}>
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(ticket.created_at)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {ticket.status !== 'closed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isClosingTicket === ticket.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCloseTicket(ticket.id)
                                  }}
                                >
                                  <X size={14} className="mr-1" />
                                  {isClosingTicket === ticket.id ? 'Closing...' : 'Close'}
                                </Button>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${ticket.id}-detail`}>
                              <td colSpan={5} className="py-3 px-6 bg-surface-container-low/50">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {ticket.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Created: {format(new Date(ticket.created_at), 'PPP p')}
                                </p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Contact Form */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Contact Support</h2>
                <p className="text-sm text-muted-foreground">Submit a ticket for help</p>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <Input
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="What do you need help with?"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <select
                  value={contactForm.priority}
                  onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm focus:border-primary focus:ring-primary/20 outline-none"
                >
                  <option value="low">Low — General question</option>
                  <option value="medium">Medium — Need help soon</option>
                  <option value="high">High — Urgent issue</option>
                  <option value="critical">Critical — System down</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <Textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  required
                  className="min-h-[120px] resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground"
                >
                  <Send size={16} className="mr-2" />
                  {isSubmitting ? 'Sending...' : 'Submit Ticket'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column - Quick Links & Info */}
        <div className="space-y-6">
          {/* Quick Links */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <ExternalLink size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Quick Links</h2>
                <p className="text-sm text-muted-foreground">Navigate to key pages</p>
              </div>
            </div>
            <div className="space-y-2">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </a>
                )
              })}
            </div>
          </Card>

          {/* Contact Info */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Contact Info</h2>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">support@eventnu.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Response time: 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">
                  For critical issues, escalate immediately
                </span>
              </div>
            </div>
          </Card>

          {/* Version Info */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">System</h2>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admin Version</span>
                <span className="text-foreground font-mono">v3.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schema</span>
                <span className="text-foreground font-mono">v3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="text-foreground">Jun 8, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment</span>
                <span className="text-success">Production</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
