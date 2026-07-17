import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Phone, KeyRound, ChevronLeft, Sparkles } from 'lucide-react'
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
      toast.success('Verification code sent to your mobile number! 🙏')
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
      <div className="mb-8 text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] text-[#B8860B] font-label-caps text-[11px] font-bold uppercase tracking-[0.2em] shadow-2xs">
          <Sparkles className="h-3 w-3" />
          <span>Devotee Portal</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-[#3E2B1F] font-bold tracking-tight">
          Welcome Back
        </h2>
        <p className="font-body-md text-sm sm:text-base text-[#6F5B47] font-normal leading-relaxed">
          Sign in using your registered 10-digit mobile number to access your pilgrimage account and administration dashboard.
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div>
            <label className="block text-xs font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
              Registered Mobile Number *
            </label>
            <div className="relative">
              <input
                id="login-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-5 py-4 pl-12 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] text-[#3E2B1F] placeholder-[#9A8A78] focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 transition-all duration-200 shadow-2xs text-sm sm:text-base font-medium"
              />
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B8860B]" />
            </div>
          </div>

          {error && (
            <div className="px-5 py-3.5 rounded-[14px] bg-[#B23A2F]/12 border border-[#B23A2F]/25 text-[#B23A2F] text-xs sm:text-sm font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            id="login-submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-8 rounded-full bg-[#B8860B] hover:bg-[#6F5200] text-[#FFFFFF] font-label-caps text-xs sm:text-sm tracking-[0.2em] uppercase font-bold shadow-[0_8px_24px_rgba(140,106,10,0.25)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Request OTP Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in duration-300">
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setError('')
              setOtp('')
            }}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6F5B47] hover:text-[#B8860B] transition-colors mb-2 focus:outline-none"
          >
            <ChevronLeft className="h-4 w-4" /> Change Mobile Number ({phone})
          </button>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B]">
                Verification Code (OTP) *
              </label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timerActive || loading}
                className="text-xs font-bold uppercase tracking-wider text-[#B8860B] hover:text-[#6F5200] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {timerActive ? `Resend OTP in ${timer}s` : 'Resend OTP Now'}
              </button>
            </div>
            <div className="relative">
              <input
                id="login-otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit verification code"
                className="w-full px-5 py-4 pl-12 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] text-[#3E2B1F] placeholder-[#9A8A78] focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 transition-all duration-200 shadow-2xs text-sm sm:text-base font-mono font-bold tracking-widest"
              />
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B8860B]" />
            </div>
          </div>

          {error && (
            <div className="px-5 py-3.5 rounded-[14px] bg-[#B23A2F]/12 border border-[#B23A2F]/25 text-[#B23A2F] text-xs sm:text-sm font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            id="login-verify-submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-8 rounded-full bg-[#B8860B] hover:bg-[#6F5200] text-[#FFFFFF] font-label-caps text-xs sm:text-sm tracking-[0.2em] uppercase font-bold shadow-[0_8px_24px_rgba(140,106,10,0.25)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Enter Portal'}
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-[#E9DCC5] text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-sm text-[#6F5B47] font-normal">
          Don't have a registered account?
        </span>
        <Link
          to="/signup"
          className="font-label-caps text-xs uppercase tracking-widest font-bold text-[#B8860B] hover:text-[#6F5200] transition-colors inline-flex items-center gap-1.5 group"
        >
          Register Free Account{' '}
          <span className="transform transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </AuthSplitLayout>
  )
}
