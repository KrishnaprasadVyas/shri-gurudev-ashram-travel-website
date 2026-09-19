import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UsersRound,
  Search,
  Plus,
  ArrowRight,
  Phone,
  Calendar,
  IndianRupee,
  Loader2,
  X,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminGroupsPage() {
  usePageTitle('Groups Management | Admin')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupMobile, setNewGroupMobile] = useState('')
  const [newGroupNotes, setNewGroupNotes] = useState('')

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['admin-groups', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/groups', { params: { search } })
      return data.groups as any[]
    },
  })

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/api/groups', {
        name: newGroupName,
        leadMobile: newGroupMobile,
        notes: newGroupNotes,
      })
      return data.group
    },
    onSuccess: (g) => {
      toast.success(`Group ${g.group_code} created successfully!`)
      setShowModal(false)
      setNewGroupName('')
      setNewGroupMobile('')
      setNewGroupNotes('')
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] })
      navigate(`/admin/groups/${g.id}`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create group')
    },
  })

  const groups = groupsData || []

  return (
    <div className="space-y-6 text-[#3E2B1F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UsersRound className="h-5 w-5 text-[#B8860B]" />
            <span className="font-label-caps text-xs font-bold text-[#B8860B] uppercase tracking-wider">
              Yatra Master Grouping
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
            Pilgrim Groups
          </h1>
          <p className="text-sm text-[#6F5B47] mt-0.5">
            Manage collective groups (GRP-xxxx), linked bookings, seat manifests, and room quotas.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#B8860B] text-white font-bold text-sm hover:bg-[#8C6A0A] transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A8A78]" />
          <input
            type="text"
            placeholder="Search by GRP-xxxx, name, or lead mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] placeholder:text-[#9A8A78] focus:outline-none focus:border-[#B8860B] transition-all"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-[#6F5B47] font-semibold px-2">
          <span>Total: <strong className="text-[#3E2B1F]">{groups.length}</strong> Groups</span>
        </div>
      </div>

      {/* Groups Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-[#B8860B]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFFFF] rounded-2xl border border-[#E9DCC5]">
          <UsersRound className="h-12 w-12 text-[#9A8A78] mx-auto mb-3 opacity-50" />
          <h3 className="font-bold text-lg text-[#3E2B1F]">No Groups Found</h3>
          <p className="text-sm text-[#6F5B47] mt-1">Create a new group or adjust your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map((group) => {
            const bookingsCount = group.bookings?.length || 0
            const totalAmount = (group.bookings || []).reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0)
            const totalPaid = (group.bookings || []).reduce((s: number, b: any) => s + Number(b.total_paid || 0), 0)
            const pending = Math.max(0, totalAmount - totalPaid)

            return (
              <div
                key={group.id}
                onClick={() => navigate(`/admin/groups/${group.id}`)}
                className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] transition-all shadow-[0_4px_20px_rgba(90,70,20,0.04)] hover:shadow-[0_8px_30px_rgba(184,134,11,0.1)] cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF7E8] text-[#B8860B] border border-[#B8860B]/20">
                      {group.group_code}
                    </span>
                    <span className="text-xs text-[#9A8A78] flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(group.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#3E2B1F] group-hover:text-[#B8860B] transition-colors line-clamp-1">
                    {group.name}
                  </h3>

                  {group.lead_mobile && (
                    <p className="text-xs text-[#6F5B47] flex items-center gap-1.5 mt-1 font-medium">
                      <Phone className="h-3 w-3 text-[#B8860B]" />
                      {group.lead_mobile}
                    </p>
                  )}

                  {group.notes && (
                    <p className="text-xs text-[#9A8A78] mt-2 line-clamp-2 italic">
                      "{group.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#E9DCC5]/60 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-[#6F5B47]">
                    <span>Linked Bookings:</span>
                    <strong className="text-[#3E2B1F]">{bookingsCount}</strong>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-[#6F5B47]">
                    <span>Total Amount:</span>
                    <strong className="text-[#3E2B1F]">₹{totalAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#6F5B47]">Pending Balance:</span>
                    <strong className={pending > 0 ? 'text-[#C0392B]' : 'text-[#2E7D32]'}>
                      ₹{pending.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div className="pt-2 flex items-center justify-end text-xs font-bold text-[#B8860B] group-hover:translate-x-1 transition-transform">
                    <span>View Group Dossier</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E9DCC5] max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Create New Group</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-[#FAF7F2] text-[#6F5B47]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newGroupName.trim()) {
                  toast.error('Group name is required')
                  return
                }
                createGroupMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Group Name / Family Head *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Family Yatra"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Lead Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={newGroupMobile}
                  onChange={(e) => setNewGroupMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Operational Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any group preferences, relations, room requests..."
                  value={newGroupNotes}
                  onChange={(e) => setNewGroupNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-full text-[#6F5B47] text-sm font-semibold hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGroupMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold hover:bg-[#8C6A0A] disabled:opacity-50 cursor-pointer"
                >
                  {createGroupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
