import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PackageForm } from '@/components/admin/PackageForm'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import { toast } from 'sonner'
import type { TravelPackageRow } from '@/types/database.types'

export function AdminEditPackagePage() {
  usePageTitle('Edit Package')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: pkg, isLoading } = useQuery<TravelPackageRow>({
    // F.6: Use adminPackage key to avoid cache collision with public usePackage()
    queryKey: QUERY_KEYS.adminPackage(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/admin/packages/${id}`)
      return data.package
    },
    enabled: Boolean(id),
  })

  const handleUpdate = async (formData: Parameters<typeof PackageForm>[0]['onSubmit'] extends (d: infer D) => unknown ? D : never) => {
    try {
      await apiClient.put(`/api/admin/packages/${id}`, formData)
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPackages })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPackage(id ?? '') })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.packages })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.package(id ?? '') })
      toast.success('Package updated!')
      navigate('/admin/packages')
    } catch {
      toast.error('Failed to update package')
      throw new Error('update failed')
    }
  }

  if (isLoading) return <LoadingState variant="detail" />
  if (!pkg) return <p className="text-[#f2f0eb]/50">Package not found</p>

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-[#f2f0eb] mb-6">Edit Package</h1>
      <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
        <PackageForm initialData={pkg} onSubmit={handleUpdate} submitLabel="Save Changes" />
      </div>
    </div>
  )
}
