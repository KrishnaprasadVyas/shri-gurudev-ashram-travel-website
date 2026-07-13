import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, Loader2, ImageOff } from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import { toast } from 'sonner'
import type { AdminUser } from '@/types/admin'
import type { BookingRow } from '@/types/database.types'

const statusBadge: Record<string, string> = {
  payment_pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

/** E.1: Fetches a signed URL for a verification file and renders it as an image. */
function VerificationImage({ userId, filePath, label }: { userId: string; filePath: string; label: string }) {
  const [imgError, setImgError] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'signed-url', userId, filePath],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/admin/users/${userId}/verification-file-url`, {
        params: { path: filePath },
      })
      return data as { url: string; expiresAt: number }
    },
    staleTime: 4 * 60 * 1000, // 4 min (signed URLs expire in 5 min)
  })

  return (
    <div className="mb-4">
      <p className="text-xs text-[#f2f0eb]/40 mb-2 uppercase tracking-wider">{label}</p>
      <div className="h-40 rounded-xl overflow-hidden bg-amber-900/10 border border-amber-900/20 flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-amber-500/40" />
        ) : data?.url && !imgError ? (
          <img
            src={data.url}
            alt={label}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#f2f0eb]/30">
            <ImageOff className="h-6 w-6" />
            <span className="text-xs">Unable to load image</span>
          </div>
        )}
      </div>
    </div>
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
      toast.success(status === 'verified' ? 'Verification approved! ✓' : 'Verification rejected')
    },
    onError: () => toast.error('Action failed'),
  })

  if (isLoading) return <LoadingState variant="detail" />
  if (!data) return null

  const { user, bookings } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-[#f2f0eb]/50 hover:text-[#f2f0eb] hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-2xl font-bold text-[#f2f0eb]">{user.full_name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User profile */}
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
            <h2 className="font-semibold text-[#f2f0eb] mb-4">Profile</h2>
            {[
              { label: 'Email', value: user.email ?? '—' },
              { label: 'Phone', value: user.phone },
              { label: 'Role', value: user.role },
              { label: 'Joined', value: new Date(user.created_at).toLocaleDateString('en-IN') },
            ].map((r) => (
              <div key={r.label} className="flex gap-4 py-2 border-b border-amber-900/10 last:border-0">
                <span className="w-20 text-sm text-[#f2f0eb]/40 flex-shrink-0">{r.label}</span>
                <span className="text-sm text-[#f2f0eb]">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Verification */}
          <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
            <h2 className="font-semibold text-[#f2f0eb] mb-4">Verification Status</h2>
            <p className="text-sm text-[#f2f0eb]/60 mb-3">
              Current status:{' '}
              <span className="capitalize font-medium text-[#f2f0eb]">
                {user.verification_status.replace('_', ' ')}
              </span>
            </p>
            {user.aadhaar_number && (
              <p className="text-sm text-[#f2f0eb]/60 mb-3">
                Aadhaar: <span className="font-mono text-[#f2f0eb]">{user.aadhaar_number}</span>
              </p>
            )}
            {/* E.1: Real image previews via signed URL */}
            {user.aadhaar_image_path && id && (
              <VerificationImage userId={id} filePath={user.aadhaar_image_path} label="Aadhaar Card" />
            )}
            {user.selfie_image_path && id && (
              <VerificationImage userId={id} filePath={user.selfie_image_path} label="Selfie" />
            )}

            {user.verification_status === 'submitted' && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => verifyMutation.mutate('verified')}
                  disabled={verifyMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/30 disabled:opacity-60 transition-colors"
                >
                  {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Approve
                </button>
                <button
                  onClick={() => verifyMutation.mutate('rejected')}
                  disabled={verifyMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 disabled:opacity-60 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bookings */}
        <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
          <h2 className="font-semibold text-[#f2f0eb] mb-4">Bookings ({bookings.length})</h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-[#f2f0eb]/40">No bookings found.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Link
                  key={b.id}
                  to={`/admin/bookings/${b.id}`}
                  className="block p-3 rounded-xl bg-[#0a0908] border border-amber-900/20 hover:border-amber-500/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[#f2f0eb]/60">#{b.booking_reference}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge[b.status] ?? ''}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-amber-400 mt-1">₹{b.total_amount.toLocaleString('en-IN')}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
