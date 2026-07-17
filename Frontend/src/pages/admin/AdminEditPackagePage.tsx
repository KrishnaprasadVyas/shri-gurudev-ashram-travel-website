import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, Sparkles } from 'lucide-react'
import { PackageForm } from '@/components/admin/PackageForm'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import { toast } from 'sonner'
import type { TravelPackageRow } from '@/types/database.types'

export function AdminEditPackagePage() {
  usePageTitle('Edit Pilgrimage Package')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: pkg, isLoading } = useQuery<TravelPackageRow>({
    queryKey: QUERY_KEYS.adminPackage(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/admin/packages/${id}`)
      return data.package
    },
    enabled: Boolean(id),
  })

  const handleUpdate = async (
    formData: Parameters<typeof PackageForm>[0]['onSubmit'] extends (d: infer D) => unknown ? D : never
  ) => {
    try {
      await apiClient.put(`/api/admin/packages/${id}`, formData)
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPackages })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPackage(id ?? '') })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.packages })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.package(id ?? '') })
      toast.success('Pilgrimage package updated successfully! ✨')
      navigate('/admin/packages')
    } catch {
      toast.error('Failed to update Yatra package. Please verify all fields.')
      throw new Error('update failed')
    }
  }

  if (isLoading) return <LoadingState variant="detail" />
  if (!pkg) {
    return (
      <div className="p-16 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] text-center max-w-md mx-auto space-y-4">
        <span className="text-4xl">⚠️</span>
        <h2 className="font-display text-2xl font-bold text-[#3E2B1F]">Package Not Found</h2>
        <p className="text-sm text-[#6F5B47]">We could not locate this Yatra package record in the database.</p>
        <button
          onClick={() => navigate('/admin/packages')}
          className="px-6 py-2.5 rounded-full bg-[#B8860B] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider"
        >
          Return to Catalog
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-[#3E2B1F]">
      {/* Top Header Card */}
      <div className="p-8 sm:p-10 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] relative overflow-hidden flex items-center gap-5">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(140,106,10,0.08)_0%,transparent_70%)] pointer-events-none" />

        <button
          onClick={() => navigate('/admin/packages')}
          className="w-11 h-11 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B] text-[#B8860B] flex items-center justify-center transition-all duration-200 shadow-sm shrink-0 hover:scale-105"
          title="Back to Package Catalog"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-white flex items-center justify-center font-display font-bold text-2xl shadow-md shrink-0 ring-4 ring-[#B8860B]/20">
          <Edit className="h-6 w-6" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8860B] block">
              Catalog Modification
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              pkg.is_active ? 'bg-[#2E7D32]/15 text-[#2E7D32]' : 'bg-[#9A8A78]/15 text-[#6F5B47]'
            }`}>
              {pkg.is_active ? 'Live on Website' : 'Draft Mode'}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] tracking-tight mt-0.5">
            Edit: {pkg.title}
          </h1>
        </div>
      </div>

      <PackageForm initialData={pkg} onSubmit={handleUpdate} submitLabel="Save Pilgrimage Updates" />
    </div>
  )
}
