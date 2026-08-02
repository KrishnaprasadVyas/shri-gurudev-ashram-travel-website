import { useState } from 'react'
import { Loader2, Image as ImageIcon, CheckCircle, AlertCircle, Calendar, IndianRupee, Users, Sparkles } from 'lucide-react'
import type { TravelPackageRow } from '@/types/database.types'
import { useTranslation } from "react-i18next";

interface PackageFormData {
  title: string
  description: string
  price: number
  duration: string
  total_seats: number
  remaining_seats: number
  image_url: string
  is_active: boolean
  flight_price: number
  train_ac_price: number
  train_non_ac_price: number
  room_ac_price: number
  room_non_ac_price: number
}

interface PackageFormProps {
  initialData?: TravelPackageRow
  onSubmit: (data: PackageFormData) => Promise<void>
  submitLabel: string
}

export function PackageForm({ initialData, onSubmit, submitLabel }: PackageFormProps) {
    const { t } = useTranslation();
  const [form, setForm] = useState<PackageFormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    price: initialData?.price ?? 0,
    duration: initialData?.duration ?? '',
    total_seats: initialData?.total_seats ?? 30,
    remaining_seats: initialData?.remaining_seats ?? 30,
    image_url: initialData?.image_url ?? '',
    is_active: initialData?.is_active ?? true,
    flight_price: initialData?.flight_price ?? 0,
    train_ac_price: initialData?.train_ac_price ?? 0,
    train_non_ac_price: initialData?.train_non_ac_price ?? 0,
    room_ac_price: initialData?.room_ac_price ?? 0,
    room_non_ac_price: initialData?.room_non_ac_price ?? 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Required Yatra title'
    if (form.description.length < 50) e.description = 'Please provide at least 50 characters of spiritual details'
    if (form.price <= 0) e.price = 'Must be greater than ₹0'
    if (!form.duration.trim()) e.duration = 'Required duration (e.g. "7 Days / 6 Nights")'
    if (form.total_seats < 1) e.total_seats = 'Must allow at least 1 seeker seat'
    if (form.remaining_seats > form.total_seats) e.remaining_seats = 'Remaining seats cannot exceed total seat capacity'
    if (form.remaining_seats < 0) e.remaining_seats = 'Cannot be negative'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full px-4.5 py-3 rounded-[14px] bg-[#FFFFFF] border ${
      errors[field] ? 'border-[#B23A2F]' : 'border-[#E9DCC5]'
    } text-[#3E2B1F] placeholder-[#9A8A78] text-sm focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 transition-all duration-200`

  const renderError = (f: string) =>
    errors[f] ? (
      <p className="text-[#B23A2F] text-xs font-semibold mt-1.5 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        <span>{errors[f]}</span>
      </p>
    ) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-[#3E2B1F]">
      {/* Group 1: Basic Details */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E9DCC5]">
          <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-[#B8860B]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[#3E2B1F]">{"Basic Yatra Details"}</h3>
            <p className="text-xs text-[#6F5B47]">{"Set the sacred pilgrimage title and comprehensive spiritual itinerary"}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
              
                                        {"Pilgrimage Package Title *"}
                                      </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={"e.g. Char Dham & Kashi Sacred Yatra 2026"}
              className={inputClass('title')}
            />
            {renderError('title')}
          </div>

          <div>
            <label className="block text-xs font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
              
                                        {"Spiritual Itinerary & Description * (Min 50 chars)"}
                                      </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={"Provide full details of the holy darshan, accommodation inclusions, transport luxury, and daily schedule..."}
              className={`${inputClass('description')} resize-y min-h-[120px]`}
            />
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <div>{renderError('description')}</div>
              <span className={`font-mono ${form.description.length < 50 ? 'text-[#C48A00]' : 'text-[#2E7D32] font-bold'}`}>
                {form.description.length} / 50 min characters
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Group 2: Pricing & Schedule */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E9DCC5]">
          <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-[#B8860B]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[#3E2B1F]">{"Pricing & Pilgrimage Schedule"}</h3>
            <p className="text-xs text-[#6F5B47]">{"Define per-devotee contribution tier and journey duration"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
              
                                        {"Per Devotee Price (₹) *"}
                                      </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B8860B]" />
              <input
                type="number"
                min={1}
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                placeholder="24500"
                className={`${inputClass('price')} pl-10 font-display font-bold text-base text-[#B8860B]`}
              />
            </div>
            {renderError('price')}
          </div>

          <div>
            <label className="block text-xs font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
              
                                        {"Journey Duration *"}
                                      </label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder={"e.g. 7 Days / 6 Nights"}
              className={inputClass('duration')}
            />
            {renderError('duration')}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E9DCC5]">
          <h4 className="text-sm font-bold text-[#3E2B1F] mb-4">{"Travel Preference Surcharges (Optional Add-ons)"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
                
                                              {"Flight (+₹)"}
                                            </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B8860B]" />
                <input type="number" min={0} value={form.flight_price || ''} onChange={(e) => setForm({ ...form, flight_price: Number(e.target.value) })} placeholder="0" className={`${inputClass('flight_price')} pl-8 py-2 text-xs`} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
                
                                              {"AC Train (+₹)"}
                                            </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B8860B]" />
                <input type="number" min={0} value={form.train_ac_price || ''} onChange={(e) => setForm({ ...form, train_ac_price: Number(e.target.value) })} placeholder="0" className={`${inputClass('train_ac_price')} pl-8 py-2 text-xs`} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
                
                                              {"Non-AC Train (+₹)"}
                                            </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B8860B]" />
                <input type="number" min={0} value={form.train_non_ac_price || ''} onChange={(e) => setForm({ ...form, train_non_ac_price: Number(e.target.value) })} placeholder="0" className={`${inputClass('train_non_ac_price')} pl-8 py-2 text-xs`} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
                
                                              {"AC Room (+₹)"}
                                            </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B8860B]" />
                <input type="number" min={0} value={form.room_ac_price || ''} onChange={(e) => setForm({ ...form, room_ac_price: Number(e.target.value) })} placeholder="0" className={`${inputClass('room_ac_price')} pl-8 py-2 text-xs`} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
                
                                              {"Non-AC Room (+₹)"}
                                            </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B8860B]" />
                <input type="number" min={0} value={form.room_non_ac_price || ''} onChange={(e) => setForm({ ...form, room_non_ac_price: Number(e.target.value) })} placeholder="0" className={`${inputClass('room_non_ac_price')} pl-8 py-2 text-xs`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group 3: Images & Media Upload (#7) */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E9DCC5]">
          <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-[#B8860B]">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[#3E2B1F]">{"Banner Media & Visual Presentation"}</h3>
            <p className="text-xs text-[#6F5B47]">{"High-resolution holy temple photograph for public Yatra card display"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
              
                                        {"Direct Image URL / Media Asset Link"}
                                      </label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
              className={inputClass('image_url')}
            />
          </div>

          {/* Drag & Drop Style Visual Box (#7) */}
          <div className="border-2 border-dashed border-[#E9DCC5] rounded-[20px] p-6 bg-[#FFFFFF] text-center transition-colors hover:border-[#B8860B]/50">
            {form.image_url ? (
              <div className="space-y-3">
                <div className="h-52 rounded-[16px] overflow-hidden border border-[#E9DCC5] shadow-md max-w-lg mx-auto">
                  <img
                    src={form.image_url}
                    alt={"Yatra Banner Preview"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <p className="text-xs font-bold text-[#2E7D32] flex items-center justify-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{"Banner loaded successfully. This exact image will appear on the public Yatras catalog."}</span>
                </p>
              </div>
            ) : (
              <div className="py-8 space-y-2 text-[#9A8A78]">
                <div className="w-14 h-14 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center mx-auto shadow-sm text-[#B8860B]">
                  🪷
                </div>
                <p className="font-display text-base font-bold text-[#3E2B1F]">
                  
                                                        {"Paste image URL above to preview banner"}
                                                      </p>
                <p className="text-xs text-[#6F5B47] max-w-sm mx-auto">
                  
                                                        {"Use clear, serene photography of sacred shrines or spiritual landscapes in 16:9 aspect ratio."}
                                                      </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group 4: Availability & Live Status (#8) */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(90,70,20,0.06)] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E9DCC5]">
          <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center text-[#B8860B]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[#3E2B1F]">{"Seat Quotas & Live Status"}</h3>
            <p className="text-xs text-[#6F5B47]">{"Manage total capacity and real-time public catalog availability"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
              
                                        {"Total Seat Capacity *"}
                                      </label>
            <input
              type="number"
              min={1}
              value={form.total_seats || ''}
              onChange={(e) => setForm({ ...form, total_seats: Number(e.target.value) })}
              className={inputClass('total_seats')}
            />
            {renderError('total_seats')}
          </div>

          <div>
            <label className="block text-xs font-label-caps font-bold uppercase tracking-[0.15em] text-[#B8860B] mb-2">
              
                                        {"Remaining Available Seats *"}
                                      </label>
            <input
              type="number"
              min={0}
              max={form.total_seats}
              value={form.remaining_seats || ''}
              onChange={(e) => setForm({ ...form, remaining_seats: Number(e.target.value) })}
              className={inputClass('remaining_seats')}
            />
            {renderError('remaining_seats')}
          </div>
        </div>

        {/* Live Status Toggle (#8) */}
        <div className="p-5 rounded-[18px] bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-between gap-4 cursor-pointer hover:border-[#B8860B]/50 transition-colors"
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${form.is_active ? 'bg-[#2E7D32]' : 'bg-[#9A8A78]'}`}
              />
              <span className="font-display font-bold text-base text-[#3E2B1F]">
                {form.is_active ? 'Active Package (Live on Website)' : 'Draft Mode (Hidden from Public)'}
              </span>
            </div>
            <p className="text-xs text-[#6F5B47]">
              {form.is_active
                ? 'Seekers can view and instantly book seats on the public Yatras catalog.'
                : 'This package is saved as a private draft and will not appear to public website visitors.'}
            </p>
          </div>

          <button
            type="button"
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 flex items-center ${
              form.is_active ? 'bg-[#B8860B] justify-end' : 'bg-[#E9DCC5] justify-start'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-[#FFFFFF] shadow-md block transition-transform" />
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-8 rounded-full bg-[#B8860B] hover:bg-[#6F5200] text-[#FFFFFF] font-display font-bold text-lg flex items-center justify-center gap-2.5 shadow-[0_10px_30px_rgba(140,106,10,0.3)] transition-all duration-200 disabled:opacity-60 cursor-pointer hover:-translate-y-0.5"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{"Saving Pilgrimage Package..."}</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
