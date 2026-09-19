import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  UserCheck,
  Search,
  Train,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminPassengersPage() {
  usePageTitle('Passenger Directory | Admin')
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [travelClass, setTravelClass] = useState<string>('')
  const [page, setPage] = useState(1)
  const limit = 25

  const { data, isLoading } = useQuery({
    queryKey: ['admin-passengers', search, travelClass, page],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/passengers', {
        params: {
          search: search || undefined,
          travelClass: travelClass || undefined,
          page,
          limit,
        },
      })
      return data
    },
  })

  const passengers = data?.passengers || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="space-y-6 text-[#3E2B1F] pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UserCheck className="h-5 w-5 text-[#B8860B]" />
          <span className="font-label-caps text-xs font-bold text-[#B8860B] uppercase tracking-wider">
            Yatra Devotees
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
          Passenger Directory
        </h1>
        <p className="text-sm text-[#6F5B47] mt-0.5">
          Comprehensive roster of all pilgrims with unique IDs (P-xxxxxx), travel classes, and seat/room assignments.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A8A78]" />
          <input
            type="text"
            placeholder="Search by P-xxxxxx, name, mobile, or aadhaar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] placeholder:text-[#9A8A78] focus:outline-none focus:border-[#B8860B] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#9A8A78]" />
            <select
              value={travelClass}
              onChange={(e) => {
                setTravelClass(e.target.value)
                setPage(1)
              }}
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-bold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
            >
              <option value="">All Travel Classes</option>
              <option value="ac">AC Train Only</option>
              <option value="non_ac">Non-AC Only</option>
            </select>
          </div>

          <div className="text-xs text-[#6F5B47] font-semibold px-2">
            Total: <strong className="text-[#3E2B1F]">{total}</strong> Passengers
          </div>
        </div>
      </div>

      {/* Passengers Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-[#B8860B]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : passengers.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="h-12 w-12 text-[#9A8A78] mx-auto mb-3 opacity-50" />
            <h3 className="font-bold text-lg text-[#3E2B1F]">No Passengers Found</h3>
            <p className="text-sm text-[#6F5B47] mt-1">Try adjusting your search criteria or travel class filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E9DCC5] text-xs font-bold text-[#6F5B47] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Passenger ID</th>
                  <th className="px-5 py-3.5">Full Name</th>
                  <th className="px-5 py-3.5">Group</th>
                  <th className="px-5 py-3.5">Booking Code</th>
                  <th className="px-5 py-3.5">Class</th>
                  <th className="px-5 py-3.5">Going Seat</th>
                  <th className="px-5 py-3.5">Return Seat</th>
                  <th className="px-5 py-3.5">Room</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DCC5]/60">
                {passengers.map((p: any) => {
                  const bCode = p.bookings?.booking_code || '—'
                  const gCode = p.groups?.group_code || '—'

                  return (
                    <tr key={p.id} className="hover:bg-[#FFFDF8] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#B8860B]">
                        {p.passenger_code}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-[#3E2B1F]">{p.full_name}</div>
                        <div className="text-xs text-[#9A8A78] capitalize">{p.gender || '—'} {p.phone ? `• ${p.phone}` : ''}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.group_id ? (
                          <button
                            onClick={() => navigate(`/admin/groups/${p.group_id}`)}
                            className="font-mono text-xs font-bold text-[#B8860B] hover:underline"
                          >
                            {gCode}
                          </button>
                        ) : (
                          <span className="text-xs text-[#9A8A78]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.booking_id ? (
                          <button
                            onClick={() => navigate(`/admin/bookings/${p.booking_id}`)}
                            className="font-mono text-xs font-bold text-[#3E2B1F] hover:text-[#B8860B]"
                          >
                            {bCode}
                          </button>
                        ) : (
                          <span className="text-xs text-[#9A8A78]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${p.travel_class === 'ac' ? 'bg-[#FFF7E8] text-[#B8860B] border border-[#B8860B]/30' : 'bg-[#FAF7F2] text-[#6F5B47] border border-[#E9DCC5]'}`}>
                          {p.travel_class === 'ac' ? 'AC Train' : 'Non-AC'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {p.goingSeat ? (
                          <span className="font-bold text-[#3E2B1F] flex items-center gap-1">
                            <Train className="h-3 w-3 text-[#B8860B]" />
                            {p.goingSeat}
                          </span>
                        ) : (
                          <span className="text-[#9A8A78] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {p.returnSeat ? (
                          <span className="font-bold text-[#3E2B1F] flex items-center gap-1">
                            <Train className="h-3 w-3 text-[#B8860B]" />
                            {p.returnSeat}
                          </span>
                        ) : (
                          <span className="text-[#9A8A78] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {p.roomNumber ? (
                          <span className="font-bold text-[#3E2B1F] flex items-center gap-1">
                            <BedDouble className="h-3 w-3 text-[#B8860B]" />
                            Room {p.roomNumber}
                          </span>
                        ) : (
                          <span className="text-[#9A8A78] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {p.booking_id && (
                          <button
                            onClick={() => navigate(`/admin/bookings/${p.booking_id}`)}
                            className="text-xs font-bold text-[#B8860B] hover:underline"
                          >
                            View Dossier
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E9DCC5] flex items-center justify-between text-xs text-[#6F5B47]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E9DCC5] disabled:opacity-40 hover:bg-[#FAF7F2]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-[#E9DCC5] disabled:opacity-40 hover:bg-[#FAF7F2]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
