'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'company-design-system'
import { ArrowLeft, Shield, Lock } from 'lucide-react'

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary tracking-tight">Event Nu Admin</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Enterprise Suite</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-card">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">New Password</CardTitle>
            <CardDescription className="text-muted-foreground">
              Password reset via email is not yet available. Contact your administrator to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="py-6">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
                <Lock size={28} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                SMTP email service needs to be configured before password reset can be completed.
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
