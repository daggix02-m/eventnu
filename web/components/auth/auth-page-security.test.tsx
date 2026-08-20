import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

/* -------------------------------------------------------------------------- */
/*  Shared Mocks                                                               */
/* -------------------------------------------------------------------------- */

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
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

vi.mock('motion/react', () => {
  const createMotionComponent = (tag: string) => {
    const Component = ({
      children,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: Record<string, unknown>) =>
      React.createElement(
        tag,
        props as React.HTMLAttributes<HTMLElement>,
        children as React.ReactNode,
      )
    Component.displayName = `motion.${tag}`
    return Component
  }
  return {
    motion: new Proxy(
      {},
      {
        get: (_target: object, tag: string | symbol) => {
          if (typeof tag === 'string') return createMotionComponent(tag)
          return undefined
        },
      },
    ),
    MotionConfig: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  }
})

const mockSignIn = vi.fn()
vi.mock('convex/react', () => ({
  useMutation: () => {
    const mutations: Record<string, ReturnType<typeof vi.fn>> = {
      'profiles.ensureProfile': vi.fn(),
      'profiles.acceptTerms': vi.fn(),
      'organizers.create': vi.fn(),
    }
    return (key: string) => mutations[key] || vi.fn()
  },
}))

vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}))

vi.mock('@/lib/auth', () => ({
  consumeAuthRedirect: vi.fn(() => '/'),
  rememberAuthRedirect: vi.fn(),
}))

vi.mock('@/lib/auth-storage', () => ({
  storeEmail: vi.fn(),
  storePendingTerms: vi.fn(),
  storePendingOrg: vi.fn(),
  clearAllPending: vi.fn(),
  getEmail: vi.fn(),
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
    ArrowLeft: icon('arrow-left'),
    Mail: icon('mail'),
    Calendar: icon('calendar'),
    CalendarDays: icon('calendar-days'),
    Megaphone: icon('megaphone'),
    Info: icon('info'),
    Building2: icon('building'),
    Compass: icon('compass'),
    Heart: icon('heart'),
    Eye: icon('eye'),
    EyeOff: icon('eye-off'),
    Check: icon('check'),
  }
})

import { AuthPage } from './AuthPage'

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fillInput(labelRe: RegExp, value: string) {
  const input = screen.getByLabelText(labelRe)
  fireEvent.change(input, { target: { value } })
}

/* -------------------------------------------------------------------------- */
/*  Security Tests                                                             */
/* -------------------------------------------------------------------------- */

