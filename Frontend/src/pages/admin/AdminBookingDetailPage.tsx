import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  User,
  BookOpen,
  MapPin,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle,
  FileText,
} from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import type { BookingRow, UserRow, TravelPackageRow, PaymentRow } from '@/types/database.types'

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex gap-4 py-3 border-b border-[#F1E9D8] last:border-0 text-sm">
      <span className="w-40 flex-shrink-0 font-semibold text-[#9A8A78]">{label}</span>
      <span className="text-[#3E2B1F] font-mono font-bold break-all">{String(value)}</span>
    </div>
  )
}

const statusBadge: Record<string, string> = {
  payment_pending: 'bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30 font-bold',
  paid: 'bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30 font-bold',
  cancelled: 'bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/30 font-bold',
  completed: 'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30 font-bold',
}

export function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery<{
    booking: BookingRow
    user: UserRow
    package: TravelPackageRow
    payments: PaymentRow[]
  }>({
    queryKey: QUERY_KEYS.adminBooking(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/admin/bookings/${id}`)
      return data
    },
    enabled: Boolean(id),
  })

  usePageTitle(data?.booking?.booking_reference ? `Booking #${data.booking.booking_reference}` : 'Booking Detail')

  if (isLoading) return <LoadingState variant="detail" />
  if (!data) return null

  const { booking, user, package: pkg, payments } = data

  return (
    <div className="space-y-8 text-[#3E2B1F]">
      {/* Top Header Card */}
      <div className="p-8 sm:p-10 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(140,106,10,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] flex items-center justify-center transition-all duration-200 shadow-sm shrink-0 hover:scale-105"
            title="Go Back to Bookings Directory"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-white flex items-center justify-center font-display font-bold text-2xl shadow-md shrink-0 ring-4 ring-[#B8860B]/20">
            📖
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] tracking-tight">
                Booking #{booking.booking_reference}
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  statusBadge[booking.status] ?? ''
                }`}
              >
                {booking.status.replace('_', ' ')}
              </span>
            </div>
            <p className="font-mono text-xs text-[#6F5B47]">
              Database Record ID: #{booking.id} • Created on {new Date(booking.created_at).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto relative z-10">
          <span className="text-xs text-[#6F5B47] font-semibold">Total Amount:</span>
          <span className="font-display text-2xl font-bold text-[#B8860B]">
            ₹{booking.total_amount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Traveler & Preferences */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-4">
            <h2 className="font-display text-xl font-bold text-[#3E2B1F] flex items-center gap-2 pb-3 border-b border-[#E9DCC5]">
              <User className="h-5 w-5 text-[#B8860B]" />
              <span>Devotee & Traveler Details</span>
            </h2>
            <div className="divide-y divide-[#F1E9D8]">
              <InfoRow label="Primary Seeker Name" value={booking.full_name} />
              <InfoRow label="Phone Contact" value={booking.phone_number} />
              <InfoRow label="WhatsApp Number" value={booking.whatsapp_number} />
              <InfoRow label="Date of Birth" value={booking.dob} />
              <InfoRow label="Residential Address" value={booking.address} />
              <InfoRow label="Reserved Travelers" value={`${booking.traveler_count} Seeker(s)`} />
              <InfoRow label="Special Requests / Notes" value={booking.special_notes} />
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-4">
            <h2 className="font-display text-xl font-bold text-[#3E2B1F] flex items-center gap-2 pb-3 border-b border-[#E9DCC5]">
              <MapPin className="h-5 w-5 text-[#B8860B]" />
              <span>Logistics & Accommodation Preferences</span>
            </h2>
            <div className="divide-y divide-[#F1E9D8]">
              <InfoRow label="Transport Preference" value={booking.transport_type} />
              <InfoRow label="Train / Bus Class" value={booking.bus_type} />
              <InfoRow label="Room & Lodging Type" value={booking.room_type} />
            </div>
          </div>
        </div>

        {/* Right Column: Package Info, User Profile & Payments */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-4">
            <h2 className="font-display text-xl font-bold text-[#3E2B1F] flex items-center gap-2 pb-3 border-b border-[#E9DCC5]">
              <BookOpen className="h-5 w-5 text-[#B8860B]" />
              <span>Pilgrimage Package</span>
            </h2>
            <div className="divide-y divide-[#F1E9D8]">
              <InfoRow label="Sacred Destination" value={pkg?.title || 'Custom Pilgrimage Package'} />
              <InfoRow label="Duration" value={pkg?.duration || 'Standard Schedule'} />
              <InfoRow
                label="Per Seeker Price"
                value={pkg?.price ? `₹${pkg.price.toLocaleString('en-IN')}` : 'Included'}
              />
            </div>
          </div>

          {user && (
            <div className="p-6 sm:p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-4">
              <h2 className="font-display text-xl font-bold text-[#3E2B1F] flex items-center justify-between pb-3 border-b border-[#E9DCC5]">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#B8860B]" />
                  <span>Linked Seeker Account</span>
                </span>
                <span className="text-[11px] font-bold text-[#B8860B] bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#E9DCC5] uppercase tracking-wider">
                  Verified User
                </span>
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#9A8A78] font-semibold">Registered Name:</span>
                  <span className="font-bold text-[#3E2B1F]">{user.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9A8A78] font-semibold">Account Email:</span>
                  <span className="font-mono text-[#3E2B1F] truncate max-w-[200px]">{user.email ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9A8A78] font-semibold">Identity Status:</span>
                  <span className="capitalize font-bold text-[#2E7D32]">
                    {user.verification_status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9DCC5]">
              <h2 className="font-display text-xl font-bold text-[#3E2B1F] flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#B8860B]" />
                <span>Financial Ledger</span>
              </h2>
              <span className="font-mono text-xs font-bold text-[#B8860B]">
                ₹{booking.total_amount.toLocaleString('en-IN')}
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="p-6 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] text-center space-y-1.5">
                <FileText className="h-6 w-6 text-[#E9DCC5] mx-auto" />
                <p className="font-display font-bold text-sm text-[#3E2B1F]">No payment receipts logged.</p>
                <p className="text-xs text-[#6F5B47]">Transaction history will update when online or offline payments settle.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] text-sm space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-base text-[#3E2B1F]">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#2E7D32]/15 text-[#2E7D32] text-xs font-bold capitalize">
                        {p.status}
                      </span>
                    </div>
                    {p.razorpay_payment_id && (
                      <div className="flex items-center justify-between text-xs text-[#6F5B47] font-mono pt-1 border-t border-[#E9DCC5]">
                        <span>Razorpay ID:</span>
                        <span className="font-bold text-[#3E2B1F] truncate max-w-[160px]">{p.razorpay_payment_id}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
