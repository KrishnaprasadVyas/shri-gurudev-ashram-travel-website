import { useState, useEffect } from 'react'
import { Download, FileSpreadsheet, Calendar, Filter, Sparkles } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { exportToCsv } from '@/lib/csvExporter'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminReportsPage() {
  usePageTitle('Reports & Manifest Exports')
  const [packages, setPackages] = useState<{ id: string; title: string }[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const res = await apiClient.get('/api/admin/packages')
      if (Array.isArray(res.data?.packages)) {
        setPackages(res.data.packages)
      }
    } catch {
      // Ignore
    }
  }

  const exportPassengerManifest = async () => {
    try {
      setExporting(true)
      setMessage('')
      const res = await apiClient.get(`/api/admin/bookings?limit=1000${selectedPackageId ? `&packageId=${selectedPackageId}` : ''}`)
      const bookings = res.data?.bookings ?? []

      const manifestRows: Record<string, unknown>[] = []

      for (const b of bookings) {
        // Fetch single booking details for passengers
        try {
          const detailRes = await apiClient.get(`/api/admin/bookings/${b.id}`)
          const passengers = detailRes.data?.passengers ?? []

          if (passengers.length === 0) {
            manifestRows.push({
              BookingRef: b.booking_reference,
              YatraPackage: b.packageTitle || b.title,
              LeadUser: b.userName || b.full_name,
              Phone: b.phone_number || b.phone,
              PassengerIndex: 0,
              PassengerName: b.full_name || 'Lead',
              Gender: '-',
              DOB: b.dob || '-',
              AadhaarNumber: '-',
              VerificationStatus: '-',
              RoomType: b.room_type || '-',
              TransportType: b.transport_type || '-',
              BusType: b.bus_type || '-',
              BookingStatus: b.status,
              TotalAmount: b.total_amount,
            })
          } else {
            passengers.forEach((p: Record<string, unknown>) => {
              manifestRows.push({
                BookingRef: b.booking_reference,
                YatraPackage: b.packageTitle || b.title,
                LeadUser: b.userName || b.full_name,
                Phone: b.phone_number || p.phone,
                PassengerIndex: p.passenger_index,
                PassengerName: p.full_name,
                Gender: p.gender,
                DOB: p.dob,
                AadhaarNumber: p.aadhaar_number,
                VerificationStatus: p.verification_status,
                RoomType: b.room_type || '-',
                TransportType: b.transport_type || '-',
                BusType: b.bus_type || '-',
                BookingStatus: b.status,
                TotalAmount: b.total_amount,
              })
            })
          }
        } catch {
          // Ignore failed single fetch
        }
      }

      if (manifestRows.length === 0) {
        setMessage('No passenger records found to export.')
        return
      }

      const filename = `YATRA_PASSENGER_MANIFEST_${new Date().toISOString().split('T')[0]}.csv`
      exportToCsv(filename, manifestRows)
      setMessage(`Successfully exported ${manifestRows.length} passenger records!`)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const exportFinancialLedger = async () => {
    try {
      setExporting(true)
      setMessage('')
      const res = await apiClient.get('/api/admin/bookings?limit=1000')
      const bookings = res.data?.bookings ?? []

      const ledgerRows = bookings.map((b: Record<string, unknown>) => ({
        BookingRef: b.booking_reference,
        Date: b.created_at,
        LeadUser: b.userName || b.full_name,
        YatraPackage: b.packageTitle,
        TravelerCount: b.traveler_count,
        BaseAmount: b.base_amount || 0,
        TransportAmount: b.transport_amount || 0,
        RoomAmount: b.room_amount || 0,
        SevaAmount: b.additional_seva_amount || 0,
        GatewayFee: b.gateway_fee || 0,
        TotalAmount: b.total_amount,
        PayableAmount: b.payable_amount || b.total_amount,
        Status: b.status,
      }))

      if (ledgerRows.length === 0) {
        setMessage('No financial records found.')
        return
      }

      const filename = `YATRA_FINANCIAL_LEDGER_${new Date().toISOString().split('T')[0]}.csv`
      exportToCsv(filename, ledgerRows)
      setMessage(`Successfully exported ${ledgerRows.length} financial transactions!`)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Financial export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f2f0eb]">
          Reports & Export Center
        </h1>
        <p className="text-xs text-[#f2f0eb]/50 mt-1">
          Export passenger manifests and financial ledgers in CSV format for Ashram staff
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passenger Manifest Card */}
        <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20 space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <FileSpreadsheet className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-bold text-[#f2f0eb]">Yatra Passenger Manifest</h3>
              <p className="text-xs text-[#f2f0eb]/50">Export complete list of passengers, Aadhaar, room & transit choices</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#f2f0eb]/70 mb-1">Filter by Yatra Package (Optional)</label>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-900/30 text-xs text-[#f2f0eb]"
            >
              <option value="">All Active & Past Yatras</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exportPassengerManifest}
            disabled={exporting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white text-xs hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Generating CSV Manifest...' : 'Export Passenger Manifest (CSV)'}
          </button>
        </div>

        {/* Financial Ledger Card */}
        <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20 space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-bold text-[#f2f0eb]">Financial Ledger & Gateway Fees</h3>
              <p className="text-xs text-[#f2f0eb]/50">Export monetary transactions, 2% fees, and booking totals</p>
            </div>
          </div>

          <p className="text-xs text-[#f2f0eb]/60 leading-relaxed pt-2">
            Generates detailed financial report listing base package costs, transport add-ons, room add-ons, convenience fee collections, and payment statuses.
          </p>

          <button
            onClick={exportFinancialLedger}
            disabled={exporting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-white text-xs transition-all flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Generating Ledger...' : 'Export Financial Ledger (CSV)'}
          </button>
        </div>
      </div>
    </div>
  )
}
