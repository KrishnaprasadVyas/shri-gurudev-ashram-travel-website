import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { AdminBooking } from '@/types/admin'

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'payment_pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

const statusBadge: Record<string, string> = {
  payment_pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export function AdminBookingsPage() {
  usePageTitle('Booking Management')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.adminBookings(page, statusFilter),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/bookings', {
        params: { page, limit: 20, status: statusFilter },
      })
      return data
    },
  })

  const bookings: AdminBooking[] = data?.bookings ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  // E.7: Error state
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <p className="text-[#f2f0eb]/50 text-sm">Failed to load bookings.</p>
      <button onClick={() => window.location.reload()} className="text-xs text-amber-400 hover:underline">
        Retry
      </button>
    </div>
  )

  const exportCSV = async () => {
    const { data: all } = await apiClient.get('/api/admin/bookings', {
      params: { status: statusFilter, limit: 1000, page: 1 },
    })
    const rows: AdminBooking[] = all.bookings ?? []
    const headers = [
      'booking_reference', 'full_name', 'phone_number', 'whatsapp_number',
      'dob', 'address', 'transport_type', 'bus_type', 'room_type',
      'traveler_count', 'total_amount', 'status', 'created_at',
    ]
    const csv = [
      headers.join(','),
      ...rows.map((b) =>
        headers
          .map((h) => JSON.stringify((b as unknown as Record<string, unknown>)[h] ?? ''))
          .join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${statusFilter || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Status tabs + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  : 'border border-amber-900/20 text-[#f2f0eb]/50 hover:text-[#f2f0eb]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-900/20 text-[#f2f0eb]/60 text-xs hover:text-[#f2f0eb] hover:border-amber-500/30 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#121110] border border-amber-900/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-900/20">
                {['Reference', 'User', 'Package', 'Travelers', 'Amount', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-medium text-[#f2f0eb]/40 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-amber-900/20 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : bookings.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-[#f2f0eb]/40">No bookings found</td>
                    </tr>
                  )
                  : bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-amber-500/5 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/bookings/${b.id}`)}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-[#f2f0eb]/70">#{b.booking_reference}</td>
                      <td className="px-5 py-4 text-[#f2f0eb]">{b.userName || '—'}</td>
                      <td className="px-5 py-4 text-[#f2f0eb]/70 max-w-[150px] truncate">{b.packageTitle || '—'}</td>
                      <td className="px-5 py-4 text-[#f2f0eb]/60">{b.traveler_count}</td>
                      <td className="px-5 py-4 text-amber-400">₹{b.total_amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusBadge[b.status] ?? ''}`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#f2f0eb]/50 text-xs whitespace-nowrap">
                        {new Date(b.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-amber-400">View →</span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-amber-900/20">
            <p className="text-xs text-[#f2f0eb]/40">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs border border-amber-900/20 text-[#f2f0eb]/60 hover:text-[#f2f0eb] disabled:opacity-30 transition-colors">Previous</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs border border-amber-900/20 text-[#f2f0eb]/60 hover:text-[#f2f0eb] disabled:opacity-30 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
