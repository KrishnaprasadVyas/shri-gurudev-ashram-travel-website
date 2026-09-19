import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Train,
  Download,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
  Info,
  Calendar,
  UsersRound,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminTrainExportPage() {
  usePageTitle('Train Booking Manifest Export | Admin')

  const [travelType, setTravelType] = useState('')
  const [journeyType, setJourneyType] = useState('')
  const [groupId, setGroupId] = useState('')
  const [downloading, setDownloading] = useState(false)

  const { data: groupsData } = useQuery({
    queryKey: ['admin-groups-list'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/groups')
      return data.groups as any[]
    },
  })

  const handleDownload = async (customSheet?: string) => {
    try {
      setDownloading(true)
      const params = new URLSearchParams()
      if (customSheet) {
        params.append('sheet', customSheet)
      } else {
        if (travelType) params.append('travelType', travelType)
        if (journeyType) params.append('journeyType', journeyType)
        if (groupId) params.append('groupId', groupId)
      }

      const response = await apiClient.get(`/api/train-journeys/export/excel?${params.toString()}`, {
        responseType: 'blob',
      })

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = customSheet
        ? `MAVT_Train_Manifest_${customSheet}.xlsx`
        : `MAVT_Train_Booking_Manifest_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Excel manifest downloaded successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to download manifest')
    } finally {
      setDownloading(false)
    }
  }

  const groups = groupsData || []

  return (
    <div className="space-y-8 text-[#3E2B1F] pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Train className="h-5 w-5 text-[#B8860B]" />
            <span className="font-label-caps text-xs font-bold text-[#B8860B] uppercase tracking-wider">
              Akbar Portal Manifest Engine
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
            Train Booking Manifest Export
          </h1>
          <p className="text-sm text-[#6F5B47] mt-0.5">
            Export ready-to-book passenger manifests formatted for agent bulk ticket processing.
          </p>
        </div>

        <button
          onClick={() => handleDownload()}
          disabled={downloading}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm hover:bg-[#8C6A0A] transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>{downloading ? 'Generating Excel...' : '1-Click Download 4-Sheet Manifest'}</span>
        </button>
      </div>

      {/* Akbar Portal Workflow Instructions Box */}
      <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#B8860B]/40 shadow-[0_6px_20px_rgba(184,134,11,0.06)] space-y-3">
        <div className="flex items-center gap-2.5 text-[#B8860B]">
          <Info className="h-5 w-5 shrink-0" />
          <h3 className="font-display text-base font-bold text-[#3E2B1F]">
            Section 13 & 14 Operational Specification: Akbar Portal Workflow
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#6F5B47] leading-relaxed">
          The exported Excel workbook generates <strong>4 distinct formatted sheets</strong>:
          <br />
          <strong>1. Going - AC</strong> • <strong>2. Going - Non-AC</strong> • <strong>3. Return - AC</strong> • <strong>4. Return - Non-AC</strong>
          <br />
          Each sheet separates passengers by Group headers with <strong>exactly 1 blank row between groups</strong> so booking agents can book family/friend units together on IRCTC / Akbar portal. Once booked, upload the resulting PDF in <em>Ticket Upload & Mapping</em>.
        </p>
      </div>

      {/* 4 Separate Sheet Quick-Download Cards */}
      <div>
        <h2 className="font-display text-lg font-bold text-[#3E2B1F] mb-4">
          Individual Sheet Quick Exports
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'going-ac', label: 'Going — AC Class', desc: 'Outbound AC 3-Tier / 2-Tier passengers' },
            { id: 'going-non-ac', label: 'Going — Non-AC', desc: 'Outbound Sleeper class pilgrims' },
            { id: 'return-ac', label: 'Return — AC Class', desc: 'Inbound AC 3-Tier / 2-Tier returnees' },
            { id: 'return-non-ac', label: 'Return — Non-AC', desc: 'Inbound Sleeper class returnees' },
          ].map((sheet) => (
            <div
              key={sheet.id}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF7E8] border border-[#B8860B]/20 flex items-center justify-center text-[#B8860B] mb-3">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-[#3E2B1F]">{sheet.label}</h4>
                <p className="text-xs text-[#9A8A78] mt-1">{sheet.desc}</p>
              </div>

              <button
                onClick={() => handleDownload(sheet.id)}
                disabled={downloading}
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#B8860B] text-[#6F5B47] hover:text-white text-xs font-bold transition-colors cursor-pointer border border-[#E9DCC5]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Sheet</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filtered Custom Export */}
      <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-xs space-y-4">
        <h3 className="font-display text-base font-bold text-[#3E2B1F] flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#B8860B]" />
          <span>Filtered Custom Manifest Export</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
              Travel Class
            </label>
            <select
              value={travelType}
              onChange={(e) => setTravelType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-bold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
            >
              <option value="">All Travel Classes</option>
              <option value="ac">AC Travel Only</option>
              <option value="non_ac">Non-AC Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
              Journey Direction
            </label>
            <select
              value={journeyType}
              onChange={(e) => setJourneyType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-bold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
            >
              <option value="">Both Directions (Going & Return)</option>
              <option value="going">Going Only</option>
              <option value="return">Return Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
              Specific Group
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-bold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
            >
              <option value="">All Groups (Consolidated)</option>
              {groups.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.group_code} — {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleDownload()}
            disabled={downloading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#3E2B1F] text-[#FAF7F2] font-bold text-xs hover:bg-[#B8860B] transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Filtered Export</span>
          </button>
        </div>
      </div>
    </div>
  )
}
