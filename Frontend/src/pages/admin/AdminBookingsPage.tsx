import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Download,
  Search,
  Eye,
  Filter,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDebounce } from '@/hooks/useDebounce'
import type { AdminBooking, AdminStats } from '@/types/admin'

const statusTabs = [
  { value: '', label: 'All Active Reservations' },
  { value: 'verification_pending', label: 'Paid • Under Review' },
  { value: 'verified', label: 'Verified & Confirmed' },
  { value: 'payment_pending', label: 'Pending Payment (Unpaid)' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusStyles: Record<string, { badge: string; label: string; icon: string }> = {
  verification_pending: {
    badge: 'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30',
    label: 'Paid • Under Review',
    icon: '●',
  },
  verified: {
    badge: 'bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30',
    label: 'Verified & Confirmed',
    icon: '●',
  },
  paid: {
    badge: 'bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30',
    label: 'Paid',
    icon: '●',
  },
  ticket_generated: {
    badge: 'bg-[#B8860B]/15 text-[#B8860B] border border-[#B8860B]/30',
    label: 'Ticket Issued',
    icon: '●',
  },
  payment_pending: {
    badge: 'bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30',
    label: 'Pending Payment',
    icon: '●',
  },
  draft: {
    badge: 'bg-[#9A8A78]/15 text-[#9A8A78] border border-[#9A8A78]/30',
    label: 'Unsubmitted Draft',
    icon: '○',
  },
  documents_pending: {
    badge: 'bg-[#9A8A78]/15 text-[#9A8A78] border border-[#9A8A78]/30',
    label: 'Incomplete Form',
    icon: '○',
  },
  completed: {
    badge: 'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/30',
    label: 'Completed',
    icon: '●',
  },
  cancelled: {
    badge: 'bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/30',
    label: 'Cancelled',
    icon: '●',
  },
  rejected: {
    badge: 'bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/30',
    label: 'Verification Rejected',
    icon: '●',
  },
}

const PAGE_SIZE = 20

export function AdminBookingsPage() {
  usePageTitle('Bookings Management')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Debounced search input
  const search = useDebounce(searchInput, 400)

  // Preserved API query
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.adminBookings(page, statusFilter),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/bookings', {
        params: { page, limit: PAGE_SIZE, status: statusFilter },
      })
      return data
    },
  })

  // Global stats for dashboard-style statistics cards (#2)
  const { data: stats } = useQuery<AdminStats>({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/stats')
      return data
    },
  })

  let bookings: AdminBooking[] = data?.bookings ?? []
  if (search) {
    const q = search.toLowerCase()
    bookings = bookings.filter(
      (b) =>
        b.booking_reference?.toLowerCase().includes(q) ||
        b.userName?.toLowerCase().includes(q) ||
        b.packageTitle?.toLowerCase().includes(q)
    )
  }

  const total: number = data?.total ?? bookings.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2
  )

  const handleResetFilters = () => {
    setSearchInput('')
    setStatusFilter('')
    setPage(1)
  }

  // Preserved CSV export
  const exportCSV = async () => {
    const { data: all } = await apiClient.get('/api/admin/bookings', {
      params: { status: statusFilter, limit: 1000, page: 1 },
    })
    const rows: AdminBooking[] = all.bookings ?? []
    const headers = [
      'booking_reference',
      'full_name',
      'phone_number',
      'whatsapp_number',
      'dob',
      'address',
      'transport_type',
      'bus_type',
      'room_type',
      'traveler_count',
      'total_amount',
      'status',
      'created_at',
    ]
    const csv = [
      headers.join(','),
      ...rows.map((b) =>
        headers
          .map((h) => JSON.stringify((b as unknown as Record<string, unknown>)[h] ?? ''))
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ashram-bookings-${statusFilter || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="p-12 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-[#C0392B]/10 border border-[#C0392B]/20 flex items-center justify-center text-[#C0392B] text-2xl">
          ⚠️
        </div>
        <p className="font-display text-xl font-bold text-[#3E2B1F]">Failed to load bookings.</p>
        <p className="text-sm text-[#6F5B47]">We encountered a connection issue while reading the reservations database.</p>
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
      {/* 1. Hero Header */}
      <div className="p-8 sm:p-10 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] relative overflow-hidden flex flex-col justify-between gap-4">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(140,106,10,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
            <span className="font-label-caps text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8860B]">
              Sacred Reservations
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">
            Bookings Management
          </h1>
          <div className="h-px w-36 bg-gradient-to-r from-[#B8860B] via-[#E9DCC5] to-transparent my-3" />
          <p className="font-body-md text-sm sm:text-base text-[#6F5B47] leading-relaxed font-normal">
            Track every devotee's pilgrimage journey from initial registration to sacred completion.
          </p>
        </div>
      </div>

      {/* 2. Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] hover:-translate-y-1 hover:border-[#B8860B] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
              Total Bookings
            </span>
            <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-[#B8860B]">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-[#3E2B1F] mt-3">
            {stats?.totalBookings ?? total}
          </p>
          <span className="text-[11px] text-[#9A8A78] font-normal mt-1">All historical registrations</span>
        </div>

        <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] hover:-translate-y-1 hover:border-[#B8860B] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
              Active Yatras
            </span>
            <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-[#B8860B]">
              🛕
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-[#B8860B] mt-3">
            {stats?.activePackages ?? 0}
          </p>
          <span className="text-[11px] text-[#9A8A78] font-normal mt-1">Open for booking right now</span>
        </div>

        <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] hover:-translate-y-1 hover:border-[#B8860B] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
              Confirmed
            </span>
            <div className="w-10 h-10 rounded-full bg-[#2E7D32]/15 border border-[#2E7D32]/30 flex items-center justify-center text-[#2E7D32]">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-[#2E7D32] mt-3">
            {stats?.confirmedBookings ?? bookings.filter((b) => ['paid', 'verified', 'ticket_generated', 'completed'].includes(b.status)).length}
          </p>
          <span className="text-[11px] text-[#9A8A78] font-normal mt-1">Fully paid reservations</span>
        </div>

        <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] hover:-translate-y-1 hover:border-[#B8860B] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
              Pending Payment
            </span>
            <div className="w-10 h-10 rounded-full bg-[#C68A00]/15 border border-[#C68A00]/30 flex items-center justify-center text-[#C68A00]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-[#C68A00] mt-3">
            {stats?.pendingPaymentBookings ?? bookings.filter((b) => b.status === 'payment_pending').length}
          </p>
          <span className="text-[11px] text-[#9A8A78] font-normal mt-1">Awaiting financial transfer</span>
        </div>

        <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] hover:-translate-y-1 hover:border-[#B8860B] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-[11px] uppercase tracking-[0.15em] font-bold text-[#6F5B47]">
              Cancelled
            </span>
            <div className="w-10 h-10 rounded-full bg-[#C0392B]/15 border border-[#C0392B]/30 flex items-center justify-center text-[#C0392B]">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-[#C0392B] mt-3">
            {stats?.cancelledBookings ?? bookings.filter((b) => b.status === 'cancelled').length}
          </p>
          <span className="text-[11px] text-[#9A8A78] font-normal mt-1">Cancelled or expired records</span>
        </div>
      </div>

      {/* 3. Search & Filters Card */}
      <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_6px_24px_rgba(90,70,20,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E9DCC5]">
          <h2 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#B8860B]" />
            <span>Filter Reservations & Export</span>
          </h2>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-1.5 rounded-full bg-[#B8860B] hover:bg-[#6F5200] text-[#FFFFFF] font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B8860B]" />
            <input
              type="text"
              placeholder="Search reservations by reference #, devotee name, or package..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              className="w-full pl-11 pr-4 h-11 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] text-[#3E2B1F] placeholder-[#9A8A78] text-sm focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 transition-all duration-200"
            />
          </div>

          <div className="md:col-span-6 flex flex-wrap gap-2 items-center">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value)
                  setPage(1)
                }}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                  statusFilter === tab.value
                    ? 'bg-[#B8860B] text-[#FFFFFF] border-[#B8860B] shadow-sm ring-2 ring-[#B8860B]/20'
                    : 'bg-[#FFFFFF] border-[#E9DCC5] text-[#6F5B47] hover:border-[#B8860B] hover:text-[#B8860B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bookings Table Container */}
      <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] overflow-hidden space-y-6">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h3 className="font-display text-xl font-bold text-[#3E2B1F]">
              Pilgrimage Bookings Directory
            </h3>
            <p className="text-xs text-[#6F5B47] mt-0.5">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} total bookings
            </p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-[18px] border border-[#E9DCC5] bg-[#FFFFFF]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E9DCC5] bg-[#FFFFFF] sticky top-0 z-10">
                {['Reference', 'Devotee', 'Package / Yatra', 'Travelers', 'Amount', 'Payment', 'Status', 'Booking Date', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-4 text-[11px] font-label-caps font-bold text-[#B8860B] uppercase tracking-[0.15em] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1E9D8]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5"><div className="w-20 h-4 bg-[#FAF7F2] rounded" /></td>
                    <td className="px-6 py-5"><div className="w-32 h-4 bg-[#FAF7F2] rounded" /></td>
                    <td className="px-6 py-5"><div className="w-40 h-4 bg-[#FAF7F2] rounded" /></td>
                    <td className="px-6 py-5"><div className="w-12 h-4 bg-[#FAF7F2] rounded" /></td>
                    <td className="px-6 py-5"><div className="w-20 h-4 bg-[#FAF7F2] rounded" /></td>
                    <td className="px-6 py-5"><div className="w-16 h-6 bg-[#FAF7F2] rounded-full" /></td>
                    <td className="px-6 py-5"><div className="w-24 h-6 bg-[#FAF7F2] rounded-full" /></td>
                    <td className="px-6 py-5"><div className="w-24 h-4 bg-[#FAF7F2] rounded" /></td>
                    <td className="px-6 py-5"><div className="w-9 h-9 bg-[#FAF7F2] rounded-full" /></td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                /* 9. Empty State */
                <tr>
                  <td colSpan={9} className="py-16 px-4">
                    <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                      <div className="w-16 h-16 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-3xl shadow-sm mb-1 text-[#B8860B]">
                        🛕
                      </div>
                      <p className="font-display text-xl font-bold text-[#3E2B1F]">
                        No bookings found
                      </p>
                      <p className="text-sm font-normal text-[#6F5B47] leading-relaxed">
                        No reservation records match your selected status filter or query. New registrations will appear here instantly.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-5 py-2.5 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs hover:bg-[#6F5200] transition-all duration-200 shadow-sm mt-2"
                      >
                        Show All Bookings
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const statusInfo = statusStyles[b.status] ?? statusStyles.payment_pending
                  const isPaid = (b as any).isPaid || ['verification_pending', 'verified', 'ticket_generated', 'completed', 'paid'].includes(b.status)

                  return (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/admin/bookings/${b.id}`)}
                      className="hover:bg-[#FFFFFF] transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="px-6 py-5 font-mono text-xs font-bold text-[#B8860B]">
                        #{b.booking_reference}
                      </td>

                      <td className="px-6 py-5 font-bold text-[#3E2B1F] group-hover:text-[#B8860B] transition-colors">
                        {b.userName || 'Anonymous Devotee'}
                      </td>

                      <td className="px-6 py-5 text-[#6F5B47] font-medium max-w-[220px] truncate">
                        {b.packageTitle || 'General Pilgrimage'}
                      </td>

                      <td className="px-6 py-5 font-mono text-[#3E2B1F] font-semibold">
                        {b.traveler_count} {b.traveler_count === 1 ? 'Seeker' : 'Seekers'}
                      </td>

                      <td className="px-6 py-5 font-display font-bold text-base text-[#3E2B1F]">
                        ₹{b.total_amount.toLocaleString('en-IN')}
                      </td>

                      {/* Payment Status Pill */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        {isPaid ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></span>
                            PAID
                          </span>
                        ) : b.status === 'cancelled' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B]"></span>
                            CANCELLED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C68A00]"></span>
                            UNPAID
                          </span>
                        )}
                      </td>

                      {/* Lifecycle Status Badges */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs ${statusInfo.badge}`}
                        >
                          <span className="text-[8px]">{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      <td className="px-6 py-5 text-xs text-[#6F5B47] font-normal whitespace-nowrap font-mono">
                        {new Date(b.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* 8. Action Buttons */}
                      <td className="px-6 py-5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/admin/bookings/${b.id}`)
                          }}
                          title="View Booking Details"
                          className="w-9 h-9 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] text-[#B8860B] hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-105"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Booking Cards (Mobile & Tablet) */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] animate-pulse h-40" />
            ))
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] space-y-3">
              <span className="text-3xl">🛕</span>
              <p className="font-display text-lg font-bold text-[#3E2B1F]">No bookings found</p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            bookings.map((b) => {
              const statusInfo = statusStyles[b.status] ?? statusStyles.payment_pending

              return (
                <div
                  key={b.id}
                  onClick={() => navigate(`/admin/bookings/${b.id}`)}
                  className="p-5 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-sm space-y-4 transition-all duration-200 hover:border-[#B8860B]/40 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#B8860B]">
                        #{b.booking_reference}
                      </span>
                      <h4 className="font-display text-lg font-bold text-[#3E2B1F] mt-0.5">
                        {b.userName || 'Anonymous Devotee'}
                      </h4>
                      <p className="text-xs text-[#6F5B47] font-medium truncate mt-0.5">
                        {b.packageTitle || 'General Pilgrimage'}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#9A8A78] font-semibold block">Travelers:</span>
                      <span className="font-mono text-[#3E2B1F] font-bold">
                        {b.traveler_count} {b.traveler_count === 1 ? 'Seat' : 'Seats'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#9A8A78] font-semibold block">Total Amount:</span>
                      <span className="font-display text-sm font-bold text-[#B8860B]">
                        ₹{b.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E9DCC5]">
                    <span className="text-xs font-mono text-[#9A8A78]">
                      {new Date(b.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <button className="px-4 py-1.5 rounded-full bg-[#FFFFFF] border border-[#B8860B] text-[#B8860B] font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E9DCC5]">
            <p className="text-xs text-[#6F5B47] font-normal">
              Showing <strong className="text-[#3E2B1F]">{(page - 1) * PAGE_SIZE + 1}</strong> to{' '}
              <strong className="text-[#3E2B1F]">{Math.min(page * PAGE_SIZE, total)}</strong> of{' '}
              <strong className="text-[#B8860B] font-bold">{total}</strong> bookings
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
