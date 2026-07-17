import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  CheckCircle, ShieldAlert, ShieldCheck, ShieldX, Loader2,
  User, Phone, Mail, Calendar, Edit3, ChevronRight, Lock, Bell, Settings,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'

const statusConfig = {
  not_submitted: {
    icon: ShieldX,
    label: 'Not Submitted',
    color: 'text-[#6F5B47]',
    bg: 'bg-[#6F5B47]/15 border-[#6F5B47]/30',
  },
  submitted: {
    icon: ShieldAlert,
    label: 'Under Review',
    color: 'text-[#C68A00]',
    bg: 'bg-[#C68A00]/15 border-[#C68A00]/30',
  },
  verified: {
    icon: CheckCircle,
    label: 'Verified',
    color: 'text-[#2E7D32]',
    bg: 'bg-[#2E7D32]/15 border-[#2E7D32]/30',
  },
  rejected: {
    icon: ShieldX,
    label: 'Rejected',
    color: 'text-[#C0392B]',
    bg: 'bg-[#C0392B]/15 border-[#C0392B]/30',
  },
}

export function ProfilePage() {
  usePageTitle('My Profile')
  const { user, userProfile, refreshProfile, loading } = useAuth()

  const [form, setForm] = useState({
    full_name: userProfile?.full_name ?? '',
    phone: userProfile?.phone ?? '',
  })

  const [editing, setEditing] = useState(false)

  const updateMutation = useMutation({
    mutationFn: async (data: { full_name: string; phone: string }) => {
      const { default: apiClient } = await import('@/lib/apiClient')
      await apiClient.put('/api/users/profile', data)
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

  const completionItems = [
    { done: true, label: 'Account created' },
    { done: Boolean(displayProfile?.full_name), label: 'Name set' },
    { done: Boolean(displayProfile?.phone), label: 'Phone added' },
    { done: verStatus === 'verified', label: 'Identity verified' },
  ]
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8860B]" />
      </div>
    )
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Recently joined'

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
      {/* ── Page Header ──────────────────────────────────── */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">Profile</h1>
        <p className="text-sm text-[#6F5B47] mt-1 font-normal">Manage your devotee information and account security</p>
      </div>

      {/* ── Top Profile Card ─────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0 self-start sm:self-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#B8860B] to-[#D4AF37] flex items-center justify-center text-white font-display font-bold text-3xl sm:text-4xl shadow-sm ring-4 ring-[#F5EFE4]">
              {(displayProfile?.full_name ?? 'U').charAt(0).toUpperCase()}
            </div>
            {verStatus === 'verified' && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#2E7D32] border-[3px] border-[#FFFFFF] flex items-center justify-center shadow-2xs">
                <CheckCircle className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Name & Meta */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] tracking-tight truncate">
                  {displayProfile?.full_name ?? 'Sacred Seeker'}
                </h2>
                <span className={`px-3 py-0.5 rounded-full font-label-caps text-[10px] font-bold uppercase tracking-wider border ${StatusInfo.bg} ${StatusInfo.color}`}>
                  {StatusInfo.label}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[#6F5B47]">
              {displayProfile?.phone && (
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#B8860B]" />
                  {displayProfile.phone}
                </span>
              )}
              {user?.email && (
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#B8860B]" />
                  {user.email}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#B8860B]" />
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Completion ───────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-[#3E2B1F]">Profile Completion</h3>
          <span className="font-display text-base font-bold text-[#B8860B]">{completionPct}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-[#F5EFE4] overflow-hidden mb-5 border border-[#E9DCC5]/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] transition-all duration-700 ease-out"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {completionItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl border transition-colors ${
                item.done
                  ? 'text-[#2E7D32] bg-[#2E7D32]/10 border-[#2E7D32]/30'
                  : 'text-[#6F5B47] bg-[#F5EFE4]/50 border-[#E9DCC5]'
              }`}
            >
              {item.done ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-current shrink-0" />}
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Personal Information (two-column) ────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E9DCC5]">
          <h3 className="font-display text-lg font-bold text-[#3E2B1F]">Personal Information</h3>
          {!editing && (
            <button
              onClick={() => {
                setForm({ full_name: displayProfile?.full_name ?? '', phone: displayProfile?.phone ?? '' })
                setEditing(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5EFE4] border border-[#E9DCC5] text-xs font-bold text-[#B8860B] hover:bg-[#FFF7E8] transition-colors cursor-pointer shadow-2xs"
              aria-label="Edit personal information"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Details
            </button>
          )}
        </div>

        {editing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form) }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-[#3E2B1F] focus:outline-none focus:border-[#B8860B] focus:bg-[#FFFFFF] transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  pattern="\d{10}"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-[#3E2B1F] focus:outline-none focus:border-[#B8860B] focus:bg-[#FFFFFF] transition-all text-sm font-medium"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-3 border-t border-[#E9DCC5]">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-2.5 rounded-full border border-[#E9DCC5] bg-[#F5EFE4] text-[#6F5B47] text-xs font-bold uppercase tracking-wider hover:text-[#3E2B1F] hover:bg-[#FFF7E8] transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
            {[
              { icon: User, label: 'Full Name', value: displayProfile?.full_name ?? '—' },
              { icon: Phone, label: 'Phone', value: displayProfile?.phone ?? '—' },
              { icon: Mail, label: 'Email', value: user?.email ?? '—' },
              { icon: Calendar, label: 'Member Since', value: memberSince },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F5EFE4] border border-[#E9DCC5] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <row.icon className="h-4 w-4 text-[#B8860B]" />
                </div>
                <div className="min-w-0">
                  <p className="font-label-caps text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">{row.label}</p>
                  <p className="font-display text-base font-bold text-[#3E2B1F] truncate">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Verification Status ──────────────────────────── */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-[0_8px_30px_rgba(62,43,31,0.04)] bg-[#FFFFFF] transition-all duration-300`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EFE4] border border-[#E9DCC5] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <StatusInfo.icon className={`h-6 w-6 ${StatusInfo.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h3 className="font-display text-lg font-bold text-[#3E2B1F]">Identity Verification</h3>
              <span className={`font-label-caps text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider border ${StatusInfo.bg} ${StatusInfo.color}`}>
                {StatusInfo.label}
              </span>
            </div>
            {verStatus === 'not_submitted' && (
              <>
                <p className="text-sm text-[#6F5B47] mb-4 leading-relaxed">Submit your Aadhaar and selfie to unlock pilgrimage reservations.</p>
                <Link to="/portal/verify" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full bg-[#B8860B] text-white hover:bg-[#D4AF37] transition-all shadow-sm">
                  <ShieldCheck className="h-4 w-4" /> Verify Now
                </Link>
              </>
            )}
            {verStatus === 'submitted' && (
              <p className="text-sm text-[#6F5B47] leading-relaxed">Your verification is under review. We&apos;ll notify you within 24 to 48 hours.</p>
            )}
            {verStatus === 'verified' && (
              <p className="text-sm text-[#6F5B47] leading-relaxed">Your identity has been verified by Ashram administration. You can now book all sacred Yatras.</p>
            )}
            {verStatus === 'rejected' && (
              <>
                <p className="text-sm text-[#6F5B47] mb-4 leading-relaxed">
                  Verification was rejected.{displayProfile?.admin_notes ? ` Reason: ${displayProfile.admin_notes}` : ''} Please re-upload clearer documents.
                </p>
                <Link to="/portal/verify" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full bg-[#C0392B] text-white hover:opacity-90 transition-all shadow-sm">
                  Resubmit Documents
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Account Settings ─────────────────────────────── */}
      <div>
        <h3 className="font-display text-xl font-bold text-[#3E2B1F] mb-4">Account Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Edit3, title: 'Edit Profile', description: 'Update your name, phone & details', href: '#' },
            { icon: Bell, title: 'Notifications', description: 'Manage email & push alerts', href: '#' },
            { icon: Lock, title: 'Security', description: 'Password & two-factor authentication', href: '#' },
            { icon: Settings, title: 'Preferences', description: 'Language, timezone & display', href: '#' },
          ].map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => {
                if (card.title === 'Edit Profile') {
                  setForm({ full_name: displayProfile?.full_name ?? '', phone: displayProfile?.phone ?? '' })
                  setEditing(true)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
              className="group flex items-center gap-4 p-6 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B]/40 hover:bg-[#FFF7E8]/30 transition-all duration-300 text-left cursor-pointer w-full shadow-[0_8px_30px_rgba(62,43,31,0.04)]"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#F5EFE4] border border-[#E9DCC5] flex items-center justify-center shrink-0 group-hover:bg-[#FFF7E8] group-hover:border-[#B8860B]/30 transition-colors duration-300 shadow-2xs">
                <card.icon className="h-5 w-5 text-[#B8860B] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-base font-bold text-[#3E2B1F] group-hover:text-[#B8860B] transition-colors">{card.title}</p>
                <p className="text-xs text-[#6F5B47] mt-0.5">{card.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#6F5B47]/40 group-hover:text-[#B8860B] group-hover:translate-x-1 transition-all duration-200 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
