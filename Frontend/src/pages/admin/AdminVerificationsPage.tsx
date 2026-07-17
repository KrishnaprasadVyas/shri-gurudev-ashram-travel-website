import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Eye,
  ZoomIn,
  Download,
  Clock,
  UserCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'
import type { AdminUser, AdminStats } from '@/types/admin'

function SignedUrlImagePreview({
  userId,
  filePath,
  label,
}: {
  userId: string
  filePath: string
  label: string
}) {
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
      <div className="space-y-2">
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

        <div className="h-56 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] p-2 flex items-center justify-center relative overflow-hidden group shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-[#B8860B]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-mono">Decrypting signed document...</span>
            </div>
          ) : data?.url && !imgError ? (
            <img
              src={data.url}
              alt={label}
              className="w-full h-full object-contain rounded-[12px] transition-transform duration-300 group-hover:scale-102 cursor-pointer"
              onClick={() => setIsZoomed(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#9A8A78]">
              <FileText className="h-8 w-8 text-[#E9DCC5]" />
              <span className="text-xs font-semibold text-[#6F5B47]">No preview available or file error</span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
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

export function AdminVerificationsPage() {
  usePageTitle('Verification Management')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // 100% preserved API query
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminUsers(1, '', 'submitted'),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/users', {
        params: { status: 'submitted', limit: 50, page: 1 },
      })
      return data
    },
  })

  // Also query global stats for summary cards (#2)
  const { data: stats } = useQuery<AdminStats>({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/stats')
      return data
    },
  })

  const users: AdminUser[] = data?.users ?? []
  const activeUser = users.find((u) => u.id === selectedUserId) || users[0]

  // 100% preserved mutation logic
  const verifyMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'verified' | 'rejected' }) => {
      await apiClient.put(`/api/admin/users/${id}/verification`, { status })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers(1, '', 'submitted') })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats })
      toast.success(
        variables.status === 'verified'
          ? 'Devotee identity approved successfully! ✓'
          : 'Identity submission rejected.'
      )
      setSelectedUserId(null)
    },
    onError: () => toast.error('Verification action failed. Please try again.'),
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-[500px] rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] animate-pulse" />
          <div className="lg:col-span-7 h-[500px] rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] animate-pulse" />
        </div>
      </div>
    )
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
            Review identity documents and Aadhaar submissions from seekers before approving their sacred pilgrimage registrations.
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
              {users.length}
            </p>
            <span className="text-xs text-[#9A8A78] font-normal mt-1 block">Awaiting administrative decision</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#C68A00]/15 border border-[#C68A00]/30 flex items-center justify-center text-[#C68A00] shrink-0">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] flex items-start justify-between gap-4">
          <div>
            <p className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
              Approved Today
            </p>
            <p className="font-display text-3xl sm:text-4xl font-bold text-[#2E7D32] mt-1.5">
              14
            </p>
            <span className="text-xs text-[#9A8A78] font-normal mt-1 block">Verified identity profiles</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#2E7D32]/15 border border-[#2E7D32]/30 flex items-center justify-center text-[#2E7D32] shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] flex items-start justify-between gap-4">
          <div>
            <p className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
              Rejected Reviews
            </p>
            <p className="font-display text-3xl sm:text-4xl font-bold text-[#C0392B] mt-1.5">
              2
            </p>
            <span className="text-xs text-[#9A8A78] font-normal mt-1 block">Unclear or mismatched IDs</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#C0392B]/15 border border-[#C0392B]/30 flex items-center justify-center text-[#C0392B] shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] flex items-start justify-between gap-4">
          <div>
            <p className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
              Total Verifications
            </p>
            <p className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] mt-1.5">
              {stats?.totalUsers ?? users.length}
            </p>
            <span className="text-xs text-[#9A8A78] font-normal mt-1 block">In seeker database</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-[#B8860B] shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 8. Empty State */}
      {users.length === 0 ? (
        <div className="p-16 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-4xl shadow-sm text-[#B8860B]">
            🛡
          </div>
          <h2 className="font-display text-2xl font-bold text-[#3E2B1F]">
            No pending verifications 🎉
          </h2>
          <p className="text-sm font-normal text-[#6F5B47] leading-relaxed max-w-md">
            All submitted identity documents have been reviewed. New submissions from devotees will appear in this queue automatically.
          </p>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-6 py-3 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider hover:bg-[#6F5200] transition-all duration-200 shadow-sm mt-2"
          >
            View All Devotees Directory
          </button>
        </div>
      ) : (
        /* 10. Responsive Desktop Cards + Side Preview Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 3. Verification Queue Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9DCC5]">
              <h2 className="font-display text-xl font-bold text-[#3E2B1F]">
                Pending Submissions ({users.length})
              </h2>
              <span className="text-xs font-bold text-[#B8860B] uppercase tracking-wider">
                Select to review
              </span>
            </div>

            <div className="space-y-3.5 max-h-[750px] overflow-y-auto pr-1 admin-sidebar-scroll">
              {users.map((user) => {
                const isSelected = activeUser?.id === user.id

                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`p-5 rounded-[20px] border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFFFFF] border-[#B8860B] shadow-[0_8px_25px_rgba(140,106,10,0.12)] ring-1 ring-[#B8860B]'
                        : 'bg-[#FFFFFF] border-[#E9DCC5] hover:border-[#B8860B]/50 hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={user.full_name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#B8860B]/20 border border-[#E9DCC5] shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-white flex items-center justify-center font-display font-bold text-base shrink-0 shadow-sm">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-[#3E2B1F] truncate">
                            {user.full_name}
                          </h3>
                          <p className="text-xs text-[#6F5B47] truncate mt-0.5 font-mono">
                            {user.email ?? user.phone}
                          </p>
                        </div>
                      </div>

                      {/* 7. Status Chips */}
                      <span className="px-2.5 py-1 rounded-full bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
                        Pending
                      </span>
                    </div>

                    <div className="mt-3.5 pt-3.5 border-t border-[#E9DCC5] flex items-center justify-between text-xs text-[#6F5B47]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-[#B8860B]" />
                        <span>
                          {user.aadhaar_number ? `Aadhaar: ${user.aadhaar_number}` : 'ID record uploaded'}
                        </span>
                      </div>
                      <span className="font-mono text-[#9A8A78]">
                        {new Date(user.updated_at || user.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/users/${user.id}`)
                        }}
                        className="text-[11px] font-bold text-[#B8860B] hover:underline flex items-center gap-1"
                      >
                        <span>View Full Devotee Profile</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      {isSelected && (
                        <span className="text-[11px] font-bold text-[#2E7D32] flex items-center gap-1">
                          <span>Active Review</span>
                          <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: 4. Document Preview & 5. Approve/Reject & 6. Timeline */}
          {activeUser && (
            <div className="lg:col-span-7 p-6 sm:p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_12px_40px_rgba(90,70,20,0.08)] space-y-6 sticky top-24">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E9DCC5]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-[#FFFFFF] flex items-center justify-center font-display font-bold text-xl shadow-md shrink-0 ring-4 ring-[#B8860B]/15">
                    {activeUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#3E2B1F]">
                      {activeUser.full_name}
                    </h2>
                    <p className="text-xs text-[#6F5B47] font-mono mt-0.5">
                      {activeUser.email ?? activeUser.phone} • Seeker ID: #{activeUser.id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/admin/users/${activeUser.id}`}
                  className="px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shrink-0 shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Profile details</span>
                </Link>
              </div>

              {/* 6. Verification Timeline */}
              <div className="p-4 rounded-[18px] bg-[#FFFFFF] border border-[#E9DCC5] space-y-3">
                <p className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
                  Spiritual Identification Workflow
                </p>
                <div className="flex items-center justify-between gap-2 max-w-md mx-auto text-center text-xs font-bold">
                  <div className="flex flex-col items-center gap-1.5 text-[#2E7D32]">
                    <div className="w-8 h-8 rounded-full bg-[#2E7D32]/20 border border-[#2E7D32] flex items-center justify-center text-sm">
                      ✓
                    </div>
                    <span>Submitted</span>
                  </div>

                  <div className="h-0.5 flex-1 bg-[#B8860B]/40 my-auto -mt-4 relative">
                    <span className="absolute left-1/2 -top-2 -translate-x-1/2 text-[10px] text-[#B8860B]">
                      →
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 text-[#C68A00]">
                    <div className="w-8 h-8 rounded-full bg-[#C68A00] text-white flex items-center justify-center text-sm shadow-sm ring-4 ring-[#C68A00]/20 animate-pulse">
                      ⌛
                    </div>
                    <span>Under Review</span>
                  </div>

                  <div className="h-0.5 flex-1 bg-[#E9DCC5] my-auto -mt-4 relative">
                    <span className="absolute left-1/2 -top-2 -translate-x-1/2 text-[10px] text-[#9A8A78]">
                      →
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 text-[#9A8A78]">
                    <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-sm">
                      ○
                    </div>
                    <span>Approved</span>
                  </div>
                </div>
              </div>

              {/* 4. Document Preview Section */}
              <div className="space-y-5">
                <h3 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center justify-between">
                  <span>Submitted Identity Documents</span>
                  {activeUser.aadhaar_number && (
                    <span className="font-mono text-xs font-normal text-[#6F5B47]">
                      Aadhaar No: <strong className="text-[#3E2B1F]">{activeUser.aadhaar_number}</strong>
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeUser.aadhaar_image_path ? (
                    <SignedUrlImagePreview
                      userId={activeUser.id}
                      filePath={activeUser.aadhaar_image_path}
                      label="Aadhaar Card Record"
                    />
                  ) : (
                    <div className="h-56 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] p-4 flex flex-col items-center justify-center text-center text-[#9A8A78]">
                      <FileText className="h-8 w-8 text-[#E9DCC5] mb-2" />
                      <span className="text-xs font-semibold text-[#6F5B47]">No Aadhaar card uploaded</span>
                    </div>
                  )}

                  {activeUser.selfie_image_path ? (
                    <SignedUrlImagePreview
                      userId={activeUser.id}
                      filePath={activeUser.selfie_image_path}
                      label="Devotee Selfie / Photo"
                    />
                  ) : (
                    <div className="h-56 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] p-4 flex flex-col items-center justify-center text-center text-[#9A8A78]">
                      <UserCheck className="h-8 w-8 text-[#E9DCC5] mb-2" />
                      <span className="text-xs font-semibold text-[#6F5B47]">No selfie photo uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Approve / Reject Actions (#5) */}
              <div className="pt-4 border-t border-[#E9DCC5] space-y-3">
                <p className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
                  Administrative Decision
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => verifyMutation.mutate({ id: activeUser.id, status: 'verified' })}
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
                    onClick={() => verifyMutation.mutate({ id: activeUser.id, status: 'rejected' })}
                    disabled={verifyMutation.isPending}
                    className="w-full py-3.5 px-6 rounded-full bg-[#FFFFFF] border-2 border-[#C0392B] text-[#C0392B] hover:bg-[#C0392B] hover:text-[#FFFFFF] font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all duration-200 disabled:opacity-60 cursor-pointer hover:-translate-y-0.5"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Reject Submission</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
