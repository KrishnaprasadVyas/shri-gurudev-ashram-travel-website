import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShieldX, Loader2, IndianRupee, ArrowLeft, Clock, Users, Sparkles, CheckCircle2, ChevronRight, Upload, X, Gift } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { usePackage } from '@/hooks/usePackages'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import type { BookingRow } from '@/types/database.types'
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
  const { packageId } = useParams<{ packageId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userProfile } = useAuth()
  const { data: pkg, isLoading } = usePackage(packageId)

  // Fetch available public Seva packages
  const { data: sevaPackages = [] } = useQuery({
    queryKey: ['public-seva-packages'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/public/seva-packages')
      return (data.packages ?? []) as Array<{
        id: string
        title: string
        description: string | null
        price: number
        seva_type: string
        allow_date_selection: boolean
      }>
    }
  })

  usePageTitle(pkg ? `${t('portal.book.bookTitle')} ${pkg.title}` : t('portal.book.bookYatra'))

  const [step, setStep] = useState<Step>(1)
  const [booking, setBooking] = useState<BookingRow | null>(null)
  const [travelerCount, setTravelerCount] = useState(1)
  const [passengers, setPassengers] = useState<PassengerForm[]>([])
  const [documents, setDocuments] = useState<DocState>({})
  
  const [preferences, setPreferences] = useState({
    transportType: 'Flight',
    busType: '',
    roomType: 'AC Room',
    additionalSevaPackageId: '',
    additionalSevaType: '',
    additionalSevaDate: '',
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

  const selectedSeva = sevaPackages.find(s => s.id === preferences.additionalSevaPackageId)

  const step1Mutation = useMutation({
    mutationFn: async () => {
      const { data: d1 } = await apiClient.post('/api/bookings/draft', { packageId })
      const bId = d1.booking.id
      const { data: d2 } = await apiClient.patch(`/api/bookings/${bId}/travellers`, { travelerCount })
      await apiClient.patch(`/api/bookings/${bId}/preferences`, {
        transportType: preferences.transportType,
        busType: preferences.transportType === 'Train' ? preferences.busType : undefined,
        roomType: preferences.roomType,
        additionalSevaPackageId: preferences.additionalSevaPackageId || undefined,
        additionalSevaType: selectedSeva ? selectedSeva.seva_type : undefined,
        additionalSevaDate: preferences.additionalSevaDate || undefined,
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
  const sevaFee = selectedSeva ? Number(selectedSeva.price || 0) : 0
  const grandTotal = totalBasePrice + sevaFee

  const renderSurcharge = (price?: number | null) => {
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
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] tracking-tight">{t('portal.book.bookTitle')} {pkg.title}</h1>
            <p className="text-sm text-[#6F5B47] font-normal mt-0.5">{t('portal.book.completeReservation')}</p>
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
              <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">{t('portal.book.step1')}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#3E2B1F] mb-6">{t('portal.book.setupYatra')}</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-2">{t('portal.book.transportType')}</label>
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
                    <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-2">{t('portal.book.trainClass')}</label>
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
                    <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-2">{t('portal.book.roomType')}</label>
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
                  <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-2">{t('portal.book.roomType')}</label>
                  <div className="flex gap-3 max-w-[50%]">
                      {(['AC Room', 'Non-AC Room'] as const).map(r => (
                      <button key={r} type="button" onClick={() => setPreferences({ ...preferences, roomType: r })} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${preferences.roomType === r ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B]' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47]'}`}>
                        {r} {r === 'AC Room' ? renderSurcharge(pkg.room_ac_price) : renderSurcharge(pkg.room_non_ac_price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Attach Optional Seva Section ─────────────────── */}
              <div className="pt-4 border-t border-[#E9DCC5]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#3E2B1F] uppercase tracking-wider flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[#B8860B]" />
                    {t('portal.book.attachOptionalSeva')}
                  </label>
                  <span className="text-[10px] font-bold text-[#B8860B] uppercase bg-[#FFF7E8] px-2 py-0.5 rounded-md border border-[#B8860B]/20">{t('portal.book.optional')}</span>
                </div>
                <p className="text-xs text-[#6F5B47]">{t('portal.book.sevaDesc')}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreferences(prev => ({ ...prev, additionalSevaPackageId: '', additionalSevaType: '' }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${!preferences.additionalSevaPackageId ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B] ring-2 ring-[#B8860B]/20' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47] hover:border-[#B8860B]/40'}`}
                  >
                    <div className="font-bold text-sm text-[#3E2B1F]">{t('portal.book.noAttachedSeva')}</div>
                    <div className="text-xs text-[#6F5B47] mt-1">{t('portal.book.standardYatraDesc')}</div>
                    <div className="mt-2 text-xs font-bold text-[#B8860B]">₹0</div>
                  </button>

                  {sevaPackages.map((s) => {
                    const isSelected = preferences.additionalSevaPackageId === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setPreferences(prev => ({ ...prev, additionalSevaPackageId: s.id, additionalSevaType: s.seva_type }))}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${isSelected ? 'bg-[#FFF7E8] border-[#B8860B] text-[#B8860B] ring-2 ring-[#B8860B]/20' : 'bg-[#FAF7F2] border-[#E9DCC5] text-[#6F5B47] hover:border-[#B8860B]/40'}`}
                      >
                        <div className="font-bold text-sm text-[#3E2B1F] line-clamp-1">{s.title}</div>
                        <div className="text-xs text-[#6F5B47] mt-1 line-clamp-2">{s.description || t('portal.book.sacredAshramSeva')}</div>
                        <div className="mt-2 text-xs font-bold text-[#B8860B]">+ ₹{Number(s.price).toLocaleString('en-IN')}</div>
                      </button>
                    )
                  })}
                </div>

                {selectedSeva?.allow_date_selection && (
                  <div className="pt-2 max-w-xs">
                    <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">{t('portal.book.sevaDate')}</label>
                    <input
                      type="date"
                      value={preferences.additionalSevaDate}
                      onChange={(e) => setPreferences(prev => ({ ...prev, additionalSevaDate: e.target.value }))}
                      className={inputClass()}
                    />
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-[#FFF7E8] border border-[#B8860B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#B8860B] uppercase tracking-wider mb-1">{t('portal.book.travelers')}</label>
                  <div className="w-full sm:w-32">
                    <input type="number" min={1} max={pkg.remaining_seats} value={travelerCount} onChange={(e) => setTravelerCount(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#B8860B] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20 text-center text-lg font-bold shadow-2xs" />
                  </div>
                  <span className="flex items-center gap-1.5 font-medium text-xs text-[#6F5B47] mt-2"><Users className="h-3 w-3 text-[#B8860B]" /> {pkg.remaining_seats} {t('portal.book.seatsLeft')}</span>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-[#6F5B47]">
                    {t('portal.book.yatra')}{travelerCount}{"x): ₹"}{totalBasePrice.toLocaleString('en-IN')}
                    {sevaFee > 0 && <span className="ml-2 font-semibold text-[#B8860B]">{t('portal.book.sevaFeeLabel')}{sevaFee.toLocaleString('en-IN')}</span>}
                  </div>
                  <span className="block font-medium text-xs text-[#6F5B47]">{t('portal.book.totalBaseAmount')}</span>
                  <span className="flex items-center justify-end gap-1 font-display text-2xl font-bold text-[#B8860B]">
                    <IndianRupee className="h-5 w-5" />
                    {grandTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-[#6F5B47]">{t('portal.book.gatewayFeeAdd')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E9DCC5]">
              <button type="submit" disabled={step1Mutation.isPending || travelerCount > pkg.remaining_seats || travelerCount < 1} className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm tracking-wider uppercase hover:bg-[#D4AF37] disabled:opacity-50 transition-all shadow-md">
                {step1Mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : t('portal.book.continue')} <ChevronRight className="h-4 w-4" />
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
              <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">{t('portal.book.step2')}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#3E2B1F]">{t('portal.book.passengerDetails')}</h2>

            <div className="space-y-6">
              {passengers.map((p, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E9DCC5] space-y-4">
                  <h3 className="font-bold text-[#3E2B1F] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#B8860B] text-white flex items-center justify-center text-xs">{i + 1}</span>
                    {t('portal.book.passenger')} {i + 1} {p.is_primary && <span className="text-[10px] uppercase bg-[#E9DCC5] text-[#6F5B47] px-2 py-0.5 rounded-full">{t('portal.book.primary')}</span>}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">{t('portal.book.fullName')}</label>
                      <input type="text" value={p.full_name} onChange={(e) => handlePassengerChange(i, 'full_name', e.target.value)} className={inputClass(errors[`${i}_name`])} />
                      {errors[`${i}_name`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_name`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">{t('portal.book.gender')}</label>
                      <select value={p.gender} onChange={(e) => handlePassengerChange(i, 'gender', e.target.value)} className={inputClass(errors[`${i}_gender`])}>
                        <option value="">{t('portal.book.select')}</option>
                        <option value="male">{t('portal.book.male')}</option>
                        <option value="female">{t('portal.book.female')}</option>
                        <option value="other">{t('portal.book.other')}</option>
                      </select>
                      {errors[`${i}_gender`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_gender`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">{t('portal.book.dob')}</label>
                      <input type="date" value={p.dob} onChange={(e) => handlePassengerChange(i, 'dob', e.target.value)} className={inputClass(errors[`${i}_dob`])} />
                      {errors[`${i}_dob`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_dob`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">{t('portal.book.phone')}</label>
                      <input type="tel" maxLength={10} value={p.phone} onChange={(e) => handlePassengerChange(i, 'phone', e.target.value.replace(/\D/g, ''))} className={inputClass(errors[`${i}_phone`])} />
                      {errors[`${i}_phone`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_phone`]}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">{t('portal.book.aadhaarNumber')}</label>
                      <input type="text" maxLength={12} value={p.aadhaar_number} onChange={(e) => handlePassengerChange(i, 'aadhaar_number', e.target.value.replace(/\D/g, ''))} className={inputClass(errors[`${i}_aadhaar`])} />
                      {errors[`${i}_aadhaar`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_aadhaar`]}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#6F5B47] uppercase tracking-wider mb-1">{t('portal.book.address')}</label>
                      <textarea rows={2} value={p.address} onChange={(e) => handlePassengerChange(i, 'address', e.target.value)} className={inputClass(errors[`${i}_address`])} />
                      {errors[`${i}_address`] && <p className="text-[#C0392B] text-xs font-bold mt-1">{errors[`${i}_address`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-[#E9DCC5]">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-full text-[#6F5B47] font-bold text-sm tracking-wider uppercase hover:bg-[#FAF7F2] transition-colors">{t('portal.book.back')}</button>
              <button type="submit" disabled={step2Mutation.isPending} className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm tracking-wider uppercase hover:bg-[#D4AF37] disabled:opacity-50 transition-all shadow-md">
                {step2Mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : t('portal.book.continue')} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={(e) => { e.preventDefault(); step3Mutation.mutate(); }} className="p-6 sm:p-8 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#B8860B]" />
              <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">{t('portal.book.step3')}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#3E2B1F]">{t('portal.book.docUploads')}</h2>
            <p className="text-sm text-[#6F5B47]" dangerouslySetInnerHTML={{ __html: t('portal.book.docInfo') }}></p>

            <div className="space-y-6">
              {passengers.map((p, i) => (
                <div key={p.id} className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] space-y-4 shadow-sm">
                  <h3 className="font-bold text-[#3E2B1F]">{p.full_name}{t('portal.book.sDocs')}</h3>
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
                              <Upload className="h-3 w-3" /> {t('portal.book.upload')}
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
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-full text-[#6F5B47] font-bold text-sm tracking-wider uppercase hover:bg-[#FAF7F2] transition-colors">{t('portal.book.back')}</button>
              <button type="submit" disabled={step3Mutation.isPending} className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm tracking-wider uppercase hover:bg-[#D4AF37] disabled:opacity-50 transition-all shadow-md">
                {step3Mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : t('portal.book.continue')} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }} className="p-6 sm:p-8 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#B8860B]" />
              <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">{t('portal.book.step4')}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#3E2B1F]">{t('portal.book.reviewSubmit')}</h2>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E9DCC5]">
                <h3 className="font-bold text-[#3E2B1F] mb-3 border-b border-[#E9DCC5] pb-2">{t('portal.book.bookingSummary')}</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-[#6F5B47]">{t('portal.book.package')}</span>
                  <span className="font-medium text-[#3E2B1F] text-right">{pkg.title}</span>
                  <span className="text-[#6F5B47]">{t('portal.book.travelers')}</span>
                  <span className="font-medium text-[#3E2B1F] text-right">{travelerCount}</span>
                  <span className="text-[#6F5B47]">{t('portal.book.transport')}</span>
                  <span className="font-medium text-[#3E2B1F] text-right">{preferences.transportType} {preferences.busType ? `(${preferences.busType})` : ''}</span>
                  <span className="text-[#6F5B47]">{t('portal.book.room')}</span>
                  <span className="font-medium text-[#3E2B1F] text-right">{preferences.roomType}</span>
                  {selectedSeva && (
                    <>
                      <span className="text-[#6F5B47]">{t('portal.book.attachedSeva')}</span>
                      <span className="font-medium text-[#B8860B] text-right">{selectedSeva.title}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFF7E8] border border-[#B8860B]/30 shadow-sm space-y-2">
                <div className="flex justify-between text-sm text-[#6F5B47]">
                  <span className="font-medium">{t('portal.book.yatra')}{travelerCount} {t('portal.book.travelerStr')}{travelerCount > 1 ? 's' : ''})</span>
                  <span className="font-bold text-[#3E2B1F]">₹{totalBasePrice.toLocaleString('en-IN')}</span>
                </div>
                {selectedSeva && (
                  <div className="flex justify-between text-sm text-[#6F5B47]">
                    <span className="font-medium">{t('portal.book.sevaLabel')}{selectedSeva.title})</span>
                    <span className="font-bold text-[#B8860B]">₹{sevaFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-[#6F5B47] pt-1">
                  <span>{t('portal.book.paymentGatewayFeeAdded')}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#B8860B]/20">
                  <span className="font-display text-lg font-bold text-[#3E2B1F]">{t('portal.book.totalSubtotal')}</span>
                  <div className="flex items-center gap-1 text-2xl font-bold text-[#B8860B]">
                    <IndianRupee className="h-5 w-5" />
                    {grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#E9DCC5]">
              <button type="button" onClick={() => setStep(3)} className="px-6 py-3 rounded-full text-[#6F5B47] font-bold text-sm tracking-wider uppercase hover:bg-[#FAF7F2] transition-colors">{t('portal.book.back')}</button>
              <button type="submit" disabled={submitMutation.isPending} className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B8860B] text-white font-bold text-sm tracking-wider uppercase hover:bg-[#D4AF37] disabled:opacity-50 transition-all shadow-md">
                {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : t('portal.book.confirmPay')}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
