import { useQuery } from '@tanstack/react-query'
import { X, Printer, Loader2, CheckCircle2 } from 'lucide-react'
import apiClient from '@/lib/apiClient'

interface CashReceiptModalProps {
  paymentId: string | null
  isOpen: boolean
  onClose: () => void
}

interface CashReceiptData {
  receiptNumber: string
  paymentId: string
  bookingCode: string
  passengerName: string
  mobile: string
  amount: number
  paymentMode: string
  utr?: string | null
  receivedBy: string
  timestamp: string
  status: string
  remarks?: string
}

export function CashReceiptModal({ paymentId, isOpen, onClose }: CashReceiptModalProps) {
  const { data: receipt, isLoading } = useQuery<CashReceiptData>({
    queryKey: ['cash-receipt', paymentId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/admin/payments/${paymentId}/cash-receipt`)
      return res.data
    },
    enabled: isOpen && Boolean(paymentId),
  })

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E9DCC5] rounded-[24px] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Header - Screen only */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9DCC5] print:hidden">
          <div className="flex items-center gap-2 text-sm font-bold text-[#3E2B1F]">
            <span>🧾 Cash Payment Receipt Voucher</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E9DCC5] text-[#6F5B47] flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#B8860B] text-xs">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading receipt data...</span>
          </div>
        ) : receipt ? (
          <div id="printable-receipt" className="space-y-6 text-[#3E2B1F]">
            {/* Ashram Title Banner */}
            <div className="text-center pb-4 border-b-2 border-dashed border-[#B8860B]/40 space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8860B]">
                ॥ श्री गुरुदेव नमः ॥
              </p>
              <h1 className="font-display text-2xl font-bold text-[#3E2B1F]">
                माँ वैष्णवी टूरिज़्म
              </h1>
              <p className="text-xs text-[#6F5B47]">
                Maa Vaishnavi Tourism & Ashram Seva Kendra
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E9DCC5] text-[11px] font-mono font-bold text-[#B8860B]">
                  Receipt No: {receipt.receiptNumber}
                </span>
              </div>
            </div>

            {/* Receipt Details Grid */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F1E9D8]">
                <span className="text-[#6F5B47] font-semibold">Booking Reference:</span>
                <span className="font-mono font-bold text-[#3E2B1F]">{receipt.bookingCode || '—'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#F1E9D8]">
                <span className="text-[#6F5B47] font-semibold">Devotee / Passenger:</span>
                <span className="font-bold text-[#3E2B1F]">{receipt.passengerName || 'Devotee'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#F1E9D8]">
                <span className="text-[#6F5B47] font-semibold">Mobile Number:</span>
                <span className="font-mono text-[#3E2B1F]">{receipt.mobile || '—'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#F1E9D8]">
                <span className="text-[#6F5B47] font-semibold">Payment Mode:</span>
                <span className="font-bold uppercase text-[#2E7D32]">{receipt.paymentMode}</span>
              </div>

              {receipt.utr && (
                <div className="flex justify-between py-1.5 border-b border-[#F1E9D8]">
                  <span className="text-[#6F5B47] font-semibold">UTR / Transaction Ref:</span>
                  <span className="font-mono text-[#3E2B1F]">{receipt.utr}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-[#F1E9D8]">
                <span className="text-[#6F5B47] font-semibold">Date & Time:</span>
                <span className="text-[#3E2B1F]">{new Date(receipt.timestamp).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#F1E9D8]">
                <span className="text-[#6F5B47] font-semibold">Desk Cashier / Staff:</span>
                <span className="font-semibold text-[#3E2B1F]">{receipt.receivedBy}</span>
              </div>

              {receipt.remarks && (
                <div className="flex justify-between py-1.5 border-b border-[#F1E9D8]">
                  <span className="text-[#6F5B47] font-semibold">Remarks:</span>
                  <span className="text-[#3E2B1F] italic">{receipt.remarks}</span>
                </div>
              )}

              {/* Grand Total Amount Highlight */}
              <div className="p-4 rounded-[16px] bg-[#FAF7F2] border border-[#B8860B]/30 flex items-center justify-between mt-3">
                <span className="font-display text-sm font-bold text-[#6F5B47]">Total Amount Paid:</span>
                <span className="font-display text-2xl font-bold text-[#2E7D32]">
                  ₹{receipt.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Acknowledgment & Stamp */}
            <div className="pt-6 flex justify-between items-end text-[11px] text-[#6F5B47]">
              <div className="flex items-center gap-1 text-[#2E7D32] font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified Cash Desk Voucher</span>
              </div>
              <div className="text-right">
                <div className="h-10 border-b border-dashed border-gray-400 w-32 mb-1" />
                <span>Authorized Signature</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer Actions - Screen only */}
        <div className="pt-4 border-t border-[#E9DCC5] flex items-center justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#E9DCC5] text-xs font-bold text-[#6F5B47] hover:bg-[#FAF7F2]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-full bg-[#B8860B] hover:bg-[#8C6A0A] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  )
}
