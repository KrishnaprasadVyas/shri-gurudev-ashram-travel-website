import { useRef, useEffect } from 'react'
import type { ConfirmationResult, User as FirebaseUser } from 'firebase/auth'
import {
  sendPhoneOtp,
  clearRecaptcha,
  normalizeIndianPhone,
  mapFirebaseError,
} from '@/firebase/phoneAuth'

const LOG = import.meta.env.DEV

export interface PhoneAuthResult {
  error?: string
}

export interface PhoneConfirmResult {
  firebaseUser?: FirebaseUser
  error?: string
}

/**
 * React hook that manages Firebase Phone OTP state.
 * Used inside AuthProvider so it persists for the entire app session.
 *
 * Design:
 * - confirmationResult lives in useRef (survives renders, not shared globally)
 * - RecaptchaVerifier is created fresh on every sendPhoneOtp call (see phoneAuth.ts)
 * - In DEMO_AUTH mode all Firebase paths are skipped entirely
 */
export function usePhoneAuth() {
  const IS_DEMO = import.meta.env.VITE_DEMO_AUTH === 'true'

  // confirmationResult must persist between initiateSend() and confirmOtp() calls.
  // useRef keeps it alive without causing re-renders.
  const confirmationResultRef = useRef<ConfirmationResult | null>(null)

  // Clean up any lingering RecaptchaVerifier when AuthProvider unmounts.
  // AuthProvider never unmounts during a normal browser session, but this
  // handles edge cases like server-side rendering or hot-module replacement.
  useEffect(() => {
    return () => {
      if (!IS_DEMO) {
        if (LOG) console.log('[usePhoneAuth] unmounting — clearing RecaptchaVerifier')
        clearRecaptcha()
      }
    }
  }, [IS_DEMO])

  /**
   * Normalise the phone number, create a fresh RecaptchaVerifier,
   * and call signInWithPhoneNumber.
   * Stores the ConfirmationResult for the subsequent confirmOtp() call.
   */
  async function initiateSend(
    rawPhone: string,
    // Reserved for future sign-up flow metadata; not yet consumed by this hook.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: { isSignUp?: boolean; fullName?: string; email?: string }
  ): Promise<PhoneAuthResult> {
    if (LOG) console.log('[usePhoneAuth] initiateSend() — raw input:', rawPhone)

    // ── Normalise phone ──────────────────────────────────────────────────────
    let normalized: string
    try {
      normalized = normalizeIndianPhone(rawPhone)
      if (LOG) console.log('[usePhoneAuth] normalised phone:', normalized)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid phone number.'
      if (LOG) console.warn('[usePhoneAuth] normalisation failed:', message)
      return { error: message }
    }

    // ── Send OTP ─────────────────────────────────────────────────────────────
    try {
      const result = await sendPhoneOtp(normalized)
      confirmationResultRef.current = result
      if (LOG) console.log('[usePhoneAuth] confirmationResult stored ✓')
      return {}
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      if (LOG) console.error('[usePhoneAuth] initiateSend error code:', code)
      return { error: mapFirebaseError(code) }
    }
  }

  /**
   * Confirm the 6-digit OTP code and return the authenticated Firebase User.
   */
  async function confirmOtp(code: string): Promise<PhoneConfirmResult> {
    if (LOG) {
      console.log('[usePhoneAuth] confirmOtp() called')
      console.log('[usePhoneAuth] confirmationResult present:', !!confirmationResultRef.current)
    }

    if (!confirmationResultRef.current) {
      return { error: 'Session expired. Please request a new OTP.' }
    }

    try {
      if (LOG) console.log('[usePhoneAuth] calling confirmationResult.confirm(code)...')
      const result = await confirmationResultRef.current.confirm(code)

      // Clear immediately after successful use — cannot be reused
      confirmationResultRef.current = null

      const { user } = result
      if (LOG) {
        console.log('[usePhoneAuth] OTP confirmed ✓')
        console.log('[usePhoneAuth] Firebase UID        :', user.uid)
        console.log('[usePhoneAuth] Firebase phoneNumber:', user.phoneNumber)
        console.log('[usePhoneAuth] Firebase email      :', user.email)
        const idToken = await user.getIdToken()
        console.log('[usePhoneAuth] ID token (first 60) :', idToken.substring(0, 60) + '…')
      }

      return { firebaseUser: result.user }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      const msg = (err as { message?: string })?.message ?? ''
      if (LOG) {
        console.error('[usePhoneAuth] confirmOtp FAILED')
        console.error('  code   :', code)
        console.error('  message:', msg)
      }
      return { error: mapFirebaseError(code) }
    }
  }

  return { initiateSend, confirmOtp }
}
