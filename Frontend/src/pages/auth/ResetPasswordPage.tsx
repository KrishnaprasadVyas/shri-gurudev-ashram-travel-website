import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function ResetPasswordPage() {
  usePageTitle('Reset Password')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // D.6: null = checking, true = valid, false = invalid/expired
  const [sessionValid, setSessionValid] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionValid(session !== null)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      toast.success('Password updated! Please sign in with your new password.')
      navigate('/login')
    }
  }

  if (sessionValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (sessionValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-16 font-body-md text-on-surface">
        <div className="w-full max-w-md text-center space-y-6">
          <img
            src="/assets/Ashram vector logo_2022_white-01.png"
            alt="Shri Gurudev Ashram Logo"
            className="w-14 h-14 object-contain mx-auto mb-4 drop-shadow-sm"
          />
          <div className="p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm space-y-4">
            <div className="px-5 py-4 rounded-xl bg-error-container text-on-error-container text-sm font-medium">
              Invalid or expired recovery link. Please request a new password reset.
            </div>
            <Link
              to="/forgot-password"
              className="inline-block text-primary hover:text-secondary font-bold transition-colors"
            >
              Request New Password Reset →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-16 font-body-md text-on-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img
            src="/assets/Ashram vector logo_2022_white-01.png"
            alt="Shri Gurudev Ashram Logo"
            className="w-14 h-14 object-contain mx-auto mb-4 drop-shadow-sm"
          />
          <h1 className="font-display-lg text-3xl text-primary mb-2">New Password</h1>
          <p className="text-on-surface-variant">Choose a strong new password</p>
        </div>
        
        <div className="p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-5 py-4 pr-12 rounded-xl bg-surface border border-outline-variant/50 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-5 py-4 rounded-xl bg-surface border border-outline-variant/50 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            
            {error && (
              <div className="px-5 py-4 rounded-xl bg-error-container text-on-error-container text-sm font-medium">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-all disabled:opacity-60 shadow-md"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Password'}
            </button>
            
            <p className="text-center text-on-surface-variant mt-6">
              <Link to="/login" className="text-primary hover:text-secondary font-bold transition-colors">Back to Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
