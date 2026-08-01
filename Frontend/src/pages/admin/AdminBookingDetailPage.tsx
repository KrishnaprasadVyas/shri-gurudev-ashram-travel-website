import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  User,
  BookOpen,
  MapPin,
  CreditCard,
  ShieldCheck,
  FileText,
  ZoomIn,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import { toast } from 'sonner'
import type { BookingRow, UserRow, TravelPackageRow, PaymentRow } from '@/types/database.types'
import { useTranslation } from "react-i18next";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    const { t } = useTranslation();
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

function PassengerDocPreview({ passengerId, filePath, label }: { passengerId: string; filePath: string; label: string }) {
    const { t } = useTranslation();
  const [imgError, setImgError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'passenger-doc-url', passengerId, filePath],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/admin/passengers/${passengerId}/document-url`, {
        params: { path: filePath },
      })
      return data as { url: string; expiresAt: number }
    },
    staleTime: 4 * 60 * 1000,
  })

  return (
    <>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#6F5B47] uppercase tracking-wider text-[10px]">{label}</span>
          {data?.url && !imgError && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsZoomed(true)}
                className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] text-[10px] font-bold flex items-center gap-1 transition-colors"
              >
                <ZoomIn className="h-3 w-3" />
                <span>{"Zoom"}</span>
              </button>
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer noopener"
                className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] text-[10px] font-bold flex items-center gap-1 transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>{"Open"}</span>
              </a>
            </div>
          )}
        </div>

        <div className="h-40 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] p-2 flex items-center justify-center relative overflow-hidden group shadow-2xs">
          {isLoading ? (
            <div className="flex flex-col items-center gap-1 text-[#B8860B] text-xs">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-mono text-[10px]">{"Loading document..."}</span>
            </div>
          ) : data?.url && !imgError ? (
            <img
              src={data.url}
              alt={label}
              className="w-full h-full object-contain rounded-[10px] cursor-pointer transition-transform duration-200 group-hover:scale-102"
              onClick={() => setIsZoomed(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-[#9A8A78] text-xs">
              <FileText className="h-6 w-6 text-[#E9DCC5]" />
              <span className="text-[11px] font-medium">{"No document preview"}</span>
            </div>
          )}
        </div>
      </div>

      {isZoomed && data?.url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              type="button"
              className="absolute -top-12 right-0 px-4 py-1.5 rounded-full bg-[#FFFFFF] text-[#3E2B1F] font-bold text-xs uppercase tracking-wider hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-colors"
              onClick={() => setIsZoomed(false)}
            >
              
                                        {"Close Zoom ✕"}
                                      </button>
            <img
              src={data.url}
              alt={label}
              className="max-h-[85vh] w-auto object-contain rounded-[20px] shadow-2xl border-4 border-[#FFFFFF]"
            />
          </div>
        </div>
      )}
    </>
  )
}

export function AdminBookingDetailPage() {
    const { t } = useTranslation();
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{
    booking: BookingRow
    user: UserRow
    package: TravelPackageRow
    passengers: any[]
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

  const verifyPassengerMutation = useMutation({
    mutationFn: async ({ passengerId, status, notes }: { passengerId: string; status: 'verified' | 'rejected'; notes?: string }) => {
      await apiClient.put(`/api/admin/passengers/${passengerId}/verification`, { status, notes })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminBooking(id ?? '') })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats })
      toast.success(variables.status === 'verified' ? 'Passenger verification approved! ✓' : 'Passenger verification rejected.')
    },
    onError: () => toast.error('Failed to update passenger verification.'),
  })

  if (isLoading) return <LoadingState variant="detail" />
  if (!data) return null

  const { booking, user, package: pkg, passengers, payments } = data

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
                
                                              {"Booking #"}{booking.booking_reference}
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
              
                                        {"Database Record ID: #"}{booking.id}  {"• Created on"} {new Date(booking.created_at).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end sm:self-auto relative z-10">
          {payments.some(p => p.status === 'captured') || ['verification_pending', 'verified', 'ticket_generated', 'completed', 'paid'].includes(booking.status) ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
              
                                        {"PAYMENT VERIFIED (PAID)"}
                                      </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C68A00]"></span>
              
                                            {"UNPAID (PENDING PAYMENT)"}
                                          </span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6F5B47] font-semibold">{"Total:"}</span>
            <span className="font-display text-2xl font-bold text-[#B8860B]">
              ₹{(booking.payable_amount ?? booking.total_amount).toLocaleString('en-IN')}
            </span>
          </div>
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
              {passengers?.length > 0 ? (
                passengers.map((p, idx) => (
                  <div key={p.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#3E2B1F] text-sm">
                        
                                                        {"Traveler"} {idx + 1} {p.is_primary ? '(Primary Lead)' : ''}
                      </p>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.verification_status === 'verified'
                          ? 'bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30'
                          : p.verification_status === 'rejected'
                          ? 'bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/30'
                          : 'bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30'
                      }`}>
                        {p.verification_status || 'Pending'}
                      </span>
                    </div>

                    <InfoRow label={"Name"} value={p.full_name} />
                    <InfoRow label={"Gender/Age"} value={`${p.gender} • ${new Date().getFullYear() - new Date(p.dob).getFullYear()} yrs`} />
                    <InfoRow label={"Phone"} value={p.phone} />
                    <InfoRow label={"Aadhaar"} value={p.aadhaar_number} />
                    <InfoRow label={"Address"} value={p.address} />

                    {/* Passenger Identity Documents Viewer */}
                    {Array.isArray(p.passenger_documents) && p.passenger_documents.length > 0 ? (
                      <div className="pt-2">
                        <p className="text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">{"Submitted Identity Documents:"}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {p.passenger_documents.map((doc: any) => (
                            <PassengerDocPreview
                              key={doc.id}
                              passengerId={p.id}
                              filePath={doc.file_path}
                              label={doc.document_type ? doc.document_type.replace('_', ' ') : 'Identity Card'}
                            />
                          ))}
                        </div>
                      </div>
                    ) : p.aadhaar_image_path ? (
                      <div className="pt-2">
                        <PassengerDocPreview
                          passengerId={p.id}
                          filePath={p.aadhaar_image_path}
                          label={"Aadhaar Card Record"}
                        />
                      </div>
                    ) : null}

                    {/* Passenger Verification Action Buttons */}
                    {p.verification_status !== 'verified' && (
                      <div className="pt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => verifyPassengerMutation.mutate({ passengerId: p.id, status: 'verified' })}
                          disabled={verifyPassengerMutation.isPending}
                          className="px-3.5 py-1.5 rounded-full bg-[#2E7D32] hover:bg-[#1b4d1f] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Approve Passenger ID</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const notes = window.prompt('Enter reason for rejecting passenger document:')
                            if (notes && notes.trim()) {
                              verifyPassengerMutation.mutate({ passengerId: p.id, status: 'rejected', notes })
                            }
                          }}
                          disabled={verifyPassengerMutation.isPending}
                          className="px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#C0392B] text-[#C0392B] hover:bg-[#C0392B] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{"Reject ID"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-4 text-sm text-[#9A8A78]">{"Legacy booking format (details on user profile)."}</div>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-4">
            <h2 className="font-display text-xl font-bold text-[#3E2B1F] flex items-center gap-2 pb-3 border-b border-[#E9DCC5]">
              <MapPin className="h-5 w-5 text-[#B8860B]" />
              <span>Logistics & Accommodation Preferences</span>
            </h2>
            <div className="divide-y divide-[#F1E9D8]">
              <InfoRow label={"Transport Preference"} value={booking.transport_type} />
              <InfoRow label={"Train / Bus Class"} value={booking.bus_type} />
              <InfoRow label={"Room & Lodging Type"} value={booking.room_type} />
              <InfoRow label={"Emergency Contact"} value={booking.emergency_contact_name ? `${booking.emergency_contact_name} (${booking.emergency_contact_relationship}) - ${booking.emergency_contact_phone}` : null} />
              <InfoRow label={"Special Requests / Notes"} value={booking.special_notes} />
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
              <InfoRow label={"Sacred Destination"} value={pkg?.title || 'Custom Pilgrimage Package'} />
              <InfoRow label={"Duration"} value={pkg?.duration || 'Standard Schedule'} />
              <InfoRow
                label={"Per Seeker Price"}
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
                  
                                                    {"Verified User"}
                                                  </span>
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#9A8A78] font-semibold">{"Registered Name:"}</span>
                  <span className="font-bold text-[#3E2B1F]">{user.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9A8A78] font-semibold">{"Account Email:"}</span>
                  <span className="font-mono text-[#3E2B1F] truncate max-w-[200px]">{user.email ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9A8A78] font-semibold">{"Identity Status:"}</span>
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
                ₹{(booking.payable_amount ?? booking.total_amount).toLocaleString('en-IN')}
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="p-6 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] text-center space-y-1.5">
                <FileText className="h-6 w-6 text-[#E9DCC5] mx-auto" />
                <p className="font-display font-bold text-sm text-[#3E2B1F]">{"No payment receipts logged."}</p>
                <p className="text-xs text-[#6F5B47]">{"Transaction history will update when online or offline payments settle."}</p>
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
                        <span>{"Razorpay ID:"}</span>
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
