import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldX, ShieldCheck, BookOpen, Map, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useMyBookings } from '@/hooks/useBookings'
import { usePageTitle } from '@/hooks/usePageTitle'

export function PortalHomePage() {
  usePageTitle('My Portal')
  const { userProfile } = useAuth()
  const { data: bookings } = useMyBookings()
  const navigate = useNavigate()

  const name = userProfile?.full_name?.split(' ')[0] ?? 'Devotee'
  const verStatus = userProfile?.verification_status ?? 'not_submitted'

  useEffect(() => {
    if (bookings && bookings.length > 0 && verStatus === 'verified') {
      navigate('/portal/bookings', { replace: true })
    }
  }, [bookings, verStatus, navigate])

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#f2f0eb]">
          Welcome, {name}! 🙏
        </h1>
        <p className="text-[#f2f0eb]/50 mt-1">Manage your bookings and account from here.</p>
      </div>

      {/* Verification status card */}
      {verStatus === 'not_submitted' && (
        <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldX className="h-5 w-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-[#f2f0eb] mb-1">Complete Identity Verification</h2>
              <p className="text-sm text-[#f2f0eb]/60 mb-4">
                You need to verify your identity before booking any Yatra. It takes less than 5 minutes.
              </p>
              <Link
                to="/portal/verify"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Verify Now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {verStatus === 'submitted' && (
        <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="font-semibold text-[#f2f0eb]">Verification Under Review</h2>
              <p className="text-sm text-[#f2f0eb]/60 mt-0.5">
                Your documents are being reviewed. We'll notify you within 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {verStatus === 'verified' && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-400 font-medium">Identity Verified ✓ — You can now book Yatras.</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/yatras"
          className="group p-6 rounded-2xl bg-[#121110] border border-amber-900/20 hover:border-amber-500/30 transition-all hover:shadow-[0_10px_30px_rgba(245,158,11,0.08)]"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
            <Map className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="font-semibold text-[#f2f0eb] mb-1">Browse Yatras</h3>
          <p className="text-sm text-[#f2f0eb]/50">View all upcoming sacred journeys</p>
        </Link>

        <Link
          to="/portal/bookings"
          className="group p-6 rounded-2xl bg-[#121110] border border-amber-900/20 hover:border-amber-500/30 transition-all hover:shadow-[0_10px_30px_rgba(245,158,11,0.08)]"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
            <BookOpen className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="font-semibold text-[#f2f0eb] mb-1">My Bookings</h3>
          <p className="text-sm text-[#f2f0eb]/50">
            {bookings?.length ? `${bookings.length} booking${bookings.length === 1 ? '' : 's'} found` : 'No bookings yet'}
          </p>
        </Link>
      </div>
    </div>
  )
}
