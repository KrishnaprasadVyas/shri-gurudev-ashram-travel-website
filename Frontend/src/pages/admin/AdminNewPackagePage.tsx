import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { PackageForm } from '@/components/admin/PackageForm'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'

export function AdminNewPackagePage() {
  usePageTitle('New Pilgrimage Package')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleCreate = async (
    formData: Parameters<typeof PackageForm>[0]['onSubmit'] extends (d: infer D) => unknown ? D : never
  ) => {
    try {
      await apiClient.post('/api/admin/packages', formData)
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPackages })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.packages })
      toast.success('New pilgrimage package created successfully! ✨')
      navigate('/admin/packages')
    } catch {
      toast.error('Failed to create Yatra package. Please verify all fields.')
      throw new Error('create failed')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-[#3E2B1F]">
      {/* Top Header Box */}
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
          <Sparkles className="h-6 w-6" />
        </div>

        <div>
          <span className="font-label-caps text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8860B] block">
            Pilgrimage Catalog Creation
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] tracking-tight mt-0.5">
            Create New Yatra Package
          </h1>
        </div>
      </div>

      <PackageForm onSubmit={handleCreate} submitLabel="Publish New Pilgrimage Package" />
    </div>
  )
}
