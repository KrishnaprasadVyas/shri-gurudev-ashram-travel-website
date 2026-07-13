import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDebounce } from '@/hooks/useDebounce'
import type { AdminUser } from '@/types/admin'

const statusStyles: Record<string, string> = {
  not_submitted: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  submitted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  verified: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const PAGE_SIZE = 20

export function AdminUsersPage() {
  usePageTitle('User Management')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // E.3: Debounce search — only fires query after 400 ms of no typing
  const search = useDebounce(searchInput, 400)

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.adminUsers(page, search, statusFilter),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/users', {
        params: { page, limit: PAGE_SIZE, search, status: statusFilter },
      })
      return data
    },
  })

  const users: AdminUser[] = data?.users ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // E.2: Numbered page buttons (show up to 5 page numbers around current)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2
  )

  // E.7: Error state
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <p className="text-[#f2f0eb]/50 text-sm">Failed to load users.</p>
      <button onClick={() => window.location.reload()} className="text-xs text-amber-400 hover:underline">
        Retry
      </button>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f2f0eb]/30" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#121110] border border-amber-900/20 text-[#f2f0eb] placeholder-[#f2f0eb]/30 text-sm focus:outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 rounded-xl bg-[#121110] border border-amber-900/20 text-[#f2f0eb] text-sm focus:outline-none focus:border-amber-500/40 transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="not_submitted">Not Submitted</option>
          <option value="submitted">Submitted</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#121110] border border-amber-900/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-900/20">
                {/* E.2: Added # and Role columns */}
                {['#', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Bookings', 'Joined', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-medium text-[#f2f0eb]/40 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-amber-900/20 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-[#f2f0eb]/40">No users found</td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr
                    key={u.id}
                    className="hover:bg-amber-500/5 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                  >
                    {/* E.2: Row number */}
                    <td className="px-5 py-4 text-[#f2f0eb]/30 text-xs font-mono">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-5 py-4 font-medium text-[#f2f0eb]">{u.full_name}</td>
                    <td className="px-5 py-4 text-[#f2f0eb]/60">{u.email ?? '—'}</td>
                    <td className="px-5 py-4 text-[#f2f0eb]/60">{u.phone}</td>
                    {/* E.2: Role column */}
                    <td className="px-5 py-4 text-[#f2f0eb]/50 text-xs capitalize">{u.role}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusStyles[u.verification_status] ?? ''}`}>
                        {u.verification_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#f2f0eb]/60">{u.bookingCount}</td>
                    <td className="px-5 py-4 text-[#f2f0eb]/50 text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-amber-400">View →</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* E.2: Numbered pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-amber-900/20">
            <p className="text-xs text-[#f2f0eb]/40">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs border border-amber-900/20 text-[#f2f0eb]/60 hover:text-[#f2f0eb] disabled:opacity-30 transition-colors"
              >
                ‹
              </button>
              {pageNumbers.map((n, i) => {
                const prev = pageNumbers[i - 1]
                const showEllipsis = prev !== undefined && n - prev > 1
                return (
                  <span key={n} className="flex items-center gap-1.5">
                    {showEllipsis && <span className="text-xs text-[#f2f0eb]/30 px-1">…</span>}
                    <button
                      onClick={() => setPage(n)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        n === page
                          ? 'bg-amber-500 border-amber-500 text-white font-medium'
                          : 'border-amber-900/20 text-[#f2f0eb]/60 hover:text-[#f2f0eb]'
                      }`}
                    >
                      {n}
                    </button>
                  </span>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs border border-amber-900/20 text-[#f2f0eb]/60 hover:text-[#f2f0eb] disabled:opacity-30 transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
