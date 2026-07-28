import { Link, useNavigate } from 'react-router-dom'
import { Clock, IndianRupee, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { TravelPackage } from '@/types/travel'

interface PackageCardProps {
  package: TravelPackage
  showBookButton?: boolean
}

function SeatsBadge({ remaining }: { remaining: number }) {
  if (remaining === 0) {
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/80 text-white">
        Sold Out
      </span>
    )
  }
  if (remaining <= 10) {
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/80 text-white">
        {remaining} left
      </span>
    )
  }
  return (
    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/80 text-white">
      {remaining} seats
    </span>
  )
}

export function PackageCard({ package: pkg, showBookButton = true }: PackageCardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleBook = () => {
    if (user) {
      navigate(`/portal/book/${pkg.id}`)
    } else {
      navigate('/login', { state: { redirectTo: `/portal/book/${pkg.id}` } })
    }
  }

  return (
    <div className="group rounded-2xl overflow-hidden border border-amber-900/20 bg-[#121110] hover:border-amber-500/30 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(245,158,11,0.1)] flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {pkg.image_url ? (
          <img
            src={pkg.image_url}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-orange-900/20 flex items-center justify-center">
            <span className="text-4xl">🪷</span>
          </div>
        )}
        {/* Seats badge */}
        <div className="absolute top-3 right-3">
          <SeatsBadge remaining={pkg.remaining_seats} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-lg text-[#f2f0eb] group-hover:text-amber-400 transition-colors line-clamp-2 mb-3">
          {pkg.title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-[#f2f0eb]/50 mb-4">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            {pkg.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-500" />
            {pkg.total_seats} seats
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-4">
          <IndianRupee className="h-4 w-4 text-amber-400" />
          <span className="text-xl font-bold text-amber-400">
            {pkg.price.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-[#f2f0eb]/40">per person</span>
        </div>

        {/* Footer */}
        <div className="mt-auto flex flex-col sm:flex-row items-stretch gap-2">
          <Link
            to={`/yatras/${pkg.id}`}
            className="flex-1 flex items-center justify-center py-2 rounded-lg border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition-colors min-h-[44px]"
          >
            View Details
          </Link>
          {showBookButton && pkg.remaining_seats > 0 && (
            <button
              onClick={handleBook}
              className="flex-1 flex items-center justify-center py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors min-h-[44px]"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
