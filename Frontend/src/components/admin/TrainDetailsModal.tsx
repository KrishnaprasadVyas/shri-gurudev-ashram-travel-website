import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Train, Save, RefreshCw } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'

interface TrainDetailsModalProps {
  bookingId: string
  bookingCode: string
  initialBoarding?: string
  initialDestination?: string
  initialGoingDate?: string
  initialReturnDate?: string
  initialTrainArrangement?: string
  isOpen: boolean
  onClose: () => void
}

export function TrainDetailsModal({
  bookingId,
  bookingCode,
  initialBoarding = '',
  initialDestination = '',
  initialGoingDate = '',
  initialReturnDate = '',
  initialTrainArrangement = 'tourism_arranged',
  isOpen,
  onClose,
}: TrainDetailsModalProps) {
  const queryClient = useQueryClient()
  const [boardingStation, setBoardingStation] = useState(initialBoarding)
  const [destinationStation, setDestinationStation] = useState(initialDestination)
  const [goingDate, setGoingDate] = useState(initialGoingDate)
  const [returnDate, setReturnDate] = useState(initialReturnDate)
  const [trainArrangement, setTrainArrangement] = useState(initialTrainArrangement)
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/api/bookings/${bookingId}/train-details`, {
        boardingStation: boardingStation.trim(),
        destinationStation: destinationStation.trim(),
        goingDate: goingDate.trim() || undefined,
        returnDate: returnDate.trim() || undefined,
        trainArrangement,
        transportType: 'Train',
        notes: notes.trim() || undefined,
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('🚆 Train journey details updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['admin-booking', bookingId] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-readiness', bookingId] })
      onClose()
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Failed to update train details'
      toast.error(`Update Failed: ${message}`)
    },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E9DCC5] rounded-[24px] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9DCC5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#B8860B]/15 border border-[#B8860B]/30 flex items-center justify-center text-xl text-[#B8860B]">
              🚆
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#3E2B1F]">
                Train Journey Allocation
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

        {/* Form Body */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-[#6F5B47] uppercase tracking-wider block mb-1">
              Train Arrangement Mode
            </label>
            <select
              value={trainArrangement}
              onChange={(e) => setTrainArrangement(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-white text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
            >
              <option value="tourism_arranged">MAVT Arranged (Ashram / Tourism Express)</option>
              <option value="customer_self_arranged">Customer Self-Arranged Train Travel</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#6F5B47] uppercase tracking-wider block mb-1">
                Boarding Station
              </label>
              <input
                type="text"
                value={boardingStation}
                onChange={(e) => setBoardingStation(e.target.value)}
                placeholder="e.g. NDLS / New Delhi"
                className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-white text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>
            <div>
              <label className="font-bold text-[#6F5B47] uppercase tracking-wider block mb-1">
                Destination Station
              </label>
              <input
                type="text"
                value={destinationStation}
                onChange={(e) => setDestinationStation(e.target.value)}
                placeholder="e.g. SVDK / Katra"
                className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-white text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#6F5B47] uppercase tracking-wider block mb-1">
                Going Journey Date
              </label>
              <input
                type="date"
                value={goingDate}
                onChange={(e) => setGoingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-white text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>
            <div>
              <label className="font-bold text-[#6F5B47] uppercase tracking-wider block mb-1">
                Return Journey Date
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-white text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#6F5B47] uppercase tracking-wider block mb-1">
              Admin Notes / Train Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Train #12425 Rajdhani Exp, PNR confirmed, Coach B2"
              className="w-full px-3 py-2 rounded-xl border border-[#E9DCC5] bg-white text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E9DCC5] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#E9DCC5] text-xs font-bold text-[#6F5B47] hover:bg-[#FAF7F2]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="px-5 py-2 rounded-full bg-[#B8860B] hover:bg-[#8C6A0A] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            {mutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Train Details</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
