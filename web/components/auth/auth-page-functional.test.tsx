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
const mockEnsureProfile = vi.fn()
const mockAcceptTerms = vi.fn()
const mockCreateOrganizer = vi.fn()
const mockStoreEmail = vi.fn()
const mockClearAllPending = vi.fn()

vi.mock('convex/react', () => ({
  useMutation: () => {
    const mutations: Record<string, ReturnType<typeof vi.fn>> = {
      'profiles.ensureProfile': mockEnsureProfile,
      'profiles.acceptTerms': mockAcceptTerms,
      'organizers.create': mockCreateOrganizer,
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
  storeEmail: (email: string) => mockStoreEmail(email),
  storePendingTerms: vi.fn(),
  storePendingOrg: vi.fn(),
  clearAllPending: () => mockClearAllPending(),
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
/*  Helpers — fill FieldBox via fireEvent (more reliable with floating label)  */
/* -------------------------------------------------------------------------- */

function fillInput(labelRe: RegExp, value: string) {
  const input = screen.getByLabelText(labelRe)
  fireEvent.change(input, { target: { value } })
}

/* -------------------------------------------------------------------------- */
/*  Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('AuthPage — Functional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  /* ---- Initial Render ---- */

  describe('initial render', () => {
    it('renders the choose view by default', () => {
      render(<AuthPage />)
      expect(screen.getByRole('heading', { name: /join event nu/i })).toBeInTheDocument()
    })

    it('shows both account type options', () => {
      render(<AuthPage />)
      expect(screen.getByText('Browse events')).toBeInTheDocument()
      expect(screen.getByText('Host events')).toBeInTheDocument()
    })

    it('shows "Already have an account? Sign in" link', () => {
      render(<AuthPage />)
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument()
    })
  })

  /* ---- View Transitions ---- */

  describe('view transitions', () => {
    it('navigates to signup when "Browse events" is clicked', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))
      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    })

    it('navigates to organizer signup when "Host events" is clicked', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))
      expect(screen.getByRole('heading', { name: /apply as an organizer/i })).toBeInTheDocument()
      expect(screen.getByText(/your account is created right away/i)).toBeInTheDocument()
    })

    it('navigates to signin when "Sign in" button is clicked', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    })

    it('navigates from signin back to choose view via "Create an account"', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /create an account/i }))
      expect(screen.getByRole('heading', { name: /join event nu/i })).toBeInTheDocument()
    })
  })

  /* ---- Sign-In Form Validation ---- */

  describe('sign-in form validation', () => {
    it('shows error when submitting with empty email', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))
      expect(screen.getByText('Please enter your email.')).toBeInTheDocument()
    })

    it('shows error when submitting with empty password', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))
      expect(screen.getByText('Please enter a password.')).toBeInTheDocument()
    })

    it('does not submit when validation fails', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))
      expect(mockSignIn).not.toHaveBeenCalled()
    })
  })

  /* ---- Sign-In Loading State ---- */

  describe('sign-in loading state', () => {
    it('shows loading spinner during sign-in', async () => {
      const user = userEvent.setup()
      mockSignIn.mockImplementation(() => new Promise(() => {}))

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      })
      expect(screen.getByTestId('icon-loader')).toBeInTheDocument()
    })

    it('disables submit button during loading', async () => {
      const user = userEvent.setup()
      mockSignIn.mockImplementation(() => new Promise(() => {}))

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')

      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      // Re-query inside waitFor since the button text changes during loading
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /signing in/i })
        expect(btn).toBeDisabled()
      })
    })
  })

  /* ---- Error Handling ---- */

  describe('error handling', () => {
    it('displays error message when sign-in fails', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'))

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
      })
    })

    it('displays generic error for unexpected errors', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Something weird'))

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
      })
    })

    it('clears previous errors when switching views', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'))

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /create an account/i }))
      expect(screen.queryByText('Invalid email or password.')).not.toBeInTheDocument()
    })
  })

  /* ---- Organizer Step Navigation ---- */

  describe('organizer step navigation', () => {
    it('shows step progress indicator for organizer signup', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))
      expect(screen.getByText('1 of 3')).toBeInTheDocument()
    })

    it('shows "Continue" button for organizer step 1', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })

    it('navigates to step 2 after step 1 validation passes', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByText('2 of 3')).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    })

    it('navigates back from step 2 to step 1', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByText('2 of 3')).toBeInTheDocument()
      })

      // Go back
      await user.click(screen.getByRole('button', { name: /back/i }))

      await waitFor(() => {
        expect(screen.getByText('1 of 3')).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/your personal name/i)).toBeInTheDocument()
    })

    it('navigates from step 1 back to choose view', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))
      await user.click(screen.getByRole('button', { name: /choose a different path/i }))
      expect(screen.getByRole('heading', { name: /join event nu/i })).toBeInTheDocument()
    })

    it('validates name is required on step 1', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))
      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByText('Please enter your name.')).toBeInTheDocument()
    })

    it('validates email is required on step 1', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))
      fillInput(/your personal name/i, 'Test User')
      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByText('Please enter your email.')).toBeInTheDocument()
    })

    it('validates password is required on step 2', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByText('Please enter a password.')).toBeInTheDocument()
    })

    it('validates password length on step 2', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      fillInput(/^password$/i, 'short')
      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    })

    it('validates password confirmation on step 2', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'different123')
      await user.click(screen.getByRole('button', { name: /continue/i }))
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    })

    it('validates terms acceptance on final submit (step 3 for organizer)', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'password123')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/organizer \/ business name/i)).toBeInTheDocument()
      })

      fillInput(/organizer \/ business name/i, 'My Events')
      // Submit without checking terms checkbox
      await user.click(screen.getByRole('button', { name: /submit application/i }))

      await waitFor(() => {
        expect(screen.getByText(/please accept the terms/i)).toBeInTheDocument()
      })
    })

    it('shows organizer details form on step 3', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, 'Test User')
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
        expect(screen.getByText('3 of 3')).toBeInTheDocument()
      })
      expect(screen.getByLabelText(/organizer \/ business name/i)).toBeInTheDocument()
    })

    it('validates org name is required on step 3', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, 'Test User')
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
      await user.click(screen.getByRole('button', { name: /submit application/i }))
      expect(screen.getByText('Please enter your organizer or business name.')).toBeInTheDocument()
    })
  })

  /* ---- Organizer Sign-Up Successful Flow ---- */

  describe('successful organizer sign-up flow', () => {
    it('calls signIn with correct params for organizer signup', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })
      mockEnsureProfile.mockResolvedValue({})

      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, 'Test User')
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

    it('shows verify view after successful signup (when verification needed)', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Step 1
      fillInput(/your personal name/i, 'Test User')
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
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
      })
    })
  })

  /* ---- Password Strength Indicator ---- */

  describe('password strength indicator', () => {
    it('shows password strength on organizer signup step 2', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Host events'))

      // Navigate to step 2
      fillInput(/your personal name/i, 'Test User')
      fillInput(/email/i, 'test@example.com')
      await user.click(screen.getByRole('button', { name: /continue/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      })

      fillInput(/^password$/i, 'MyP@ssw0rd!')

      expect(screen.getByText('Strong')).toBeInTheDocument()
    })
  })

  /* ---- Forgot Password Link ---- */

  describe('forgot password link', () => {
    it('shows "Forgot password?" on signin view', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))
      expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument()
    })

    it('navigates to forgot-password page when clicked', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))
      await user.click(screen.getByRole('button', { name: /forgot password/i }))
      expect(mockPush).toHaveBeenCalledWith('/auth/forgot-password')
    })
  })

  /* ---- Sign-In Submission ---- */

  describe('sign-in submission', () => {
    it('calls signIn with correct params', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: true })

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
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

  /* ---- Sign-In Verify View ---- */

  describe('sign-in verify view', () => {
    it('shows verify view when signIn returns signingIn: false', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: false })

      render(<AuthPage />)
      await user.click(screen.getByRole('button', { name: /sign in$/i }))

      fillInput(/email/i, 'test@example.com')
      fillInput(/^password$/i, 'password123')
      await user.click(screen.getByRole('button', { name: /^sign in$/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
      })
    })
  })

  /* ---- Regular User Signup ---- */

  describe('regular user signup', () => {
    it('shows password fields on the same page (no step progression needed)', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      // Regular users should see ALL fields at once: name, email, password, confirm, terms
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /accept terms/i })).toBeInTheDocument()
    })

    it('has a submit button (not Continue) for regular users', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()
    })

    it('can successfully sign up as a regular user', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ signingIn: true })

      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      fillInput(/full name/i, 'Jane Doe')
      fillInput(/email/i, 'jane@example.com')
      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'password123')
      await user.click(screen.getByRole('checkbox', { name: /accept terms/i }))
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('password', {
          email: 'jane@example.com',
          password: 'password123',
          name: 'Jane Doe',
          flow: 'signUp',
          redirectTo: '/auth/callback',
        })
      })
    })

    it('validates all required fields on submit', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      // Check terms first so field validation runs (terms check returns early otherwise)
      await user.click(screen.getByRole('checkbox', { name: /accept terms/i }))
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText('Please enter your name.')).toBeInTheDocument()
      expect(screen.getByText('Please enter your email.')).toBeInTheDocument()
      expect(screen.getByText('Please enter a password.')).toBeInTheDocument()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('validates email format on regular user signup', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      fillInput(/full name/i, 'Jane Doe')
      fillInput(/email/i, 'not-an-email')
      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'password123')
      await user.click(screen.getByRole('checkbox', { name: /accept terms/i }))
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('validates password length on regular user signup', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      fillInput(/full name/i, 'Jane Doe')
      fillInput(/email/i, 'jane@example.com')
      fillInput(/^password$/i, 'short')
      fillInput(/confirm password/i, 'short')
      await user.click(screen.getByRole('checkbox', { name: /accept terms/i }))
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('validates password confirmation matches', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      fillInput(/full name/i, 'Jane Doe')
      fillInput(/email/i, 'jane@example.com')
      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'different123')
      await user.click(screen.getByRole('checkbox', { name: /accept terms/i }))
      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('shows loading state during sign up', async () => {
      const user = userEvent.setup()
      mockSignIn.mockImplementation(() => new Promise(() => {})) // never resolves

      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      fillInput(/full name/i, 'Jane Doe')
      fillInput(/email/i, 'jane@example.com')
      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'password123')
      await user.click(screen.getByRole('checkbox', { name: /accept terms/i }))
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
    })

    it('does not submit when terms are unchecked', async () => {
      const user = userEvent.setup()
      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      fillInput(/full name/i, 'Jane Doe')
      fillInput(/email/i, 'jane@example.com')
      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'password123')
      // Do NOT check terms
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/please accept the terms/i)).toBeInTheDocument()
      })
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('routes to sign-in when the account already exists', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Account already exists'))

      render(<AuthPage />)
      await user.click(screen.getByText('Browse events'))

      fillInput(/full name/i, 'Jane Doe')
      fillInput(/email/i, 'jane@example.com')
      fillInput(/^password$/i, 'password123')
      fillInput(/confirm password/i, 'password123')
      await user.click(screen.getByRole('checkbox', { name: /accept terms/i }))
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      })
      expect(
        screen.getByText('An account with this email already exists. Please sign in instead.'),
      ).toBeInTheDocument()
      expect(mockStoreEmail).toHaveBeenCalled()
    })
  })
})
