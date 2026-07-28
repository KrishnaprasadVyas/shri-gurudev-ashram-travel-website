import { Link } from 'react-router-dom'
import { IndianRupee, Calendar, Users, ArrowRight } from 'lucide-react'
import type { BookingRow } from '@/types/database.types'

type BookingWithTitle = BookingRow & { packageTitle?: string }

const statusConfig: Record<string, { label: string, className: string }> = {
  draft: { label: 'Draft', className: 'bg-[#6F5B47]/15 text-[#6F5B47] border-[#6F5B47]/30 font-bold' },
  documents_pending: { label: 'Action Required', className: 'bg-[#C68A00]/15 text-[#C68A00] border-[#C68A00]/30 font-bold' },
  payment_pending: { label: 'Payment Pending', className: 'bg-[#C68A00]/15 text-[#C68A00] border-[#C68A00]/30 font-bold' },
  paid: { label: 'Confirmed', className: 'bg-[#2E7D32]/15 text-[#2E7D32] border-[#2E7D32]/30 font-bold' },
  verification_pending: { label: 'Under Review', className: 'bg-[#C68A00]/15 text-[#C68A00] border-[#C68A00]/30 font-bold' },
  verified: { label: 'Verified', className: 'bg-[#2E7D32]/15 text-[#2E7D32] border-[#2E7D32]/30 font-bold' },
  cancelled: { label: 'Cancelled', className: 'bg-[#C0392B]/15 text-[#C0392B] border-[#C0392B]/30 font-bold' },
  completed: { label: 'Completed', className: 'bg-[#B8860B]/15 text-[#B8860B] border-[#B8860B]/30 font-bold' },
}

export function BookingCard({ booking }: { booking: BookingWithTitle }) {
  const status = statusConfig[booking.status] ?? statusConfig.payment_pending

  return (
    <div className="group p-6 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B]/40 transition-all duration-300 shadow-[0_8px_30px_rgba(62,43,31,0.04)] hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="font-display text-base font-bold text-[#3E2B1F] truncate group-hover:text-[#B8860B] transition-colors">
              {booking.packageTitle ?? 'Sacred Pilgrimage Package'}
            </p>
            <span className={`font-label-caps text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="text-[11px] text-[#6F5B47] font-mono font-bold">
            Ref: #{booking.booking_reference}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-[13px] text-[#6F5B47]">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="h-4 w-4 text-[#B8860B]" />
            {booking.traveler_count} traveler{booking.traveler_count !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1 font-bold text-[#3E2B1F]">
            <IndianRupee className="h-4 w-4 text-[#B8860B]" />
            ₹{booking.total_amount.toLocaleString('en-IN')}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-4 w-4 text-[#B8860B]" />
            {new Date(booking.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        <Link
          to={`/portal/bookings/${booking.id}`}
          className="inline-flex justify-center items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B8860B] hover:text-[#D4AF37] transition-colors shrink-0 px-4 py-2 min-h-[44px] rounded-full bg-[#F5EFE4] hover:bg-[#FFF7E8] border border-[#E9DCC5] shadow-2xs w-full sm:w-auto mt-2 sm:mt-0"
        >
          View Details <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  )
}
