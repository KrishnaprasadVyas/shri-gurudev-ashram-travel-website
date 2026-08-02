import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Search,
  Filter,
  RotateCcw,
  Calendar,
  Clock,
  Users,
  Eye,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
} from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'
import type { TravelPackageRow } from '@/types/database.types'
import { useTranslation } from "react-i18next";

function AlertDialog({
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  confirmClass: string
  onConfirm: () => void
  onCancel: () => void
}) {
    const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_20px_60px_rgba(90,70,20,0.18)] p-8 space-y-5 text-[#3E2B1F]">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-full bg-[#C0392B]/12 border border-[#C0392B]/25 flex items-center justify-center flex-shrink-0 text-[#C0392B]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] text-[#9A8A78] hover:text-[#3E2B1F] flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <h3 className="font-display text-2xl font-bold text-[#3E2B1F]">{title}</h3>
          <p className="text-sm text-[#6F5B47] mt-1.5 leading-relaxed font-normal">{description}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 rounded-full border border-[#E9DCC5] bg-[#FFFFFF] text-[#6F5B47] text-xs font-bold uppercase tracking-wider hover:bg-[#E9DCC5]/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-6 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminPackagesPage() {
    const { t } = useTranslation();
  usePageTitle('Yatra Packages Management')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialog, setDialog] = useState<{
    pkg: TravelPackageRow
    action: 'deactivate' | 'activate' | 'delete'
  } | null>(null)

  // 100% preserved API call
  const { data: rawPackages, isLoading } = useQuery<TravelPackageRow[]>({
    queryKey: QUERY_KEYS.adminPackages,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/packages')
      return data.packages
    },
  })

  // 100% preserved toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await apiClient.put(`/api/admin/packages/${id}`, { is_active })
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPackages })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.packages })
      toast.success(is_active ? 'Pilgrimage package activated! ✨' : 'Package deactivated.')
    },
    onError: () => toast.error('Failed to update package status.'),
  })

  // 100% preserved delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/admin/packages/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPackages })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.packages })
      toast.success('Yatra package deleted successfully.')
    },
    onError: () => toast.error('Failed to delete package.'),
  })

  const handleDialogConfirm = () => {
    if (!dialog) return
    const { pkg, action } = dialog
    setDialog(null)
    if (action === 'delete') {
      deleteMutation.mutate(pkg.id)
    } else {
      toggleMutation.mutate({ id: pkg.id, is_active: action === 'activate' })
    }
  }

  let packages: TravelPackageRow[] = rawPackages ?? []
  if (searchInput) {
    const q = searchInput.toLowerCase()
    packages = packages.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.duration?.toLowerCase().includes(q)
    )
  }
  if (statusFilter === 'active') {
    packages = packages.filter((p) => p.is_active)
  } else if (statusFilter === 'inactive') {
    packages = packages.filter((p) => !p.is_active)
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setStatusFilter('')
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-32 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] animate-pulse" />
        <div className="h-24 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 text-[#3E2B1F]">
      {dialog && (
        <AlertDialog
          title={
            dialog.action === 'delete'
              ? `Delete "${dialog.pkg.title}"?`
              : dialog.action === 'deactivate'
              ? `Deactivate "${dialog.pkg.title}"?`
              : `Activate "${dialog.pkg.title}"?`
          }
          description={
            dialog.action === 'delete'
              ? 'This action will permanently remove this Yatra package record. Associated historical bookings and devotee logs will remain intact.'
              : dialog.action === 'deactivate'
              ? 'The package will be hidden from public visitors on the Sacred Yatras page. Existing reservations remain unaffected.'
              : 'The package will immediately become live and open for booking on the public Yatras page.'
          }
          confirmLabel={
            dialog.action === 'delete' ? 'Confirm Delete' : dialog.action === 'deactivate' ? 'Confirm Deactivate' : 'Activate Live'
          }
          confirmClass={
            dialog.action === 'delete'
              ? 'bg-[#C0392B] text-[#FFFFFF] hover:bg-[#8F2D24]'
              : 'bg-[#B8860B] text-[#FFFFFF] hover:bg-[#6F5200]'
          }
          onConfirm={handleDialogConfirm}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* 1. Page Header & 2. Top Actions */}
      <div className="p-8 sm:p-10 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(140,106,10,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
            <span className="font-label-caps text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8860B]">
              Pilgrimage Catalog
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">
            Yatra Packages
          </h1>
          <div className="h-px w-36 bg-gradient-to-r from-[#B8860B] via-[#E9DCC5] to-transparent my-3" />
          <p className="font-body-md text-sm sm:text-base text-[#6F5B47] leading-relaxed font-normal">
            Manage all sacred pilgrimage packages, departure schedules, and pricing tiers available for devotees.
          </p>
        </div>

        {/* 2. Website Gold Filled CTA Button */}
        <button
          onClick={() => navigate('/admin/packages/new')}
          className="px-7 py-3.5 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider hover:bg-[#6F5200] shadow-[0_6px_20px_rgba(140,106,10,0.25)] flex items-center gap-2 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 shrink-0 relative z-10"
        >
          <Plus className="h-4 w-4" />
          <span>＋ Add New Package</span>
        </button>
      </div>

      {/* 5. Search & Filters Card */}
      <div className="p-6 rounded-[20px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_6px_24px_rgba(90,70,20,0.05)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E9DCC5]">
          <h2 className="font-display text-lg font-bold text-[#3E2B1F] flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#B8860B]" />
            <span>Search & Filter Sacred Yatras</span>
          </h2>
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B8860B]" />
            <input
              type="text"
              placeholder="Search packages by title, sacred destination, or duration..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-4 h-11 rounded-[14px] bg-[#FFFFFF] border border-[#E9DCC5] text-[#3E2B1F] placeholder-[#9A8A78] text-sm focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 transition-all duration-200"
            />
          </div>

          <div className="md:col-span-4 flex gap-2">
            {[
              { value: '', label: 'All Yatras' },
              { value: 'active', label: 'Active & Open' },
              { value: 'inactive', label: 'Draft / Inactive' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all duration-200 border ${
                  statusFilter === t.value
                    ? 'bg-[#B8860B] text-[#FFFFFF] border-[#B8860B] shadow-sm ring-2 ring-[#B8860B]/20'
                    : 'bg-[#FFFFFF] border-[#E9DCC5] text-[#6F5B47] hover:border-[#B8860B] hover:text-[#B8860B]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Package Cards Grid (#3) & 4. Hover (#4) & 10. Responsive (#10) */}
      {!packages.length ? (
        /* 9. Empty State */
        <div className="p-16 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-4xl shadow-sm text-[#B8860B]">
            🛕
          </div>
          <h2 className="font-display text-2xl font-bold text-[#3E2B1F]">
            
                                  {"No Yatra Packages Found"}
                                </h2>
          <p className="text-sm font-normal text-[#6F5B47] leading-relaxed max-w-md">
            
                                  {"No pilgrimage packages match your filter selection. Create your first sacred Yatra package to make it available for devotees."}
                                </p>
          <button
            onClick={() => navigate('/admin/packages/new')}
            className="px-6 py-3 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider hover:bg-[#6F5200] transition-all duration-200 shadow-sm mt-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>{"Create First Pilgrimage Package"}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isSeatsLow = pkg.remaining_seats <= 3
            const isFull = pkg.remaining_seats === 0

            return (
              <div
                key={pkg.id}
                className="rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] overflow-hidden shadow-[0_8px_30px_rgba(90,70,20,0.06)] hover:-translate-y-1 hover:border-[#B8860B] transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Image Banner */}
                <div className="relative h-56 overflow-hidden bg-[#FFFFFF]">
                  {pkg.image_url ? (
                    <img
                      src={pkg.image_url}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FFFFFF] via-[#FAF7F2] to-[#E9DCC5] flex items-center justify-center">
                      <span className="text-6xl opacity-40">🪷</span>
                    </div>
                  )}

                  {/* Top Status & Price Badges */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
                    {/* 8. Status Badges */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-md border ${
                        !pkg.is_active
                          ? 'bg-[#9A8A78]/90 text-[#FFFFFF] border-[#FFFFFF]/20'
                          : isFull
                          ? 'bg-[#C0392B]/90 text-[#FFFFFF] border-[#FFFFFF]/20'
                          : 'bg-[#2E7D32]/90 text-[#FFFFFF] border-[#FFFFFF]/20'
                      }`}
                    >
                      {!pkg.is_active ? 'Draft / Inactive' : isFull ? 'Full (Sold Out)' : 'Open for Booking'}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-[#FFFFFF]/95 text-[#B8860B] font-display font-bold text-sm shadow-md border border-[#E9DCC5]">
                      ₹{pkg.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 text-white pointer-events-none">
                    <span className="font-label-caps text-[10px] uppercase tracking-widest text-amber-300 block font-bold">
                      
                                                      {"Sacred Pilgrimage"}
                                                    </span>
                    <h3 className="font-display text-xl font-bold line-clamp-1 leading-snug">
                      {pkg.title}
                    </h3>
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-xs text-[#6F5B47] line-clamp-2 leading-relaxed font-normal">
                      {pkg.description || 'Experience the divine atmosphere and spiritual blessings of माँ वैष्णवी टूरिज़्म across sacred temples.'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E9DCC5] text-xs font-medium text-[#3E2B1F]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#B8860B]" />
                        <span>{pkg.duration || 'Flexible schedule'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#B8860B]" />
                        <span className={isSeatsLow ? 'text-[#C0392B] font-bold' : ''}>
                          {pkg.remaining_seats}/{pkg.total_seats}  {"Seats left"}
                                                                </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar (#3) */}
                  <div className="pt-4 border-t border-[#E9DCC5] flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate(`/admin/packages/${pkg.id}/edit`)}
                      className="flex-1 py-2 px-3 rounded-full bg-[#FFFFFF] border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-[#FFFFFF] transition-all duration-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>{"Edit Yatra"}</span>
                    </button>

                    <button
                      onClick={() =>
                        setDialog({ pkg, action: pkg.is_active ? 'deactivate' : 'activate' })
                      }
                      title={pkg.is_active ? 'Deactivate Package' : 'Activate Package'}
                      className={`w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center shadow-2xs ${
                        pkg.is_active
                          ? 'bg-[#FFFFFF] border-[#E9DCC5] text-[#6F5B47] hover:border-[#B8860B] hover:text-[#B8860B]'
                          : 'bg-[#2E7D32]/15 border-[#2E7D32]/30 text-[#2E7D32] hover:bg-[#2E7D32] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {pkg.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => setDialog({ pkg, action: 'delete' })}
                      title={"Delete Package"}
                      className="w-9 h-9 rounded-full bg-[#FFFFFF] border border-[#C0392B]/30 text-[#C0392B] hover:bg-[#C0392B] hover:text-[#FFFFFF] transition-all duration-200 flex items-center justify-center shadow-2xs"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
