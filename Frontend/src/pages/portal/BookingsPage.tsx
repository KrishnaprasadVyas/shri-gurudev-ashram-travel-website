import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useMyBookings } from '@/hooks/useBookings'
import { BookingCard } from '@/components/portal/BookingCard'
import { LoadingState, EmptyState } from '@/components/shared/States'
import { usePageTitle } from '@/hooks/usePageTitle'

export function BookingsPage() {
  usePageTitle('My Bookings')
  const { data: bookings, isLoading, error } = useMyBookings()

  // F.3: Error state
  if (error) return (
    <div className="text-center py-16 space-y-3">
      <p className="text-[#f2f0eb]/50">Failed to load your bookings.</p>
      <button onClick={() => window.location.reload()} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
        Retry
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-[#f2f0eb]">My Bookings</h1>
        <Link
          to="/yatras"
          className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          Browse Yatras →
        </Link>
      </div>

      {isLoading ? (
        <LoadingState variant="cards" count={3} />
      ) : !bookings?.length ? (
        <EmptyState
          icon={BookOpen}
          title="No bookings yet"
          description="Book a Yatra to get started on your spiritual journey."
          action={{ label: 'Browse Yatras', href: '/yatras' }}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}
