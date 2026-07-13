import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShieldX, Loader2, IndianRupee } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { usePackage } from '@/hooks/usePackages'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import type { CreateBookingInput } from '@/types/travel'

export function BookPage() {
  const { packageId } = useParams<{ packageId: string }>()
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const { data: pkg, isLoading } = usePackage(packageId)

  usePageTitle(pkg ? `Book ${pkg.title}` : 'Book Yatra')

  const [form, setForm] = useState<Omit<CreateBookingInput, 'packageId'>>({
    fullName: userProfile?.full_name ?? '',
    phoneNumber: userProfile?.phone ?? '',
    whatsappNumber: userProfile?.phone ?? '',
    dob: '',
    address: '',
    transportType: 'Flight',
    busType: undefined,
    roomType: 'AC Room',
    travelerCount: 1,
    specialNotes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const bookMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateBookingInput = { ...form, packageId: packageId! }
      const { data } = await apiClient.post('/api/bookings', payload)
      return data.booking
    },
    onSuccess: (booking) => {
      toast.success('Booking created! Proceed to payment. 🙏')
      navigate(`/portal/bookings/${booking.id}`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create booking'
      toast.error(msg)
    },
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!/^\d{10}$/.test(form.phoneNumber)) e.phoneNumber = 'Must be 10 digits'
    if (!/^\d{10}$/.test(form.whatsappNumber)) e.whatsappNumber = 'Must be 10 digits'
    if (!form.dob) e.dob = 'Required'
    if (!form.address.trim()) e.address = 'Required'
    if (form.transportType === 'Train' && !form.busType) e.busType = 'Select train type'
    if (pkg && form.travelerCount > pkg.remaining_seats) e.travelerCount = `Only ${pkg.remaining_seats} seat${pkg.remaining_seats !== 1 ? 's' : ''} available`
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    bookMutation.mutate()
  }

  // Verification check
  if (userProfile?.verification_status === 'not_submitted') {
    return (
      <div className="max-w-lg text-center py-16 space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <ShieldX className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#f2f0eb]">Identity Verification Required</h1>
        <p className="text-[#f2f0eb]/60">
          You must submit your Aadhaar and selfie before booking a Yatra.
        </p>
        <Link
          to="/portal/verify"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
        >
          Verify My Identity
        </Link>
      </div>
    )
  }

  if (isLoading) return <LoadingState variant="detail" />
  if (!pkg) return null

  const totalPrice = pkg.price * form.travelerCount

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl bg-[#0a0908] border ${errors[field] ? 'border-red-500/50' : 'border-amber-900/30'} text-[#f2f0eb] focus:outline-none focus:border-amber-500/50 transition-colors`

  const renderError = (field: string) =>
    errors[field] ? <p className="text-red-400 text-xs mt-1">{errors[field]}</p> : null

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-[#f2f0eb]">Book Yatra</h1>

      {/* Package summary */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <p className="font-semibold text-[#f2f0eb]">{pkg.title}</p>
        <div className="flex gap-4 mt-2 text-sm text-amber-400">
          <span>{pkg.duration}</span>
          <span>₹{pkg.price.toLocaleString('en-IN')} / person</span>
          <span>{pkg.remaining_seats} seats left</span>
        </div>
        {pkg.remaining_seats === 0 && (
          <p className="text-red-400 text-sm mt-2 font-medium">This Yatra is fully booked.</p>
        )}
      </div>

      {pkg.remaining_seats > 0 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Info */}
          <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20 space-y-4">
            <h2 className="font-semibold text-[#f2f0eb]">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#f2f0eb]/60 mb-1.5">Full Name</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass('fullName')} />
                {renderError('fullName')}
              </div>
              <div>
                <label className="block text-sm text-[#f2f0eb]/60 mb-1.5">Date of Birth</label>
                <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className={inputClass('dob')} />
                {renderError('dob')}
              </div>
              <div>
                <label className="block text-sm text-[#f2f0eb]/60 mb-1.5">Phone Number</label>
                <input type="tel" maxLength={10} value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, '') })} placeholder="10-digit" className={inputClass('phoneNumber')} />
                {renderError('phoneNumber')}
              </div>
              <div>
                <label className="block text-sm text-[#f2f0eb]/60 mb-1.5">WhatsApp Number</label>
                <input type="tel" maxLength={10} value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value.replace(/\D/g, '') })} placeholder="10-digit" className={inputClass('whatsappNumber')} />
                {renderError('whatsappNumber')}
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#f2f0eb]/60 mb-1.5">Address</label>
              <textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${inputClass('address')} resize-none`} placeholder="Full address" />
              {renderError('address')}
            </div>
          </div>

          {/* Section 2: Travel Preferences */}
          <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20 space-y-4">
            <h2 className="font-semibold text-[#f2f0eb]">Travel Preferences</h2>
            <div>
              <label className="block text-sm text-[#f2f0eb]/60 mb-2">Transport Type</label>
              <div className="flex gap-3">
                {(['Flight', 'Train'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, transportType: t, busType: undefined })}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.transportType === t ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-amber-900/30 text-[#f2f0eb]/50 hover:text-[#f2f0eb]'}`}
                  >
                    {t === 'Flight' ? '✈️' : '🚂'} {t}
                  </button>
                ))}
              </div>
            </div>
            {form.transportType === 'Train' && (
              <div>
                <label className="block text-sm text-[#f2f0eb]/60 mb-2">Train Class</label>
                <div className="flex gap-3">
                  {(['AC Train', 'Non-AC Train'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setForm({ ...form, busType: b })}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.busType === b ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-amber-900/30 text-[#f2f0eb]/50 hover:text-[#f2f0eb]'}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                {renderError('busType')}
              </div>
            )}
            <div>
              <label className="block text-sm text-[#f2f0eb]/60 mb-2">Room Type</label>
              <div className="flex gap-3">
                {(['AC Room', 'Non-AC Room'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, roomType: r })}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.roomType === r ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-amber-900/30 text-[#f2f0eb]/50 hover:text-[#f2f0eb]'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Booking Details */}
          <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20 space-y-4">
            <h2 className="font-semibold text-[#f2f0eb]">Booking Details</h2>
            <div>
              <label className="block text-sm text-[#f2f0eb]/60 mb-1.5">Number of Travelers</label>
              <input
                type="number"
                min={1}
                max={pkg.remaining_seats}
                value={form.travelerCount}
                onChange={(e) => {
                  const count = Math.max(1, Number(e.target.value))
                  setForm({ ...form, travelerCount: count })
                  if (count > pkg.remaining_seats) {
                    setErrors((prev) => ({ ...prev, travelerCount: `Only ${pkg.remaining_seats} seat${pkg.remaining_seats !== 1 ? 's' : ''} available` }))
                  } else {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    setErrors((prev) => { const { travelerCount: _tc, ...rest } = prev; return rest })
                  }
                }}
                className={inputClass('travelerCount')}
              />
              {renderError('travelerCount')}
            </div>
            <div>
              <label className="block text-sm text-[#f2f0eb]/60 mb-1.5">Special Notes (optional)</label>
              <textarea rows={3} value={form.specialNotes} onChange={(e) => setForm({ ...form, specialNotes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#0a0908] border border-amber-900/30 text-[#f2f0eb] focus:outline-none focus:border-amber-500/50 transition-colors resize-none" placeholder="Any dietary requirements, mobility needs, etc." />
            </div>
          </div>

          {/* Price summary */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex justify-between text-sm text-[#f2f0eb]/60 mb-2">
              <span>₹{pkg.price.toLocaleString('en-IN')} × {form.travelerCount} traveler{form.travelerCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#f2f0eb]">Total Amount</span>
              <div className="flex items-center gap-1 text-2xl font-bold text-amber-400">
                <IndianRupee className="h-5 w-5" />
                {totalPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={bookMutation.isPending || form.travelerCount > pkg.remaining_seats}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:from-amber-600 hover:to-orange-700 disabled:opacity-60 transition-all text-lg"
          >
            {bookMutation.isPending ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Creating Booking...</>
            ) : (
              '🙏 Proceed to Payment'
            )}
          </button>
        </form>
      )}
    </div>
  )
}
