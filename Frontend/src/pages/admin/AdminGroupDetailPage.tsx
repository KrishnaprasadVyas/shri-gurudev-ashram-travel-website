import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  UsersRound,
  Phone,
  Link2,
  Send,
  BedDouble,
  Train,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  IndianRupee,
  Calendar,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminGroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [linkBookingCode, setLinkBookingCode] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [transferPassengerId, setTransferPassengerId] = useState<string | null>(null)
  const [targetGroupCode, setTargetGroupCode] = useState('')
  const [transferReason, setTransferReason] = useState('')

  const { data: groupData, isLoading, error } = useQuery({
    queryKey: ['admin-group', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/groups/${id}`)
      return data
    },
    enabled: Boolean(id),
  })

  usePageTitle(groupData?.group?.group_code ? `Group ${groupData.group.group_code} | Admin` : 'Group Details')

  const linkBookingMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/api/groups/${id}/link-booking`, {
        bookingCode: linkBookingCode.trim(),
      })
      return data
    },
    onSuccess: () => {
      toast.success('Booking linked to group successfully!')
      setShowLinkModal(false)
      setLinkBookingCode('')
      queryClient.invalidateQueries({ queryKey: ['admin-group', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to link booking')
    },
  })

  const transferPassengerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/api/groups/transfer-passenger', {
        passengerId: transferPassengerId,
        targetGroupCode: targetGroupCode.trim(),
        reason: transferReason.trim(),
      })
      return data
    },
    onSuccess: () => {
      toast.success('Passenger transferred successfully!')
      setTransferPassengerId(null)
      setTargetGroupCode('')
      setTransferReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-group', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to transfer passenger')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-[#B8860B] animate-spin" />
      </div>
    )
  }

  if (error || !groupData?.group) {
    return (
      <div className="p-8 text-center bg-[#FFFFFF] rounded-2xl border border-[#E9DCC5]">
        <AlertCircle className="h-10 w-10 text-[#C0392B] mx-auto mb-2" />
        <h2 className="text-xl font-bold text-[#3E2B1F]">Group Not Found</h2>
        <button
          onClick={() => navigate('/admin/groups')}
          className="mt-4 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold"
        >
          Back to Groups
        </button>
      </div>
    )
  }

  const { group, summary, passengers = [], roomAllocations = [] } = groupData
  const bookings = group.bookings || []

  return (
    <div className="space-y-8 text-[#3E2B1F] pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate('/admin/groups')}
            className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#6F5B47] transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#B8860B] text-white">
                {group.group_code}
              </span>
              <span className="text-xs text-[#9A8A78]">Created {new Date(group.created_at).toLocaleDateString('en-IN')}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
              {group.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B8860B] text-white font-bold text-sm hover:bg-[#8C6A0A] transition-all shadow-md cursor-pointer"
          >
            <Link2 className="h-4 w-4" />
            <span>Link Late Booking</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5]">
          <span className="text-xs text-[#6F5B47] font-medium">Linked Bookings</span>
          <p className="font-display text-2xl font-bold text-[#3E2B1F] mt-1">{summary.totalBookings}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5]">
          <span className="text-xs text-[#6F5B47] font-medium">Total Passengers</span>
          <p className="font-display text-2xl font-bold text-[#3E2B1F] mt-1">{summary.totalPassengers}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5]">
          <span className="text-xs text-[#6F5B47] font-medium">Class Breakdown</span>
          <p className="text-sm font-bold text-[#3E2B1F] mt-2">
            <span className="text-[#B8860B]">{summary.acPassengers} AC</span> / <span>{summary.nonAcPassengers} Non-AC</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5]">
          <span className="text-xs text-[#6F5B47] font-medium">Total Amount</span>
          <p className="font-display text-xl font-bold text-[#3E2B1F] mt-1">₹{summary.totalAmount.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5]">
          <span className="text-xs text-[#6F5B47] font-medium">Total Received</span>
          <p className="font-display text-xl font-bold text-[#2E7D32] mt-1">₹{summary.totalPaid.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5]">
          <span className="text-xs text-[#6F5B47] font-medium">Pending Balance</span>
          <p className={`font-display text-xl font-bold mt-1 ${summary.pendingBalance > 0 ? 'text-[#C0392B]' : 'text-[#2E7D32]'}`}>
            ₹{summary.pendingBalance.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Linked Bookings Table */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[#B8860B]" />
          <span>Linked Bookings ({bookings.length})</span>
        </h2>

        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E9DCC5] text-xs font-bold text-[#6F5B47] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Booking Code</th>
                  <th className="px-5 py-3.5">Lead Passenger</th>
                  <th className="px-5 py-3.5">Mobile</th>
                  <th className="px-5 py-3.5">Devotees</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Paid</th>
                  <th className="px-5 py-3.5">Pending</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DCC5]/60">
                {bookings.map((b: any) => {
                  const bPending = Math.max(0, Number(b.total_amount || 0) - Number(b.total_paid || 0))
                  return (
                    <tr key={b.id} className="hover:bg-[#FFFDF8] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#B8860B]">
                        {b.booking_code}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#3E2B1F]">
                        {b.lead_passenger_name}
                      </td>
                      <td className="px-5 py-3.5 text-[#6F5B47]">
                        {b.mobile}
                      </td>
                      <td className="px-5 py-3.5 text-[#3E2B1F]">
                        {b.traveler_count}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#3E2B1F]">
                        ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-[#2E7D32] font-semibold">
                        ₹{Number(b.total_paid || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-[#C0392B] font-bold">
                        ₹{bPending.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF7F2] border border-[#E9DCC5] text-[#6F5B47]">
                          {b.status || b.booking_status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/admin/bookings/${b.id}`)}
                          className="text-xs font-bold text-[#B8860B] hover:underline"
                        >
                          View Booking
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Passengers Dossier Table */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-[#B8860B]" />
          <span>All Group Passengers ({passengers.length})</span>
        </h2>

        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E9DCC5] text-xs font-bold text-[#6F5B47] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Passenger ID</th>
                  <th className="px-5 py-3.5">Full Name</th>
                  <th className="px-5 py-3.5">Gender / Age</th>
                  <th className="px-5 py-3.5">Travel Class</th>
                  <th className="px-5 py-3.5">Mobile</th>
                  <th className="px-5 py-3.5">WhatsApp</th>
                  <th className="px-5 py-3.5">Stations</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DCC5]/60">
                {passengers.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#FFFDF8] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#B8860B]">
                      {p.passenger_code}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#3E2B1F]">
                      {p.full_name}
                    </td>
                    <td className="px-5 py-3.5 text-[#6F5B47] capitalize">
                      {p.gender || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${p.travel_class === 'ac' ? 'bg-[#FFF7E8] text-[#B8860B] border border-[#B8860B]/30' : 'bg-[#FAF7F2] text-[#6F5B47] border border-[#E9DCC5]'}`}>
                        {p.travel_class === 'ac' ? 'AC Train' : 'Non-AC'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#6F5B47]">
                      {p.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[#6F5B47]">
                      {p.whatsapp_number || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#9A8A78]">
                      {p.boarding_station || 'NDLS'} → {p.destination_station || 'SVDK'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setTransferPassengerId(p.id)}
                        className="text-xs font-bold text-[#6F5B47] hover:text-[#B8860B] border border-[#E9DCC5] hover:border-[#B8860B] px-3 py-1 rounded-full transition-colors"
                      >
                        Transfer Group
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Link Late Booking Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E9DCC5] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Link Booking to Group</h3>
              <button onClick={() => setShowLinkModal(false)} className="p-1 rounded-full hover:bg-[#FAF7F2] text-[#6F5B47]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#6F5B47]">
              Enter the Booking Code (e.g. <code>MVT-260914-0001</code>) to move this booking and all its passengers into <strong>{group.group_code}</strong>.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!linkBookingCode.trim()) {
                  toast.error('Booking code is required')
                  return
                }
                linkBookingMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Booking Code
                </label>
                <input
                  type="text"
                  placeholder="MVT-YYMMDD-XXXX"
                  value={linkBookingCode}
                  onChange={(e) => setLinkBookingCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-mono text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-5 py-2.5 rounded-full text-[#6F5B47] text-sm font-semibold hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkBookingMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold hover:bg-[#8C6A0A] disabled:opacity-50 cursor-pointer"
                >
                  {linkBookingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Link to Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Passenger Modal */}
      {transferPassengerId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E9DCC5] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Transfer Passenger</h3>
              <button onClick={() => setTransferPassengerId(null)} className="p-1 rounded-full hover:bg-[#FAF7F2] text-[#6F5B47]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#6F5B47]">
              Specify the target Group Code (e.g. <code>GRP-0002</code>) to transfer this passenger.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!targetGroupCode.trim()) {
                  toast.error('Target group code is required')
                  return
                }
                transferPassengerMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Target Group Code *
                </label>
                <input
                  type="text"
                  placeholder="GRP-XXXX"
                  value={targetGroupCode}
                  onChange={(e) => setTargetGroupCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-mono text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Transfer Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason for passenger transfer..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferPassengerId(null)}
                  className="px-5 py-2.5 rounded-full text-[#6F5B47] text-sm font-semibold hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferPassengerMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold hover:bg-[#8C6A0A] disabled:opacity-50 cursor-pointer"
                >
                  {transferPassengerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
