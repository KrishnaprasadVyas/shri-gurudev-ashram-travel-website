import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle, XCircle, IndianRupee, MapPin, Clock, Plane, BedDouble } from 'lucide-react'
import { useBooking } from '@/hooks/useBookings'
import { usePayment } from '@/hooks/usePayment'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import type { BookingRow } from '@/types/database.types'
import { useTranslation } from "react-i18next";

type TravelPackageInfo = {
  title?: string | null
  image_url?: string | null
  start_date?: string | null
  duration?: string | null
  price?: number | null
}

type EnrichedBooking = BookingRow & {
  booking_passengers?: any[]
  travel_packages?: TravelPackageInfo | null
  base_amount?: number
  transport_amount?: number
  room_amount?: number
  additional_seva_amount?: number
  gateway_fee?: number
}

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
    const { t } = useTranslation();
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

  const booking: EnrichedBooking = data?.booking as any
  usePageTitle(booking ? `${t('portal.bookingDetail.bookingHash')}${booking.booking_reference}` : t('portal.bookingDetail.title'))

  if (isLoading) return <LoadingState variant="detail" />
  if (error) return (
    <div className="text-center py-16 space-y-3 animate-in fade-in duration-300">
      <p className="text-[#6F5B47] text-sm font-medium">{t('portal.bookingDetail.failedLoad')}</p>
      <Link to="/portal/bookings" className="text-[#B8860B] hover:text-[#D4AF37] text-sm font-bold underline transition-colors">
        {t('portal.bookingDetail.backToBookings')}
      </Link>
    </div>
  )
  if (!booking) return (
    <div className="text-center py-16 text-[#6F5B47] text-sm animate-in fade-in duration-300 font-medium">
      <p>{t('portal.bookingDetail.notFound')}</p>
      <Link to="/portal/bookings" className="text-[#B8860B] hover:text-[#D4AF37] text-sm font-bold underline mt-2 inline-block">{t('portal.bookingDetail.backToBookings')}</Link>
    </div>
  )

  const status = statusConfig[booking.status] ?? statusConfig.payment_pending
  const StatusIcon = status.icon

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
      {/* ── Package Info ────────────────────────────────── */}
      {booking.travel_packages && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FFF7E8] to-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)] flex flex-col sm:flex-row gap-5 items-start">
          {booking.travel_packages.image_url && (
            <img
              src={booking.travel_packages.image_url}
              alt={booking.travel_packages.title ?? 'Yatra Package'}
              className="w-full sm:w-32 h-24 object-cover rounded-2xl border border-[#E9DCC5] flex-shrink-0"
            />
          )}
          <div className="flex-1 space-y-2">
            <p className="font-label-caps text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8860B]">{t('portal.bookingDetail.yatraPackage')}</p>
            <h2 className="font-display text-xl font-bold text-[#3E2B1F]">{booking.travel_packages.title}</h2>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-1">
              {booking.travel_packages.start_date && (
                <span className="flex items-center gap-1.5 text-xs text-[#6F5B47] font-medium">
                  <MapPin className="h-3.5 w-3.5 text-[#B8860B]" />
                  {t('portal.bookingDetail.departure')} {new Date(booking.travel_packages.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              {booking.travel_packages.duration && (
                <span className="flex items-center gap-1.5 text-xs text-[#6F5B47] font-medium">
                  <Clock className="h-3.5 w-3.5 text-[#B8860B]" />
                  {booking.travel_packages.duration}
                </span>
              )}
              {booking.transport_type && (
                <span className="flex items-center gap-1.5 text-xs text-[#6F5B47] font-medium">
                  <Plane className="h-3.5 w-3.5 text-[#B8860B]" />
                  {booking.transport_type}{booking.bus_type ? ` (${booking.bus_type})` : ''}
                </span>
              )}
              {booking.room_type && (
                <span className="flex items-center gap-1.5 text-xs text-[#6F5B47] font-medium">
                  <BedDouble className="h-3.5 w-3.5 text-[#B8860B]" />
                  {booking.room_type}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

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
            {t('portal.bookingDetail.bookingHash')}{booking.booking_reference}
          </h1>
          <p className="text-sm text-[#6F5B47] font-normal mt-0.5">
            {t('portal.bookingDetail.summary')}
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
              {t('portal.bookingDetail.cancelBooking')}
            </button>
          )}
          {booking.status === 'payment_pending' && (
            <button
              type="button"
              onClick={() => initiatePayment(booking.id, booking.booking_reference)}
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] transition-all duration-250 shrink-0 cursor-pointer shadow-sm hover:-translate-y-0.5"
            >
              <IndianRupee className="h-4 w-4" />
              {t('portal.bookingDetail.pay')}{(booking.payable_amount ?? booking.total_amount).toLocaleString('en-IN')}
            </button>
          )}
        </div>
      </div>

      {/* ── Traveler Information ─────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <h2 className="font-display text-lg font-bold text-[#3E2B1F] mb-4 pb-3 border-b border-[#E9DCC5]">
            {t('portal.bookingDetail.travelerInfo')}
                          </h2>
        <div className="divide-y divide-[#E9DCC5]/60">
          {booking.booking_passengers && booking.booking_passengers.length > 0 ? (
            booking.booking_passengers.map((p: any, idx: number) => (
              <div key={p.id} className="py-4 first:pt-0 last:pb-0">
                <p className="font-bold text-[#3E2B1F] mb-2 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#B8860B] text-white flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  {t('portal.bookingDetail.traveler')} {idx + 1} {p.is_primary ? `(${t('portal.bookingDetail.primary')})` : ''}
                </p>
                <InfoRow label={t('portal.bookingDetail.name')} value={p.full_name} />
                <InfoRow label={t('portal.bookingDetail.genderAge')} value={`${p.gender} • ${new Date().getFullYear() - new Date(p.dob).getFullYear()} yrs`} />
                <InfoRow label={t('portal.bookingDetail.phone')} value={p.phone} />
                <InfoRow label={t('portal.bookingDetail.aadhaar')} value={p.aadhaar_number} />
              </div>
            ))
          ) : (
            <div className="text-sm text-[#9A8A78]">{t('portal.bookingDetail.legacyFormat')}</div>
          )}
        </div>
      </div>

      {/* ── Travel Preferences ──────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <h2 className="font-display text-lg font-bold text-[#3E2B1F] mb-4 pb-3 border-b border-[#E9DCC5]">
            {t('portal.bookingDetail.travelPrefs')}
                          </h2>
        <InfoRow label={t('portal.bookingDetail.transport')} value={booking.transport_type} />
        {booking.bus_type && <InfoRow label={t('portal.bookingDetail.trainClass')} value={booking.bus_type} />}
        <InfoRow label={t('portal.bookingDetail.roomType')} value={booking.room_type} />
        <InfoRow label={t('portal.bookingDetail.travelers')} value={`${booking.traveler_count} ${booking.traveler_count !== 1 ? t('portal.bookingDetail.persons') : t('portal.bookingDetail.person')}`} />
        {booking.additional_seva_type && (
          <InfoRow
            label={t('portal.bookingDetail.attachedSeva')}
            value={`${booking.additional_seva_type.replace(/_/g, ' ').toUpperCase()}${booking.additional_seva_amount ? ` (+₹${booking.additional_seva_amount.toLocaleString('en-IN')})` : ''}`}
          />
        )}
        {booking.special_notes && <InfoRow label={t('portal.bookingDetail.specialNotes')} value={booking.special_notes} />}
      </div>

      {/* ── Payment Summary ──────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <h2 className="font-display text-lg font-bold text-[#3E2B1F] mb-4 pb-3 border-b border-[#E9DCC5]">
            {t('portal.bookingDetail.paymentSummary')}
                          </h2>
        <div className="space-y-1">
          {booking.base_amount != null && (
            <InfoRow label={t('portal.bookingDetail.baseFare')} value={`₹${Number(booking.base_amount).toLocaleString('en-IN')} × ${booking.traveler_count}`} />
          )}
          {booking.transport_amount != null && Number(booking.transport_amount) > 0 && (
            <InfoRow label={t('portal.bookingDetail.transport')} value={`+₹${Number(booking.transport_amount).toLocaleString('en-IN')}`} />
          )}
          {booking.room_amount != null && Number(booking.room_amount) > 0 && (
            <InfoRow label={t('portal.bookingDetail.roomUpgrade')} value={`+₹${Number(booking.room_amount).toLocaleString('en-IN')}`} />
          )}
          {booking.additional_seva_amount != null && Number(booking.additional_seva_amount) > 0 && (
            <InfoRow label={t('portal.bookingDetail.attachedSeva')} value={`+₹${Number(booking.additional_seva_amount).toLocaleString('en-IN')}`} />
          )}
          {booking.gateway_fee != null && Number(booking.gateway_fee) > 0 && (
            <InfoRow label={t('portal.bookingDetail.gatewayFee')} value={`+₹${Number(booking.gateway_fee).toLocaleString('en-IN')}`} />
          )}
        </div>
        <div className="flex items-center justify-between py-4 mt-2 border-t border-[#E9DCC5]">
          <span className="font-label-caps text-xs font-bold uppercase tracking-wider text-[#6F5B47]">{t('portal.bookingDetail.totalAmount')}</span>
          <span className="font-display text-3xl font-bold text-[#B8860B]">
            ₹{(booking.payable_amount ?? booking.total_amount).toLocaleString('en-IN')}
          </span>
        </div>
        <InfoRow label={t('portal.bookingDetail.bookedOn')} value={new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
      </div>
    </div>
  )
}
