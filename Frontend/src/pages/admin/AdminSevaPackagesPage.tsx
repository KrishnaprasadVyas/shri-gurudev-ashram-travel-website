import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Sparkles, Check, X, Layers } from 'lucide-react'
import type { SevaPackage } from '@/types/travel'
import apiClient from '@/lib/apiClient'
import { formatCurrency } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminSevaPackagesPage() {
  usePageTitle('Manage Seva Packages')
  const [packages, setPackages] = useState<SevaPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    fetchSevaPackages()
  }, [showArchived])

  const fetchSevaPackages = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/api/admin/seva-packages', {
        params: { includeDeleted: showArchived ? 'true' : 'false' },
      })
      if (Array.isArray(res.data?.packages)) {
        setPackages(res.data.packages)
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch Seva packages')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true)
      await apiClient.post('/api/admin/seva-packages/seed')
      await fetchSevaPackages()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to seed default packages')
    } finally {
      setSeeding(false)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await apiClient.post(`/api/admin/seva-packages/${id}/restore`)
      await fetchSevaPackages()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to restore package')
    }
  }

  const handleOpenCreate = () => {
    setEditingPkg(null)
    setFormData({
      seva_type: 'guruji_aarti',
      title: '',
      description: '',
      image_url: '',
      price: 1100,
      is_active: true,
      booking_enabled: true,
      allow_date_selection: true,
      max_bookings_per_day: 50,
      display_order: packages.length + 1,
      category: 'General',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (pkg: SevaPackage) => {
    setEditingPkg(pkg)
    setFormData({
      seva_type: pkg.seva_type,
      title: pkg.title,
      description: pkg.description || '',
      image_url: pkg.image_url || '',
      price: pkg.price,
      is_active: pkg.is_active,
      booking_enabled: pkg.booking_enabled,
      allow_date_selection: pkg.allow_date_selection,
      max_bookings_per_day: pkg.max_bookings_per_day || 50,
      display_order: pkg.display_order || 0,
      category: pkg.category || 'General',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingPkg) {
        await apiClient.put(`/api/admin/seva-packages/${editingPkg.id}`, formData)
      } else {
        await apiClient.post('/api/admin/seva-packages', formData)
      }
      setIsModalOpen(false)
      fetchSevaPackages()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save Seva package')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate and remove this Seva package?')) return
    try {
      await apiClient.delete(`/api/admin/seva-packages/${id}`)
      fetchSevaPackages()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete package')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f2f0eb]">
            Dynamic Seva Catalog
          </h1>
          <p className="text-xs text-[#f2f0eb]/50 mt-1">
            Configure dynamic Seva offerings, pricing, daily caps, and ritual availability.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              showArchived
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-black/40 text-[#f2f0eb]/60 border-amber-900/30 hover:text-white'
            }`}
          >
            {showArchived ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </button>

          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-950/60 border border-amber-700/40 font-semibold text-amber-300 text-xs hover:bg-amber-900/80 transition-all disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {seeding ? 'Seeding...' : 'Seed Standard Packages'}
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white text-xs hover:from-amber-600 hover:to-orange-700 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <Plus className="h-4 w-4" /> Add New Seva Package
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Datatable */}
      <div className="rounded-2xl bg-[#121110] border border-amber-900/20 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#f2f0eb]/40 animate-pulse">
            Loading Seva catalog...
          </div>
        ) : packages.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#f2f0eb]/60 space-y-4">
            <Layers className="h-10 w-10 mx-auto text-amber-500/30" />
            <div>
              <p className="font-semibold text-sm text-[#f2f0eb]">No dynamic Seva packages found in database.</p>
              <p className="text-xs text-[#f2f0eb]/50 mt-1">
                You can populate standard Ashram Seva packages or create a custom package.
              </p>
            </div>
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              {seeding ? 'Seeding Default Sevas...' : 'Seed Standard Seva Packages Now'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 border-b border-amber-900/20 text-[#f2f0eb]/60 uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3.5 px-4">Title & Type</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Daily Cap</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 text-[#f2f0eb]/80">
                {packages.map((pkg) => {
                  const isDeleted = Boolean(pkg.deleted_at)

                  return (
                    <tr
                      key={pkg.id}
                      className={`hover:bg-amber-900/5 transition-colors ${
                        isDeleted ? 'opacity-50 bg-red-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#f2f0eb]">{pkg.title}</div>
                        <div className="text-[11px] text-amber-400 font-mono">{pkg.seva_type}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                          {pkg.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        {formatCurrency(pkg.price)}
                      </td>
                      <td className="py-3.5 px-4">
                        {pkg.max_bookings_per_day ?? 'Unlimited'} / day
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isDeleted
                                ? 'bg-red-500'
                                : pkg.is_active
                                ? 'bg-emerald-400'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span>
                            {isDeleted ? 'Archived (Deleted)' : pkg.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {isDeleted ? (
                          <button
                            onClick={() => handleRestore(pkg.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black font-semibold text-[11px] transition-all"
                            title="Restore Soft-Deleted Package"
                          >
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(pkg)}
                              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all"
                              title="Edit Package"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(pkg.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                              title="Delete Package"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#121110] border border-amber-900/30 shadow-2xl p-6 text-[#f2f0eb]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#f2f0eb]/40 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-display text-xl font-bold text-[#f2f0eb] mb-4">
              {editingPkg ? 'Edit Seva Package' : 'Create New Seva Package'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#f2f0eb]/70 mb-1">Seva Type Key *</label>
                <input
                  type="text"
                  value={formData.seva_type}
                  onChange={(e) => setFormData({ ...formData, seva_type: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-900/30 text-[#f2f0eb]"
                />
              </div>

              <div>
                <label className="block text-[#f2f0eb]/70 mb-1">Package Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-900/30 text-[#f2f0eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#f2f0eb]/70 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-900/30 text-[#f2f0eb]"
                  />
                </div>
                <div>
                  <label className="block text-[#f2f0eb]/70 mb-1">Max Daily Capacity</label>
                  <input
                    type="number"
                    value={formData.max_bookings_per_day}
                    onChange={(e) => setFormData({ ...formData, max_bookings_per_day: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-900/30 text-[#f2f0eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#f2f0eb]/70 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-amber-900/30 text-[#f2f0eb] resize-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded bg-black/40 border-amber-900/40 text-amber-500 focus:ring-0"
                  />
                  <span>Active Catalog</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.booking_enabled}
                    onChange={(e) => setFormData({ ...formData, booking_enabled: e.target.checked })}
                    className="rounded bg-black/40 border-amber-900/40 text-amber-500 focus:ring-0"
                  />
                  <span>Allow Bookings</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white text-sm hover:from-amber-600 hover:to-orange-700 transition-all mt-4"
              >
                {editingPkg ? 'Update Package' : 'Create Package'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
