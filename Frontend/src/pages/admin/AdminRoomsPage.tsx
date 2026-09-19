import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BedDouble,
  Plus,
  Search,
  Upload,
  Key,
  Edit2,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminRoomsPage() {
  usePageTitle('Rooms Master | Admin')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [excelFile, setExcelFile] = useState<File | null>(null)

  // Add Room Form
  const [roomNumber, setRoomNumber] = useState('')
  const [buildingName, setBuildingName] = useState('Main Ashram Bhavan')
  const [floorNumber, setFloorNumber] = useState(1)
  const [roomType, setRoomType] = useState('AC')
  const [capacity, setCapacity] = useState(3)
  const [basePrice, setBasePrice] = useState(0)

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['admin-rooms', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/rooms', { params: { search } })
      return data.rooms as any[]
    },
  })

  const addRoomMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/api/rooms', {
        room_number: roomNumber.trim(),
        building_name: buildingName.trim(),
        floor_number: Number(floorNumber),
        room_type: roomType,
        capacity: Number(capacity),
        base_price: Number(basePrice),
      })
      return data.room
    },
    onSuccess: (r) => {
      toast.success(`Room ${r.room_number} added successfully!`)
      setShowAddModal(false)
      setRoomNumber('')
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to add room')
    },
  })

  const excelImportMutation = useMutation({
    mutationFn: async () => {
      if (!excelFile) throw new Error('Please select an Excel file')
      const formData = new FormData()
      formData.append('file', excelFile)
      const { data } = await apiClient.post('/api/rooms/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.count || 0} rooms successfully!`)
      setShowExcelModal(false)
      setExcelFile(null)
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to import rooms')
    },
  })

  const rooms = roomsData || []

  return (
    <div className="space-y-6 text-[#3E2B1F] pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BedDouble className="h-5 w-5 text-[#B8860B]" />
            <span className="font-label-caps text-xs font-bold text-[#B8860B] uppercase tracking-wider">
              Ashram Accommodation
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
            Rooms Master Catalog
          </h1>
          <p className="text-sm text-[#6F5B47] mt-0.5">
            Configure room inventory, buildings, capacity limits, and AC classifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#3E2B1F] font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => navigate('/admin/room-allocation')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FFF7E8] border border-[#B8860B]/30 hover:border-[#B8860B] text-[#B8860B] font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Allocation Matrix</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B8860B] text-white font-bold text-xs hover:bg-[#8C6A0A] transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A8A78]" />
          <input
            type="text"
            placeholder="Search by room number or building..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] placeholder:text-[#9A8A78] focus:outline-none focus:border-[#B8860B] transition-all"
          />
        </div>

        <div className="text-xs text-[#6F5B47] font-semibold px-2">
          Total: <strong className="text-[#3E2B1F]">{rooms.length}</strong> Rooms Registered
        </div>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-[#B8860B]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFFFF] rounded-2xl border border-[#E9DCC5]">
          <BedDouble className="h-12 w-12 text-[#9A8A78] mx-auto mb-3 opacity-50" />
          <h3 className="font-bold text-lg text-[#3E2B1F]">No Rooms Registered</h3>
          <p className="text-sm text-[#6F5B47] mt-1">Add your first room or bulk import an Excel sheet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] transition-all shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-lg font-bold text-[#3E2B1F] group-hover:text-[#B8860B]">
                    Room {room.room_number}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${room.room_type?.toLowerCase() === 'ac' ? 'bg-[#FFF7E8] text-[#B8860B] border border-[#B8860B]/30' : 'bg-[#FAF7F2] text-[#6F5B47] border border-[#E9DCC5]'}`}>
                    {room.room_type}
                  </span>
                </div>

                <p className="text-xs text-[#6F5B47] font-medium">
                  {room.building_name} (Floor {room.floor_number})
                </p>

                <div className="mt-3 flex items-center justify-between text-xs text-[#6F5B47]">
                  <span>Capacity:</span>
                  <strong className="text-[#3E2B1F]">{room.capacity} Devotees</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E9DCC5]/60 flex items-center justify-between text-xs">
                <span className="text-[#2E7D32] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
                <span className="text-[#9A8A78]">
                  {room.base_price > 0 ? `₹${room.base_price}/day` : 'Standard'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E9DCC5] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Add Room to Master</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-[#FAF7F2] text-[#6F5B47]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!roomNumber.trim()) return toast.error('Room number is required')
                addRoomMutation.mutate()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] font-bold text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                    Room Type
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-semibold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                  >
                    <option value="AC">AC Room</option>
                    <option value="Non-AC">Non-AC Room</option>
                    <option value="Suite">Family Suite</option>
                    <option value="Dormitory">Dormitory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                  Building / Hotel Name
                </label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                    Floor Number
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-semibold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                    Capacity (Devotees)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-semibold text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-full text-[#6F5B47] text-sm font-semibold hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addRoomMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold hover:bg-[#8C6A0A] disabled:opacity-50 cursor-pointer"
                >
                  {addRoomMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Excel Upload Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E9DCC5] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#3E2B1F]">Bulk Import Rooms</h3>
              <button onClick={() => setShowExcelModal(false)} className="p-1 rounded-full hover:bg-[#FAF7F2] text-[#6F5B47]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#6F5B47]">
              Upload an Excel (.xlsx) file with columns: <code>Room Number</code>, <code>Building Name</code>, <code>Floor</code>, <code>Type</code>, <code>Capacity</code>.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                excelImportMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-[#6F5B47] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#B8860B] file:text-white hover:file:bg-[#8C6A0A] file:cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExcelModal(false)}
                  className="px-5 py-2.5 rounded-full text-[#6F5B47] text-sm font-semibold hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!excelFile || excelImportMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#B8860B] text-white text-sm font-bold hover:bg-[#8C6A0A] disabled:opacity-50 cursor-pointer"
                >
                  {excelImportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import Excel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
