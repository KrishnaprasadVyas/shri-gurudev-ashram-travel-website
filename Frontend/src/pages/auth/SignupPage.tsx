import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'

export function SignupPage() {
  usePageTitle('Create Account')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be 10 digits'
    if (!form.email.includes('@')) e.email = 'Valid email is required'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)
    const result = await signUp(form.email, form.password, form.fullName, form.phone)
    setLoading(false)
    if (result.error) {
      setErrors({ form: result.error })
    } else {
      // D.7: Check if a session exists — email confirmation may be required
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        toast.success('Account created! Submit your verification to book Yatras. 🙏')
        navigate('/portal')
      } else {
        toast.success('Account created! Please check your email to confirm your account.')
        navigate('/login')
      }
    }
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <AuthSplitLayout>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="font-display-lg text-3xl sm:text-4xl text-primary font-bold tracking-tight mb-2">
          Join Shri Gurudev Ashram
        </h2>
        <p className="font-body-md text-sm sm:text-base text-on-surface-variant font-light">
          Create your account to participate in Sacred Yatras and stay connected with Ashram activities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {[
          { id: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
          { id: 'phone', label: 'Mobile Number', type: 'tel', placeholder: '10-digit mobile number' },
          { id: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com' },
        ].map((field) => (
          <div key={field.id}>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              {field.label}
            </label>
            <input
              id={`signup-${field.id}`}
              type={field.type}
              value={form[field.id as keyof typeof form]}
              onChange={f(field.id)}
              placeholder={field.placeholder}
              className="w-full px-5 py-3.5 sm:py-4 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
            />
            {errors[field.id] && (
              <p className="text-error font-medium text-xs mt-1">{errors[field.id]}</p>
            )}
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={f('password')}
                placeholder="Min. 6 chars"
                className="w-full px-5 py-3.5 sm:py-4 pr-10 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-error font-medium text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Confirm Password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={f('confirmPassword')}
              placeholder="Repeat password"
              className="w-full px-5 py-3.5 sm:py-4 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
            />
            {errors.confirmPassword && (
              <p className="text-error font-medium text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {errors.form && (
          <div className="px-5 py-4 rounded-xl bg-error-container/80 border border-error/20 text-on-error-container text-xs sm:text-sm font-medium">
            {errors.form}
          </div>
        )}

        <button
          type="submit"
          id="signup-submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-4 px-8 rounded-xl bg-gradient-to-r from-[#E8A338] via-[#C98B1A] to-[#B87314] text-white font-label-caps text-xs sm:text-sm tracking-[0.2em] uppercase font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-md active:scale-95 mt-6"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Register Free'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="font-body-md text-sm text-on-surface-variant font-light">
          Already have an account?
        </span>
        <Link
          to="/login"
          className="font-label-caps text-xs tracking-widest uppercase font-bold text-primary hover:text-secondary transition-colors inline-flex items-center gap-1 group"
        >
          Login{' '}
          <span className="transform transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </AuthSplitLayout>
  )
}
