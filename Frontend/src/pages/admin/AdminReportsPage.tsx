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
    <div className="space-y-8 text-[#3E2B1F]">
      {/* Top Header Card */}
      <div className="p-8 sm:p-10 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] relative overflow-hidden flex flex-col justify-between gap-3">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(140,106,10,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
            <span className="font-label-caps text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8860B]">
              Sacred Administration • Export Center
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">
            Reports & Manifest Exports
          </h1>
          <p className="text-sm font-normal text-[#6F5B47] leading-relaxed">
            Generate and download complete passenger manifests, identity verification records, and financial transaction ledgers in CSV format for Ashram staff.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-[16px] bg-[#FFFFFF] border border-[#B8860B]/40 shadow-sm text-[#3E2B1F] text-xs font-semibold flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#B8860B] animate-pulse" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passenger Manifest Card */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#B8860B]/15 border border-[#B8860B]/30 text-[#B8860B] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Yatra Passenger Manifest</h3>
                <p className="text-xs text-[#6F5B47]">Export complete list of passengers, Aadhaar, room & transit choices</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-2">Filter by Yatra Package (Optional)</label>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full px-4 py-3 rounded-[16px] bg-[#FFFFFF] border border-[#E9DCC5] text-xs font-medium text-[#3E2B1F] focus:border-[#B8860B] outline-none shadow-2xs"
              >
                <option value="">All Active & Past Yatras</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={exportPassengerManifest}
            disabled={exporting}
            className="w-full py-3.5 px-6 rounded-full bg-[#B8860B] hover:bg-[#6F5200] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(140,106,10,0.25)] disabled:opacity-60 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? 'Generating CSV Manifest...' : 'Export Passenger Manifest (CSV)'}</span>
          </button>
        </div>

        {/* Financial Ledger Card */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#2E7D32]/15 border border-[#2E7D32]/30 text-[#2E7D32] flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Financial Ledger & Gateway Fees</h3>
                <p className="text-xs text-[#6F5B47]">Export monetary transactions, gateway fees, and booking totals</p>
              </div>
            </div>

            <p className="text-xs text-[#6F5B47] leading-relaxed pt-1">
              Generates detailed financial report listing base package costs, transport add-ons, room add-ons, convenience fee collections, and payment statuses.
            </p>
          </div>

          <button
            type="button"
            onClick={exportFinancialLedger}
            disabled={exporting}
            className="w-full py-3.5 px-6 rounded-full bg-[#2E7D32] hover:bg-[#1b4d1f] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(46,125,50,0.25)] disabled:opacity-60 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? 'Generating Ledger...' : 'Export Financial Ledger (CSV)'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
