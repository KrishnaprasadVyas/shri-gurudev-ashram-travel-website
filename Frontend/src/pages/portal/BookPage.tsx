import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShieldX, Loader2, IndianRupee, ArrowLeft, Clock, Users, Sparkles } from 'lucide-react'
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
      <div className="max-w-lg text-center py-16 space-y-6 mx-auto animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-[#C0392B]/15 border border-[#C0392B]/30 flex items-center justify-center mx-auto shadow-sm">
          <ShieldX className="h-8 w-8 text-[#C0392B]" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#3E2B1F]">Identity Verification Required</h1>
        <p className="text-[#6F5B47] text-sm leading-relaxed">
          You must submit your Aadhaar and selfie before booking a sacred Yatra.
        </p>
        <Link
          to="/portal/verify"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] transition-all shadow-sm"
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
    `w-full px-4 py-3.5 rounded-xl bg-[#FAF7F2] border ${errors[field] ? 'border-[#C0392B]' : 'border-[#E9DCC5]'} text-[#3E2B1F] focus:outline-none focus:border-[#B8860B] focus:bg-[#FFFFFF] transition-all text-sm font-medium shadow-2xs`

  const renderError = (field: string) =>
    errors[field] ? <p className="text-[#C0392B] text-xs font-bold mt-1.5">{errors[field]}</p> : null

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E9DCC5] text-[#6F5B47] hover:text-[#3E2B1F] hover:border-[#B8860B] transition-all cursor-pointer shadow-2xs"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold text-[#3E2B1F] tracking-tight">Book Yatra</h1>
          <p className="text-sm text-[#6F5B47] font-normal mt-0.5">Complete your pilgrimage reservation</p>
        </div>
      </div>

      {/* ── Package summary card ─────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] border border-[#B8860B]/30 shadow-[0_8px_30px_rgba(62,43,31,0.05)]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-[#B8860B]" />
          <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">Selected Journey</span>
        </div>
        <p className="font-display text-xl font-bold text-[#3E2B1F] mb-3">{pkg.title}</p>
        <div className="flex flex-wrap gap-5 text-sm text-[#6F5B47]">
          <span className="flex items-center gap-1.5 font-medium"><Clock className="h-4 w-4 text-[#B8860B]" /> {pkg.duration}</span>
          <span className="flex items-center gap-1.5 font-medium"><IndianRupee className="h-4 w-4 text-[#B8860B]" /> ₹{pkg.price.toLocaleString('en-IN')} / person</span>
          <span className="flex items-center gap-1.5 font-medium"><Users className="h-4 w-4 text-[#B8860B]" /> {pkg.remaining_seats} seats left</span>
        </div>
        {pkg.remaining_seats === 0 && (
          <p className="text-[#C0392B] text-sm mt-3 font-bold">This Yatra is fully booked.</p>
        )}
      </div>

      {pkg.remaining_seats > 0 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Info */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] space-y-5 shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
            <h2 className="font-display text-lg font-bold text-[#3E2B1F] pb-3 border-b border-[#E9DCC5]">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">Full Name</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass('fullName')} />
                {renderError('fullName')}
              </div>
              <div>
                <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">Date of Birth</label>
                <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className={inputClass('dob')} />
                {renderError('dob')}
              </div>
              <div>
                <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">Phone Number</label>
                <input type="tel" maxLength={10} value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, '') })} placeholder="10-digit" className={inputClass('phoneNumber')} />
                {renderError('phoneNumber')}
              </div>
              <div>
                <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">WhatsApp Number</label>
                <input type="tel" maxLength={10} value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value.replace(/\D/g, '') })} placeholder="10-digit" className={inputClass('whatsappNumber')} />
                {renderError('whatsappNumber')}
              </div>
            </div>
            <div>
              <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">Address</label>
              <textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${inputClass('address')} resize-none`} placeholder="Full address" />
              {renderError('address')}
            </div>
          </div>

          {/* Section 2: Travel Preferences */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] space-y-5 shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
            <h2 className="font-display text-lg font-bold text-[#3E2B1F] pb-3 border-b border-[#E9DCC5]">Travel Preferences</h2>
            <div>
              <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-3 uppercase tracking-wider">Transport Type</label>
              <div className="flex gap-3">
                {(['Flight', 'Train'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, transportType: t, busType: undefined })}
                    className={`flex-1 py-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer shadow-2xs ${form.transportType === t ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B]' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47] hover:text-[#3E2B1F] hover:bg-[#FFFFFF]'}`}
                  >
                    {t === 'Flight' ? '✈️' : '🚂'} {t}
                  </button>
                ))}
              </div>
            </div>
            {form.transportType === 'Train' && (
              <div>
                <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-3 uppercase tracking-wider">Train Class</label>
                <div className="flex gap-3">
                  {(['AC Train', 'Non-AC Train'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setForm({ ...form, busType: b })}
                      className={`flex-1 py-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer shadow-2xs ${form.busType === b ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B]' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47] hover:text-[#3E2B1F] hover:bg-[#FFFFFF]'}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                {renderError('busType')}
              </div>
            )}
            <div>
              <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-3 uppercase tracking-wider">Room Type</label>
              <div className="flex gap-3">
                {(['AC Room', 'Non-AC Room'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, roomType: r })}
                    className={`flex-1 py-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer shadow-2xs ${form.roomType === r ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B]' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47] hover:text-[#3E2B1F] hover:bg-[#FFFFFF]'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Booking Details */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] space-y-5 shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
            <h2 className="font-display text-lg font-bold text-[#3E2B1F] pb-3 border-b border-[#E9DCC5]">Booking Details</h2>
            <div>
              <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">Number of Travelers</label>
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
              <label className="block font-label-caps text-[11px] font-bold text-[#6F5B47] mb-2 uppercase tracking-wider">Special Notes (optional)</label>
              <textarea rows={3} value={form.specialNotes} onChange={(e) => setForm({ ...form, specialNotes: e.target.value })} className="w-full px-4 py-3.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-[#3E2B1F] focus:outline-none focus:border-[#B8860B] focus:bg-[#FFFFFF] transition-all text-sm font-medium resize-none shadow-2xs" placeholder="Any dietary requirements, mobility needs, etc." />
            </div>
          </div>

          {/* ── Price summary ────────────────────────────── */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#FFF7E8] border border-[#B8860B]/30 shadow-sm">
            <div className="flex justify-between text-sm text-[#6F5B47] mb-3">
              <span className="font-medium">₹{pkg.price.toLocaleString('en-IN')} × {form.travelerCount} traveler{form.travelerCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#B8860B]/20">
              <span className="font-display text-lg font-bold text-[#3E2B1F]">Total Amount</span>
              <div className="flex items-center gap-1 text-2xl font-bold text-[#B8860B]">
                <IndianRupee className="h-5 w-5" />
                {totalPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={bookMutation.isPending || form.travelerCount > pkg.remaining_seats}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-full bg-[#B8860B] text-white font-bold hover:bg-[#D4AF37] disabled:opacity-50 transition-all text-sm tracking-wider uppercase cursor-pointer shadow-md hover:-translate-y-0.5"
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
