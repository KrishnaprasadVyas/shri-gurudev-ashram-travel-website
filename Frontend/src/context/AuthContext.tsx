import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onIdTokenChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { firebaseAuth } from '@/firebase/config'
import { usePhoneAuth } from '@/hooks/usePhoneAuth'
import type { UserRow } from '@/types/database.types'
import type { AuthUser } from '@/types'
import apiClient from '@/lib/apiClient'
import { useTranslation } from "react-i18next";

const LOG = import.meta.env.DEV

interface AuthContextValue {
  user: AuthUser | null
  userProfile: UserRow | null
  loading: boolean
  sendOtp: (
    phone: string,
    options?: { isSignUp?: boolean; fullName?: string; email?: string }
  ) => Promise<{ error?: string }>
  verifyOtp: (
    phone: string,
    code: string,
    options?: { isSignUp?: boolean; fullName?: string; email?: string }
  ) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)

  // Firebase Phone OTP hook — confirmationResult lives inside this hook's useRef.
  const phoneAuth = usePhoneAuth()

  // ---------------------------------------------------------------------------
  // fetchProfile — calls the backend API which resolves the correct Supabase
  // row via the Bearer token (Firebase or demo).  Errors are caught and logged
  // but do NOT throw — a profile fetch failure must never abort navigation.
  // ---------------------------------------------------------------------------
  const fetchProfile = useCallback(async () => {
    if (LOG) console.log('[AuthContext] fetchProfile() called')
    try {
      const { data } = await apiClient.get('/api/users/me')
      if (LOG) console.log('[AuthContext] fetchProfile() ✓ — user row:', data.user?.id)
      setUserProfile(data.user as UserRow)
      if (import.meta.env.VITE_DEMO_AUTH === 'true') {
        localStorage.setItem('demo_user_profile', JSON.stringify(data.user))
      }
    } catch (err) {
      // Log the failure but do NOT re-throw.
      // A 401 here means FIREBASE_PROJECT_ID is not configured on the backend;
      // that must not sign the user out or block navigation.
      if (LOG) console.error('[AuthContext] fetchProfile() failed:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  // ---------------------------------------------------------------------------
  // Session restore & auth state synchronisation
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // ── DEMO MODE ─────────────────────────────────────────────────────────────
    if (import.meta.env.VITE_DEMO_AUTH === 'true') {
      if (LOG) console.log('[AuthContext] Demo mode — restoring session from localStorage')
      const storedUser = localStorage.getItem('demo_user')
      const storedProfile = localStorage.getItem('demo_user_profile')
      if (storedUser) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(storedUser))
        if (storedProfile) setUserProfile(JSON.parse(storedProfile))
      }
      setLoading(false)
      return
    }

    // ── FIREBASE MODE ─────────────────────────────────────────────────────────
    if (!firebaseAuth) {
      if (LOG) console.warn('[AuthContext] firebaseAuth is null — check VITE_FIREBASE_* env vars')
      setLoading(false)
      return
    }

    if (LOG) console.log('[AuthContext] Subscribing to onIdTokenChanged...')

    // onIdTokenChanged fires:
    //  1. Immediately on subscribe (null if no session, User if there is one)
    //  2. After every successful sign-in
    //  3. After every token refresh (~60 min)
    //  4. After sign-out (null)
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      if (LOG) {
        console.log(
          '[AuthContext] onIdTokenChanged — Firebase user:',
          firebaseUser ? firebaseUser.uid : 'null (signed out)'
        )
      }

      if (firebaseUser) {
        if (LOG) {
          console.log('[AuthContext] Authenticated as:', firebaseUser.phoneNumber)
          // Log the ID token issuer to confirm it's a Firebase token
          const token = await firebaseUser.getIdToken()
          console.log('[AuthContext] ID token obtained (first 60):', token.substring(0, 60) + '…')
        }

        const u: AuthUser = {
          id: firebaseUser.uid,
          // Firebase phone_number is always E.164 (+919876543210); strip +91 for app display
          phone: firebaseUser.phoneNumber?.replace(/^\+91/, '') ?? '',
          email: firebaseUser.email ?? undefined,
          name: firebaseUser.displayName ?? undefined,
        }
        setUser(u)

        // Fetch the Supabase profile.  Error is swallowed inside fetchProfile.
        await fetchProfile()
      } else {
        if (LOG) console.log('[AuthContext] User signed out — clearing state')
        setUser(null)
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => {
      if (LOG) console.log('[AuthContext] Unsubscribing onIdTokenChanged')
      unsubscribe()
    }
  }, [fetchProfile])

  // ---------------------------------------------------------------------------
  // sendOtp
  // ---------------------------------------------------------------------------
  const sendOtp = useCallback(
    async (
      phone: string,
      options?: { isSignUp?: boolean; fullName?: string; email?: string }
    ) => {
      if (LOG) console.log('[AuthContext] sendOtp() phone:', phone)

      // ── DEMO MODE ───────────────────────────────────────────────────────────
      if (import.meta.env.VITE_DEMO_AUTH === 'true') {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return {}
      }

      // ── FIREBASE MODE ────────────────────────────────────────────────────────
      const result = await phoneAuth.initiateSend(phone, options)
      if (LOG) {
        if (result.error) console.error('[AuthContext] sendOtp failed:', result.error)
        else console.log('[AuthContext] sendOtp ✓ — OTP dispatched')
      }
      return result
    },
    [phoneAuth]
  )

  // ---------------------------------------------------------------------------
  // verifyOtp
  // ---------------------------------------------------------------------------
  const verifyOtp = useCallback(
    async (
      phone: string,
      code: string,
      options?: { isSignUp?: boolean; fullName?: string; email?: string }
    ) => {
      if (LOG) console.log('[AuthContext] verifyOtp() phone:', phone, 'code: [redacted]')

      // ── DEMO MODE ───────────────────────────────────────────────────────────
      if (import.meta.env.VITE_DEMO_AUTH === 'true') {
        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
          return { error: 'Invalid OTP code. Use any 6-digit code for testing.' }
        }

        const userId = `00000000-0000-0000-0000-${phone}00`
        const mockUser: AuthUser = {
          id: userId,
          phone: phone,
          email: options?.email || `user_${phone}@example.com`,
          name: options?.fullName || `Test User ${phone}`,
        }

        const token = `dev-token-${userId}:${encodeURIComponent(
          options?.fullName || `Test User ${phone}`
        )}:${encodeURIComponent(options?.email || '')}`

        localStorage.setItem('demo_token', token)
        localStorage.setItem('demo_user', JSON.stringify(mockUser))
        setUser(mockUser)

        // fetchProfile is safe to call — errors are swallowed inside it
        await fetchProfile()
        return {}
      }

      // ── FIREBASE MODE ────────────────────────────────────────────────────────
      if (LOG) console.log('[AuthContext] calling phoneAuth.confirmOtp()...')
      const { firebaseUser, error } = await phoneAuth.confirmOtp(code)

      if (error || !firebaseUser) {
        if (LOG) console.error('[AuthContext] verifyOtp failed:', error)
        return { error: error ?? 'Verification failed. Please try again.' }
      }

      if (LOG) {
        console.log('[AuthContext] Firebase OTP confirmed ✓')
        console.log('[AuthContext] Firebase UID:', firebaseUser.uid)
        console.log('[AuthContext] Firebase phone:', firebaseUser.phoneNumber)
      }

      // Set user immediately so protected routes don't redirect to /login
      // before onIdTokenChanged fires (which is asynchronous).
      const u: AuthUser = {
        id: firebaseUser.uid,
        phone: firebaseUser.phoneNumber?.replace(/^\+91/, '') ?? phone,
        email: firebaseUser.email ?? undefined,
        name: firebaseUser.displayName ?? options?.fullName,
      }
      setUser(u)

      if (LOG) console.log('[AuthContext] user state set — fetching profile...')

      // Fetch profile.  Any backend error (including 401 from missing
      // FIREBASE_PROJECT_ID) is caught inside fetchProfile and only logged.
      // This prevents a backend misconfiguration from blocking navigation.
      await fetchProfile()

      if (LOG) console.log('[AuthContext] verifyOtp complete — returning {} for navigation ✓')
      return {}
    },
    [phoneAuth, fetchProfile]
  )

  // ---------------------------------------------------------------------------
  // signOut
  // ---------------------------------------------------------------------------
  const signOut = useCallback(async () => {
    if (LOG) console.log('[AuthContext] signOut()')
    if (import.meta.env.VITE_DEMO_AUTH === 'true') {
      localStorage.removeItem('demo_token')
      localStorage.removeItem('demo_user')
      localStorage.removeItem('demo_user_profile')
    } else if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth)
    }
    setUser(null)
    setUserProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      sendOtp,
      verifyOtp,
      signOut,
      refreshProfile,
    }),
    [user, userProfile, loading, sendOtp, verifyOtp, signOut, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
