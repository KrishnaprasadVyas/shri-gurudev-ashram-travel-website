import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import type { Auth } from 'firebase-admin/auth'

// ---------------------------------------------------------------------------
// Firebase Admin SDK — initialised lazily so that the backend starts even
// when FIREBASE_PROJECT_ID is not set (e.g., if only DEMO_AUTH is used).
// ---------------------------------------------------------------------------

let _auth: Auth | null = null

function ensureInitialised(): Auth | null {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) return null // Firebase not configured on this server

  if (_auth) return _auth

  if (getApps().length === 0) {
    // initializeApp with only projectId is sufficient for verifyIdToken.
    // The SDK downloads public keys from Google — no service-account JSON needed.
    initializeApp({ projectId })
  }

  _auth = getAuth()
  return _auth
}

/**
 * Verify a Firebase ID token and return the decoded claims.
 * Returns null if Firebase Admin is not configured (missing FIREBASE_PROJECT_ID).
 * Throws if the token is invalid.
 */
export async function verifyFirebaseToken(token: string) {
  const auth = ensureInitialised()
  if (!auth) return null
  return auth.verifyIdToken(token)
}
