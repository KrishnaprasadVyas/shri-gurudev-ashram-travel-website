import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle, XCircle, IndianRupee } from 'lucide-react'
import { useBooking } from '@/hooks/useBookings'
import { usePayment } from '@/hooks/usePayment'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import type { BookingRow } from '@/types/database.types'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-4 py-3 border-b border-[#E9DCC5]/60 last:border-0">
      <span className="w-36 flex-shrink-0 font-label-caps text-[11px] font-bold uppercase tracking-wider text-[#6F5B47]">{label}</span>
      <span className="text-sm font-bold text-[#3E2B1F]">{value}</span>
    </div>
  )
}

const statusConfig: Record<string, { label: string, description?: string, icon: any, className: string }> = {
  draft: { label: 'Unsubmitted Draft', description: 'Incomplete reservation form.', icon: AlertCircle, className: 'text-[#6F5B47] bg-[#6F5B47]/15 border-[#6F5B47]/30' },
  documents_pending: { label: 'Incomplete Form', description: 'Passenger document upload required.', icon: AlertCircle, className: 'text-[#C68A00] bg-[#C68A00]/15 border-[#C68A00]/30' },
  payment_pending: { label: 'Payment Pending (Unpaid)', description: 'Complete payment below to confirm your sacred Yatra seat.', icon: AlertCircle, className: 'text-[#C68A00] bg-[#C68A00]/15 border-[#C68A00]/30' },
  verification_pending: { label: 'Payment Received • Under Review', description: 'Your online payment is captured & confirmed! Devotee documents are currently under admin review.', icon: CheckCircle, className: 'text-[#2563EB] bg-[#2563EB]/15 border-[#2563EB]/30' },
  paid: { label: 'Payment Confirmed', description: 'Payment verified successfully.', icon: CheckCircle, className: 'text-[#2E7D32] bg-[#2E7D32]/15 border-[#2E7D32]/30' },
  verified: { label: 'Verified & Confirmed', description: 'Identity verified and pilgrimage seat confirmed!', icon: CheckCircle, className: 'text-[#2E7D32] bg-[#2E7D32]/15 border-[#2E7D32]/30' },
  ticket_generated: { label: 'Boarding Pass Issued', description: 'Your official Yatra pass is ready.', icon: CheckCircle, className: 'text-[#2E7D32] bg-[#2E7D32]/15 border-[#2E7D32]/30' },
  cancelled: { label: 'Cancelled', description: 'This booking has been cancelled.', icon: XCircle, className: 'text-[#C0392B] bg-[#C0392B]/15 border-[#C0392B]/30' },
  completed: { label: 'Yatra Completed', description: 'Pilgrimage journey completed.', icon: CheckCircle, className: 'text-[#B8860B] bg-[#B8860B]/15 border-[#B8860B]/30' },
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useBooking(id)
  const { initiatePayment } = usePayment()
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/bookings/${id}`)
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Failed to cancel booking')
    }
  })

  const booking: BookingRow & { booking_passengers?: any[] } = data?.booking as any
  usePageTitle(booking ? `Booking #${booking.booking_reference}` : 'Booking Detail')

  if (isLoading) return <LoadingState variant="detail" />
  if (error) return (
    <div className="text-center py-16 space-y-3 animate-in fade-in duration-300">
      <p className="text-[#6F5B47] text-sm font-medium">Failed to load booking details.</p>
      <Link to="/portal/bookings" className="text-[#B8860B] hover:text-[#D4AF37] text-sm font-bold underline transition-colors">
        Back to Bookings
      </Link>
    </div>
  )
  if (!booking) return (
    <div className="text-center py-16 text-[#6F5B47] text-sm animate-in fade-in duration-300 font-medium">
      <p>Booking not found.</p>
      <Link to="/portal/bookings" className="text-[#B8860B] hover:text-[#D4AF37] text-sm font-bold underline mt-2 inline-block">Back to Bookings</Link>
    </div>
  )

  const status = statusConfig[booking.status] ?? statusConfig.payment_pending
  const StatusIcon = status.icon

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center gap-3.5">
        <Link
          to="/portal/bookings"
          className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E9DCC5] text-[#6F5B47] hover:text-[#3E2B1F] hover:border-[#B8860B] transition-all shadow-2xs"
          aria-label="Back to bookings"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-[#3E2B1F] tracking-tight">
            Booking #{booking.booking_reference}
          </h1>
          <p className="text-sm text-[#6F5B47] font-normal mt-0.5">
            Reservation details & payment summary
          </p>
        </div>
      </div>

      {/* ── Status banner ────────────────────────────────── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl border shadow-[0_8px_30px_rgba(62,43,31,0.05)] ${status.className}`}>
        <div className="flex items-center gap-3.5">
          <StatusIcon className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-display text-base font-bold">{status.label}</p>
            {status.description && (
              <p className="text-xs opacity-80 mt-0.5 font-medium">{status.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {['draft', 'documents_pending', 'payment_pending'].includes(booking.status) && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
                  cancelMutation.mutate()
                }
              }}
              disabled={cancelMutation.isPending}
              className="px-5 py-3.5 rounded-full bg-[#FFFFFF]/50 text-[#C0392B] border border-[#C0392B]/20 font-bold text-xs uppercase tracking-wider hover:bg-[#C0392B]/10 hover:border-[#C0392B]/40 transition-all shadow-2xs"
            >
              Cancel Booking
            </button>
          )}
          {booking.status === 'payment_pending' && (
            <button
              type="button"
              onClick={() => initiatePayment(booking.id, booking.booking_reference)}
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] transition-all duration-250 shrink-0 cursor-pointer shadow-sm hover:-translate-y-0.5"
            >
              <IndianRupee className="h-4 w-4" />
              Pay ₹{(booking.payable_amount ?? booking.total_amount).toLocaleString('en-IN')}
            </button>
          )}
        </div>
      </div>

      {/* ── Traveler Information ─────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <h2 className="font-display text-lg font-bold text-[#3E2B1F] mb-4 pb-3 border-b border-[#E9DCC5]">
          Traveler Information
        </h2>
        <div className="divide-y divide-[#E9DCC5]/60">
          {booking.booking_passengers && booking.booking_passengers.length > 0 ? (
            booking.booking_passengers.map((p: any, idx: number) => (
              <div key={p.id} className="py-4 first:pt-0 last:pb-0">
                <p className="font-bold text-[#3E2B1F] mb-2 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#B8860B] text-white flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  Traveler {idx + 1} {p.is_primary ? '(Primary)' : ''}
                </p>
                <InfoRow label="Name" value={p.full_name} />
                <InfoRow label="Gender/Age" value={`${p.gender} • ${new Date().getFullYear() - new Date(p.dob).getFullYear()} yrs`} />
                <InfoRow label="Phone" value={p.phone} />
                <InfoRow label="Aadhaar" value={p.aadhaar_number} />
              </div>
            ))
          ) : (
            <div className="text-sm text-[#9A8A78]">Legacy booking format.</div>
          )}
        </div>
      </div>

      {/* ── Travel Preferences ──────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <h2 className="font-display text-lg font-bold text-[#3E2B1F] mb-4 pb-3 border-b border-[#E9DCC5]">
          Travel Preferences
        </h2>
        <InfoRow label="Transport" value={booking.transport_type} />
        {booking.bus_type && <InfoRow label="Train Class" value={booking.bus_type} />}
        <InfoRow label="Room Type" value={booking.room_type} />
        <InfoRow label="Travelers" value={`${booking.traveler_count} person${booking.traveler_count !== 1 ? 's' : ''}`} />
        {booking.additional_seva_type && (
          <InfoRow
            label="Attached Seva"
            value={`${booking.additional_seva_type.replace(/_/g, ' ').toUpperCase()}${booking.additional_seva_amount ? ` (+₹${booking.additional_seva_amount.toLocaleString('en-IN')})` : ''}`}
          />
        )}
        {booking.special_notes && <InfoRow label="Special Notes" value={booking.special_notes} />}
      </div>

      {/* ── Payment Summary ──────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <h2 className="font-display text-lg font-bold text-[#3E2B1F] mb-4 pb-3 border-b border-[#E9DCC5]">
          Payment Summary
        </h2>
        <div className="flex items-center justify-between py-3">
          <span className="font-label-caps text-xs font-bold uppercase tracking-wider text-[#6F5B47]">Total Amount</span>
          <span className="font-display text-3xl font-bold text-[#B8860B]">
            ₹{(booking.payable_amount ?? booking.total_amount).toLocaleString('en-IN')}
          </span>
        </div>
        <InfoRow label="Booked On" value={new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
      </div>
    </div>
  )
}
