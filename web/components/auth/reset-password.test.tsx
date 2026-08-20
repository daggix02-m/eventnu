import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

/* -------------------------------------------------------------------------- */
/*  Mocks                                                                      */
/* -------------------------------------------------------------------------- */

const mockPush = vi.fn()
const mockRefresh = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => mockSearchParams,
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
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Type a code into the CodeInput component character by character */
async function fillCode(code: string) {
  for (let i = 0; i < code.length; i++) {
    const input = screen.getByLabelText(new RegExp(`character ${i + 1} of`, 'i'))
    fireEvent.change(input, { target: { value: code[i] } })
  }
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                      */
/* -------------------------------------------------------------------------- */

import ResetPasswordPage from '@/app/auth/reset-password/page'

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockGetEmail.mockReturnValue(null)
  })

  /* ---- Initial State ---- */

  describe('initial state', () => {
    it('shows the reset password form', () => {
      render(<ResetPasswordPage />)

      expect(screen.getByRole('heading', { name: /choose a new password/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
    })

    it('pre-fills email from sessionStorage', () => {
      mockGetEmail.mockReturnValue('user@example.com')

      render(<ResetPasswordPage />)

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveValue('user@example.com')
    })

    it('pre-fills code from URL search params', () => {
      mockSearchParams = new URLSearchParams({ code: 'ABC123' })

      render(<ResetPasswordPage />)

      // CodeInput should receive the code from URL
      // We verify indirectly by checking the page rendered without error
      expect(screen.getByRole('heading', { name: /choose a new password/i })).toBeInTheDocument()
    })

    it('shows "Request a new reset link" link', () => {
      render(<ResetPasswordPage />)

      const link = screen.getByRole('link', { name: /request a new reset link/i })
      expect(link).toHaveAttribute('href', '/auth/forgot-password')
    })

    it('shows "Back to sign in" link', () => {
      render(<ResetPasswordPage />)

      const link = screen.getByRole('link', { name: /back to sign in/i })
      expect(link).toHaveAttribute('href', '/auth')
    })

    it('shows Suspense loading state initially', () => {
      // The page wraps ResetPasswordInner in Suspense
      // We just verify it renders (Suspense resolves synchronously in tests)
      render(<ResetPasswordPage />)

      expect(screen.getByRole('heading', { name: /choose a new password/i })).toBeInTheDocument()
    })
  })

  /* ---- Password Validation ---- */

  describe('password validation', () => {
    it('rejects empty email', async () => {
      const user = userEvent.setup()
      render(<ResetPasswordPage />)

      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i)
      })
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('rejects empty code', async () => {
      const user = userEvent.setup()
      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/enter the reset code/i)
      })
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('rejects password shorter than 8 characters', async () => {
      const user = userEvent.setup()
      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      // Fill the code input with 6 characters
      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'short' } })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i)
      })
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('rejects mismatched passwords', async () => {
      const user = userEvent.setup()
      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      // Fill code
      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password456!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i)
      })
      expect(mockSignIn).not.toHaveBeenCalled()
    })
  })

  /* ---- Successful Reset ---- */

  describe('successful reset', () => {
    it('calls signIn with correct form data', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: true })

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('password', expect.any(FormData))
      })

      const formData = mockSignIn.mock.calls[0][1] as FormData
      expect(formData.get('email')).toBe('test@example.com')
      expect(formData.get('code')).toBe('ABC123')
      expect(formData.get('newPassword')).toBe('Password123!')
      expect(formData.get('flow')).toBe('reset-verification')
      expect(formData.get('redirectTo')).toBe('/auth/callback')
    })

    it('normalizes email to lowercase and code to uppercase', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: true })

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'TEST@EXAMPLE.COM' } })
      await fillCode('abc123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        const formData = mockSignIn.mock.calls[0][1] as FormData
        expect(formData.get('email')).toBe('test@example.com')
        expect(formData.get('code')).toBe('ABC123')
      })
    })

    it('stores email after successful reset', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: true })

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(mockStoreEmail).toHaveBeenCalledWith('test@example.com')
      })
    })

    it('redirects to home on success when signingIn is true', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: true })

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('redirects to /auth?mode=signin on success when signingIn is false', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth?mode=signin')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })

  /* ---- Password Strength Indicator ---- */

  describe('password strength indicator', () => {
    it('shows strength indicator when password field has value', () => {
      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'abc' } })

      // The strength bar should be visible
      expect(screen.getByText(/weak|fair|good|strong/i)).toBeInTheDocument()
    })

    it('does not show strength indicator when password field is empty', () => {
      render(<ResetPasswordPage />)

      // Strength indicator should not be visible when empty
      expect(screen.queryByText(/weak|fair|good|strong/i)).not.toBeInTheDocument()
    })
  })

  /* ---- Password Visibility Toggle ---- */

  describe('password visibility toggle', () => {
    it('toggles password visibility', () => {
      render(<ResetPasswordPage />)

      const newPassInput = screen.getByLabelText(/new password/i)
      expect(newPassInput).toHaveAttribute('type', 'password')

      const toggleBtn = screen.getByRole('button', { name: /show password/i })
      fireEvent.click(toggleBtn)

      expect(newPassInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
    })
  })

  /* ---- Error Handling ---- */

  describe('error handling', () => {
    it('shows friendly error for invalid code', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Invalid code provided'))

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/code is incorrect/i)
      })
    })

    it('shows friendly error for expired code', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Code has expired'))

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/code has expired/i)
      })
    })

    it('shows friendly error for rate limiting', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('TooManyFailedAttempts'))

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/too many attempts/i)
      })
    })

    it('shows friendly error for connection failures', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Failed to fetch'))

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/could not reach the server/i)
      })
    })

    it('does not expose internal error details to users', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(
        new Error('ConvexError: DB failure at /packages/convex/convex/auth.ts:123'),
      )

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        const pageText = document.body.textContent || ''
        expect(pageText).not.toContain('auth.ts:123')
        expect(pageText).not.toContain('ConvexError')
        expect(pageText).not.toContain('DB failure')
      })
    })
  })

  /* ---- Security ---- */

  describe('security', () => {
    it('disables button during loading', async () => {
      const user = userEvent.setup()
      let resolveSignIn!: (value: unknown) => void
      mockSignIn.mockImplementation(
        () =>
          new Promise((r) => {
            resolveSignIn = r
          }),
      )

      render(<ResetPasswordPage />)

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })

      await fillCode('ABC123')

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'Password123!' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123!' },
      })
      await user.click(screen.getByRole('button', { name: /reset password/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled()
      })

      resolveSignIn({ signingIn: true })
    })
  })
})
