import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  History,
  Search,
  ShieldCheck,
  Calendar,
  User,
  Filter,
  Loader2,
  FileText,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminAuditLogsPage() {
  usePageTitle('Immutable Audit Trail | Admin')

  const [entityType, setEntityType] = useState('')
  const [limit, setLimit] = useState(50)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', entityType, limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/audit-logs', {
        params: {
          entityType: entityType || undefined,
          limit,
        },
      })
      return data.logs as any[]
    },
  })

  const logs = data || []

  return (
    <div className="space-y-6 text-[#3E2B1F] pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <History className="h-5 w-5 text-[#B8860B]" />
          <span className="font-label-caps text-xs font-bold text-[#B8860B] uppercase tracking-wider">
            Compliance & Security
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
          Immutable Audit Logs
        </h1>
        <p className="text-sm text-[#6F5B47] mt-0.5">
          Tamper-evident record of all administrative modifications, UTR corrections, transfers, and security events.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-[#9A8A78]" />
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-bold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
          >
            <option value="">All Entities</option>
            <option value="payment">Payments / UTR</option>
            <option value="booking">Bookings</option>
            <option value="group">Groups</option>
            <option value="passenger">Passengers</option>
            <option value="room">Rooms</option>
          </select>
        </div>

        <div className="text-xs text-[#6F5B47] font-semibold px-2">
          Showing latest <strong className="text-[#3E2B1F]">{logs.length}</strong> events
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-[#B8860B]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="h-12 w-12 text-[#2E7D32] mx-auto mb-3 opacity-50" />
            <h3 className="font-bold text-lg text-[#3E2B1F]">No Audit Events</h3>
            <p className="text-sm text-[#6F5B47] mt-1">No modifications recorded for this filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E9DCC5] text-xs font-bold text-[#6F5B47] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity</th>
                  <th className="px-5 py-3.5">Actor ID</th>
                  <th className="px-5 py-3.5">Reason / Description</th>
                  <th className="px-5 py-3.5">State Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DCC5]/60 text-xs">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-[#FFFDF8] transition-colors">
                    <td className="px-5 py-3.5 text-[#9A8A78] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-[#B8860B] bg-[#FFF7E8] px-2 py-0.5 rounded border border-[#B8860B]/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#3E2B1F] capitalize">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#6F5B47]">
                      {log.actor_id ? `${log.actor_id.slice(0, 8)}...` : 'system'}
                    </td>
                    <td className="px-5 py-3.5 text-[#6F5B47] max-w-xs truncate" title={log.reason}>
                      {log.reason || 'Standard operation'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      {log.new_values ? (
                        <span className="text-[#2E7D32]">
                          {JSON.stringify(log.new_values)}
                        </span>
                      ) : (
                        <span className="text-[#9A8A78]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
