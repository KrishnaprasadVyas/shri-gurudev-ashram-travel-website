import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Ticket,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Train,
  Download,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminTicketUploadPage() {
  usePageTitle('Ticket Upload & Mapping | Admin')
  const queryClient = useQueryClient()

  const [file, setFile] = useState<File | null>(null)
  const [journeyType, setJourneyType] = useState<'going' | 'return'>('going')
  const [travelClass, setTravelClass] = useState<'ac' | 'non_ac'>('ac')
  const [uploading, setUploading] = useState(false)

  // Upload Result State
  const [ticketResult, setTicketResult] = useState<any | null>(null)
  const [pnr, setPnr] = useState('')
  const [trainNumber, setTrainNumber] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [passengerRows, setPassengerRows] = useState<any[]>([])

  // Available platform passengers for mapping dropdown
  const { data: passData } = useQuery({
    queryKey: ['all-passengers-for-mapping'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/passengers', { params: { limit: 500 } })
      return data.passengers as any[]
    },
  })

  const availablePassengers = passData || []

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a ticket PDF')

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('ticket', file)
      formData.append('journeyType', journeyType)
      formData.append('travelClass', travelClass)

      const { data } = await apiClient.post('/api/train-journeys/upload-ticket', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setTicketResult(data.ticket)
      setPnr(data.ticket.pnr || '')
      setTrainNumber(data.ticket.trainNumber || '')
      setDepartureDate(data.ticket.departureDate || '')

      // Initialize mapping rows with suggestions
      const suggested = data.ticket.suggestedPassengers || []
      const rows = suggested.map((s: any) => {
        // Try auto-matching by name
        const match = availablePassengers.find((ap: any) =>
          ap.full_name?.toLowerCase().trim() === s.name?.toLowerCase().trim()
        )
        return {
          suggestedName: s.name,
          passengerId: match?.id || '',
          coach: s.coach || '',
          seatNumber: s.seatNumber || '',
          bookingStatus: s.bookingStatus || 'CNF',
        }
      })

      // If no suggestions parsed, provide empty row
      if (rows.length === 0) {
        rows.push({
          suggestedName: '',
          passengerId: '',
          coach: '',
          seatNumber: '',
          bookingStatus: 'CNF',
        })
      }

      setPassengerRows(rows)
      toast.success('Ticket uploaded! Suggestions parsed by OCR.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload ticket')
    } finally {
      setUploading(false)
    }
  }

  const mapTicketMutation = useMutation({
    mutationFn: async () => {
      if (!ticketResult) throw new Error('No ticket uploaded')
      const validMappings = passengerRows
        .filter((r) => r.passengerId && r.seatNumber)
        .map((r) => ({
          passengerId: r.passengerId,
          coach: r.coach,
          seatNumber: r.seatNumber,
          bookingStatus: r.bookingStatus,
        }))

      if (validMappings.length === 0) {
        throw new Error('Please map at least 1 passenger with a seat number')
      }

      const { data } = await apiClient.post('/api/train-journeys/map-ticket', {
        ticketPdfId: ticketResult.id,
        pnr: pnr.trim(),
        trainNumber: trainNumber.trim(),
        departureDate: departureDate || undefined,
        mappings: validMappings,
      })
      return data
    },
    onSuccess: () => {
      toast.success('All passengers mapped to ticket successfully!')
      setTicketResult(null)
      setFile(null)
      setPassengerRows([])
      queryClient.invalidateQueries({ queryKey: ['admin-passengers'] })
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.error || 'Failed to save mapping')
    },
  })

  const addRow = () => {
    setPassengerRows((prev) => [
      ...prev,
      { suggestedName: '', passengerId: '', coach: '', seatNumber: '', bookingStatus: 'CNF' },
    ])
  }

  const removeRow = (idx: number) => {
    setPassengerRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, field: string, val: string) => {
    setPassengerRows((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: val }
      return updated
    })
  }

  return (
    <div className="space-y-8 text-[#3E2B1F] pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Ticket className="h-5 w-5 text-[#B8860B]" />
          <span className="font-label-caps text-xs font-bold text-[#B8860B] uppercase tracking-wider">
            Ticketing Dispatch
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
          Ticket Upload & Passenger Mapping
        </h1>
        <p className="text-sm text-[#6F5B47] mt-0.5">
          Upload Akbar / IRCTC e-tickets (PDF). The AI parser detects PNR, train number, and suggests seat allocations.
        </p>
      </div>

      {/* Upload Box */}
      {!ticketResult && (
        <form
          onSubmit={handleFileUpload}
          className="p-8 rounded-[24px] bg-[#FFFFFF] border-2 border-dashed border-[#B8860B]/40 hover:border-[#B8860B] transition-all space-y-6 max-w-2xl"
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#FFF7E8] border border-[#B8860B]/20 flex items-center justify-center text-[#B8860B]">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#3E2B1F]">
                Upload Booked Ticket PDF
              </h3>
              <p className="text-xs text-[#6F5B47] mt-1">
                Upload the PDF downloaded from Akbar Portal or IRCTC (Max 10MB)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                Journey Direction
              </label>
              <select
                value={journeyType}
                onChange={(e) => setJourneyType(e.target.value as 'going' | 'return')}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-semibold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              >
                <option value="going">Going Journey (To Katra)</option>
                <option value="return">Return Journey (Return Home)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                Travel Class
              </label>
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value as 'ac' | 'non_ac')}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-semibold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              >
                <option value="ac">AC Class (3A / 2A / 1A)</option>
                <option value="non_ac">Non-AC (Sleeper Class)</option>
              </select>
            </div>
          </div>

          <div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-[#6F5B47] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#B8860B] file:text-white hover:file:bg-[#8C6A0A] file:cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm hover:bg-[#8C6A0A] disabled:opacity-50 transition-all shadow-md cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Parsing PDF & Extracting PNR...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Upload & Parse Ticket Suggestions</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Mapping Interface */}
      {ticketResult && (
        <div className="p-8 rounded-[24px] bg-[#FFFFFF] border border-[#B8860B]/40 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E9DCC5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#3E2B1F]">
                  Parsed Ticket Mapping
                </h3>
                <p className="text-xs text-[#6F5B47]">
                  Verify detected details and map seats to system passengers.
                </p>
              </div>
            </div>

            <button
              onClick={() => setTicketResult(null)}
              className="text-xs font-bold text-[#6F5B47] hover:text-[#C0392B]"
            >
              Cancel & Upload Another
            </button>
          </div>

          {/* Ticket Meta Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                PNR Number *
              </label>
              <input
                type="text"
                placeholder="10-digit PNR"
                value={pnr}
                onChange={(e) => setPnr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] font-mono font-bold text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                Train Number *
              </label>
              <input
                type="text"
                placeholder="e.g. 12425"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] font-bold text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                Departure Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>
          </div>

          {/* Mapping Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#3E2B1F]">
                Passenger Seat Assignments ({passengerRows.length})
              </h4>
              <button
                type="button"
                onClick={addRow}
                className="text-xs font-bold text-[#B8860B] hover:underline"
              >
                + Add Another Seat
              </button>
            </div>

            <div className="border border-[#E9DCC5] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF7F2] border-b border-[#E9DCC5] text-xs font-bold text-[#6F5B47] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Detected Name (PDF)</th>
                    <th className="px-4 py-3">Assign to System Passenger *</th>
                    <th className="px-4 py-3">Coach</th>
                    <th className="px-4 py-3">Seat No. *</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DCC5]/60">
                  {passengerRows.map((row, i) => (
                    <tr key={i} className="hover:bg-[#FFFDF8]">
                      <td className="px-4 py-3 font-medium text-xs text-[#6F5B47]">
                        {row.suggestedName || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.passengerId}
                          onChange={(e) => updateRow(i, 'passengerId', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-semibold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                        >
                          <option value="">Select Pilgrim...</option>
                          {availablePassengers.map((ap: any) => (
                            <option key={ap.id} value={ap.id}>
                              {ap.passenger_code} — {ap.full_name} ({ap.travel_class?.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="e.g. B3"
                          value={row.coach}
                          onChange={(e) => updateRow(i, 'coach', e.target.value)}
                          className="w-20 px-2 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-bold text-center"
                        >
                        </input>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="e.g. 42"
                          value={row.seatNumber}
                          onChange={(e) => updateRow(i, 'seatNumber', e.target.value)}
                          className="w-20 px-2 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-bold text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.bookingStatus}
                          onChange={(e) => updateRow(i, 'bookingStatus', e.target.value)}
                          className="w-20 px-2 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-semibold text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          className="p-1 text-[#9A8A78] hover:text-[#C0392B]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E9DCC5]">
            <button
              type="button"
              onClick={() => setTicketResult(null)}
              className="px-6 py-2.5 rounded-full text-[#6F5B47] text-sm font-semibold hover:bg-[#FAF7F2]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={mapTicketMutation.isPending}
              onClick={() => mapTicketMutation.mutate()}
              className="flex items-center gap-2 px-8 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold hover:bg-[#8C6A0A] disabled:opacity-50 cursor-pointer shadow-md"
            >
              {mapTicketMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Save All Mappings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
