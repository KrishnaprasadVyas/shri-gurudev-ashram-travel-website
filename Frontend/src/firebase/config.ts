import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// ---------------------------------------------------------------------------
// Firebase is only active when VITE_DEMO_AUTH is NOT 'true'.
// All functions that call Firebase check this guard before doing anything.
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
}

// Lazily initialise Firebase so that missing env vars in demo mode don't throw.
function initFirebase() {
  if (import.meta.env.VITE_DEMO_AUTH === 'true') return null
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  return getAuth(app)
}

// Export a single auth instance.  Consumers MUST guard with `if (!firebaseAuth) return`.
export const firebaseAuth = initFirebase()
