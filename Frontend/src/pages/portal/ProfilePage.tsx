import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle, ShieldAlert, ShieldCheck, ShieldX, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'

const statusConfig = {
  not_submitted: {
    icon: ShieldX,
    label: 'Not Submitted',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10 border-gray-500/20',
  },
  submitted: {
    icon: ShieldAlert,
    label: 'Under Review',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  verified: {
    icon: CheckCircle,
    label: 'Verified',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  rejected: {
    icon: ShieldX,
    label: 'Rejected',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
}

export function ProfilePage() {
  usePageTitle('My Profile')
  // F.5: Use userProfile from AuthContext directly — no redundant /api/users/me fetch
  const { user, userProfile, refreshProfile, loading } = useAuth()

  const [form, setForm] = useState({
    full_name: userProfile?.full_name ?? '',
    phone: userProfile?.phone ?? '',
  })

  const [editing, setEditing] = useState(false)

  const updateMutation = useMutation({
    mutationFn: async (data: { full_name: string; phone: string }) => {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user!.id)
      if (error) throw error
    },
    onSuccess: async () => {
      await refreshProfile()
      setEditing(false)
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const displayProfile = userProfile
  const verStatus = displayProfile?.verification_status ?? 'not_submitted'
  const StatusInfo = statusConfig[verStatus]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-display text-3xl font-bold text-[#f2f0eb]">My Profile</h1>

      {/* Edit Profile */}
      <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[#f2f0eb]">Personal Information</h2>
          {!editing && (
            <button
              onClick={() => {
                setForm({ full_name: displayProfile?.full_name ?? '', phone: displayProfile?.phone ?? '' })
                setEditing(true)
              }}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form) }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm text-[#f2f0eb]/60 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0908] border border-amber-900/30 text-[#f2f0eb] focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#f2f0eb]/60 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                pattern="\d{10}"
                className="w-full px-4 py-3 rounded-xl bg-[#0a0908] border border-amber-900/30 text-[#f2f0eb] focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 rounded-xl border border-amber-900/30 text-[#f2f0eb]/60 text-sm hover:text-[#f2f0eb] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {[
              { label: 'Full Name', value: displayProfile?.full_name ?? '—' },
              { label: 'Phone', value: displayProfile?.phone ?? '—' },
              { label: 'Email', value: user?.email ?? '—' },
            ].map((row) => (
              <div key={row.label} className="flex gap-4">
                <span className="w-24 text-sm text-[#f2f0eb]/40 flex-shrink-0">{row.label}</span>
                <span className="text-sm text-[#f2f0eb]">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Status */}
      <div className={`p-6 rounded-2xl border ${StatusInfo.bg}`}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
            <StatusInfo.icon className={`h-5 w-5 ${StatusInfo.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-[#f2f0eb]">Identity Verification</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 ${StatusInfo.color}`}>
                {StatusInfo.label}
              </span>
            </div>
            {verStatus === 'not_submitted' && (
              <>
                <p className="text-sm text-[#f2f0eb]/60 mb-3">Submit your Aadhaar and selfie to book Yatras.</p>
                <Link to="/portal/verify" className="inline-flex items-center gap-1.5 text-sm text-amber-400 font-medium hover:text-amber-300">
                  <ShieldCheck className="h-4 w-4" /> Verify Now
                </Link>
              </>
            )}
            {verStatus === 'submitted' && (
              <p className="text-sm text-[#f2f0eb]/60">Under review. We'll notify you within 24-48 hours.</p>
            )}
            {verStatus === 'verified' && (
              <p className="text-sm text-[#f2f0eb]/60">Your identity has been verified. You can now book Yatras.</p>
            )}
            {verStatus === 'rejected' && (
              <>
                <p className="text-sm text-[#f2f0eb]/60 mb-3">
                  Verification was rejected.{displayProfile?.admin_notes ? ` Reason: ${displayProfile.admin_notes}` : ''} Please resubmit.
                </p>
                <Link to="/portal/verify" className="inline-flex items-center gap-1.5 text-sm text-red-400 font-medium hover:text-red-300">
                  Resubmit Documents
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
