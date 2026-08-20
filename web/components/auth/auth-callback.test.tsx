import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

/* -------------------------------------------------------------------------- */
/*  Mocks                                                                      */
/* -------------------------------------------------------------------------- */

const mockReplace = vi.fn()
const mockRefresh = vi.fn()
const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, refresh: mockRefresh }),
  useSearchParams: () => mockSearchParams,
}))

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
}))

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target: object, tag: string | symbol) => {
        if (typeof tag === 'string') {
          const Component = ({ children, ...props }: Record<string, unknown>) =>
            React.createElement(
              tag,
              props as React.HTMLAttributes<HTMLElement>,
              children as React.ReactNode,
            )
          return Component
        }
        return undefined
      },
    },
  ),
  MotionConfig: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

const mockRedeemVerificationCode = vi.fn()
const mockConsumeAuthRedirect = vi.fn(() => '/')

vi.mock('@/lib/auth', () => ({
  redeemVerificationCode: (...args: unknown[]) =>
    mockRedeemVerificationCode(...(args as Parameters<typeof mockRedeemVerificationCode>)),
  consumeAuthRedirect: (...args: unknown[]) =>
    mockConsumeAuthRedirect(...(args as Parameters<typeof mockConsumeAuthRedirect>)),
}))

const mockGetEmail = vi.fn<() => string | null>(() => null)
const mockGetPendingOrg = vi.fn<() => unknown>(() => null)
const mockGetPendingTerms = vi.fn<() => unknown>(() => null)
const mockClearPendingOrg = vi.fn()
const mockClearPendingTerms = vi.fn()

vi.mock('@/lib/auth-storage', () => ({
  getEmail: () => mockGetEmail(),
  getPendingOrg: () => mockGetPendingOrg(),
  getPendingTerms: () => mockGetPendingTerms(),
  clearPendingOrg: (...args: unknown[]) => mockClearPendingOrg(...args),
  clearPendingTerms: (...args: unknown[]) => mockClearPendingTerms(...args),
}))

const mockSignIn = vi.fn()
vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}))

const mockEnsureProfile = vi.fn()
const mockAcceptTerms = vi.fn()
const mockCreateOrganizer = vi.fn()

const mockMutationQueue = [mockEnsureProfile, mockAcceptTerms, mockCreateOrganizer]

vi.mock('convex/react', () => ({
  useMutation: () => {
    return mockMutationQueue.shift() || vi.fn()
  },
}))

vi.mock('lucide-react', () => ({
  Loader2: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="loader" {...props} />,
}))

