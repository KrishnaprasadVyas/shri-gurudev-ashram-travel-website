import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, ToggleLeft, ToggleRight, Trash2, AlertTriangle, X } from 'lucide-react'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState, EmptyState } from '@/components/shared/States'
import { toast } from 'sonner'
import type { TravelPackageRow } from '@/types/database.types'

// E.4: Inline AlertDialog component — avoids native window.confirm()
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-[#1a1917] border border-amber-900/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#f2f0eb] mb-1">{title}</h3>
            <p className="text-sm text-[#f2f0eb]/50">{description}</p>
          </div>
          <button onClick={onCancel} className="text-[#f2f0eb]/30 hover:text-[#f2f0eb] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-amber-900/20 text-[#f2f0eb]/60 text-sm hover:text-[#f2f0eb] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminPackagesPage() {
  usePageTitle('Package Management')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // E.4: Dialog state — null = closed, otherwise holds the pkg and action
  const [dialog, setDialog] = useState<{
    pkg: TravelPackageRow
    action: 'deactivate' | 'activate' | 'delete'
  } | null>(null)

  const { data: packages, isLoading } = useQuery<TravelPackageRow[]>({
    queryKey: QUERY_KEYS.adminPackages,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/packages')
      return data.packages
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await apiClient.put(`/api/admin/packages/${id}`, { is_active })
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPackages })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.packages })
      toast.success(is_active ? 'Package activated!' : 'Package deactivated')
    },
    onError: () => toast.error('Failed to update package'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/admin/packages/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPackages })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.packages })
      toast.success('Package deleted!')
    },
    onError: () => toast.error('Failed to delete package'),
  })

  // E.4: Unified dialog confirm handler
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

  if (isLoading) return <LoadingState variant="cards" count={4} />

  return (
    <div className="space-y-5">
      {/* E.4: AlertDialog rendered at root so it overlays everything */}
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
              ? 'This cannot be undone. All associated data will remain but the package will be permanently removed.'
              : dialog.action === 'deactivate'
              ? 'The package will be hidden from the public listing. Active bookings are unaffected.'
              : 'The package will become visible on the public Yatras page.'
          }
          confirmLabel={
            dialog.action === 'delete' ? 'Delete' : dialog.action === 'deactivate' ? 'Deactivate' : 'Activate'
          }
          confirmClass={
            dialog.action === 'delete'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }
          onConfirm={handleDialogConfirm}
          onCancel={() => setDialog(null)}
        />
      )}

      <div className="flex justify-end">
        <button
          onClick={() => navigate('/admin/packages/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Package
        </button>
      </div>

      {!packages?.length ? (
        <EmptyState
          icon={Plus}
          title="No packages yet"
          description="Create your first Yatra package."
          action={{ label: 'Create Package', href: '/admin/packages/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl overflow-hidden border transition-all ${
                pkg.is_active ? 'border-amber-900/20' : 'border-amber-900/10 opacity-70'
              } bg-[#121110]`}
            >
              {/* Image */}
              <div className="relative h-40">
                {pkg.image_url ? (
                  <img src={pkg.image_url} alt={pkg.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-orange-900/20 flex items-center justify-center">
                    <span className="text-4xl">🪷</span>
                  </div>
                )}
                {/* Active badge */}
                <span
                  className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium ${
                    pkg.is_active ? 'bg-green-500/80 text-white' : 'bg-gray-600/80 text-gray-300'
                  }`}
                >
                  {pkg.is_active ? 'Active' : 'Draft'}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-[#f2f0eb] line-clamp-1 mb-1">{pkg.title}</h3>
                <div className="flex gap-3 text-xs text-[#f2f0eb]/50 mb-4">
                  <span>{pkg.duration}</span>
                  <span>₹{pkg.price.toLocaleString('en-IN')}</span>
                  <span>{pkg.remaining_seats}/{pkg.total_seats} seats</span>
                </div>

                {/* E.5: Deduplicated controls — Edit | Toggle | Delete (no duplicate deactivate/trash overlap) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/packages/${pkg.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-amber-900/20 text-[#f2f0eb]/60 text-xs hover:text-amber-400 hover:border-amber-500/30 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  {/* E.4: Opens AlertDialog instead of window.confirm */}
                  <button
                    onClick={() =>
                      setDialog({ pkg, action: pkg.is_active ? 'deactivate' : 'activate' })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-amber-900/20 text-[#f2f0eb]/60 text-xs hover:text-amber-400 hover:border-amber-500/30 transition-colors"
                  >
                    {pkg.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                    {pkg.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  {/* E.5: Single trash button with AlertDialog confirmation */}
                  <button
                    onClick={() => setDialog({ pkg, action: 'delete' })}
                    className="p-2 rounded-lg border border-red-500/20 text-red-400/50 text-xs hover:text-red-400 hover:border-red-500/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
