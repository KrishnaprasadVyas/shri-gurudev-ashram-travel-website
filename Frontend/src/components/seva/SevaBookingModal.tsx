import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Phone, CheckCircle2, ShieldCheck, CreditCard, Sparkles } from 'lucide-react'
import type { SevaPackage } from '@/types/travel'
import apiClient from '@/lib/apiClient'
import { formatCurrency, loadRazorpayScript } from '@/lib/utils'
import { useTranslation } from "react-i18next";

interface SevaBookingModalProps {
  isOpen: boolean
  onClose: () => void
  sevaPackage: SevaPackage | null
}

export function SevaBookingModal({ isOpen, onClose, sevaPackage }: SevaBookingModalProps) {
    const { t } = useTranslation();
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form')
  const [sevaDate, setSevaDate] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [completedBooking, setCompletedBooking] = useState<Record<string, unknown> | null>(null)

  // Availability map for target month
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { booked: number; max: number; available: boolean }>>({})
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    return `${today.getFullYear()}-${mm}`
  })

  useEffect(() => {
    if (isOpen && sevaPackage) {
      // Set default tomorrow date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setSevaDate(tomorrow.toISOString().split('T')[0])
      fetchAvailability(currentMonth)
    }
  }, [isOpen, sevaPackage, currentMonth])

  const fetchAvailability = async (monthStr: string) => {
    if (!sevaPackage) return
    try {
      const res = await apiClient.get(`/api/seva/availability?type=${sevaPackage.seva_type}&month=${monthStr}`)
      if (res.data?.availability) {
        setAvailabilityMap(res.data.availability)
      }
    } catch {
      // Ignore background availability error fallback
    }
  }

  if (!isOpen || !sevaPackage) return null

  const handleCreateOrderAndPay = async () => {
    setErrorMsg('')
    setLoading(true)
    try {
      // 1. Create Standalone Seva booking
      const createRes = await apiClient.post('/api/seva', {
        sevaPackageId: sevaPackage.id,
        sevaType: sevaPackage.seva_type,
        sevaDate,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        notes: notes.trim(),
      })

      const booking = createRes.data.booking

      // 2. Create Razorpay order
      const orderRes = await apiClient.post('/api/payments/create-seva-order', {
        sevaBookingId: booking.id,
      })

      const order = orderRes.data.order

      // 3. Load Razorpay script
      const sdkLoaded = await loadRazorpayScript()
      if (!sdkLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check network connection.')
      }

      // 4. Trigger Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: order.amount,
        currency: 'INR',
        name: 'Shri Gurudev Ashram',
        description: `Seva: ${sevaPackage.title}`,
        order_id: order.id,
        prefill: {
          name: fullName,
          contact: phoneNumber,
        },
        theme: {
          color: '#d97706',
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            setLoading(true)
            await apiClient.post('/api/payments/verify-seva', {
              sevaBookingId: booking.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setCompletedBooking({
              ...booking,
              status: 'paid',
              razorpay_payment_id: response.razorpay_payment_id,
            })
            setStep('success')
          } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Payment verification failed')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to process Seva booking')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#121110] border border-amber-900/30 shadow-2xl p-6 sm:p-8 text-[#f2f0eb]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#f2f0eb]/40 hover:text-[#f2f0eb] hover:bg-amber-900/20"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 'form' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-[#f2f0eb]">
                  Book {sevaPackage.title}
                </h3>
                <p className="text-xs text-[#f2f0eb]/50">
                  {formatCurrency(sevaPackage.price)} base contribution
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!sevaDate || !fullName.trim() || phoneNumber.trim().length !== 10) {
                  setErrorMsg('Please fill all required fields correctly (10-digit phone number).')
                  return
                }
                setErrorMsg('')
                setStep('review')
              }}
              className="space-y-4 text-sm"
            >
              {/* Seva Date */}
              <div>
                <label className="block text-xs font-medium text-[#f2f0eb]/70 mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" /> Seva Date *
                </label>
                <input
                  type="date"
                  value={sevaDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSevaDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-amber-900/30 text-[#f2f0eb] focus:outline-none focus:border-amber-500"
                />
                {sevaDate && availabilityMap[sevaDate] && (
                  <p className="text-[11px] text-amber-400/80 mt-1">
                    Daily Capacity: {availabilityMap[sevaDate].booked} / {availabilityMap[sevaDate].max} slots booked
                  </p>
                )}
              </div>

              {/* Devotee Name */}
              <div>
                <label className="block text-xs font-medium text-[#f2f0eb]/70 mb-1 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-400" /> Devotee Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter full name for Sankalp"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-amber-900/30 text-[#f2f0eb] placeholder-[#f2f0eb]/30 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-[#f2f0eb]/70 mb-1 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-amber-400" /> 10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-amber-900/30 text-[#f2f0eb] placeholder-[#f2f0eb]/30 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Sankalp / Notes */}
              <div>
                <label className="block text-xs font-medium text-[#f2f0eb]/70 mb-1">
                  Special Notes / Sankalp Request (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sankalp in the name of family members..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-amber-900/30 text-[#f2f0eb] placeholder-[#f2f0eb]/30 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white hover:from-amber-600 hover:to-orange-700 transition-all mt-4"
              >
                Continue to Review
              </button>
            </form>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-5">
            <h3 className="font-display text-xl font-bold text-[#f2f0eb]">
              Review Seva Booking
            </h3>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="p-4 rounded-xl bg-black/40 border border-amber-900/20 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#f2f0eb]/50">Seva Package</span>
                <span className="font-semibold text-amber-400">{sevaPackage.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f2f0eb]/50">Scheduled Date</span>
                <span>{sevaDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f2f0eb]/50">Devotee Name</span>
                <span>{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f2f0eb]/50">Contact Phone</span>
                <span>{phoneNumber}</span>
              </div>
              <div className="flex justify-between border-t border-amber-900/20 pt-2 font-bold text-base">
                <span>{"Total Amount"}</span>
                <span className="text-amber-400">{formatCurrency(sevaPackage.price)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#f2f0eb]/50">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Direct Payment via Razorpay. No extra convenience fee charged for Seva.</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={loading}
                className="w-1/3 py-3 rounded-xl bg-black/40 border border-amber-900/30 font-medium text-[#f2f0eb]/70 hover:text-white"
              >
                
                                              {"Back"}
                                            </button>
              <button
                type="button"
                onClick={handleCreateOrderAndPay}
                disabled={loading}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : (
                  <>
                    <CreditCard className="h-4 w-4" /> Pay {formatCurrency(sevaPackage.price)}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && completedBooking && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
            <h3 className="font-display text-2xl font-bold text-[#f2f0eb]">
              Seva Confirmed!
            </h3>
            <p className="text-xs text-[#f2f0eb]/60">
              Your Seva booking reference is{' '}
              <span className="font-mono text-amber-400 font-bold">{String(completedBooking.booking_reference)}</span>
            </p>

            <div className="p-4 rounded-xl bg-black/50 border border-amber-900/20 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#f2f0eb]/50">Devotee:</span>
                <span className="font-medium text-[#f2f0eb]">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f2f0eb]/50">Performance Date:</span>
                <span className="font-medium text-[#f2f0eb]">{sevaDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f2f0eb]/50">Payment ID:</span>
                <span className="font-mono text-emerald-400">{String(completedBooking.razorpay_payment_id || 'Captured')}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white hover:from-amber-600 hover:to-orange-700 transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
