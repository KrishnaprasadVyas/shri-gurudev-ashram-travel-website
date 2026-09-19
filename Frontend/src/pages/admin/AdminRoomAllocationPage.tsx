import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Key,
  BedDouble,
  UsersRound,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowLeft,
  Users,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminRoomAllocationPage() {
  usePageTitle('Room Allocation Matrix | Admin')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<string[]>([])

  // Load Room Allocation Matrix
  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['room-allocation-matrix'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/rooms/allocation-matrix')
      return data.matrix as any[]
    },
  })

  // Load Groups for allocation modal
  const { data: groupsData } = useQuery({
    queryKey: ['admin-groups-for-allocation'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/groups')
      return data.groups as any[]
    },
  })

  // Load Group detail when group is selected to get its passengers across bookings
  const { data: groupDetail } = useQuery({
    queryKey: ['group-passengers-for-allocation', selectedGroupId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/groups/${selectedGroupId}`)
      return data
    },
    enabled: Boolean(selectedGroupId),
  })

  const allocateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoom) throw new Error('No room selected')
      if (selectedPassengerIds.length === 0) throw new Error('Select at least 1 passenger')

      const { data } = await apiClient.post('/api/rooms/allocate', {
        roomId: selectedRoom.id,
        passengerIds: selectedPassengerIds,
      })
      return data
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Room allocated successfully!')
      setSelectedRoom(null)
      setSelectedGroupId('')
      setSelectedPassengerIds([])
      queryClient.invalidateQueries({ queryKey: ['room-allocation-matrix'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || 'Failed to allocate room')
    },
  })

  const deallocateMutation = useMutation({
    mutationFn: async (allocationId: string) => {
      const { data } = await apiClient.delete(`/api/rooms/allocation/${allocationId}`)
      return data
    },
    onSuccess: () => {
      toast.success('Passenger deallocated from room')
      queryClient.invalidateQueries({ queryKey: ['room-allocation-matrix'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to deallocate')
    },
  })

  const matrix = matrixData || []
  const groups = groupsData || []
  const groupPassengers = groupDetail?.passengers || []

  const togglePassenger = (id: string) => {
    setSelectedPassengerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-8 text-[#3E2B1F] pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate('/admin/rooms')}
            className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#6F5B47] transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Key className="h-5 w-5 text-[#B8860B]" />
              <span className="font-label-caps text-xs font-bold text-[#B8860B] uppercase tracking-wider">
                Cross-Booking Sharing Support
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
              Room Allocation Matrix
            </h1>
            <p className="text-sm text-[#6F5B47] mt-0.5">
              Visual room occupancy manager supporting family/friend room-sharing across different Booking IDs in the same Group.
            </p>
          </div>
        </div>
      </div>

      {/* Matrix Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-[#B8860B]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : matrix.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFFFF] rounded-2xl border border-[#E9DCC5]">
          <BedDouble className="h-12 w-12 text-[#9A8A78] mx-auto mb-3 opacity-50" />
          <h3 className="font-bold text-lg text-[#3E2B1F]">No Rooms Configured</h3>
          <p className="text-sm text-[#6F5B47] mt-1">Configure rooms in the Rooms Master catalog first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matrix.map((room) => {
            const isFull = room.availableSpots <= 0
            return (
              <div
                key={room.id}
                className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xl font-bold text-[#3E2B1F]">
                      Room {room.room_number}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        isFull
                          ? 'bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/20'
                          : 'bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20'
                      }`}
                    >
                      {isFull ? 'FULL' : `${room.availableSpots} Spot${room.availableSpots > 1 ? 's' : ''} Open`}
                    </span>
                  </div>

                  <p className="text-xs text-[#6F5B47]">
                    {room.building_name} • {room.room_type} (Capacity {room.capacity})
                  </p>

                  {/* Occupants List */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[11px] font-bold text-[#9A8A78] uppercase tracking-wider block">
                      Occupants ({room.occupiedSpots} / {room.capacity}):
                    </span>

                    {room.allocations && room.allocations.length > 0 ? (
                      <div className="space-y-1.5">
                        {room.allocations.map((alloc: any) => (
                          <div
                            key={alloc.id}
                            className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#3E2B1F] block">
                                {alloc.passenger?.full_name || 'Pilgrim'}
                              </span>
                              <span className="font-mono text-[10px] text-[#B8860B]">
                                {alloc.passenger?.passenger_code}
                              </span>
                            </div>
                            <button
                              onClick={() => deallocateMutation.mutate(alloc.id)}
                              className="p-1 text-[#9A8A78] hover:text-[#C0392B] transition-colors"
                              title="Remove from room"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#9A8A78] italic py-2">No devotees assigned yet.</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[#E9DCC5]/60">
                  <button
                    disabled={isFull}
                    onClick={() => {
                      setSelectedRoom(room)
                      setSelectedGroupId('')
                      setSelectedPassengerIds([])
                    }}
                    className="w-full py-2.5 rounded-full bg-[#FFF7E8] hover:bg-[#B8860B] text-[#B8860B] hover:text-white border border-[#B8860B]/30 hover:border-[#B8860B] text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Assign Devotees</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Allocate Room Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E9DCC5] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-[#3E2B1F]">
                  Assign Devotees to Room {selectedRoom.room_number}
                </h3>
                <p className="text-xs text-[#6F5B47] mt-0.5">
                  Available capacity: <strong>{selectedRoom.availableSpots}</strong> spots open.
                </p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1 rounded-full hover:bg-[#FAF7F2] text-[#6F5B47]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  1. Select Pilgrim Group *
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value)
                    setSelectedPassengerIds([])
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-xs font-semibold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                >
                  <option value="">Choose a Group...</option>
                  {groups.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.group_code} — {g.name} ({g.bookings?.length || 0} Bookings)
                    </option>
                  ))}
                </select>
              </div>

              {selectedGroupId && (
                <div>
                  <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-2">
                    2. Select Devotees to Room Together (Cross-Booking Allowed)
                  </label>

                  <div className="max-h-60 overflow-y-auto space-y-2 border border-[#E9DCC5] rounded-xl p-3 bg-[#FAF7F2]">
                    {groupPassengers.length === 0 ? (
                      <p className="text-xs text-[#9A8A78] italic">No passengers found in this group.</p>
                    ) : (
                      groupPassengers.map((p: any) => {
                        const checked = selectedPassengerIds.includes(p.id)
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                              checked
                                ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B]'
                                : 'bg-[#FFFFFF] border-[#E9DCC5] text-[#3E2B1F]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePassenger(p.id)}
                              className="rounded border-[#B8860B] text-[#B8860B] focus:ring-[#B8860B]"
                            />
                            <div className="text-xs flex-1">
                              <strong className="block">{p.full_name}</strong>
                              <span className="font-mono text-[10px] opacity-75">
                                {p.passenger_code} • {p.travel_class?.toUpperCase()}
                              </span>
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                  <p className="text-[11px] text-[#6F5B47] mt-1.5">
                    Selected: <strong>{selectedPassengerIds.length}</strong> / Max{' '}
                    <strong>{selectedRoom.availableSpots}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E9DCC5]">
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="px-5 py-2.5 rounded-full text-[#6F5B47] text-sm font-semibold hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  selectedPassengerIds.length === 0 ||
                  selectedPassengerIds.length > selectedRoom.availableSpots ||
                  allocateMutation.isPending
                }
                onClick={() => allocateMutation.mutate()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold hover:bg-[#8C6A0A] disabled:opacity-50 cursor-pointer shadow-md"
              >
                {allocateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Room Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
