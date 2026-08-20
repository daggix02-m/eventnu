import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

/* -------------------------------------------------------------------------- */
/*  Mocks                                                                      */
/* -------------------------------------------------------------------------- */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const mockSignIn = vi.fn()
vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}))

const mockGetEmail = vi.fn<() => string | null>(() => null)
const mockStoreEmail = vi.fn()
vi.mock('@/lib/auth-storage', () => ({
  getEmail: () => mockGetEmail(),
  storeEmail: (...args: unknown[]) => mockStoreEmail(...args),
}))

vi.mock('lucide-react', () => {
  const icon = (name: string) => {
    const Component = (props: React.SVGProps<SVGSVGElement>) => (
      <svg data-testid={`icon-${name}`} {...props} />
    )
    Component.displayName = name
    return Component
  }
  return {
    Loader2: icon('loader'),
    Mail: icon('mail'),
    ArrowLeft: icon('arrow-left'),
    Eye: icon('eye'),
    EyeOff: icon('eye-off'),
    ShieldCheck: icon('shield-check'),
    Check: icon('check'),
  }
})

/* -------------------------------------------------------------------------- */
/*  Tests                                                                      */
/* -------------------------------------------------------------------------- */

import ForgotPasswordPage from '@/app/auth/forgot-password/page'

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmail.mockReturnValue(null)
  })

  /* ---- Initial State ---- */

  describe('initial state', () => {
    it('shows the reset password form with email input', () => {
      render(<ForgotPasswordPage />)

      expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument()
    })

    it('shows "Back to sign in" link pointing to /auth', () => {
      render(<ForgotPasswordPage />)

      const backLink = screen.getByRole('link', { name: /back to sign in/i })
      expect(backLink).toHaveAttribute('href', '/auth')
    })

    it('pre-fills email from sessionStorage and shows confirmation view', () => {
      mockGetEmail.mockReturnValue('user@example.com')

      render(<ForgotPasswordPage />)

      expect(screen.getByText(/send a reset code to/i)).toBeInTheDocument()
      expect(screen.getByText('user@example.com')).toBeInTheDocument()
    })
  })

  /* ---- Sending Reset Code ---- */

  describe('sending reset code', () => {
    it('validates email is required', async () => {
      const user = userEvent.setup()
      render(<ForgotPasswordPage />)

      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      expect(screen.getByText(/please enter your email/i)).toBeInTheDocument()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('sends reset code with correct form data', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('password', expect.any(FormData))
      })

      const formData = mockSignIn.mock.calls[0][1] as FormData
      expect(formData.get('email')).toBe('test@example.com')
      expect(formData.get('flow')).toBe('reset')
      expect(formData.get('redirectTo')).toBe('/auth/reset-password')
    })

    it('normalizes email to lowercase before sending', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'TEST@EXAMPLE.COM' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        const formData = mockSignIn.mock.calls[0][1] as FormData
        expect(formData.get('email')).toBe('test@example.com')
      })
    })

    it('trims whitespace from email', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: '  test@example.com  ' },
      })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        const formData = mockSignIn.mock.calls[0][1] as FormData
        expect(formData.get('email')).toBe('test@example.com')
      })
    })

    it('stores email in sessionStorage after sending', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        expect(mockStoreEmail).toHaveBeenCalledWith('test@example.com')
      })
    })

    it('shows confirmation view after successful send', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
      })
      expect(screen.getByText(/we sent a reset code to/i)).toBeInTheDocument()
      // The email is inside the paragraph text
      const bodyText = document.body.textContent || ''
      expect(bodyText).toContain('test@example.com')
    })

    it('shows "Go to reset password" link after sending', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        const resetLink = screen.getByRole('link', { name: /go to reset password/i })
        expect(resetLink).toHaveAttribute('href', '/auth/reset-password')
      })
    })
  })

  /* ---- Pre-filled Email Confirmation ---- */

  describe('pre-filled email confirmation', () => {
    it('shows confirmation view when email is in sessionStorage', () => {
      mockGetEmail.mockReturnValue('stored@example.com')

      render(<ForgotPasswordPage />)

      expect(screen.getByText(/send a reset code to/i)).toBeInTheDocument()
      expect(screen.getByText('stored@example.com')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument()
    })

    it('allows clearing email to enter a different one', async () => {
      const user = userEvent.setup()
      mockGetEmail.mockReturnValue('stored@example.com')

      render(<ForgotPasswordPage />)

      await user.click(screen.getByRole('button', { name: /use a different email/i }))

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.queryByText(/send a reset code to/i)).not.toBeInTheDocument()
    })
  })

  /* ---- Error Handling ---- */

  describe('error handling', () => {
    it('shows friendly error for rate limiting', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('TooManyFailedAttempts'))

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/too many attempts/i)
      })
    })

    it('shows friendly error for connection failures', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Failed to fetch'))

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/could not reach the server/i)
      })
    })

    it('shows friendly error when password reset is not enabled', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Password reset is not enabled'))

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/password reset is not available/i)
      })
    })

    it('shows generic error for unexpected failures', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Something weird'))

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/could not send the reset code/i)
      })
    })

    it('does not expose internal error details to users', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(
        new Error('ConvexError: Database connection failed at /app/convex/auth.ts:42'),
      )

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        const pageText = document.body.textContent || ''
        expect(pageText).not.toContain('auth.ts:42')
        expect(pageText).not.toContain('ConvexError')
        expect(pageText).not.toContain('Database connection failed')
      })
    })
  })

  /* ---- Security ---- */

  describe('security', () => {
    it('shows same confirmation for non-existent email (no user enumeration)', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nobody@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
      })
    })

    it('disables button during loading', async () => {
      const user = userEvent.setup()
      let resolveSignIn!: (value: unknown) => void
      mockSignIn.mockImplementation(
        () =>
          new Promise((r) => {
            resolveSignIn = r
          }),
      )

      render(<ForgotPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
      })

      resolveSignIn({ signingIn: false })
    })

    it('uses role="alert" for error messages (screen reader accessible)', async () => {
      const user = userEvent.setup()
      render(<ForgotPasswordPage />)

      await user.click(screen.getByRole('button', { name: /send reset code/i }))

      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThanOrEqual(1)
    })
  })
})
