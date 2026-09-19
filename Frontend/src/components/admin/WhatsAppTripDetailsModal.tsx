import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Send,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Phone,
  CheckCheck,
  ShieldCheck,
  Building,
  Train,
  Download,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'

interface WhatsAppTripDetailsModalProps {
  bookingId: string
  bookingCode: string
  defaultMobile?: string
  isOpen: boolean
  onClose: () => void
}

interface ReadinessResponse {
  ready: boolean
  serviceOption: string
  missingFields: string[]
  details: {
    hasGoingTrain: boolean
    hasReturnTrain: boolean
    hasRoom: boolean
    recipientPhone: string
    passengerName: string
  }
}

interface WhatsAppLog {
  id: string
  recipient_phone: string
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  message_id: string
  template_name: string
  created_at: string
  error_message?: string | null
}

export function WhatsAppTripDetailsModal({
  bookingId,
  bookingCode,
  defaultMobile = '',
  isOpen,
  onClose,
}: WhatsAppTripDetailsModalProps) {
  const queryClient = useQueryClient()
  const [mobileNumber, setMobileNumber] = useState(defaultMobile)
  const [resendReason, setResendReason] = useState('')
  const [showResendInput, setShowResendInput] = useState(false)

  // Query readiness
  const { data: readiness, isLoading: readinessLoading, refetch: refetchReadiness } = useQuery<ReadinessResponse>({
    queryKey: ['whatsapp-readiness', bookingId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/whatsapp/readiness/${bookingId}`)
      return res.data
    },
    enabled: isOpen && Boolean(bookingId),
  })

  // Query WhatsApp logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery<{ bookingId: string; logs: WhatsAppLog[] }>({
    queryKey: ['whatsapp-logs', bookingId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/whatsapp/logs/${bookingId}`)
      return res.data
    },
    enabled: isOpen && Boolean(bookingId),
  })

  // Mutation to send trip details
  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/whatsapp/send-trip-details', {
        bookingId,
        overridePhone: mobileNumber.trim() || undefined,
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('📲 Trip details dispatched to WhatsApp successfully!')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs', bookingId] })
      refetchLogs()
      refetchReadiness()
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to dispatch WhatsApp message'
      toast.error(`WhatsApp Dispatch Failed: ${message}`)
    },
  })

  // Mutation to resend
  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/whatsapp/resend', {
        bookingId,
        reason: resendReason.trim() || 'Admin requested resend',
        overridePhone: mobileNumber.trim() || undefined,
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('📲 Trip details resent successfully!')
      setShowResendInput(false)
      setResendReason('')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs', bookingId] })
      refetchLogs()
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to resend WhatsApp message'
      toast.error(`WhatsApp Resend Failed: ${message}`)
    },
  })

  if (!isOpen) return null

  const logs = logsData?.logs || []
  const hasAlreadySent = logs.some((l) => ['sent', 'delivered', 'read'].includes(l.status))

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E9DCC5] rounded-[24px] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9DCC5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-xl text-[#25D366]">
              📲
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#3E2B1F]">
                WhatsApp Trip Details Automation
              </h2>
              <p className="text-xs text-[#6F5B47] font-mono">
                Booking #{bookingCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#E9DCC5] text-[#6F5B47] flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-6 pr-1 flex-1">
          {/* Readiness Gate Banner */}
          {readinessLoading ? (
            <div className="p-4 rounded-[16px] bg-[#FAF7F2] border border-[#E9DCC5] text-xs text-[#B8860B] flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Validating dispatch readiness gate...</span>
            </div>
          ) : readiness?.ready ? (
            <div className="p-4 rounded-[16px] bg-[#2E7D32]/10 border border-[#2E7D32]/30 space-y-1.5">
              <div className="flex items-center gap-2 text-[#2E7D32] font-bold text-sm">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Ready for WhatsApp Dispatch</span>
              </div>
              <p className="text-xs text-[#3E2B1F]">
                All required operational allocations for{' '}
                <span className="font-bold uppercase tracking-wider">{readiness.serviceOption.replace(/_/g, ' ')}</span>{' '}
                are verified.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[16px] bg-[#C68A00]/10 border border-[#C68A00]/30 space-y-2">
              <div className="flex items-center gap-2 text-[#C68A00] font-bold text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Readiness Incomplete — Dispatch Gate Active</span>
              </div>
              <p className="text-xs text-[#3E2B1F]">
                The following required allocations must be completed before dispatching details:
              </p>
              <ul className="list-disc list-inside text-xs font-semibold text-[#C0392B] space-y-0.5">
                {readiness?.missingFields?.map((mf, idx) => (
                  <li key={idx}>{mf}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recipient Phone Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6F5B47] uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#B8860B]" />
              <span>Recipient WhatsApp Mobile Number</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. 919876543210"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E9DCC5] bg-[#FFFFFF] text-[#3E2B1F] text-sm focus:outline-none focus:border-[#B8860B] font-mono"
              />
              <button
                type="button"
                onClick={() => setMobileNumber(readiness?.details?.recipientPhone || defaultMobile)}
                className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-bold text-[#6F5B47] hover:bg-[#E9DCC5]"
              >
                Reset Default
              </button>
            </div>
          </div>

          {/* Official Hindi Template Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#6F5B47] uppercase tracking-wider flex items-center gap-1.5">
                <span>💬 Official Hindi WhatsApp Template Preview</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E9DCC5] text-[#9A8A78]">
                Section 22 Compliant
              </span>
            </div>

            <div className="p-4 rounded-[16px] bg-[#EFEAE2] border border-[#D1C7B7] text-xs text-[#111B21] font-sans leading-relaxed whitespace-pre-wrap space-y-2 shadow-inner">
              <p className="font-bold text-[#075E54]">🛕 माँ वैष्णवी पर्यटन</p>
              <p>प्रिय यात्री जी, आपकी यात्रा संबंधी जानकारी:</p>
              <div className="bg-white/80 p-3 rounded-lg border border-black/5 font-mono text-[11px] space-y-1">
                <p>🆔 <strong>Booking ID:</strong> {bookingCode}</p>
                <p>👤 <strong>Passenger:</strong> {readiness?.details?.passengerName || 'Devotee'}</p>
                {readiness?.serviceOption !== 'only_room' && (
                  <p className="flex items-center gap-1 text-[#075E54]">
                    <Train className="h-3.5 w-3.5" /> <strong>Train:</strong> Confirmed Going & Return Allocation
                  </p>
                )}
                <p className="flex items-center gap-1 text-[#B8860B]">
                  <Building className="h-3.5 w-3.5" /> <strong>Room/Hotel:</strong> Verified Stay Allocation
                </p>
              </div>
              <p className="text-[11px] text-[#54656F]">
                📎 आधिकारिक यात्रा टिकट PDF इस संदेश के साथ संलग्न है।
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-black/5 text-[11px] text-[#25D366] font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Signed PDF Stream Link Ready</span>
              </div>
            </div>
          </div>

          {/* Signed PDF Attachment Indicator */}
          <div className="p-3 rounded-[14px] bg-[#FAF7F2] border border-[#E9DCC5] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#3E2B1F]">
              <FileText className="h-4 w-4 text-[#B8860B]" />
              <span className="font-semibold">Attached Ticket:</span>
              <span className="font-mono text-[#6F5B47]">MAVT_Ticket_{bookingCode}.pdf</span>
            </div>
            <a
              href={`/api/bookings/${bookingId}/ticket-pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-[#B8860B] hover:underline font-bold flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Preview PDF</span>
            </a>
          </div>

          {/* Dispatch Logs / History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#6F5B47] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#B8860B]" />
                <span>Dispatch Log History ({logs.length})</span>
              </label>
              <button
                type="button"
                onClick={() => refetchLogs()}
                className="text-[11px] font-semibold text-[#B8860B] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            {logsLoading ? (
              <p className="text-xs text-[#9A8A78]">Loading communication history...</p>
            ) : logs.length === 0 ? (
              <div className="p-3 rounded-[12px] bg-[#FAF7F2] text-xs text-[#9A8A78] text-center">
                No previous WhatsApp dispatches recorded for this booking.
              </div>
            ) : (
              <div className="divide-y divide-[#F1E9D8] border border-[#E9DCC5] rounded-[14px] overflow-hidden text-xs">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 flex items-center justify-between bg-white hover:bg-[#FAF7F2]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#3E2B1F]">{log.recipient_phone}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.status === 'read' || log.status === 'delivered' || log.status === 'sent'
                              ? 'bg-[#2E7D32]/15 text-[#2E7D32]'
                              : 'bg-[#C0392B]/15 text-[#C0392B]'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9A8A78]">
                        Msg ID: {log.message_id} • {new Date(log.created_at).toLocaleString('en-IN')}
                      </p>
                      {log.error_message && (
                        <p className="text-[10px] text-[#C0392B] font-semibold">{log.error_message}</p>
                      )}
                    </div>
                    <CheckCheck className="h-4 w-4 text-[#2E7D32]" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resend Reason Box (if requested) */}
          {showResendInput && (
            <div className="p-4 rounded-[16px] bg-[#FAF7F2] border border-[#E9DCC5] space-y-3">
              <label className="text-xs font-bold text-[#6F5B47] uppercase tracking-wider block">
                Reason for Resend (Saved to Audit Log)
              </label>
              <input
                type="text"
                value={resendReason}
                onChange={(e) => setResendReason(e.target.value)}
                placeholder="e.g. Devotee changed phone number / requested duplicate copy"
                className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-white text-xs text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResendInput(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#E9DCC5] text-xs font-semibold text-[#6F5B47]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resendMutation.isPending}
                  onClick={() => resendMutation.mutate()}
                  className="px-4 py-1.5 rounded-xl bg-[#B8860B] hover:bg-[#8C6A0A] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {resendMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>Confirm Resend</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-4 border-t border-[#E9DCC5] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#E9DCC5] text-xs font-bold text-[#6F5B47] hover:bg-[#FAF7F2]"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {hasAlreadySent && !showResendInput && (
              <button
                type="button"
                onClick={() => setShowResendInput(true)}
                className="px-4 py-2 rounded-full border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B]/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Resend Details</span>
              </button>
            )}

            <button
              type="button"
              disabled={sendMutation.isPending || (readiness && !readiness.ready)}
              onClick={() => sendMutation.mutate()}
              className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                readiness && !readiness.ready
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#25D366] hover:bg-[#1EBE5D] text-white hover:scale-102'
              }`}
            >
              {sendMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>📲 Send on WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
