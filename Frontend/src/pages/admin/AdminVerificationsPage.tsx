import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldCheck, CheckCircle, XCircle, Loader2, FileText, Eye, ZoomIn, Download, Clock, UserCheck, AlertCircle, ArrowRight, X
} from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'
import type { AdminStats } from '@/types/admin'

type VerificationDocs = {
  document_type: string
  file_path: string
}

type PassengerVerification = {
  id: string
  booking_id: string
  full_name: string
  gender: string
  phone: string
  aadhaar_number: string
  verification_status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
  bookings: {
    booking_reference: string
    status: string
    user_id: string
    users: { full_name: string; email: string; phone: string }
  }
  passenger_documents: VerificationDocs[]
}

function SignedUrlImagePreview({
  passengerId,
  filePath,
  label,
}: {
  passengerId: string
  filePath: string
  label: string
}) {
  const [imgError, setImgError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'signed-url-passenger', passengerId, filePath],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/admin/passengers/${passengerId}/document-url`, {
        params: { path: filePath },
      })
      return data as { url: string; expiresAt: number }
    },
    staleTime: 4 * 60 * 1000,
  })

  const fullUrl = data?.url ? `${apiClient.defaults.baseURL?.replace(/\/$/, '')}${data.url}` : ''

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-xs font-bold uppercase tracking-[0.15em] text-[#6F5B47]">
            {label}
          </span>
          {data?.url && (
            <div className="flex items-center gap-2">
              {!imgError && (
                <button
                  onClick={() => setIsZoomed(true)}
                  className="px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <ZoomIn className="h-3 w-3" />
                  <span>Zoom</span>
                </button>
              )}
              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Download className="h-3 w-3" />
                <span>Open / DL</span>
              </a>
            </div>
          )}
        </div>

        <div className="h-40 sm:h-56 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] p-2 flex items-center justify-center relative overflow-hidden group shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-[#B8860B]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-mono">Decrypting signed document...</span>
            </div>
          ) : data?.url && !imgError ? (
            <img
              src={fullUrl}
              alt={label}
              className="w-full h-full object-contain rounded-[12px] transition-transform duration-300 group-hover:scale-102 cursor-pointer"
              onClick={() => setIsZoomed(true)}
              onError={() => setImgError(true)}
            />
          ) : data?.url ? (
            <a href={fullUrl} target="_blank" rel="noreferrer noopener" className="flex flex-col items-center gap-2 text-[#9A8A78] hover:text-[#B8860B] transition-colors cursor-pointer w-full h-full justify-center">
              <FileText className="h-8 w-8 text-[#E9DCC5] group-hover:text-[#B8860B] transition-colors" />
              <span className="text-xs font-semibold">No preview available (Click to Open)</span>
            </a>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#9A8A78]">
              <FileText className="h-8 w-8 text-[#E9DCC5]" />
              <span className="text-xs font-semibold text-[#6F5B47]">Loading URL...</span>
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
              src={fullUrl}
              alt={label}
              className="max-h-[85vh] w-auto object-contain rounded-[20px] shadow-2xl border-4 border-[#FFFFFF]"
            />
          </div>
        </div>
      )}
    </>
  )
}

export function AdminVerificationsPage() {
  usePageTitle('Verification Management')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminVerifications(1, 'submitted'),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/verifications', {
        params: { status: 'submitted', limit: 50, page: 1 },
      })
      return data
    },
  })

  const { data: stats } = useQuery<AdminStats>({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/stats')
      return data
    },
  })

  const verifications: PassengerVerification[] = data?.verifications ?? []
  const activePassenger = verifications.find((p) => p.id === selectedPassId) || verifications[0]

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'verified' | 'rejected', notes?: string }) => {
      await apiClient.put(`/api/admin/passengers/${id}/verification`, { status, notes })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminVerifications(1, 'submitted') })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats })
      toast.success(
        variables.status === 'verified'
          ? 'Passenger identity approved successfully! ✓'
          : 'Identity submission rejected.'
      )
      setRejectionNotes('')
      setSelectedPassId(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Verification action failed.'),
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-32 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const getDocPath = (docs: VerificationDocs[], type: string) => {
    return docs.find(d => d.document_type === type)?.file_path
  }

  return (
    <div className="space-y-8 text-[#3E2B1F]">
      {/* 1. Page Header */}
      <div className="p-8 sm:p-10 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] relative overflow-hidden flex flex-col justify-between gap-4">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(140,106,10,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C68A00]" />
            <span className="font-label-caps text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8860B]">
              Identity & Compliance Queue
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">
            Verification Management
          </h1>
          <div className="h-px w-36 bg-gradient-to-r from-[#B8860B] via-[#E9DCC5] to-transparent my-3" />
          <p className="font-body-md text-sm sm:text-base text-[#6F5B47] leading-relaxed font-normal">
            Review passenger identity documents (Aadhaar & Selfie) before approving their sacred pilgrimage.
          </p>
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] flex items-start justify-between gap-4">
          <div>
            <p className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
              Pending Reviews
            </p>
            <p className="font-display text-3xl sm:text-4xl font-bold text-[#C68A00] mt-1.5">
              {verifications.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#C68A00]/15 border border-[#C68A00]/30 flex items-center justify-center text-[#C68A00] shrink-0">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 8. Empty State */}
      {verifications.length === 0 ? (
        <div className="p-16 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-4xl shadow-sm text-[#B8860B]">
            🛡
          </div>
          <h2 className="font-display text-2xl font-bold text-[#3E2B1F]">
            No pending passenger verifications 🎉
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 3. Verification Queue Cards */}
          <div className="lg:col-span-4 xl:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9DCC5]">
              <h2 className="font-display text-xl font-bold text-[#3E2B1F]">
                Pending Submissions ({verifications.length})
              </h2>
            </div>
            <div className="space-y-3.5 max-h-[850px] overflow-y-auto pr-1 admin-sidebar-scroll">
              {verifications.map((p) => {
                const isSelected = activePassenger?.id === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPassId(p.id)
                      setRejectionNotes('')
                    }}
                    className={`p-5 rounded-[20px] border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFFFFF] border-[#B8860B] shadow-[0_8px_25px_rgba(140,106,10,0.12)] ring-1 ring-[#B8860B]'
                        : 'bg-[#FFFFFF] border-[#E9DCC5] hover:border-[#B8860B]/50 hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-white flex items-center justify-center font-display font-bold text-sm shrink-0 shadow-sm">
                          {p.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-[#3E2B1F] truncate">
                            {p.full_name}
                          </h3>
                          <p className="text-xs text-[#6F5B47] truncate mt-0.5">
                            Ref: {p.bookings.booking_reference}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
                        Pending
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Preview & Actions */}
          {activePassenger && (
            <div className="lg:col-span-8 xl:col-span-7 p-6 sm:p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_12px_40px_rgba(90,70,20,0.08)] space-y-6 sticky top-24">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E9DCC5]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-[#FFFFFF] flex items-center justify-center font-display font-bold text-xl shadow-md shrink-0 ring-4 ring-[#B8860B]/15">
                    {activePassenger.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#3E2B1F]">
                      {activePassenger.full_name}
                    </h2>
                    <p className="text-xs text-[#6F5B47] font-mono mt-0.5">
                      Gender: <span className="capitalize">{activePassenger.gender}</span> • Phone: {activePassenger.phone}
                    </p>
                    <p className="text-xs text-[#6F5B47] mt-0.5">
                      Booked by: {activePassenger.bookings.users.full_name} ({activePassenger.bookings.users.phone})
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Document Preview Section */}
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center justify-between">
                  <span>Passenger Documents</span>
                  <span className="font-mono text-xs font-normal text-[#6F5B47]">
                    Aadhaar No: <strong className="text-[#3E2B1F]">{activePassenger.aadhaar_number}</strong>
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getDocPath(activePassenger.passenger_documents, 'aadhaar_front') && (
                    <SignedUrlImagePreview
                      passengerId={activePassenger.id}
                      filePath={getDocPath(activePassenger.passenger_documents, 'aadhaar_front')!}
                      label="Aadhaar Front"
                    />
                  )}
                  {getDocPath(activePassenger.passenger_documents, 'aadhaar_back') && (
                    <SignedUrlImagePreview
                      passengerId={activePassenger.id}
                      filePath={getDocPath(activePassenger.passenger_documents, 'aadhaar_back')!}
                      label="Aadhaar Back"
                    />
                  )}
                  <div className="sm:col-span-2">
                    {getDocPath(activePassenger.passenger_documents, 'selfie') && (
                      <SignedUrlImagePreview
                        passengerId={activePassenger.id}
                        filePath={getDocPath(activePassenger.passenger_documents, 'selfie')!}
                        label="Selfie Photo"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Approve / Reject Actions */}
              <div className="pt-6 border-t border-[#E9DCC5] space-y-4">
                <p className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
                  Administrative Decision
                </p>
                
                <div className="space-y-3">
                  <textarea 
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Provide notes if rejecting this passenger's documents (Required for rejection)..."
                    className="w-full p-4 rounded-xl border border-[#E9DCC5] bg-[#FAF7F2] text-sm text-[#3E2B1F] outline-none focus:border-[#C0392B] transition-colors resize-none"
                    rows={2}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => verifyMutation.mutate({ id: activePassenger.id, status: 'verified' })}
                      disabled={verifyMutation.isPending}
                      className="w-full py-3.5 px-6 rounded-full bg-[#B8860B] hover:bg-[#6F5200] text-[#FFFFFF] font-bold text-sm flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(140,106,10,0.25)] transition-all duration-200 disabled:opacity-60 cursor-pointer hover:-translate-y-0.5"
                    >
                      {verifyMutation.isPending && verifyMutation.variables?.status === 'verified' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      <span>Approve Verification</span>
                    </button>

                    <button
                      onClick={() => verifyMutation.mutate({ id: activePassenger.id, status: 'rejected', notes: rejectionNotes })}
                      disabled={verifyMutation.isPending || !rejectionNotes.trim()}
                      className="w-full py-3.5 px-6 rounded-full bg-[#FFFFFF] border-2 border-[#C0392B] text-[#C0392B] hover:bg-[#C0392B] hover:text-[#FFFFFF] font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all duration-200 disabled:opacity-60 cursor-pointer hover:-translate-y-0.5"
                    >
                      {verifyMutation.isPending && verifyMutation.variables?.status === 'rejected' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      <span>Reject Submission</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
