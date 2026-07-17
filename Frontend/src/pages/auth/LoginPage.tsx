import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Phone, KeyRound, ChevronLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { toast } from 'sonner'

export function LoginPage() {
  usePageTitle('Sign In')
  const { sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: { pathname?: string }; redirectTo?: string } | null
  const from = state?.redirectTo ?? state?.from?.pathname ?? '/portal'

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState('')
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!/^\d{10}$/.test(phone)) {
      setError('Mobile number must be exactly 10 digits')
      return
    }

    setLoading(true)
    const result = await sendOtp(phone)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setStep(2)
      setTimer(60)
      setTimerActive(true)
      toast.success('Verification code sent! 🙏')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be exactly 6 digits')
      return
    }

    setLoading(true)
    const result = await verifyOtp(phone, otp)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      toast.success('Signed in successfully!')
      navigate(from, { replace: true })
    }
  }

  const handleResendOtp = async () => {
    if (timerActive) return
    setError('')
    setLoading(true)
    const result = await sendOtp(phone)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setTimer(60)
      setTimerActive(true)
      toast.success('Verification code resent! 🙏')
    }
  }

  return (
    <AuthSplitLayout>
      <div className="mb-10 text-center sm:text-left">
        <h2 className="font-display-lg text-3xl sm:text-4xl text-primary font-bold tracking-tight mb-2">
          Welcome Back
        </h2>
        <p className="font-body-md text-sm sm:text-base text-on-surface-variant font-light">
          Sign in using your mobile number to continue your spiritual journey.
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <input
                id="login-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full px-5 py-4 pl-12 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
              />
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
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
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setError('')
              setOtp('')
            }}
            className="flex items-center gap-1 text-xs tracking-wider uppercase font-semibold text-secondary hover:text-[#C98B1A] transition-colors mb-4 focus:outline-none"
          >
            <ChevronLeft className="h-4 w-4" /> Change Mobile Number
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
                id="login-otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-5 py-4 pl-12 rounded-xl bg-[#FAF8F5] border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-[#C98B1A] focus:ring-1 focus:ring-[#C98B1A] transition-all shadow-inner text-sm sm:text-base font-light"
              />
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
            </div>
          </div>

          {error && (
            <div className="px-5 py-4 rounded-xl bg-error-container/80 border border-error/20 text-on-error-container text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            id="login-verify-submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-8 rounded-xl bg-gradient-to-r from-[#E8A338] via-[#C98B1A] to-[#B87314] text-white font-label-caps text-xs sm:text-sm tracking-[0.2em] uppercase font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-md active:scale-95"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Login'}
          </button>
        </form>
      )}

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
