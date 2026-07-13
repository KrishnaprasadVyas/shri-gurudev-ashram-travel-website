import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'

export function LoginPage() {
  usePageTitle('Sign In')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: { pathname?: string }; redirectTo?: string } | null
  const from = state?.redirectTo ?? state?.from?.pathname ?? '/portal'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <AuthSplitLayout>
      <div className="mb-10 text-center sm:text-left">
        <h2 className="font-display-lg text-3xl sm:text-4xl text-primary font-bold tracking-tight mb-2">
          Welcome Back
        </h2>
        <p className="font-body-md text-sm sm:text-base text-on-surface-variant font-light">
          Sign in to continue your spiritual journey.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-2">
            Email Address / Mobile Number
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-5 py-4 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs tracking-wider uppercase font-semibold text-[#C98B1A] hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-5 py-4 pr-12 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
            >
              {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-5 py-4 rounded-xl bg-error-container/80 border border-error/20 text-on-error-container text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          id="login-submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-4 px-8 rounded-xl bg-gradient-to-r from-[#E8A338] via-[#C98B1A] to-[#B87314] text-white font-label-caps text-xs sm:text-sm tracking-[0.2em] uppercase font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-md active:scale-95 mt-4"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Login'}
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-outline-variant/30 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="font-body-md text-sm text-on-surface-variant font-light">
          Don't have an account?
        </span>
        <Link
          to="/signup"
          className="font-label-caps text-xs tracking-widest uppercase font-bold text-primary hover:text-secondary transition-colors inline-flex items-center gap-1 group"
        >
          Register Free{' '}
          <span className="transform transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </AuthSplitLayout>
  )
}