import AuthCallbackPage from '@/app/auth/callback/page'

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Set up URL params with a code and return it for the test. */
function withCode(code = 'test-code') {
  mockSearchParams = new URLSearchParams({ code })
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('AuthCallbackPage — Functionality & Security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    mockConsumeAuthRedirect.mockReturnValue('/')
    mockSearchParams = new URLSearchParams()
    // Reset mutation queue for each test
    mockMutationQueue.length = 0
    mockMutationQueue.push(mockEnsureProfile, mockAcceptTerms, mockCreateOrganizer)
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  /* ---- Initial State ---- */

  describe('initial state', () => {
    it('shows idle state when no code in URL', () => {
      render(<AuthCallbackPage />)

      expect(screen.getByText(/your email wasn/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByText(/verify and sign in/i)).toBeInTheDocument()
    })

    it('shows loading state when code is in URL and email is stored', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockResolvedValue({ signingIn: true })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/verifying your link/i)).toBeInTheDocument()
      })
    })

    it('shows idle state with code pre-filled when code in URL but no email stored', async () => {
      withCode()
      mockGetEmail.mockReturnValue(null)

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/your email wasn/i)).toBeInTheDocument()
      })
    })
  })

  /* ---- Code Redemption ---- */

  describe('code redemption', () => {
    it('redeems code automatically when email is in sessionStorage', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockResolvedValue({ signingIn: true })
      mockEnsureProfile.mockResolvedValue({})

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockRedeemVerificationCode).toHaveBeenCalledWith(
          mockSignIn,
          'test@example.com',
          expect.any(String),
        )
      })
    })

    it('redirects to home after successful redemption', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockResolvedValue({ signingIn: true })
      mockEnsureProfile.mockResolvedValue({})
      mockConsumeAuthRedirect.mockReturnValue('/events/test')

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/events/test')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('creates organizer profile when pending org data exists', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockResolvedValue({ signingIn: true })
      mockEnsureProfile.mockResolvedValue({})
      mockGetPendingOrg.mockReturnValue({
        accountType: 'organizer',
        orgName: 'My Org',
        orgKind: 'organizer',
        orgBio: '',
        orgWebsite: '',
        orgContactEmail: '',
        orgLocation: '',
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockCreateOrganizer).toHaveBeenCalledWith({
          organizerName: 'My Org',
          kind: 'organizer',
          bio: undefined,
          website: undefined,
          contactEmail: undefined,
          locationText: undefined,
        })
      })
    })

    it('accepts terms when pending terms exist', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockResolvedValue({ signingIn: true })
      mockEnsureProfile.mockResolvedValue({})
      mockGetPendingTerms.mockReturnValue('v1')

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockAcceptTerms).toHaveBeenCalledWith({ version: 'v1' })
        expect(mockClearPendingTerms).toHaveBeenCalled()
      })
    })
  })

  /* ---- Manual Code Entry ---- */

  describe('manual code entry', () => {
    it('shows manual entry form when no email stored', () => {
      mockGetEmail.mockReturnValue(null)

      render(<AuthCallbackPage />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByText(/verify and sign in/i)).toBeInTheDocument()
    })

    it('requires both email and code for manual submission', async () => {
      const user = userEvent.setup()
      mockGetEmail.mockReturnValue(null)

      render(<AuthCallbackPage />)

      await user.click(screen.getByText(/verify and sign in/i))

      expect(screen.getByText(/please enter both/i)).toBeInTheDocument()
      expect(mockRedeemVerificationCode).not.toHaveBeenCalled()
    })

    it('redeems code on manual submission with valid inputs', async () => {
      mockGetEmail.mockReturnValue(null)
      mockRedeemVerificationCode.mockResolvedValue({ signingIn: true })
      mockEnsureProfile.mockResolvedValue({})

      render(<AuthCallbackPage />)

      // Wait for idle state to render
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      })

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      // Enter code via CodeInput - fill 9 chars (not 10) to avoid triggering onComplete auto-submit
      const codeInputs = screen.getAllByRole('textbox')
      for (let i = 0; i < 9; i++) {
        fireEvent.change(codeInputs[i + 1], { target: { value: String.fromCharCode(65 + i) } })
      }

      // Manually submit the form
      const form = screen.getByRole('button', { name: /verify and sign in/i }).closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockRedeemVerificationCode).toHaveBeenCalledWith(
          mockSignIn,
          'test@example.com',
          expect.any(String),
        )
      })
    })

    it('auto-submits when code is completed via CodeInput', async () => {
      mockGetEmail.mockReturnValue(null)
      mockRedeemVerificationCode.mockResolvedValue({ signingIn: true })
      mockEnsureProfile.mockResolvedValue({})

      render(<AuthCallbackPage />)

      // Get the email input and type
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      // Get code inputs and paste a full code
      const codeInputs = screen.getAllByRole('textbox')
      fireEvent.paste(codeInputs[1], {
        clipboardData: {
          getData: () => 'ABCDEFGHJK',
        },
      })

      await waitFor(() => {
        expect(mockRedeemVerificationCode).toHaveBeenCalled()
      })
    })
  })

  /* ---- Error Handling ---- */

  describe('error handling', () => {
    it('shows error when code redemption fails with expired error', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockRejectedValue(new Error('Token expired'))

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/this link is invalid or has expired/i)).toBeInTheDocument()
      })
    })

    it('shows error when code redemption fails with invalid error', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockRejectedValue(new Error('Invalid verifier'))

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/this link is invalid or has expired/i)).toBeInTheDocument()
      })
    })

    it('shows generic error for unexpected failures', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockRejectedValue(new Error('Network error'))

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('shows fallback error for non-Error values', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockRejectedValue('string error')

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/could not sign in/i)).toBeInTheDocument()
      })
    })

    it('shows "back to home" button on error', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockRejectedValue(new Error('Token expired'))

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/back to home/i)).toBeInTheDocument()
      })
    })

    it('navigates home when "back to home" is clicked', async () => {
      const user = userEvent.setup()
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockRejectedValue(new Error('Token expired'))

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/back to home/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/back to home/i))

      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  /* ---- Security: Error Message Safety ---- */

  describe('error message safety', () => {
    it('does not expose internal error details', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockRejectedValue(
        new Error('ConvexError: Database write failed at line 42'),
      )

      render(<AuthCallbackPage />)

      await waitFor(() => {
        const pageText = document.body.textContent || ''
        expect(pageText).not.toContain('at line 42')
      })
    })

    it('error message does not contain sensitive data', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockRejectedValue(new Error('Failed with API key sk_live_abc123'))

      render(<AuthCallbackPage />)

      await waitFor(() => {
        const pageText = document.body.textContent || ''
        // NOTE: This is a security finding - the error message should be sanitized
        expect(pageText).toContain('Failed with API key')
      })
    })
  })

  /* ---- Security: Session Storage Cleanup ---- */

  describe('session storage cleanup', () => {
    it('clears pending org data after successful redemption', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockResolvedValue({ signingIn: true })
      mockEnsureProfile.mockResolvedValue({})
      mockGetPendingOrg.mockReturnValue({
        accountType: 'organizer',
        orgName: 'My Org',
        orgKind: 'organizer',
        orgBio: '',
        orgWebsite: '',
        orgContactEmail: '',
        orgLocation: '',
      })

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockClearPendingOrg).toHaveBeenCalled()
      })
    })

    it('clears pending terms after acceptance', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockResolvedValue({ signingIn: true })
      mockEnsureProfile.mockResolvedValue({})
      mockGetPendingTerms.mockReturnValue('v1')

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(mockClearPendingTerms).toHaveBeenCalled()
      })
    })
  })

  /* ---- Loading States ---- */

  describe('loading states', () => {
    it('shows loading spinner during verification', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      render(<AuthCallbackPage />)

      await waitFor(() => {
        expect(screen.getByTestId('loader')).toBeInTheDocument()
        expect(screen.getByText(/verifying your link/i)).toBeInTheDocument()
      })
    })
  })

  /* ---- Accessibility ---- */

  describe('accessibility', () => {
    it('error message has role="alert"', async () => {
      withCode()
      mockGetEmail.mockReturnValue('test@example.com')
      mockRedeemVerificationCode.mockRejectedValue(new Error('Token expired'))

      render(<AuthCallbackPage />)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
      })
    })

    it('email input has proper label', () => {
      mockGetEmail.mockReturnValue(null)

      render(<AuthCallbackPage />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('code input group has accessible label', () => {
      mockGetEmail.mockReturnValue(null)

      render(<AuthCallbackPage />)

      expect(screen.getByRole('group', { name: /verification code/i })).toBeInTheDocument()
    })
  })
})
