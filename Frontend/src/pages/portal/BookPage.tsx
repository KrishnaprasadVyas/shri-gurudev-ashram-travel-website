import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShieldX, Loader2, IndianRupee, ArrowLeft, Clock, Users, Sparkles, CheckCircle2, ChevronRight, Upload, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { usePackage } from '@/hooks/usePackages'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import type { BookingRow } from '@/types/database.types'

type Step = 1 | 2 | 3 | 4

type PassengerForm = {
  id?: string;
  passenger_index: number;
  is_primary: boolean;
  full_name: string;
  gender: string;
  dob: string;
  phone: string;
  address: string;
  aadhaar_number: string;
}

type DocState = Record<number, Record<string, File>>

export function BookPage() {
  const { packageId } = useParams<{ packageId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()
  const { data: pkg, isLoading } = usePackage(packageId)

  usePageTitle(pkg ? `Book ${pkg.title}` : 'Book Yatra')

  const [step, setStep] = useState<Step>(1)
  const [booking, setBooking] = useState<BookingRow | null>(null)
  const [travelerCount, setTravelerCount] = useState(1)
  const [passengers, setPassengers] = useState<PassengerForm[]>([])
  const [documents, setDocuments] = useState<DocState>({})
  
  const [preferences, setPreferences] = useState({
    transportType: 'Flight',
    busType: '',
    roomType: 'AC Room'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize passengers based on travelerCount
  useEffect(() => {
    if (passengers.length !== travelerCount) {
      const newPassengers = Array.from({ length: travelerCount }).map((_, i) => {
        const existing = passengers[i]
        if (existing) return existing
        return {
          passenger_index: i,
          is_primary: i === 0,
          full_name: i === 0 ? userProfile?.full_name ?? '' : '',
          gender: '',
          dob: '',
          phone: i === 0 ? userProfile?.phone ?? '' : '',
          address: '',
          aadhaar_number: '',
        }
      })
      setPassengers(newPassengers)
    }
  }, [travelerCount, userProfile, passengers])

  const step1Mutation = useMutation({
    mutationFn: async () => {
      const { data: d1 } = await apiClient.post('/api/bookings/draft', { packageId })
      const bId = d1.booking.id
      const { data: d2 } = await apiClient.patch(`/api/bookings/${bId}/travellers`, { travelerCount })
      await apiClient.patch(`/api/bookings/${bId}/preferences`, {
        transportType: preferences.transportType,
        busType: preferences.transportType === 'Train' ? preferences.busType : undefined,
        roomType: preferences.roomType
      })
      return d2.booking
    },
    onSuccess: (b) => {
      setBooking(b)
      setStep(2)
      window.scrollTo(0, 0)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Failed to create draft')
    }
  })

  const step2Mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/api/bookings/${booking!.id}/passengers`, { passengers })
      return data.passengers
    },
    onSuccess: (savedPassengers) => {
      setPassengers(savedPassengers)
      setStep(3)
      window.scrollTo(0, 0)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Failed to save passenger details')
    }
  })

  const step3Mutation = useMutation({
    mutationFn: async () => {
      const promises = []
      for (let i = 0; i < passengers.length; i++) {
        const pId = passengers[i].id
        const pDocs = documents[i]
        if (!pDocs || !pDocs.aadhaar_front || !pDocs.aadhaar_back || !pDocs.selfie) {
          throw new Error(`Missing documents for Passenger ${i + 1}`)
        }
        for (const type of ['aadhaar_front', 'aadhaar_back', 'selfie']) {
          const formData = new FormData()
          formData.append('file', pDocs[type])
          promises.push(
            apiClient.post(`/api/bookings/${booking!.id}/passengers/${pId}/documents/${type}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
          )
        }
      }
      await Promise.all(promises)
    },
    onSuccess: () => {
      setStep(4)
      window.scrollTo(0, 0)
    },
    onError: (err: any) => {
      toast.error(err.message ?? err.response?.data?.error ?? 'Document upload failed')
    }
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/api/bookings/${booking!.id}/submit`)
      return data.booking
    },
    onSuccess: (b) => {
      toast.success('Booking ready for payment! 🙏')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      navigate(`/portal/bookings/${b.id}`, { replace: true })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Failed to submit booking')
    }
  })

  const handlePassengerChange = (index: number, field: keyof PassengerForm, value: any) => {
    const updated = [...passengers]
    updated[index] = { ...updated[index], [field]: value }
    setPassengers(updated)
  }

  const setFile = (pIndex: number, type: string, file: File) => {
    setDocuments(prev => ({
      ...prev,
      [pIndex]: {
        ...(prev[pIndex] || {}),
        [type]: file
      }
    }))
  }

  const removeFile = (pIndex: number, type: string) => {
    setDocuments(prev => {
      const updated = { ...prev }
      if (updated[pIndex]) {
        const pDocs = { ...updated[pIndex] }
        delete pDocs[type]
        updated[pIndex] = pDocs
      }
      return updated
    })
  }

  // --- Handlers ---
  
  const validateStep2 = () => {
    const e: Record<string, string> = {}
    passengers.forEach((p, i) => {
      if (!p.full_name.trim()) e[`${i}_name`] = 'Required'
      if (!p.gender) e[`${i}_gender`] = 'Required'
      if (!p.dob) e[`${i}_dob`] = 'Required'
      if (!/^\d{10}$/.test(p.phone)) e[`${i}_phone`] = '10 digits'
      if (!p.address.trim()) e[`${i}_address`] = 'Required'
      if (!/^\d{12}$/.test(p.aadhaar_number)) e[`${i}_aadhaar`] = '12 digits'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }





  if (isLoading) return <LoadingState variant="detail" />
  if (!pkg) return null

  const inputClass = (err?: string) => `w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border ${err ? 'border-[#C0392B]' : 'border-[#E9DCC5]'} text-[#3E2B1F] focus:outline-none focus:border-[#B8860B] focus:bg-[#FFFFFF] transition-all text-sm font-medium shadow-2xs`
  
  const stepTitles = ['Travelers', 'Passenger Details', 'Documents', 'Review & Pay']

  const flightSurcharge = preferences.transportType === 'Flight' ? (pkg.flight_price || 0) : 0
  const trainAcSurcharge = (preferences.transportType === 'Train' && preferences.busType === 'AC Train') ? (pkg.train_ac_price || 0) : 0
  const trainNonAcSurcharge = (preferences.transportType === 'Train' && preferences.busType === 'Non-AC Train') ? (pkg.train_non_ac_price || 0) : 0
  const transportSurcharge = flightSurcharge + trainAcSurcharge + trainNonAcSurcharge
  
  const acRoomSurcharge = preferences.roomType === 'AC Room' ? (pkg.room_ac_price || 0) : 0
  const nonAcRoomSurcharge = preferences.roomType === 'Non-AC Room' ? (pkg.room_non_ac_price || 0) : 0
  const roomSurcharge = acRoomSurcharge + nonAcRoomSurcharge
  
  const pricePerPerson = pkg.price + transportSurcharge + roomSurcharge
  const totalBasePrice = pricePerPerson * travelerCount

  const renderSurcharge = (price?: number) => {
    return price && price > 0 ? <span className="text-[10px] block opacity-70">(+₹{price.toLocaleString('en-IN')})</span> : null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E9DCC5] text-[#6F5B47] hover:text-[#3E2B1F] hover:border-[#B8860B] transition-all cursor-pointer shadow-2xs">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] tracking-tight">Book {pkg.title}</h1>
            <p className="text-sm text-[#6F5B47] font-normal mt-0.5">Complete your pilgrimage reservation</p>
          </div>
        </div>
      </div>

      {/* ── Stepper ──────────────────────────────────────── */}
      <div className="flex items-center justify-between relative px-2 sm:px-6">
        <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-[#E9DCC5] -translate-y-1/2 -z-10 hidden sm:block"></div>
        {stepTitles.map((title, i) => {
          const s = i + 1
          const active = step === s
          const completed = step > s
          return (
            <div key={title} className="flex flex-col items-center gap-2 bg-background z-10 px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${completed ? 'bg-[#4CAF50] text-white' : active ? 'bg-[#B8860B] text-white ring-4 ring-[#B8860B]/20' : 'bg-[#E9DCC5] text-[#6F5B47]'}`}>
                {completed ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold hidden sm:block ${active ? 'text-[#B8860B]' : 'text-[#9A8A78]'}`}>{title}</span>
            </div>
          )
        })}
      </div>

      {/* ── Steps ────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] border border-[#E9DCC5] rounded-3xl shadow-[0_8px_30px_rgba(62,43,31,0.04)] overflow-hidden">
        
        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); step1Mutation.mutate(); }} className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#B8860B]" />
              <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">Step 1 of 4</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#3E2B1F] mb-6">Setup your Yatra</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-2">Transport Type</label>
                  <div className="flex gap-3">
                    {(['Flight', 'Train'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setPreferences({ ...preferences, transportType: t, busType: '' })} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${preferences.transportType === t ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B]' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47]'}`}>
                        {t} {t === 'Flight' ? renderSurcharge(pkg.flight_price) : null}
                      </button>
                    ))}
                  </div>
                </div>
                {preferences.transportType === 'Train' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-2">Train Class</label>
                    <div className="flex gap-3">
                      {(['AC Train', 'Non-AC Train'] as const).map(c => (
                        <button key={c} type="button" onClick={() => setPreferences({ ...preferences, busType: c })} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${preferences.busType === c ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B]' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47]'}`}>
                          {c} {c === 'AC Train' ? renderSurcharge(pkg.train_ac_price) : renderSurcharge(pkg.train_non_ac_price)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-2">Room Type</label>
                    <div className="flex gap-3">
                      {(['AC Room', 'Non-AC Room'] as const).map(r => (
                        <button key={r} type="button" onClick={() => setPreferences({ ...preferences, roomType: r })} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${preferences.roomType === r ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B]' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47]'}`}>
                          {r} {r === 'AC Room' ? renderSurcharge(pkg.room_ac_price) : renderSurcharge(pkg.room_non_ac_price)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {preferences.transportType === 'Train' && (
                <div>
                  <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-2">Room Type</label>
                  <div className="flex gap-3 max-w-[50%]">
                      {(['AC Room', 'Non-AC Room'] as const).map(r => (
                      <button key={r} type="button" onClick={() => setPreferences({ ...preferences, roomType: r })} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${preferences.roomType === r ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B]' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47]'}`}>
                        {r} {r === 'AC Room' ? renderSurcharge(pkg.room_ac_price) : renderSurcharge(pkg.room_non_ac_price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-[#FFF7E8] border border-[#B8860B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#B8860B] uppercase tracking-wider mb-1">Travelers</label>
                  <div className="w-full sm:w-32">
                    <input type="number" min={1} max={pkg.remaining_seats} value={travelerCount} onChange={(e) => setTravelerCount(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#B8860B] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20 text-center text-lg font-bold shadow-2xs" />
                  </div>
                  <span className="flex items-center gap-1.5 font-medium text-xs text-[#6F5B47] mt-2"><Users className="h-3 w-3 text-[#B8860B]" /> {pkg.remaining_seats} seats left</span>
                </div>
                <div className="text-right">
                  <span className="block font-medium text-xs text-[#6F5B47] mb-0.5">Total Amount</span>
                  <span className="flex items-center justify-end gap-1 font-display text-2xl font-bold text-[#B8860B]">
                    <IndianRupee className="h-5 w-5" />
                    {totalBasePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-[#6F5B47] mt-0.5">+ 2.36% Gateway Fee</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E9DCC5]">
              <button type="submit" disabled={step1Mutation.isPending || travelerCount > pkg.remaining_seats || travelerCount < 1} className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm tracking-wider uppercase hover:bg-[#D4AF37] disabled:opacity-50 transition-all shadow-md">
                {step1Mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={(e) => {
            e.preventDefault()
            if (validateStep2()) step2Mutation.mutate()
          }} className="p-6 sm:p-8 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#B8860B]" />
              <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">Step 2 of 4</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#3E2B1F]">Passenger Details</h2>

            <div className="space-y-6">
              {passengers.map((p, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E9DCC5] space-y-4">
                  <h3 className="font-bold text-[#3E2B1F] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#B8860B] text-white flex items-center justify-center text-xs">{i + 1}</span>
                    Passenger {i + 1} {p.is_primary && <span className="text-[10px] uppercase bg-[#E9DCC5] text-[#6F5B47] px-2 py-0.5 rounded-full">Primary</span>}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">Full Name</label>
                      <input type="text" value={p.full_name} onChange={(e) => handlePassengerChange(i, 'full_name', e.target.value)} className={inputClass(errors[`${i}_name`])} />
                      {errors[`${i}_name`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_name`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">Gender</label>
                      <select value={p.gender} onChange={(e) => handlePassengerChange(i, 'gender', e.target.value)} className={inputClass(errors[`${i}_gender`])}>
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {errors[`${i}_gender`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_gender`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">Date of Birth</label>
                      <input type="date" value={p.dob} onChange={(e) => handlePassengerChange(i, 'dob', e.target.value)} className={inputClass(errors[`${i}_dob`])} />
                      {errors[`${i}_dob`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_dob`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">Phone</label>
                      <input type="tel" maxLength={10} value={p.phone} onChange={(e) => handlePassengerChange(i, 'phone', e.target.value.replace(/\D/g, ''))} className={inputClass(errors[`${i}_phone`])} />
                      {errors[`${i}_phone`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_phone`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">Aadhaar Number</label>
                      <input type="text" maxLength={12} value={p.aadhaar_number} onChange={(e) => handlePassengerChange(i, 'aadhaar_number', e.target.value.replace(/\D/g, ''))} className={inputClass(errors[`${i}_aadhaar`])} />
                      {errors[`${i}_aadhaar`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_aadhaar`]}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">Address</label>
                      <textarea rows={2} value={p.address} onChange={(e) => handlePassengerChange(i, 'address', e.target.value)} className={inputClass(errors[`${i}_address`])} />
                      {errors[`${i}_address`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_address`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-[#E9DCC5]">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-full text-[#6F5B47] font-bold text-sm tracking-wider uppercase hover:bg-[#FAF7F2] transition-colors">Back</button>
              <button type="submit" disabled={step2Mutation.isPending} className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm tracking-wider uppercase hover:bg-[#D4AF37] disabled:opacity-50 transition-all shadow-md">
                {step2Mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={(e) => { e.preventDefault(); step3Mutation.mutate(); }} className="p-6 sm:p-8 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#B8860B]" />
              <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">Step 3 of 4</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#3E2B1F]">Document Uploads</h2>
            <p className="text-sm text-[#6F5B47]">Please provide ID proof for each passenger (JPG, PNG, PDF &lt; 5MB).</p>

            <div className="space-y-6">
              {passengers.map((p, i) => (
                <div key={p.id} className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] space-y-4 shadow-sm">
                  <h3 className="font-bold text-[#3E2B1F]">{p.full_name}'s Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { key: 'aadhaar_front', label: 'Aadhaar Front' },
                      { key: 'aadhaar_back', label: 'Aadhaar Back' },
                      { key: 'selfie', label: 'Recent Selfie' }
                    ].map(doc => {
                      const file = documents[i]?.[doc.key]
                      return (
                        <div key={doc.key} className="border border-[#E9DCC5] rounded-xl p-4 bg-[#FAF7F2] relative flex flex-col justify-between h-24">
                          <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider">{doc.label} *</label>
                          {file ? (
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-medium text-[#3E2B1F] truncate pr-2" title={file.name}>{file.name}</span>
                              <button type="button" onClick={() => removeFile(i, doc.key)} className="text-[#C0392B] hover:text-[#A93226]">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="mt-2 flex items-center justify-center gap-2 px-3 py-1.5 border border-dashed border-[#B8860B] rounded-lg text-[#B8860B] hover:bg-[#FFF7E8] transition-colors cursor-pointer text-xs font-bold">
                              <Upload className="h-3 w-3" /> Upload
                              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => {
                                if (e.target.files?.[0]) setFile(i, doc.key, e.target.files[0])
                              }} />
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-[#E9DCC5]">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-full text-[#6F5B47] font-bold text-sm tracking-wider uppercase hover:bg-[#FAF7F2] transition-colors">Back</button>
              <button type="submit" disabled={step3Mutation.isPending} className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm tracking-wider uppercase hover:bg-[#D4AF37] disabled:opacity-50 transition-all shadow-md">
                {step3Mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }} className="p-6 sm:p-8 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#B8860B]" />
              <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">Step 4 of 4</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#3E2B1F]">Review & Submit</h2>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E9DCC5]">
                <h3 className="font-bold text-[#3E2B1F] mb-3 border-b border-[#E9DCC5] pb-2">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-[#6F5B47]">Package</span>
                  <span className="font-medium text-[#3E2B1F] text-right">{pkg.title}</span>
                  <span className="text-[#6F5B47]">Travelers</span>
                  <span className="font-medium text-[#3E2B1F] text-right">{travelerCount}</span>
                  <span className="text-[#6F5B47]">Transport</span>
                  <span className="font-medium text-[#3E2B1F] text-right">{preferences.transportType} {preferences.busType ? `(${preferences.busType})` : ''}</span>
                  <span className="text-[#6F5B47]">Room</span>
                  <span className="font-medium text-[#3E2B1F] text-right">{preferences.roomType}</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFF7E8] border border-[#B8860B]/30 shadow-sm">
                <div className="flex justify-between text-sm text-[#6F5B47] mb-2">
                  <span className="font-medium">₹{pricePerPerson.toLocaleString('en-IN')} × {travelerCount} traveler{travelerCount > 1 ? 's' : ''}</span>
                  <span className="font-bold text-[#3E2B1F]">₹{totalBasePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-[#6F5B47] mb-3">
                  <span>Payment Gateway Fee (2.36%) will be added</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#B8860B]/20">
                  <span className="font-display text-lg font-bold text-[#3E2B1F]">Base Amount</span>
                  <div className="flex items-center gap-1 text-2xl font-bold text-[#B8860B]">
                    <IndianRupee className="h-5 w-5" />
                    {totalBasePrice.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#E9DCC5]">
              <button type="button" onClick={() => setStep(3)} className="px-6 py-3 rounded-full text-[#6F5B47] font-bold text-sm tracking-wider uppercase hover:bg-[#FAF7F2] transition-colors">Back</button>
              <button type="submit" disabled={submitMutation.isPending} className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm tracking-wider uppercase hover:bg-[#D4AF37] disabled:opacity-50 transition-all shadow-md">
                {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm & Proceed to Pay'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
