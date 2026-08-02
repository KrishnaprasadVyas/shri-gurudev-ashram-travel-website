import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Eye,
  Edit,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
} from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDebounce } from '@/hooks/useDebounce'
import type { AdminUser } from '@/types/admin'
import { useTranslation } from "react-i18next";

const statusStyles: Record<string, { badge: string; label: string; icon: string }> = {
  verified: {
    badge: 'bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30',
    label: 'Verified',
    icon: '●',
  },
  submitted: {
    badge: 'bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30',
    label: 'Pending',
    icon: '●',
  },
  rejected: {
    badge: 'bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/30',
    label: 'Rejected',
    icon: '●',
  },
  not_submitted: {
    badge: 'bg-[#9A8A78]/15 text-[#6F5B47] border border-[#9A8A78]/30',
    label: 'Inactive',
    icon: '●',
  },
}

const roleStyles: Record<string, string> = {
  admin: 'bg-[#B8860B]/15 text-[#B8860B] border border-[#B8860B]/30',
  coordinator: 'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30',
  volunteer: 'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30',
  user: 'bg-[#9A8A78]/15 text-[#6F5B47] border border-[#9A8A78]/30',
}

const PAGE_SIZE = 20

export function AdminUsersPage() {
    const { t } = useTranslation();
  usePageTitle('Users Management')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Debounce search — only fires query after 400 ms of no typing
  const search = useDebounce(searchInput, 400)

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.adminUsers(page, search, statusFilter),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/users', {
        params: {
          page,
          limit: PAGE_SIZE,
          search,
          status: statusFilter,
          ...(roleFilter ? { role: roleFilter } : {}),
        },
      })
      return data
    },
  })

  let users: AdminUser[] = data?.users ?? []
  if (roleFilter && !data?.users?.some((u: AdminUser) => u.role === roleFilter)) {
    users = users.filter((u) => u.role === roleFilter)
  }

  const total: number = data?.total ?? users.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2
  )

  const handleResetFilters = () => {
    setSearchInput('')
    setStatusFilter('')
    setRoleFilter('')
    setPage(1)
  }

  if (error) {
    return (
      <div className="p-12 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-[#C0392B]/10 border border-[#C0392B]/20 flex items-center justify-center text-[#C0392B] text-2xl">
          ⚠️
        </div>
        <p className="font-display text-xl font-bold text-[#3E2B1F]">Failed to load devotees.</p>
        <p className="text-sm text-[#6F5B47]">We encountered a connection error while fetching the user database.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider hover:bg-[#6F5200] transition-all duration-200 shadow-sm"
        >
          Retry Fetching
        </button>
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
            <span className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
            <span className="font-label-caps text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8860B]">
              Devotee Database
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">
            Users Management
          </h1>
          <div className="h-px w-36 bg-gradient-to-r from-[#B8860B] via-[#E9DCC5] to-transparent my-3" />
          <p className="font-body-md text-sm sm:text-base text-[#6F5B47] leading-relaxed font-normal">
            Manage all registered devotees, verify spiritual identification records, and oversee account access across माँ वैष्णवी टूरिज़्म.
          </p>
        </div>
      </div>

      {/* 2. Search & Filter Section */}
      <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_6px_24px_rgba(90,70,20,0.05)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9DCC5]">
          <h2 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#B8860B]" />
            <span>Search & Filter Devotees</span>
          </h2>
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B8860B]" />
            <input
              type="text"
              placeholder="Search devotees by name, phone or email..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              className="w-full pl-11 pr-4 h-11 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] text-[#3E2B1F] placeholder-[#9A8A78] text-sm focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 transition-all duration-200"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 h-11 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] text-[#3E2B1F] text-sm font-semibold focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 transition-all duration-200 cursor-pointer"
            >
              <option value="">All Verification Statuses</option>
              <option value="verified">Verified Devotees</option>
              <option value="submitted">Pending Review</option>
              <option value="not_submitted">Inactive / Not Submitted</option>
              <option value="rejected">Rejected Status</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 h-11 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] text-[#3E2B1F] text-sm font-semibold focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 transition-all duration-200 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="user">Devotee (User)</option>
              <option value="admin">Administrator</option>
              <option value="coordinator">Volunteer / Coordinator</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Users Table Container */}
      <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] overflow-hidden space-y-6">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h3 className="font-display text-xl font-bold text-[#3E2B1F]">
              Registered Seekers Directory
            </h3>
            <p className="text-xs text-[#6F5B47] mt-0.5">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} registered devotees
            </p>
          </div>
        </div>

        {/* 13. Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-[18px] border border-[#E9DCC5] bg-[#FFFFFF]">
          <table className="w-full text-sm border-collapse">
            {/* 4. Table Header */}
            <thead>
              <tr className="border-b border-[#E9DCC5] bg-[#FFFFFF] sticky top-0 z-10">
                {['#', 'Devotee', 'Contact Information', 'Role', 'Status', 'Bookings', 'Joined', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-4 text-[11px] font-label-caps font-bold text-[#B8860B] uppercase tracking-[0.15em] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* 5. Table Rows */}
            <tbody className="divide-y divide-[#F1E9D8]">
              {/* 12. Loading Skeleton State */}
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="w-6 h-4 bg-[#FAF7F2] rounded" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FAF7F2]" />
                        <div className="space-y-1.5 flex-1">
                          <div className="w-32 h-4 bg-[#FAF7F2] rounded" />
                          <div className="w-20 h-3 bg-[#FAF7F2] rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="w-36 h-3.5 bg-[#FAF7F2] rounded" />
                        <div className="w-28 h-3 bg-[#FAF7F2] rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="w-16 h-6 bg-[#FAF7F2] rounded-full" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="w-20 h-6 bg-[#FAF7F2] rounded-full" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="w-8 h-4 bg-[#FAF7F2] rounded" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="w-20 h-4 bg-[#FAF7F2] rounded" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <div className="w-9 h-9 rounded-full bg-[#FAF7F2]" />
                        <div className="w-9 h-9 rounded-full bg-[#FAF7F2]" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                /* 11. Empty State */
                <tr>
                  <td colSpan={8} className="py-16 px-4">
                    <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                      <div className="w-16 h-16 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-3xl shadow-sm mb-1 text-[#B8860B]">
                        👥
                      </div>
                      <p className="font-display text-xl font-bold text-[#3E2B1F]">
                        No registered devotees found
                      </p>
                      <p className="text-sm font-normal text-[#6F5B47] leading-relaxed">
                        No user accounts match your search or filter criteria. Try resetting filters or checking back after new registrations.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-5 py-2.5 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs hover:bg-[#6F5200] transition-all duration-200 shadow-sm mt-2"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const statusInfo = statusStyles[u.verification_status] ?? statusStyles.not_submitted

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#FFFFFF] transition-colors duration-150 group"
                    >
                      <td className="px-6 py-5 text-[#9A8A78] text-xs font-mono font-bold">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>

                      {/* 6. User Avatar & Name */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3.5">
                          {u.profile_image_url ? (
                            <img
                              src={u.profile_image_url}
                              alt={u.full_name}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#B8860B]/20 border border-[#E9DCC5] shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFFFFF] to-[#FAF7F2] border border-[#B8860B]/30 flex items-center justify-center font-display font-bold text-sm text-[#B8860B] shrink-0 shadow-sm">
                              {(u.full_name || 'D').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p
                              onClick={() => navigate(`/admin/users/${u.id}`)}
                              className="font-bold text-sm text-[#3E2B1F] hover:text-[#B8860B] transition-colors cursor-pointer truncate"
                            >
                              {u.full_name || 'Anonymous Seeker'}
                            </p>
                            <p className="text-xs text-[#B8860B] font-mono">
                              ID: {u.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-[#3E2B1F]">
                            {u.email ?? '—'}
                          </p>
                          <p className="text-xs text-[#6F5B47] font-mono">
                            {u.phone || 'No phone registered'}
                          </p>
                        </div>
                      </td>

                      {/* 8. Role Badges */}
                      <td className="px-6 py-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                            roleStyles[u.role] ?? roleStyles.user
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* 7. Status Badges */}
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs ${statusInfo.badge}`}
                        >
                          <span className="text-[8px]">{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      <td className="px-6 py-5 font-bold text-sm text-[#3E2B1F]">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] text-xs font-mono text-[#B8860B]">
                          {u.bookingCount ?? 0}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-xs text-[#6F5B47] font-normal whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* 9. Action Buttons */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/users/${u.id}`)}
                            title="View Devotee Profile"
                            className="w-9 h-9 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] text-[#B8860B] hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-105"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/users/${u.id}`)}
                            title="Edit User Information"
                            className="w-9 h-9 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] text-[#6F5B47] hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-105"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {u.verification_status === 'submitted' && (
                            <button
                              onClick={() => navigate('/admin/verifications')}
                              title="Verify Identity Record"
                              className="w-9 h-9 rounded-full bg-[#C68A00]/15 border border-[#C68A00]/40 text-[#C68A00] hover:bg-[#C68A00] hover:text-[#FFFFFF] transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-105"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 13. Mobile & Tablet Card List View */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-32 h-4 bg-[#FAF7F2] rounded" />
                    <div className="w-20 h-3 bg-[#FAF7F2] rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] space-y-3">
              <span className="text-3xl">👥</span>
              <p className="font-display text-lg font-bold text-[#3E2B1F]">No registered devotees found</p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            users.map((u) => {
              const statusInfo = statusStyles[u.verification_status] ?? statusStyles.not_submitted

              return (
                <div
                  key={u.id}
                  className="p-5 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-sm space-y-4 transition-all duration-200 hover:border-[#B8860B]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {u.profile_image_url ? (
                        <img
                          src={u.profile_image_url}
                          alt={u.full_name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-[#B8860B]/20 border border-[#E9DCC5] shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFFFFF] to-[#FAF7F2] border border-[#B8860B]/30 flex items-center justify-center font-display font-bold text-base text-[#B8860B] shrink-0 shadow-sm">
                          {(u.full_name || 'D').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="font-display text-lg font-bold text-[#3E2B1F] hover:text-[#B8860B] transition-colors cursor-pointer truncate"
                        >
                          {u.full_name || 'Anonymous Seeker'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              roleStyles[u.role] ?? roleStyles.user
                            }`}
                          >
                            {u.role}
                          </span>
                          <span className="text-xs text-[#9A8A78] font-mono">
                            • {u.bookingCount ?? 0} Booking{u.bookingCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${statusInfo.badge}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] space-y-1.5 text-xs text-[#6F5B47]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#9A8A78]">Email:</span>
                      <span className="font-mono text-[#3E2B1F] truncate max-w-[200px]">
                        {u.email ?? 'Not provided'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#9A8A78]">Phone:</span>
                      <span className="font-mono text-[#3E2B1F]">
                        {u.phone || 'No phone'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#9A8A78]">Joined:</span>
                      <span>
                        {new Date(u.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E9DCC5]">
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-all duration-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Profile</span>
                    </button>
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] text-[#6F5B47] hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-all duration-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 10. Modern Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E9DCC5]">
            <p className="text-xs text-[#6F5B47] font-normal">
              Showing <strong className="text-[#3E2B1F]">{(page - 1) * PAGE_SIZE + 1}</strong> to{' '}
              <strong className="text-[#3E2B1F]">{Math.min(page * PAGE_SIZE, total)}</strong> of{' '}
              <strong className="text-[#B8860B] font-bold">{total}</strong> devotees
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-full text-xs font-bold border border-[#E9DCC5] bg-[#FFFFFF] text-[#B8860B] hover:border-[#B8860B] hover:bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1 shadow-2xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((n, i) => {
                  const prev = pageNumbers[i - 1]
                  const showEllipsis = prev !== undefined && n - prev > 1

                  return (
                    <span key={n} className="flex items-center gap-1">
                      {showEllipsis && <span className="text-xs text-[#9A8A78] px-1 font-mono">…</span>}
                      <button
                        onClick={() => setPage(n)}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center ${
                          n === page
                            ? 'bg-[#B8860B] text-[#FFFFFF] shadow-sm ring-2 ring-[#B8860B]/20'
                            : 'bg-[#FFFFFF] border border-[#E9DCC5] text-[#6F5B47] hover:border-[#B8860B] hover:text-[#B8860B]'
                        }`}
                      >
                        {n}
                      </button>
                    </span>
                  )
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-full text-xs font-bold border border-[#E9DCC5] bg-[#FFFFFF] text-[#B8860B] hover:border-[#B8860B] hover:bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1 shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
