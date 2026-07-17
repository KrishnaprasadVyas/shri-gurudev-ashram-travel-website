import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  ImageOff,
  ZoomIn,
  Download,
  BookOpen,
  Calendar,
  User,
  ShieldCheck,
  Mail,
  Phone,
  Clock,
} from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import { toast } from 'sonner'
import type { AdminUser } from '@/types/admin'
import type { BookingRow } from '@/types/database.types'

const statusBadge: Record<string, string> = {
  payment_pending: 'bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30 font-bold',
  paid: 'bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30 font-bold',
  cancelled: 'bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/30 font-bold',
  completed: 'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30 font-bold',
}

function VerificationImage({ userId, filePath, label }: { userId: string; filePath: string; label: string }) {
  const [imgError, setImgError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'signed-url', userId, filePath],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/admin/users/${userId}/verification-file-url`, {
        params: { path: filePath },
      })
      return data as { url: string; expiresAt: number }
    },
    staleTime: 4 * 60 * 1000,
  })

  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-xs font-bold uppercase tracking-[0.15em] text-[#6F5B47]">
            {label}
          </span>
          {data?.url && !imgError && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsZoomed(true)}
                className="px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
              >
                <ZoomIn className="h-3 w-3" />
                <span>Zoom</span>
              </button>
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Download className="h-3 w-3" />
                <span>Download</span>
              </a>
            </div>
          )}
        </div>

        <div className="h-48 rounded-[16px] overflow-hidden bg-[#FFFFFF] border border-[#E9DCC5] p-2 flex items-center justify-center relative group shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-[#B8860B]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-mono">Decrypting signed file...</span>
            </div>
          ) : data?.url && !imgError ? (
            <img
              src={data.url}
              alt={label}
              className="w-full h-full object-contain rounded-[12px] cursor-pointer transition-transform duration-200 group-hover:scale-102"
              onClick={() => setIsZoomed(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#9A8A78]">
              <ImageOff className="h-6 w-6" />
              <span className="text-xs">Unable to load image record</span>
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
              className="absolute -top-12 right-0 px-4 py-1.5 rounded-full bg-[#FFFFFF] text-[#3E2B1F] font-bold text-xs uppercase tracking-wider hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-colors"
              onClick={() => setIsZoomed(false)}
            >
              Close Zoom ✕
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

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ user: AdminUser; bookings: BookingRow[] }>({
    queryKey: QUERY_KEYS.adminUser(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/admin/users/${id}`)
      return data
    },
    enabled: Boolean(id),
  })

  usePageTitle(data?.user?.full_name ?? 'User Detail')

  const verifyMutation = useMutation({
    mutationFn: async (status: 'verified' | 'rejected') => {
      await apiClient.put(`/api/admin/users/${id}/verification`, { status })
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUser(id ?? '') })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers(1, '', 'submitted') })
      toast.success(status === 'verified' ? 'Verification approved! ✓' : 'Verification rejected')
    },
    onError: () => toast.error('Action failed'),
  })

  if (isLoading) return <LoadingState variant="detail" />
  if (!data) return null

  const { user, bookings } = data

  return (
    <div className="space-y-8 text-[#3E2B1F]">
      {/* Top Navigation & Profile Header */}
      <div className="p-8 sm:p-10 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(140,106,10,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] flex items-center justify-center transition-all duration-200 shadow-sm shrink-0 hover:scale-105"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.full_name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-[#B8860B]/20 border border-[#E9DCC5] shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-white flex items-center justify-center font-display font-bold text-2xl shadow-md shrink-0 ring-4 ring-[#B8860B]/20">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] tracking-tight">
                {user.full_name}
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  user.verification_status === 'verified'
                    ? 'bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30'
                    : user.verification_status === 'submitted'
                    ? 'bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30'
                    : 'bg-[#9A8A78]/15 text-[#6F5B47] border border-[#9A8A78]/30'
                }`}
              >
                {user.verification_status.replace('_', ' ')}
              </span>
            </div>
            <p className="font-mono text-xs text-[#6F5B47]">
              Seeker ID: #{user.id} • Joined on {new Date(user.created_at).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile details & Bookings */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 sm:p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-5">
            <h2 className="font-display text-xl font-bold text-[#3E2B1F] flex items-center gap-2 pb-3 border-b border-[#E9DCC5]">
              <User className="h-5 w-5 text-[#B8860B]" />
              <span>Devotee Information</span>
            </h2>

            <div className="divide-y divide-[#F1E9D8] text-sm">
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-[#9A8A78] font-semibold">
                  <Mail className="h-4 w-4 text-[#B8860B]" />
                  <span>Email Address</span>
                </span>
                <span className="font-mono font-bold text-[#3E2B1F]">{user.email ?? 'Not provided'}</span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-[#9A8A78] font-semibold">
                  <Phone className="h-4 w-4 text-[#B8860B]" />
                  <span>Phone Number</span>
                </span>
                <span className="font-mono font-bold text-[#3E2B1F]">{user.phone || '—'}</span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-[#9A8A78] font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[#B8860B]" />
                  <span>Assigned Role</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-[#B8860B]/12 text-[#B8860B] font-bold text-xs uppercase tracking-wider">
                  {user.role}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-[#9A8A78] font-semibold">
                  <Calendar className="h-4 w-4 text-[#B8860B]" />
                  <span>Registration Date</span>
                </span>
                <span className="text-[#3E2B1F] font-medium">
                  {new Date(user.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Bookings Card */}
          <div className="p-6 sm:p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9DCC5]">
              <h2 className="font-display text-xl font-bold text-[#3E2B1F] flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#B8860B]" />
                <span>Pilgrimage Bookings ({bookings.length})</span>
              </h2>
            </div>

            {bookings.length === 0 ? (
              <div className="p-8 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] text-center space-y-2">
                <span className="text-2xl">📖</span>
                <p className="font-display text-base font-bold text-[#3E2B1F]">No yatras reserved yet.</p>
                <p className="text-xs text-[#6F5B47]">This devotee has not registered for any upcoming pilgrimage packages.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 admin-sidebar-scroll">
                {bookings.map((b) => (
                  <Link
                    key={b.id}
                    to={`/admin/bookings/${b.id}`}
                    className="block p-4 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] transition-all duration-200 group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-[#B8860B]">#{b.booking_reference}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusBadge[b.status] ?? ''}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E9DCC5]">
                      <span className="text-xs text-[#6F5B47]">
                        Reserved on {new Date(b.created_at).toLocaleDateString('en-IN')}
                      </span>
                      <span className="font-display font-bold text-base text-[#3E2B1F]">
                        ₹{b.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Verification Documents & Review Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 sm:p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-6">
            <h2 className="font-display text-xl font-bold text-[#3E2B1F] flex items-center justify-between pb-3 border-b border-[#E9DCC5]">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#B8860B]" />
                <span>Identity Verification Documents</span>
              </span>
              {user.aadhaar_number && (
                <span className="font-mono text-xs font-normal text-[#6F5B47]">
                  Aadhaar No: <strong className="text-[#3E2B1F]">{user.aadhaar_number}</strong>
                </span>
              )}
            </h2>

            {user.aadhaar_image_path && id ? (
              <VerificationImage userId={id} filePath={user.aadhaar_image_path} label="Aadhaar Card Record" />
            ) : (
              <div className="h-40 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] p-4 flex flex-col items-center justify-center text-center text-[#9A8A78]">
                <FileText className="h-7 w-7 text-[#E9DCC5] mb-2" />
                <span className="text-xs font-semibold text-[#6F5B47]">No Aadhaar card uploaded by devotee</span>
              </div>
            )}

            {user.selfie_image_path && id ? (
              <VerificationImage userId={id} filePath={user.selfie_image_path} label="Devotee Selfie / Photo Record" />
            ) : (
              <div className="h-40 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] p-4 flex flex-col items-center justify-center text-center text-[#9A8A78]">
                <FileText className="h-7 w-7 text-[#E9DCC5] mb-2" />
                <span className="text-xs font-semibold text-[#6F5B47]">No selfie photo uploaded by devotee</span>
              </div>
            )}

            {user.verification_status === 'submitted' && (
              <div className="pt-4 border-t border-[#E9DCC5] space-y-3">
                <p className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
                  Administrative Decision
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => verifyMutation.mutate('verified')}
                    disabled={verifyMutation.isPending}
                    className="w-full py-3.5 px-6 rounded-full bg-[#B8860B] hover:bg-[#6F5200] text-[#FFFFFF] font-bold text-sm flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(140,106,10,0.25)] transition-all duration-200 disabled:opacity-60 cursor-pointer hover:-translate-y-0.5"
                  >
                    {verifyMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                    <span>Approve Verification</span>
                  </button>

                  <button
                    onClick={() => verifyMutation.mutate('rejected')}
                    disabled={verifyMutation.isPending}
                    className="w-full py-3.5 px-6 rounded-full bg-[#FFFFFF] border-2 border-[#C0392B] text-[#C0392B] hover:bg-[#C0392B] hover:text-[#FFFFFF] font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all duration-200 disabled:opacity-60 cursor-pointer hover:-translate-y-0.5"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Reject Submission</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
