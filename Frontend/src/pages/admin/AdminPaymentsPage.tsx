import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreditCard,
  Search,
  Plus,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Loader2,
  X,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuth } from '@/context/AuthContext'

export function AdminPaymentsPage() {
  usePageTitle('Payments & Collections | Admin')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()
  const isSuperAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin'

  const [search, setSearch] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('')
  const [page, setPage] = useState(1)
  const limit = 25

  // Modals
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [offlineBookingCode, setOfflineBookingCode] = useState('')
  const [offlineAmount, setOfflineAmount] = useState('')
  const [offlineMode, setOfflineMode] = useState('cash')
  const [offlineUtr, setOfflineUtr] = useState('')
  const [offlineNotes, setOfflineNotes] = useState('')

  const [editingPayment, setEditingPayment] = useState<any | null>(null)
  const [newUtr, setNewUtr] = useState('')
  const [utrCorrectionReason, setUtrCorrectionReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', search, verificationStatus, page],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/payments', {
        params: {
          search: search || undefined,
          verificationStatus: verificationStatus || undefined,
          page,
          limit,
        },
      })
      return data
    },
  })

  const offlinePaymentMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/api/payments/offline', {
        bookingCode: offlineBookingCode.trim(),
        amount: Number(offlineAmount),
        paymentMode: offlineMode,
        utrNumber: offlineUtr.trim() || undefined,
        notes: offlineNotes.trim() || undefined,
      })
      return data
    },
    onSuccess: (res) => {
      toast.success(`Payment ${res.payment?.payment_code} recorded successfully!`)
      setShowOfflineModal(false)
      setOfflineBookingCode('')
      setOfflineAmount('')
      setOfflineUtr('')
      setOfflineNotes('')
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to record payment')
    },
  })

  const utrCorrectionMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.patch(`/api/payments/${editingPayment.id}/utr`, {
        newUtr: newUtr.trim(),
        reason: utrCorrectionReason.trim(),
      })
      return data
    },
    onSuccess: () => {
      toast.success('UTR corrected successfully with audit log!')
      setEditingPayment(null)
      setNewUtr('')
      setUtrCorrectionReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to correct UTR')
    },
  })

  const payments = data?.payments || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="space-y-6 text-[#3E2B1F] pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-5 w-5 text-[#B8860B]" />
            <span className="font-label-caps text-xs font-bold text-[#B8860B] uppercase tracking-wider">
              Financial Collections
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
            Payment Records
          </h1>
          <p className="text-sm text-[#6F5B47] mt-0.5">
            Full ledger of pilgrim offerings and installments (PAY-xxxxxx) with UTR duplicate enforcement.
          </p>
        </div>

        <button
          onClick={() => setShowOfflineModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#B8860B] text-white font-bold text-sm hover:bg-[#8C6A0A] transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Record Offline Payment</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A8A78]" />
          <input
            type="text"
            placeholder="Search by PAY-xxxxxx or UTR number..."
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
              value={verificationStatus}
              onChange={(e) => {
                setVerificationStatus(e.target.value)
                setPage(1)
              }}
              className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-bold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
            >
              <option value="">All Verification Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="text-xs text-[#6F5B47] font-semibold px-2">
            Total: <strong className="text-[#3E2B1F]">{total}</strong> Payments
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-[#B8860B]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-[#9A8A78] mx-auto mb-3 opacity-50" />
            <h3 className="font-bold text-lg text-[#3E2B1F]">No Payments Found</h3>
            <p className="text-sm text-[#6F5B47] mt-1">Record a new payment or change your search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E9DCC5] text-xs font-bold text-[#6F5B47] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Payment Code</th>
                  <th className="px-5 py-3.5">Booking / Group</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Mode</th>
                  <th className="px-5 py-3.5">UTR / Reference</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DCC5]/60">
                {payments.map((p: any) => {
                  const bCode = p.bookings?.booking_code || '—'
                  const gCode = p.bookings?.groups?.group_code || '—'

                  return (
                    <tr key={p.id} className="hover:bg-[#FFFDF8] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#B8860B]">
                        {p.payment_code}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs font-bold text-[#3E2B1F]">{bCode}</div>
                        <div className="text-xs text-[#9A8A78]">{p.bookings?.lead_passenger_name} ({gCode})</div>
                      </td>
                      <td className="px-5 py-3.5 font-display text-base font-bold text-[#2E7D32]">
                        ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 capitalize font-medium text-[#3E2B1F]">
                        {p.payment_mode || 'online'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs">
                        {p.utr_number ? (
                          <span className="bg-[#FAF7F2] border border-[#E9DCC5] px-2 py-0.5 rounded-md font-semibold text-[#3E2B1F]">
                            {p.utr_number}
                          </span>
                        ) : (
                          <span className="text-[#9A8A78]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${p.verification_status === 'verified' ? 'bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20' : p.verification_status === 'rejected' ? 'bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/20' : 'bg-[#C68A00]/10 text-[#C68A00] border border-[#C68A00]/20'}`}>
                          {p.verification_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#9A8A78]">
                        {new Date(p.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setEditingPayment(p)
                              setNewUtr(p.utr_number || '')
                            }}
                            className="text-xs font-bold text-[#6F5B47] hover:text-[#B8860B] border border-[#E9DCC5] hover:border-[#B8860B] px-3 py-1 rounded-full transition-colors flex items-center gap-1 ml-auto"
                            title="Super-Admin UTR Correction"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit UTR</span>
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

      {/* Record Offline Payment Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E9DCC5] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Record Offline Payment</h3>
              <button onClick={() => setShowOfflineModal(false)} className="p-1 rounded-full hover:bg-[#FAF7F2] text-[#6F5B47]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!offlineBookingCode.trim()) return toast.error('Booking Code is required')
                if (!offlineAmount || Number(offlineAmount) <= 0) return toast.error('Valid amount is required')
                offlinePaymentMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Booking Code *
                </label>
                <input
                  type="text"
                  placeholder="MVT-YYMMDD-XXXX"
                  value={offlineBookingCode}
                  onChange={(e) => setOfflineBookingCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-mono text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 5000"
                    value={offlineAmount}
                    onChange={(e) => setOfflineAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-bold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={offlineMode}
                    onChange={(e) => setOfflineMode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-semibold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">Direct UPI / QR</option>
                    <option value="bank_transfer">NEFT / RTGS</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  UTR / Reference Number
                </label>
                <input
                  type="text"
                  placeholder="Bank UTR (Strict duplicate check)"
                  value={offlineUtr}
                  onChange={(e) => setOfflineUtr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-mono text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Staff Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Cash recipient, counter location, reference..."
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfflineModal(false)}
                  className="px-5 py-2.5 rounded-full text-[#6F5B47] text-sm font-semibold hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={offlinePaymentMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold hover:bg-[#8C6A0A] disabled:opacity-50 cursor-pointer"
                >
                  {offlinePaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin UTR Correction Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E9DCC5] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Correct UTR Number</h3>
              <button onClick={() => setEditingPayment(null)} className="p-1 rounded-full hover:bg-[#FAF7F2] text-[#6F5B47]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#6F5B47]">
              Modifying UTR for <strong>{editingPayment.payment_code}</strong> will be permanently recorded in immutable audit logs.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newUtr.trim()) return toast.error('New UTR is required')
                if (!utrCorrectionReason.trim()) return toast.error('Reason for modification is required')
                utrCorrectionMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  New UTR Number *
                </label>
                <input
                  type="text"
                  value={newUtr}
                  onChange={(e) => setNewUtr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-mono text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Reason for Modification *
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why this UTR is being corrected..."
                  value={utrCorrectionReason}
                  onChange={(e) => setUtrCorrectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-5 py-2.5 rounded-full text-[#6F5B47] text-sm font-semibold hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={utrCorrectionMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold hover:bg-[#8C6A0A] disabled:opacity-50 cursor-pointer"
                >
                  {utrCorrectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