describe('AuthPage — Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  /* ---- XSS Prevention ---- */

  describe('XSS prevention', () => {
    it('does not execute script tags in email field input', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)

      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      const emailInput = screen.getByLabelText(/email/i)
      const xssPayload = '<script>alert("xss")</script>'
      fillInput(/email/i, xssPayload)

      expect(emailInput).toHaveValue(xssPayload)
      expect(document.querySelectorAll('script')).toHaveLength(0)
    })

    it('does not execute script tags in name field input', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)

      await user.click(screen.getByText('Browse events'))

      const nameInput = screen.getByLabelText(/full name/i)
      const xssPayload = '<img src=x onerror=alert(1)>'
      fillInput(/full name/i, xssPayload)

      expect(nameInput).toHaveValue(xssPayload)
      expect(document.querySelectorAll('img[src="x"]')).toHaveLength(0)
    })

    it('does not render HTML entities in error messages', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('<script>alert("xss")</script>'))

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
      })
      expect(document.querySelectorAll('script')).toHaveLength(0)
    })

    it('sanitizes email before sending to signIn', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, '  Test@Example.COM  ')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('password', {
          email: 'test@example.com',
          password: 'password123',
          flow: 'signIn',
          redirectTo: '/auth/callback',
        })
      })
    })
  })

  /* ---- Password Security ---- */

  describe('password security', () => {
    it('password field has type="password" (not visible by default)', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      const passwordInput = screen.getByLabelText(/^password$/i)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('password is not sent in URL or logged', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: true })

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'mypassword123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled()
      })

      const calls = mockPush.mock.calls.flat().join(' ')
      expect(calls).not.toContain('mypassword123')

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        const value = sessionStorage.getItem(key!)
        expect(value).not.toContain('mypassword123')
      }
    })

    it('enforces minimum password length of 8 characters (organizer flow)', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      // Step 2 - short password
      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })
      fillInput(/^password$/i, 'abc1234')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('password confirmation must match (organizer flow)', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      // Step 2 - mismatched passwords
      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })
      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'different123')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('has autoComplete="current-password" on signin', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      const passwordInput = screen.getByLabelText(/^password$/i)
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })

    it('has autoComplete="new-password" on organizer signup', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })
      const passwordInput = screen.getByLabelText(/^password$/i)
      expect(passwordInput).toHaveAttribute('autocomplete', 'new-password')
    })
  })

  /* ---- Session Storage Safety ---- */

  describe('session storage safety', () => {
    it('only stores email in sessionStorage, not password', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled()
      })

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        const value = sessionStorage.getItem(key!)
        expect(value).not.toContain('password123')
      }
    })
  })

  /* ---- Email Validation ---- */

  describe('email validation', () => {
    it('rejects email without @ symbol', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'notanemail')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    })

    it('rejects email without domain', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'user@')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    })

    it('rejects email with spaces', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'user @example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    })
  })

  /* ---- Error Message Safety ---- */

  describe('error message safety', () => {
    it('does not expose internal error details to users', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(
        new Error(
          'ConvexError: DATABASE_ERROR: table profiles column auth_user_id foreign key violation',
        ),
      )

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        const errorText = screen.getByRole('alert')
        expect(errorText.textContent).not.toContain('DATABASE_ERROR')
        expect(errorText.textContent).not.toContain('foreign key')
        expect(errorText.textContent).not.toContain('ConvexError')
      })
    })

    it('does not expose stack traces', async () => {
      const user = userEvent.setup()
      const error = new Error('Auth failed')
      error.stack = 'Error: Auth failed\n    at /app/packages/convex/convex/auth.ts:42:15'
      mockSignIn.mockRejectedValue(error)

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        const pageText = document.body.textContent || ''
        expect(pageText).not.toContain('auth.ts:42')
        expect(pageText).not.toContain('at /app/')
      })
    })
  })

  /* ---- Form Submission Safety ---- */

  describe('form submission safety', () => {
    it('prevents double submission by disabling button during loading', async () => {
      const user = userEvent.setup()
      let callCount = 0
      mockSignIn.mockImplementation(async () => {
        callCount++
        await new Promise((resolve) => setTimeout(resolve, 100))
        return { signingIn: false }
      })

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')

      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      // Re-query inside waitFor since button text changes during loading
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /signing in/i })
        expect(btn).toBeDisabled()
      })

      await waitFor(() => {
        expect(callCount).toBe(1)
      })
    })

    it('uses noValidate on forms (client-side validation only)', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      const form = screen.getByRole('button', { name: /^sign in$/i }).closest('form')
      expect(form).toHaveAttribute('novalidate')
    })
  })

  /* ---- Terms and Privacy ---- */

  describe('terms and privacy', () => {
    it('terms links open in new tab with noopener noreferrer (signup step 2)', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      const termsLink = screen.getByRole('link', { name: /terms of service/i })
      expect(termsLink).toHaveAttribute('target', '_blank')
      expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer')

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i })
      expect(privacyLink).toHaveAttribute('target', '_blank')
      expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('footer terms links open in new tab with noopener noreferrer', () => {
      render(<AuthPage />)

      const termsLink = screen.getByRole('link', { name: /^terms$/i })
      expect(termsLink).toHaveAttribute('target', '_blank')
      expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer')

      const privacyLink = screen.getByRole('link', { name: /privacy policy$/i })
      expect(privacyLink).toHaveAttribute('target', '_blank')
      expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  /* ---- Input Sanitization ---- */

  describe('input sanitization', () => {
    it('trims and lowercases email before API call', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, '  Test@Example.COM  ')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('password', {
          email: 'test@example.com',
          password: 'password123',
          flow: 'signIn',
          redirectTo: '/auth/callback',
        })
      })
    })

    it('trims name in organizer sign-up before API call', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, '  Test User  ')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      // Step 2
      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })
      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'password123')
      await user.click(screen.getByRole('checkbox', { name: /accept terms/i }))
      await user.click(screen.getByRole('button', { name: /continue/i }))

      // Step 3
      await waitFor(() => {
        expect(screen.getByLabelText(/organizer \/ business name/i)).toBeInTheDocument()
      })
      fillInput(/organizer \/ business name/i, 'My Events')
      await user.click(screen.getByRole('button', { name: /submit application/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('password', {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          flow: 'signUp',
          redirectTo: '/auth/callback',
        })
      })
    })
  })

  /* ---- Accessibility Security (SR-only errors) ---- */

  describe('accessibility security', () => {
    it('error summary has role="alert" for screen readers', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      // Multiple elements may have role="alert" (ErrorSummary + FieldBox errors).
      // Find the ErrorSummary specifically via its aria-labelledby.
      const summary = screen.getByRole('alert', { name: /there is a problem/i })
      expect(summary).toBeInTheDocument()
    })

    it('error summary is focusable (tabIndex={-1}) for screen readers', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      const summary = screen.getByRole('alert', { name: /there is a problem/i })
      expect(summary).toHaveAttribute('tabindex', '-1')
    })
  })
})
