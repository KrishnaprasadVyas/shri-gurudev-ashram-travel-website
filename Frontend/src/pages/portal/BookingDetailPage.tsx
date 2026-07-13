import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle, XCircle, IndianRupee } from 'lucide-react'
import { useBooking } from '@/hooks/useBookings'
import { usePayment } from '@/hooks/usePayment'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import type { BookingRow } from '@/types/database.types'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-4 py-2 border-b border-amber-900/10 last:border-0">
      <span className="w-36 flex-shrink-0 text-sm text-[#f2f0eb]/40">{label}</span>
      <span className="text-sm text-[#f2f0eb]">{value}</span>
    </div>
  )
}

const statusConfig = {
  payment_pending: { label: 'Payment Pending', icon: AlertCircle, className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  paid: { label: 'Confirmed', icon: CheckCircle, className: 'text-green-400 bg-green-500/10 border-green-500/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'text-red-400 bg-red-500/10 border-red-500/20' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useBooking(id)
  const { initiatePayment } = usePayment()

  const booking: BookingRow | undefined = data?.booking
  usePageTitle(booking ? `Booking #${booking.booking_reference}` : 'Booking Detail')

  if (isLoading) return <LoadingState variant="detail" />
  if (error) return (
    <div className="text-center py-16 space-y-3">
      <p className="text-[#f2f0eb]/50">Failed to load booking details.</p>
      <Link to="/portal/bookings" className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
        Back to Bookings
      </Link>
    </div>
  )
  if (!booking) return (
    <div className="text-center py-16 text-[#f2f0eb]/50">
      <p>Booking not found.</p>
      <Link to="/portal/bookings" className="text-amber-400 hover:text-amber-300 text-sm mt-2 inline-block">Back to Bookings</Link>
    </div>
  )

  const status = statusConfig[booking.status] ?? statusConfig.payment_pending
  const StatusIcon = status.icon

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/portal/bookings" className="p-1.5 rounded-lg text-[#f2f0eb]/50 hover:text-[#f2f0eb] hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-[#f2f0eb]">
          Booking #{booking.booking_reference}
        </h1>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${status.className}`}>
        <StatusIcon className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">{status.label}</p>
          {booking.status === 'payment_pending' && (
            <p className="text-xs opacity-70 mt-0.5">Complete payment to confirm your booking.</p>
          )}
        </div>
        {booking.status === 'payment_pending' && (
          <button
            onClick={() => initiatePayment(booking.id, booking.booking_reference)}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <IndianRupee className="h-3.5 w-3.5" />
            Pay ₹{booking.total_amount.toLocaleString('en-IN')}
          </button>
        )}
      </div>

      {/* Details card */}
      <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
        <h2 className="font-semibold text-[#f2f0eb] mb-4">Traveler Information</h2>
        <InfoRow label="Full Name" value={booking.full_name} />
        <InfoRow label="Phone" value={booking.phone_number} />
        <InfoRow label="WhatsApp" value={booking.whatsapp_number} />
        <InfoRow label="Date of Birth" value={booking.dob} />
        <InfoRow label="Address" value={booking.address} />
      </div>

      <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
        <h2 className="font-semibold text-[#f2f0eb] mb-4">Travel Preferences</h2>
        <InfoRow label="Transport" value={booking.transport_type} />
        {booking.bus_type && <InfoRow label="Train Class" value={booking.bus_type} />}
        <InfoRow label="Room Type" value={booking.room_type} />
        <InfoRow label="Travelers" value={`${booking.traveler_count} person${booking.traveler_count !== 1 ? 's' : ''}`} />
        {booking.special_notes && <InfoRow label="Special Notes" value={booking.special_notes} />}
      </div>

      <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
        <h2 className="font-semibold text-[#f2f0eb] mb-4">Payment Summary</h2>
        <div className="flex items-center justify-between py-2">
          <span className="text-[#f2f0eb]/60 text-sm">Total Amount</span>
          <span className="text-xl font-bold text-amber-400">
            ₹{booking.total_amount.toLocaleString('en-IN')}
          </span>
        </div>
        <InfoRow label="Booked On" value={new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
      </div>
    </div>
  )
}
