import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Clock, Users, IndianRupee, ArrowLeft } from 'lucide-react'
import { usePackage } from '@/hooks/usePackages'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'

export function YatraDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: pkg, isLoading, isError } = usePackage(id)

  usePageTitle(pkg?.title ?? 'Yatra Detail')

  useEffect(() => {
    if (isError) navigate('/yatras', { replace: true })
  }, [isError, navigate])

  const handleBook = () => {
    if (!pkg) return
    if (user) {
      navigate(`/portal/book/${pkg.id}`)
    } else {
      navigate('/login', { state: { redirectTo: `/portal/book/${pkg.id}` } })
    }
  }

  if (isLoading) return <LoadingState variant="detail" />
  if (!pkg) return null

  const isSoldOut = pkg.remaining_seats === 0

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          to="/yatras"
          className="inline-flex items-center gap-1.5 text-sm text-[#f2f0eb]/50 hover:text-amber-400 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Yatras
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero image */}
          <div className="rounded-2xl overflow-hidden h-72 sm:h-96">
            {pkg.image_url ? (
              <img
                src={pkg.image_url}
                alt={pkg.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-orange-900/20 flex items-center justify-center">
                <span className="text-8xl">🪷</span>
              </div>
            )}
          </div>

          {/* Title & metadata */}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#f2f0eb] mb-4">
              {pkg.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#f2f0eb]/60 mb-6">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-400" />
                {pkg.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-amber-400" />
                {pkg.total_seats} total seats
              </span>
              <span className="flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4 text-amber-400" />
                ₹{pkg.price.toLocaleString('en-IN')} per person
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-invert max-w-none">
            <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
              <h2 className="text-[#f2f0eb] font-semibold text-lg mb-4">About This Yatra</h2>
              <p className="text-[#f2f0eb]/60 leading-relaxed whitespace-pre-line">
                {pkg.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right — Booking card (sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 p-6 rounded-2xl bg-[#121110] border border-amber-900/20 space-y-5">
            <div>
              <p className="text-sm text-[#f2f0eb]/50 mb-1">Price per person</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-amber-400">
                  ₹{pkg.price.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[#f2f0eb]/60">
                <span>Duration</span>
                <span className="text-[#f2f0eb] font-medium">{pkg.duration}</span>
              </div>
              <div className="flex justify-between text-[#f2f0eb]/60">
                <span>Total Seats</span>
                <span className="text-[#f2f0eb] font-medium">{pkg.total_seats}</span>
              </div>
              <div className="flex justify-between text-[#f2f0eb]/60">
                <span>Remaining Seats</span>
                <span
                  className={`font-medium ${
                    isSoldOut
                      ? 'text-red-400'
                      : pkg.remaining_seats <= 10
                        ? 'text-yellow-400'
                        : 'text-green-400'
                  }`}
                >
                  {isSoldOut ? 'Sold Out' : pkg.remaining_seats}
                </span>
              </div>
            </div>

            <div className="border-t border-amber-900/20" />

            {isSoldOut ? (
              <div className="text-center py-2">
                <span className="text-red-400 font-medium">This Yatra is fully booked</span>
              </div>
            ) : (
              <button
                onClick={handleBook}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                {user ? 'Book Now' : 'Login to Book'}
              </button>
            )}

            {!user && !isSoldOut && (
              <p className="text-xs text-[#f2f0eb]/40 text-center">
                You need to{' '}
                <Link to="/signup" className="text-amber-400 hover:underline">
                  register
                </Link>{' '}
                and verify your identity before booking.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
