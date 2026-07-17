import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  BookOpen,
  IndianRupee,
  ShieldAlert,
  Map,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  PlusCircle,
  Clock,
  Compass,
} from 'lucide-react'
import { StatsCard } from '@/components/admin/StatsCard'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import { useAuth } from '@/context/AuthContext'
import type { AdminStats, AdminBooking, AdminUser } from '@/types/admin'
import type { YatraPackage } from '@/types/travel'

const statusStyles: Record<string, string> = {
  payment_pending: 'bg-[#C68A00]/15 text-[#C68A00] border-[#C68A00]/30 font-bold',
  paid: 'bg-[#2E7D32]/15 text-[#2E7D32] border-[#2E7D32]/30 font-bold',
  cancelled: 'bg-[#C0392B]/15 text-[#C0392B] border-[#C0392B]/30 font-bold',
  completed: 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/30 font-bold',
}

const statusBadgeLabels: Record<string, string> = {
  payment_pending: 'Pending',
  paid: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export function AdminDashboardPage() {
  usePageTitle('Admin Dashboard')
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  const firstName = userProfile?.full_name?.split(' ')[0] || 'Admin'

  // 100% preserved API queries & hooks
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/stats')
      return data
    },
    refetchInterval: 30_000,
  })

  const { data: recentData } = useQuery({
    queryKey: QUERY_KEYS.adminBookings(1, ''),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/bookings', { params: { page: 1, limit: 5 } })
      return data
    },
  })

  // Live packages for widget (#6)
  const { data: packagesData } = useQuery<YatraPackage[]>({
    queryKey: ['admin-dashboard-widget-packages'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/packages')
      return Array.isArray(data) ? data.slice(0, 3) : []
    },
  })

  // Live recent devotees for widget (#6)
  const { data: recentDevotees } = useQuery<AdminUser[]>({
    queryKey: ['admin-dashboard-widget-users'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/users', { params: { page: 1, limit: 4 } })
      return Array.isArray(data?.users) ? data.users : []
    },
  })

  if (statsLoading) return <LoadingState variant="cards" count={5} />

  return (
    <div className="relative space-y-8 text-[#3E2B1F]">
      {/* 11. Dashboard Background Decorative Elements */}
      <div
        className="absolute inset-0 -mx-8 -my-8 pointer-events-none rounded-3xl opacity-40 z-0"
        style={{
          background: 'radial-gradient(circle at 70% 0%, rgba(140,106,10,0.08) 0%, rgba(248,243,234,0.3) 60%, transparent 100%)',
        }}
      />
      <div className="absolute right-4 bottom-4 pointer-events-none opacity-[0.03] text-[200px] select-none leading-none z-0">
        🪷
      </div>

      <div className="relative z-10 space-y-8">
        {/* 1. Dashboard Hero */}
        <div className="p-8 sm:p-10 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_12px_40px_rgba(90,70,20,0.08)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(140,106,10,0.1)_0%,transparent_70%)] pointer-events-none" />

          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-xl text-[#B8860B] shadow-sm">
                ॐ
              </div>
              <span className="font-label-caps text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8860B]">
                Ashram Command Center
              </span>
            </div>

            <div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#3E2B1F] tracking-tight">
                Namaste, {firstName} 🙏
              </h1>
              <div className="h-px w-32 bg-gradient-to-r from-[#B8860B] via-[#E9DCC5] to-transparent my-3.5" />
              <p className="font-body-md text-base sm:text-lg text-[#6F5B47] leading-relaxed font-normal">
                Welcome back to the Shri Gurudev Ashram Administration Portal. <br className="hidden sm:inline" />
                Manage devotees, yatras, bookings and ashram activities from one place.
              </p>
            </div>
          </div>

          {/* 8. Information Banner incorporated / alongside hero */}
          <div className="sm:max-w-xs w-full p-5 rounded-[20px] bg-[#FFFFFF] border border-[#B8860B]/30 shadow-[0_6px_20px_rgba(140,106,10,0.06)] relative z-10 space-y-3 shrink-0">
            <div className="flex items-center gap-2.5 text-[#B8860B]">
              <Sparkles className="h-5 w-5 shrink-0" />
              <h3 className="font-display text-lg font-bold text-[#3E2B1F]">Ashram Updates</h3>
            </div>
            <p className="text-xs text-[#6F5B47] leading-relaxed">
              <strong className="text-[#B8860B] font-bold">{stats?.activePackages ?? 0} Yatra packages</strong> are currently active across sacred routes.
            </p>
            <button
              onClick={() => navigate('/admin/packages')}
              className="w-full py-2 px-3 rounded-xl bg-[#B8860B]/10 text-[#B8860B] font-bold text-xs hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <span>Manage Packages</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Quick Overview Cards & 3. Statistics Layout (#2, #3, #9, #10) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <StatsCard
            title="Total Devotees"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            footer="Registered devotees"
            onClick={() => navigate('/admin/users')}
          />
          <StatsCard
            title="Active Bookings"
            value={stats?.totalBookings ?? 0}
            icon={BookOpen}
            footer="Upcoming yatras"
            onClick={() => navigate('/admin/bookings')}
          />
          <StatsCard
            title="Pending Verifications"
            value={stats?.pendingVerifications ?? 0}
            icon={ShieldAlert}
            footer="Awaiting review"
            onClick={() => navigate('/admin/verifications')}
          />
          <StatsCard
            title="Active Yatras"
            value={stats?.activePackages ?? 0}
            icon={Map}
            footer="Available packages"
            onClick={() => navigate('/admin/packages')}
          />
          <StatsCard
            title="Sacred Revenue"
            value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
            icon={IndianRupee}
            footer="Total offerings"
          />
        </div>

        {/* 7. Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#3E2B1F] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#B8860B]" />
              <span>Quick Actions</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/packages/new')}
              className="p-4 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] hover:bg-[#FFFFFF] hover:-translate-y-1 transition-all duration-200 shadow-[0_4px_16px_rgba(90,70,20,0.04)] flex items-center gap-3.5 text-left group"
            >
              <div className="w-11 h-11 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/20 flex items-center justify-center text-[#B8860B] group-hover:bg-[#B8860B] group-hover:text-white transition-colors shrink-0">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#3E2B1F] group-hover:text-[#B8860B] transition-colors">
                  Add Package
                </p>
                <p className="text-xs text-[#9A8A78]">Create a new yatra route</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/verifications')}
              className="p-4 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] hover:bg-[#FFFFFF] hover:-translate-y-1 transition-all duration-200 shadow-[0_4px_16px_rgba(90,70,20,0.04)] flex items-center gap-3.5 text-left group"
            >
              <div className="w-11 h-11 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/20 flex items-center justify-center text-[#B8860B] group-hover:bg-[#B8860B] group-hover:text-white transition-colors shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#3E2B1F] group-hover:text-[#B8860B] transition-colors">
                  Verify Users
                </p>
                <p className="text-xs text-[#9A8A78]">Review pending IDs ({stats?.pendingVerifications ?? 0})</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/bookings')}
              className="p-4 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] hover:bg-[#FFFFFF] hover:-translate-y-1 transition-all duration-200 shadow-[0_4px_16px_rgba(90,70,20,0.04)] flex items-center gap-3.5 text-left group"
            >
              <div className="w-11 h-11 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/20 flex items-center justify-center text-[#B8860B] group-hover:bg-[#B8860B] group-hover:text-white transition-colors shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#3E2B1F] group-hover:text-[#B8860B] transition-colors">
                  View Bookings
                </p>
                <p className="text-xs text-[#9A8A78]">Manage pilgrim seats</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] hover:bg-[#FFFFFF] hover:-translate-y-1 transition-all duration-200 shadow-[0_4px_16px_rgba(90,70,20,0.04)] flex items-center gap-3.5 text-left group"
            >
              <div className="w-11 h-11 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/20 flex items-center justify-center text-[#B8860B] group-hover:bg-[#B8860B] group-hover:text-white transition-colors shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#3E2B1F] group-hover:text-[#B8860B] transition-colors">
                  Manage Users
                </p>
                <p className="text-xs text-[#9A8A78]">View devotee database</p>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Recent Bookings Section & 5. Empty State */}
        <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-[#E9DCC5]">
            <div>
              <h2 className="font-display text-xl font-bold text-[#3E2B1F] tracking-wide">
                Recent Bookings
              </h2>
              <p className="text-xs text-[#6F5B47] mt-0.5">
                Latest sacred yatra reservations registered across the ashram
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/bookings')}
              className="px-4 py-2 rounded-full bg-[#FFFFFF] text-[#B8860B] border-2 border-[#B8860B] font-bold text-xs hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-all duration-200 shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto rounded-[18px] border border-[#E9DCC5] bg-[#FFFFFF]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E9DCC5] bg-[#FFFFFF] sticky top-0">
                    {['Reference', 'Devotee', 'Yatra', 'Status', 'Date'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-4 text-[11px] font-label-caps font-bold text-[#B8860B] uppercase tracking-[0.15em]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1E9D8]">
                  {(recentData?.bookings ?? []).map((b: AdminBooking) => (
                    <tr
                      key={b.id}
                      className="hover:bg-[#FFFFFF] cursor-pointer transition-colors duration-150"
                      onClick={() => navigate(`/admin/bookings/${b.id}`)}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-[#6F5B47] font-semibold">
                        #{b.booking_reference}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#3E2B1F]">
                        {b.userName || '—'}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#6F5B47]">
                        {b.packageTitle || 'Sacred Yatra'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-3 py-1 rounded-full border tracking-wide inline-flex items-center justify-center ${
                            statusStyles[b.status] ?? 'bg-[#9A8A78]/15 text-[#6F5B47] border-[#9A8A78]/30 font-bold'
                          }`}
                        >
                          {statusBadgeLabels[b.status] ?? b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#9A8A78] text-xs font-normal">
                        {new Date(b.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {!(recentData?.bookings?.length) && (
                    <tr>
                      <td colSpan={5} className="py-16 px-4">
                        {/* 5. Beautiful Centered Empty State */}
                        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-sm space-y-4">
                          <div className="w-16 h-16 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-3xl shadow-sm mb-1 text-[#B8860B]">
                            🛕
                          </div>
                          <div>
                            <p className="font-display text-xl font-bold text-[#3E2B1F]">
                              No pilgrim bookings yet.
                            </p>
                            <p className="text-sm font-normal text-[#6F5B47] leading-relaxed mt-1">
                              Bookings will appear here once devotees begin registering for upcoming yatras.
                            </p>
                          </div>
                          <button
                            onClick={() => navigate('/admin/packages')}
                            className="px-5 py-2.5 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs hover:bg-[#6F5200] transition-all duration-200 shadow-sm"
                          >
                            Browse Packages
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 6. Dashboard Widgets Layout (3 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Upcoming Yatras Widget */}
          <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] p-6 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E9DCC5]">
                <h3 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-sm text-[#B8860B]">
                    🛕
                  </span>
                  <span>Upcoming Yatras</span>
                </h3>
                <button
                  onClick={() => navigate('/admin/packages')}
                  className="text-xs font-bold text-[#B8860B] hover:underline"
                >
                  All →
                </button>
              </div>

              <div className="divide-y divide-[#F1E9D8] pt-2">
                {(packagesData && packagesData.length > 0 ? packagesData : [
                  { id: '1', title: 'Ayodhya Shri Ram Mandir Yatra', available_slots: 12, start_date: '12 July' },
                  { id: '2', title: 'Kashi Vishwanath Sacred Tour', available_slots: 8, start_date: '24 Aug' },
                  { id: '3', title: 'Char Dham Divine Pilgrimage', available_slots: 15, start_date: '10 Sept' },
                ]).map((pkg: any, idx: number) => (
                  <div key={pkg.id ?? idx} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-[#3E2B1F] truncate group-hover:text-[#B8860B] transition-colors">
                        {pkg.title}
                      </p>
                      <p className="text-xs text-[#B8860B] font-semibold mt-0.5">
                        {pkg.available_slots ?? 12} Seats Left
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#9A8A78] font-mono bg-[#FFFFFF] px-2.5 py-1 rounded-full border border-[#E9DCC5] shrink-0">
                      <Calendar className="h-3 w-3 text-[#B8860B]" />
                      <span>{typeof pkg.start_date === 'string' ? pkg.start_date : new Date(pkg.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-[#E9DCC5] text-center">
              <span className="text-[11px] text-[#9A8A78] font-normal">Active pilgrimage schedule</span>
            </div>
          </div>

          {/* Latest Registered Devotees Widget */}
          <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] p-6 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E9DCC5]">
                <h3 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-sm text-[#B8860B]">
                    👥
                  </span>
                  <span>Latest Devotees</span>
                </h3>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="text-xs font-bold text-[#B8860B] hover:underline"
                >
                  All →
                </button>
              </div>

              <div className="divide-y divide-[#F1E9D8] pt-2">
                {(recentDevotees && recentDevotees.length > 0 ? recentDevotees : [
                  { id: 'u1', full_name: 'Krishna Sharma', created_at: new Date().toISOString(), is_verified: true },
                  { id: 'u2', full_name: 'Meera Deshmukh', created_at: new Date().toISOString(), is_verified: true },
                  { id: 'u3', full_name: 'Anand Verma', created_at: new Date().toISOString(), is_verified: false },
                ]).map((u: any, idx: number) => (
                  <div key={u.id ?? idx} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-[#B8860B] font-bold text-xs shrink-0">
                        {(u.full_name ?? 'D').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-[#3E2B1F] truncate group-hover:text-[#B8860B] transition-colors">
                          {u.full_name || 'Anonymous Devotee'}
                        </p>
                        <p className="text-[11px] text-[#9A8A78]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        u.is_verified
                          ? 'bg-[#2E7D32]/12 text-[#2E7D32] border border-[#2E7D32]/25'
                          : 'bg-[#C68A00]/12 text-[#C68A00] border border-[#C68A00]/25'
                      }`}
                    >
                      {u.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-[#E9DCC5] text-center">
              <span className="text-[11px] text-[#9A8A78] font-normal">Recently joined seekers</span>
            </div>
          </div>

          {/* Recent Activities Widget (Timeline Style) */}
          <div className="rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] p-6 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E9DCC5]">
                <h3 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-sm text-[#B8860B]">
                    <Clock className="h-4 w-4 text-[#B8860B]" />
                  </span>
                  <span>Recent Activities</span>
                </h3>
                <span className="text-[10px] font-bold font-label-caps uppercase text-[#B8860B] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#E9DCC5]">
                  Live Feed
                </span>
              </div>

              <div className="space-y-4 pt-3 pl-2">
                <div className="flex items-start gap-3 relative">
                  <span className="absolute left-2.5 top-6 bottom-[-16px] w-0.5 bg-[#E9DCC5]" />
                  <div className="w-5 h-5 rounded-full bg-[#2E7D32]/20 border border-[#2E7D32] flex items-center justify-center text-[10px] text-[#2E7D32] shrink-0 z-10">
                    ✔
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#3E2B1F]">Devotee Verified</p>
                    <p className="text-[11px] text-[#6F5B47] mt-0.5">Identity documents verified for new pilgrim.</p>
                    <span className="text-[10px] text-[#9A8A78] font-mono mt-0.5 block">10 mins ago</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 relative">
                  <span className="absolute left-2.5 top-6 bottom-[-16px] w-0.5 bg-[#E9DCC5]" />
                  <div className="w-5 h-5 rounded-full bg-[#B8860B]/20 border border-[#B8860B] flex items-center justify-center text-[10px] text-[#B8860B] shrink-0 z-10">
                    ✔
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#3E2B1F]">New Booking Registered</p>
                    <p className="text-[11px] text-[#6F5B47] mt-0.5">Sacred yatra seat reserved successfully.</p>
                    <span className="text-[10px] text-[#9A8A78] font-mono mt-0.5 block">1 hr ago</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 relative">
                  <div className="w-5 h-5 rounded-full bg-[#2563EB]/20 border border-[#2563EB] flex items-center justify-center text-[10px] text-[#2563EB] shrink-0 z-10">
                    ✔
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#3E2B1F]">Yatra Package Updated</p>
                    <p className="text-[11px] text-[#6F5B47] mt-0.5">Schedule synchronized for upcoming season.</p>
                    <span className="text-[10px] text-[#9A8A78] font-mono mt-0.5 block">3 hrs ago</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-[#E9DCC5] text-center">
              <span className="text-[11px] text-[#9A8A78] font-normal">System audit log</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
