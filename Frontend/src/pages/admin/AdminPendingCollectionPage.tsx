import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  Search,
  IndianRupee,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminPendingCollectionPage() {
  usePageTitle('Pending Collection | Admin')
  const navigate = useNavigate()

  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-collection'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/reports/pending-collection')
      return data.report as any[]
    },
  })

  const bookings = data || []
  const filtered = bookings.filter((b: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (b.booking_code || '').toLowerCase().includes(q) ||
      (b.lead_passenger_name || '').toLowerCase().includes(q) ||
      (b.mobile || '').toLowerCase().includes(q) ||
      (b.groups?.group_code || '').toLowerCase().includes(q)
    )
  })

  const totalPendingAmount = filtered.reduce((s: number, b: any) => s + Number(b.pending_balance || 0), 0)

  return (
    <div className="space-y-6 text-[#3E2B1F] pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-[#C0392B]" />
            <span className="font-label-caps text-xs font-bold text-[#C0392B] uppercase tracking-wider">
              Pending Collections
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
            Outstanding Balance Queue
          </h1>
          <p className="text-sm text-[#6F5B47] mt-0.5">
            Real-time queue of all bookings with pending payments, ordered by largest outstanding balance.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFF7E8] border border-[#B8860B]/30 flex items-center gap-4">
          <div>
            <span className="text-[11px] font-bold text-[#6F5B47] uppercase tracking-wider">
              Total Outstanding
            </span>
            <p className="font-display text-2xl font-bold text-[#C0392B]">
              ₹{totalPendingAmount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A8A78]" />
          <input
            type="text"
            placeholder="Search by booking code, lead name, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] placeholder:text-[#9A8A78] focus:outline-none focus:border-[#B8860B] transition-all"
          />
        </div>

        <div className="text-xs text-[#6F5B47] font-semibold px-2">
          <span>Pending: <strong className="text-[#C0392B]">{filtered.length}</strong> Bookings</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-[#B8860B]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-[#2E7D32] mx-auto mb-3 opacity-70" />
            <h3 className="font-bold text-lg text-[#3E2B1F]">Zero Pending Collections!</h3>
            <p className="text-sm text-[#6F5B47] mt-1">All bookings are fully paid or no matches were found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E9DCC5] text-xs font-bold text-[#6F5B47] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Booking Code</th>
                  <th className="px-5 py-3.5">Group</th>
                  <th className="px-5 py-3.5">Lead Passenger</th>
                  <th className="px-5 py-3.5">Devotees</th>
                  <th className="px-5 py-3.5">Total Package</th>
                  <th className="px-5 py-3.5">Paid</th>
                  <th className="px-5 py-3.5">Pending Balance</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DCC5]/60">
                {filtered.map((b: any) => (
                  <tr key={b.id} className="hover:bg-[#FFFDF8] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#B8860B]">
                      {b.booking_code}
                    </td>
                    <td className="px-5 py-3.5">
                      {b.groups?.group_code ? (
                        <span className="font-mono text-xs font-bold text-[#3E2B1F] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E9DCC5]">
                          {b.groups.group_code}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9A8A78]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#3E2B1F]">{b.lead_passenger_name}</div>
                      <a href={`tel:${b.mobile}`} className="text-xs text-[#B8860B] hover:underline flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {b.mobile}
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-[#3E2B1F]">
                      {b.traveler_count}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#3E2B1F]">
                      ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#2E7D32]">
                      ₹{Number(b.total_paid || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 font-display text-base font-bold text-[#C0392B]">
                      ₹{Number(b.pending_balance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/admin/bookings/${b.id}`)}
                        className="flex items-center gap-1 text-xs font-bold text-[#B8860B] hover:underline ml-auto"
                      >
                        <span>Record Payment</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
