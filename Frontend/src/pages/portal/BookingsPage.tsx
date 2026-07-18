import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useMyBookings } from '@/hooks/useBookings'
import { usePageTitle } from '@/hooks/usePageTitle'
import { BookingCard } from '@/components/portal/BookingCard'
import { LoadingState, EmptyState } from '@/components/shared/States'
import { toast } from 'sonner'
import type { BookingRow } from '@/types/database.types'

const filterTabs = [
  { key: 'all', label: 'All Bookings' },
  { key: 'paid', label: 'Confirmed' },
  { key: 'payment_pending', label: 'Payment Pending' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' },
] as const

type FilterKey = typeof filterTabs[number]['key']

export function BookingsPage() {
  usePageTitle('My Bookings')
  const { userProfile } = useAuth()
  const [filter, setFilter] = useState<FilterKey>('all')

  const { data: rawBookings, isLoading, error, refetch } = useMyBookings()

  const bookings = useMemo(() => {
    if (!rawBookings) return []
    return rawBookings.map((b: BookingRow & { packages?: { title?: string } | null }) => ({
      ...b,
      packageTitle: b.packages?.title ?? 'Sacred Pilgrimage Package',
    }))
  }, [rawBookings])

  const filtered = useMemo(() => {
    if (filter === 'all') return bookings
    return bookings.filter((b) => b.status === filter)
  }, [bookings, filter])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">My Bookings</h1>
          <p className="text-sm text-[#6F5B47] mt-1 font-normal">View your pilgrimage reservations & boarding passes</p>
        </div>
        <LoadingState variant="cards" count={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[380px] flex flex-col items-center justify-center gap-4 text-center p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] max-w-md mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#C0392B]/15 border border-[#C0392B]/30 flex items-center justify-center text-[#C0392B]">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Failed to load bookings</h3>
          <p className="text-sm text-[#6F5B47] mt-1 font-normal">We encountered an issue retrieving your reservations.</p>
        </div>
        <button
          onClick={() => { refetch(); toast.info('Retrying...') }}
          className="px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] transition-all cursor-pointer shadow-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">My Bookings</h1>
          <p className="text-sm text-[#6F5B47] mt-1 font-normal">Manage your sacred journey reservations and ledgers</p>
        </div>
        <Link
          to="/yatras"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#B8860B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] transition-all shrink-0 cursor-pointer shadow-sm hover:-translate-y-0.5"
        >
          Explore Yatras →
        </Link>
      </div>

      {/* ── Filter Tabs ──────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => {
          const count = tab.key === 'all'
            ? bookings.length
            : bookings.filter((b) => b.status === tab.key).length

          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === tab.key
                  ? 'bg-[#B8860B] text-white shadow-sm'
                  : 'bg-[#FFFFFF] border border-[#E9DCC5] text-[#6F5B47] hover:text-[#3E2B1F] hover:bg-[#F5EFE4]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                filter === tab.key ? 'bg-black/15 text-white' : 'bg-[#F5EFE4] text-[#6F5B47]'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Bookings List ────────────────────────────────── */}
      {bookings.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No bookings yet"
          description="You haven&apos;t made any Yatra reservations yet. Start your spiritual journey by browsing our sacred packages."
          action={{ label: 'Browse Yatras', href: '/yatras' }}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#6F5B47] text-sm bg-[#FFFFFF] border border-[#E9DCC5] rounded-3xl shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
          No bookings match this filter status.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}
