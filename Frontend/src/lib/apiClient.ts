import axios from 'axios'
import { firebaseAuth } from '@/firebase/config'

const LOG = import.meta.env.DEV

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
  if (!envUrl || envUrl.trim() === '') {
    return ''
  }
  return envUrl.trim().replace(/\/+$/, '')
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Request interceptor — attach a fresh Bearer token before every request.
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(async (config) => {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl && !config.url?.startsWith('http://') && !config.url?.startsWith('https://')) {
    const errorMsg = '[API Client Error] Backend API URL is not configured. Please define VITE_API_BASE_URL or VITE_API_URL in your environment variables.'
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  let token: string | null = null

  if (import.meta.env.VITE_DEMO_AUTH === 'true') {
    token = localStorage.getItem('demo_token')
    if (LOG) console.log('[apiClient] request →', config.url, '| demo token:', token ? '✓' : 'missing')
  } else if (firebaseAuth?.currentUser) {
    token = await firebaseAuth.currentUser.getIdToken()
    if (LOG) {
      console.log('[apiClient] request →', config.url)
      console.log('[apiClient] Firebase ID token attached (first 40):', token.substring(0, 40) + '…')
    }
  } else {
    if (LOG) console.warn('[apiClient] request →', config.url, '| no auth token (unauthenticated)')
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 Unauthorized.
//
// CRITICAL BEHAVIOUR CHANGE from previous implementation:
// We now only redirect to /login when there is genuinely no authenticated
// Firebase session.  If firebaseAuth.currentUser is set, the 401 means the
// BACKEND is not configured (e.g. missing FIREBASE_PROJECT_ID) — we must NOT
// sign the user out because their Firebase session is perfectly valid.
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => {
    if (LOG) console.log('[apiClient] response ← ', response.config.url, response.status)
    return response
  },
  async (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''

    if (LOG) {
      console.error('[apiClient] response error ← ', url, status)
      console.error('[apiClient] error detail:', error.response?.data)
    }

    if (status === 401) {
      if (import.meta.env.VITE_DEMO_AUTH === 'true') {
        // Demo mode: clear session and go to login
        localStorage.removeItem('demo_token')
        localStorage.removeItem('demo_user')
        localStorage.removeItem('demo_user_profile')
        if (LOG) console.log('[apiClient] 401 in demo mode — clearing session, redirecting to /login')
        window.location.href = '/login'
      } else if (!firebaseAuth?.currentUser) {
        // Firebase mode with no current user: session truly expired → redirect
        if (LOG) console.log('[apiClient] 401 with no Firebase user — redirecting to /login')
        window.location.href = '/login'
      } else {
        // Firebase mode but user IS authenticated: backend configuration issue.
        // Do NOT sign out or redirect — the Firebase session is valid.
        if (LOG) {
          console.warn('[apiClient] 401 received but Firebase user is active (' + firebaseAuth.currentUser.uid + ')')
          console.warn('[apiClient] This usually means FIREBASE_PROJECT_ID is not set on the backend.')
          console.warn('[apiClient] Fix: add FIREBASE_PROJECT_ID to Backend/.env.development')
        }
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
