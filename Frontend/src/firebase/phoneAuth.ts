import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import type { ConfirmationResult } from 'firebase/auth'
import { firebaseAuth } from './config'

const LOG = import.meta.env.DEV

// ---------------------------------------------------------------------------
// Phone normalisation
// Handles: 9876543210 | +919876543210 | 919876543210 | 09876543210
//          98765 43210 | 98765-43210
// Always returns: +919876543210
// ---------------------------------------------------------------------------
export function normalizeIndianPhone(raw: string): string {
  // Strip whitespace, dashes, dots, parentheses — but NOT the leading '+'
  const clean = raw.replace(/[\s\-.()]/g, '')

  // Already fully E.164: +919876543210
  if (/^\+91\d{10}$/.test(clean)) return clean

  // No '+' prefix — strip any remaining '+' chars then classify by length/prefix
  const digits = clean.replace(/\+/g, '')

  if (/^\d{10}$/.test(digits)) return `+91${digits}`        // 9876543210
  if (/^0\d{10}$/.test(digits)) return `+91${digits.slice(1)}`  // 09876543210
  if (/^91\d{10}$/.test(digits)) return `+${digits}`        // 919876543210

  throw new Error(
    'Invalid Indian mobile number. Please enter a 10-digit number (e.g. 9876543210).'
  )
}

// ---------------------------------------------------------------------------
// Friendly error messages for Firebase auth error codes
// ---------------------------------------------------------------------------
export function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-phone-number':
      'Invalid mobile number. Please check and try again.',
    'auth/too-many-requests':
      'Too many attempts. Please wait a moment and try again.',
    'auth/code-expired':
      'The OTP has expired. Please tap Resend OTP.',
    'auth/invalid-verification-code':
      'Incorrect OTP. Please try again.',
    'auth/network-request-failed':
      'Network error. Please check your connection and try again.',
    'auth/quota-exceeded':
      'SMS quota exceeded. Please contact support.',
    'auth/captcha-check-failed':
      'reCAPTCHA check failed. Please refresh the page and try again.',
    'auth/invalid-app-credential':
      'reCAPTCHA verification failed. Please refresh the page and try again.',
    'auth/missing-phone-number':
      'Phone number is required.',
    'auth/user-disabled':
      'This account has been disabled. Please contact support.',
    'auth/session-expired':
      'Your session has expired. Please request a new OTP.',
    'auth/missing-verification-code':
      'Please enter the OTP code.',
    'auth/internal-error':
      'An internal error occurred. Please try again.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

// ---------------------------------------------------------------------------
// RecaptchaVerifier — module-level ref, but RECREATED on every OTP send.
//
// WHY recreate instead of reuse?
// When signInWithPhoneNumber() is called, Firebase internally calls
// grecaptcha.execute() which generates a one-time reCAPTCHA token.
// That token is consumed immediately.  On a resend (or after any failure),
// calling grecaptcha.execute() on the same widget returns an empty/stale
// response and Firebase returns INVALID_APP_CREDENTIAL.
//
// Firebase's own documentation shows resetting the widget on error:
//   recaptchaVerifier.render().then(id => grecaptcha.reset(id))
// The cleanest equivalent for our flow is: clear → recreate → render.
// ---------------------------------------------------------------------------
let _verifier: RecaptchaVerifier | null = null

// The container ID must match the <div> in index.html.
const RECAPTCHA_CONTAINER_ID = 'firebase-recaptcha-container'

/**
 * Tear down the current RecaptchaVerifier and remove the rendered widget
 * from the DOM container so the next `new RecaptchaVerifier(...)` starts clean.
 */
export function clearRecaptcha(): void {
  if (_verifier) {
    try {
      _verifier.clear()
      if (LOG) console.log('[reCAPTCHA] verifier cleared')
    } catch (e) {
      if (LOG) console.warn('[reCAPTCHA] error during clear:', e)
    }
    _verifier = null
  }
}

/**
 * Send an OTP to a normalised E.164 phone number.
 *
 * A brand-new RecaptchaVerifier is created and explicitly rendered before
 * every call.  This guarantees a fresh reCAPTCHA token for each attempt
 * (first send, resend, or retry after failure) and prevents the
 * INVALID_APP_CREDENTIAL error that occurs when a consumed token is reused.
 */
export async function sendPhoneOtp(normalizedPhone: string): Promise<ConfirmationResult> {
  if (!firebaseAuth) {
    throw new Error('Firebase is not initialised — check your VITE_FIREBASE_* env vars.')
  }

  // ── Step 1: tear down any previous verifier ──────────────────────────────
  clearRecaptcha()

  // ── Step 2: create a fresh invisible RecaptchaVerifier ───────────────────
  if (LOG) {
    console.log('[reCAPTCHA] creating new RecaptchaVerifier on container:', RECAPTCHA_CONTAINER_ID)
  }

  _verifier = new RecaptchaVerifier(firebaseAuth, RECAPTCHA_CONTAINER_ID, {
    size: 'invisible',
    callback: () => {
      if (LOG) console.log('[reCAPTCHA] challenge solved ✓')
    },
    'expired-callback': () => {
      // The reCAPTCHA token expired while the user was idle.
      // Clear so that the next send starts completely fresh.
      if (LOG) console.log('[reCAPTCHA] token expired — verifier cleared for next attempt')
      clearRecaptcha()
    },
  })

  // ── Step 3: explicitly render the widget ─────────────────────────────────
  // render() must complete before signInWithPhoneNumber is called so that
  // grecaptcha.execute() has a valid widget ID to work with.
  try {
    const widgetId = await _verifier.render()
    if (LOG) console.log('[reCAPTCHA] rendered, widgetId:', widgetId)
  } catch (renderErr) {
    if (LOG) console.error('[reCAPTCHA] render() failed:', renderErr)
    clearRecaptcha()
    throw renderErr
  }

  // ── Step 4: send the OTP ─────────────────────────────────────────────────
  if (LOG) {
    console.log('[Firebase] signInWithPhoneNumber →', normalizedPhone)
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(firebaseAuth, normalizedPhone, _verifier)
    if (LOG) console.log('[Firebase] OTP sent successfully ✓')
    return confirmationResult
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown'
    const msg = (err as { message?: string })?.message ?? ''
    if (LOG) {
      console.error('[Firebase] signInWithPhoneNumber FAILED')
      console.error('  code   :', code)
      console.error('  message:', msg)
    }
    // Clean up so the next send attempt gets a completely fresh verifier.
    clearRecaptcha()
    throw err
  }
}
