'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-headline font-bold text-lg shadow-sm">
            En
          </div>
          <div className="text-left">
            <h1 className="font-headline text-xl font-semibold text-foreground tracking-tight">Event Nu</h1>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Admin · Addissuite</p>
          </div>
        </div>

        <Card className="border-0 shadow-[0_2px_4px_rgba(30,20,10,0.04),0_8px_24px_rgba(30,20,10,0.08)] rounded-2xl overflow-hidden bg-card">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground">
              Password reset via email is not yet available. Contact your administrator to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="py-6">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                SMTP email service needs to be configured before password reset links can be sent.
              </p>
            </div>
            <div className="flex justify-center">
              <Link href="/auth/sign-in" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
