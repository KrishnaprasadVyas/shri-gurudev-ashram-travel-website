import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  CheckCircle, ShieldAlert, ShieldCheck, ShieldX, Loader2,
  User, Phone, Mail, Calendar, Edit3,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
  usePageTitle(t('profile.title'))
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
    { done: true, label: t('profile.acctCreated') },
    { done: Boolean(displayProfile?.full_name), label: t('profile.nameSet') },
    { done: Boolean(displayProfile?.phone), label: t('profile.phoneAdded') },
    { done: verStatus === 'verified', label: t('profile.idVerified') },
  ]
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8860B]" />
      </div>
    )
  }

  const memberSince = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : t('profile.recentlyJoined')

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
      {/* ── Page Header ──────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">{t('profile.title')}</h1>
          <button
            onClick={() => {
              setForm({ full_name: displayProfile?.full_name ?? '', phone: displayProfile?.phone ?? '' })
              setEditing(true)
            }}
            className="text-[#B8860B] hover:text-[#9A7009] transition-all duration-300 hover:scale-105 cursor-pointer"
            title="Edit Profile"
          >
            <Edit3 className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          </button>
        </div>
        <p className="text-sm text-[#6F5B47] mt-1 font-normal">{t('profile.desc')}</p>
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
                  {StatusInfo.label === 'Not Submitted' ? t('profile.statusNotSubmitted') : StatusInfo.label === 'Under Review' ? t('profile.statusUnderReview') : StatusInfo.label === 'Verified' ? t('profile.statusVerified') : t('profile.statusRejected')}
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
                {t('profile.memberSince')} {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Completion ───────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-[#3E2B1F]">{t('profile.completion')}</h3>
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
          <h3 className="font-display text-lg font-bold text-[#3E2B1F]">{t('profile.personalInfo')}</h3>
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
              
              {t('profile.editDetails')}
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
                <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">{t('profile.fullName')}</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-[#3E2B1F] focus:outline-none focus:border-[#B8860B] focus:bg-[#FFFFFF] transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">{t('profile.phoneNum')}</label>
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
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('profile.saveChanges')}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-2.5 rounded-full border border-[#E9DCC5] bg-[#F5EFE4] text-[#6F5B47] text-xs font-bold uppercase tracking-wider hover:text-[#3E2B1F] hover:bg-[#FFF7E8] transition-all cursor-pointer"
              >
                {t('profile.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
            {[
              { icon: User, label: t('profile.fullName'), value: displayProfile?.full_name ?? '—' },
              { icon: Phone, label: t('profile.phoneNum'), value: displayProfile?.phone ?? '—' },
              { icon: Mail, label: t('profile.email'), value: user?.email ?? '—' },
              { icon: Calendar, label: t('profile.memberSince'), value: memberSince },
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
              <h3 className="font-display text-lg font-bold text-[#3E2B1F]">{t('profile.idVerification')}</h3>
              <span className={`font-label-caps text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider border ${StatusInfo.bg} ${StatusInfo.color}`}>
                {StatusInfo.label === 'Not Submitted' ? t('profile.statusNotSubmitted') : StatusInfo.label === 'Under Review' ? t('profile.statusUnderReview') : StatusInfo.label === 'Verified' ? t('profile.statusVerified') : t('profile.statusRejected')}
              </span>
            </div>
            {verStatus === 'not_submitted' && (
              <>
                <p className="text-sm text-[#6F5B47] mb-4 leading-relaxed">{t('profile.submitAadhaar')}</p>
                <Link to="/portal/verify" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full bg-[#B8860B] text-white hover:bg-[#D4AF37] transition-all shadow-sm">
                  <ShieldCheck className="h-4 w-4" /> {t('profile.verifyNow')}
                </Link>
              </>
            )}
            {verStatus === 'submitted' && (
              <p className="text-sm text-[#6F5B47] leading-relaxed">{t('profile.underReviewDesc')}</p>
            )}
            {verStatus === 'verified' && (
              <p className="text-sm text-[#6F5B47] leading-relaxed">{t('profile.verifiedDesc')}</p>
            )}
            {verStatus === 'rejected' && (
              <>
                <p className="text-sm text-[#6F5B47] mb-4 leading-relaxed">
                  {t('profile.rejectedDesc')}
                </p>
                <Link to="/portal/verify" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full bg-[#C0392B] text-white hover:opacity-90 transition-all shadow-sm">
                  {t('profile.resubmitDocs')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>


    </div>
  )
}
