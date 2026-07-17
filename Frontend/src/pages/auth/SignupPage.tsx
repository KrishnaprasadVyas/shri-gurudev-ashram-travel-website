import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Phone, KeyRound, User, Mail, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'

export function SignupPage() {
  usePageTitle('Create Account')
  const { sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
  })
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(60)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    let interval: any
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1)
      }, 1000)
    } else if (timer === 0) {
      setTimerActive(false)
    }
    return () => clearInterval(interval)
  }, [timerActive, timer])

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be exactly 10 digits'
    if (form.email.trim() && !form.email.includes('@')) e.email = 'Valid email is required'
    return e
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateStep1()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)

    const result = await sendOtp(form.phone, {
      isSignUp: true,
      fullName: form.fullName,
      email: form.email,
    })
    setLoading(false)

    if (result.error) {
      setErrors({ form: result.error })
    } else {
      setStep(2)
      setTimer(60)
      setTimerActive(true)
      toast.success('Verification code sent! 🙏')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!/^\d{6}$/.test(otp)) {
      setErrors({ otp: 'OTP must be exactly 6 digits' })
      return
    }

    setLoading(true)
    const result = await verifyOtp(form.phone, otp, {
      isSignUp: true,
      fullName: form.fullName,
      email: form.email,
    })
    setLoading(false)

    if (result.error) {
      setErrors({ form: result.error })
    } else {
      toast.success('Account created! Submit your verification to book Yatras. 🙏')
      navigate('/portal')
    }
  }

  const handleResendOtp = async () => {
    if (timerActive) return
    setErrors({})
    setLoading(true)
    const result = await sendOtp(form.phone, {
      isSignUp: true,
      fullName: form.fullName,
      email: form.email,
    })
    setLoading(false)

    if (result.error) {
      setErrors({ form: result.error })
    } else {
      setTimer(60)
      setTimerActive(true)
      toast.success('Verification code resent! 🙏')
    }
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = field === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value
    setForm({ ...form, [field]: val })
  }

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

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                id="signup-fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange('fullName')}
                placeholder="Your full name"
                className="w-full px-5 py-3.5 sm:py-4 pl-12 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
            </div>
            {errors.fullName && (
              <p className="text-error font-medium text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <input
                id="signup-phone"
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="10-digit mobile number"
                className="w-full px-5 py-3.5 sm:py-4 pl-12 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
              />
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
            </div>
            {errors.phone && (
              <p className="text-error font-medium text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-1.5">
              Email Address (Optional)
            </label>
            <div className="relative">
              <input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="your@email.com (optional)"
                className="w-full px-5 py-3.5 sm:py-4 pl-12 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
            </div>
            {errors.email && (
              <p className="text-error font-medium text-xs mt-1">{errors.email}</p>
            )}
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
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setErrors({})
              setOtp('')
            }}
            className="flex items-center gap-1 text-xs tracking-wider uppercase font-semibold text-secondary hover:text-[#C98B1A] transition-colors mb-4 focus:outline-none"
          >
            <ChevronLeft className="h-4 w-4" /> Go Back
          </button>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs uppercase tracking-wider font-semibold text-secondary">
                Verification Code (OTP)
              </label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timerActive || loading}
                className="text-xs tracking-wider uppercase font-semibold text-[#C98B1A] hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timerActive ? `Resend OTP in ${timer}s` : 'Resend OTP'}
              </button>
            </div>
            <div className="relative">
              <input
                id="signup-otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-5 py-4 pl-12 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
              />
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
            </div>
            {errors.otp && (
              <p className="text-error font-medium text-xs mt-1">{errors.otp}</p>
            )}
          </div>

          {errors.form && (
            <div className="px-5 py-4 rounded-xl bg-error-container/80 border border-error/20 text-on-error-container text-xs sm:text-sm font-medium">
              {errors.form}
            </div>
          )}

          <button
            type="submit"
            id="signup-verify-submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-8 rounded-xl bg-gradient-to-r from-[#E8A338] via-[#C98B1A] to-[#B87314] text-white font-label-caps text-xs sm:text-sm tracking-[0.2em] uppercase font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-md active:scale-95"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Register'}
          </button>
        </form>
      )}

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
