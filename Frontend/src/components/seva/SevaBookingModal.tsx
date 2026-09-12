import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Phone, CheckCircle2, ShieldCheck, CreditCard, Sparkles, ArrowLeft } from 'lucide-react'
import type { SevaPackage } from '@/types/travel'
import apiClient from '@/lib/apiClient'
import { formatCurrency, loadRazorpayScript } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface SevaBookingModalProps {
  isOpen: boolean
  onClose: () => void
  sevaPackage: SevaPackage | null
}

export function SevaBookingModal({ isOpen, onClose, sevaPackage }: SevaBookingModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form')
  const [sevaDate, setSevaDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [completedBooking, setCompletedBooking] = useState<Record<string, unknown> | null>(null)

  // Availability map for target month
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { booked: number; max: number; available: boolean }>>({})

  useEffect(() => {
    if (!isOpen || !sevaPackage) return

    let active = true
    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const monthStr = `${today.getFullYear()}-${mm}`

    const loadAvailability = async () => {
      try {
        const res = await apiClient.get(`/api/seva/availability?type=${sevaPackage.seva_type}&month=${monthStr}`)
        if (active && res.data?.availability) {
          setAvailabilityMap(res.data.availability)
        }
      } catch {
        // Ignore background availability error fallback
      }
    }

    loadAvailability()
    return () => {
      active = false
    }
  }, [isOpen, sevaPackage])


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
          color: '#B8860B',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#FFFDF8] border border-[#E8DDC7] shadow-[0_20px_50px_rgba(75,54,33,0.25)] p-6 sm:p-8 text-[#3E2B1F] animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-xl text-[#6F5B47] hover:text-[#3E2B1F] hover:bg-[#FAF4EB] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 'form' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-[#D6B36A]/15 text-[#8C6A0A]">
                <Sparkles className="h-6 w-6 text-[#B8860B]" />
              </span>
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#3E2B1F]">
                  {t('seva.bookSeva', { defaultValue: 'Book Seva' })}: {sevaPackage.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#8C6A0A] font-semibold mt-0.5">
                  {formatCurrency(sevaPackage.price)} {t('yatraDetail.base', { defaultValue: 'base contribution' })}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
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
                <label className="block text-xs font-bold text-[#4B3621] mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#B8860B]" />
                  <span>{t('public.seva.sevaDate', { defaultValue: 'Seva Date *' })}</span>
                </label>
                <input
                  type="date"
                  value={sevaDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSevaDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7B0] text-[#3E2B1F] focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] font-medium"
                />
                {sevaDate && availabilityMap[sevaDate] && (
                  <p className="text-[11px] text-[#8C6A0A] font-medium mt-1">
                    {t('public.seva.dailyCapacity', { defaultValue: 'Daily Capacity:' })}{' '}
                    {availabilityMap[sevaDate].booked} / {availabilityMap[sevaDate].max}{' '}
                    {t('public.seva.slotsBooked', { defaultValue: 'slots booked' })}
                  </p>
                )}
              </div>

              {/* Devotee Name */}
              <div>
                <label className="block text-xs font-bold text-[#4B3621] mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#B8860B]" />
                  <span>{t('public.seva.devoteeFullName', { defaultValue: 'Devotee Full Name *' })}</span>
                </label>
                <input
                  type="text"
                  placeholder={t('public.seva.enterFullName', { defaultValue: 'Enter full name for Sankalp' })}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7B0] text-[#3E2B1F] placeholder-[#9A8A78] focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] font-medium"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-[#4B3621] mb-1.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#B8860B]" />
                  <span>{t('public.seva.mobileNumber', { defaultValue: '10-Digit Mobile Number *' })}</span>
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7B0] text-[#3E2B1F] placeholder-[#9A8A78] focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] font-medium"
                />
              </div>

              {/* Sankalp / Notes */}
              <div>
                <label className="block text-xs font-bold text-[#4B3621] mb-1.5">
                  {t('public.seva.specialNotes', { defaultValue: 'Special Notes / Sankalp Request (Optional)' })}
                </label>
                <textarea
                  rows={2}
                  placeholder={t('public.seva.sankalpPlaceholder', {
                    defaultValue: 'e.g. Sankalp in the name of family members...',
                  })}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8C7B0] text-[#3E2B1F] placeholder-[#9A8A78] focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] font-medium resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#D6B36A] hover:bg-[#B8860B] font-semibold text-white transition-all shadow-md mt-4 active:scale-98"
              >
                {t('public.seva.continueToReview', { defaultValue: 'Continue to Review' })}
              </button>
            </form>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-5">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#3E2B1F]">
              {t('public.seva.reviewBooking', { defaultValue: 'Review Seva Booking' })}
            </h3>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="p-4 sm:p-5 rounded-xl bg-[#FAF4EB] border border-[#E8DDC7] space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#6F5B47] font-medium">
                  {t('public.seva.sevaPackage', { defaultValue: 'Seva Package' })}
                </span>
                <span className="font-bold text-[#B8860B]">{sevaPackage.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6F5B47] font-medium">
                  {t('public.seva.scheduledDate', { defaultValue: 'Scheduled Date' })}
                </span>
                <span className="font-semibold text-[#3E2B1F]">{sevaDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6F5B47] font-medium">
                  {t('public.seva.devoteeName', { defaultValue: 'Devotee Name' })}
                </span>
                <span className="font-semibold text-[#3E2B1F]">{fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6F5B47] font-medium">
                  {t('public.seva.contactPhone', { defaultValue: 'Contact Phone' })}
                </span>
                <span className="font-semibold text-[#3E2B1F]">{phoneNumber}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#E8DDC7] pt-3 font-bold text-base">
                <span className="text-[#3E2B1F]">{t('booking.totalAmount', { defaultValue: 'Total Amount' })}</span>
                <span className="text-[#B8860B] text-lg">{formatCurrency(sevaPackage.price)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#6F5B47]">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                {t('public.seva.paymentDesc', {
                  defaultValue: 'Direct Payment via Razorpay. No extra convenience fee charged for Seva.',
                })}
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={loading}
                className="w-1/3 py-3 rounded-xl bg-white border border-[#D8C7B0] font-semibold text-[#4B3621] hover:bg-[#FAF4EB] transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('common.back', { defaultValue: 'Back' })}</span>
              </button>
              <button
                type="button"
                onClick={handleCreateOrderAndPay}
                disabled={loading}
                className="w-2/3 py-3 rounded-xl bg-[#D6B36A] hover:bg-[#B8860B] font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{t('common.processing', { defaultValue: 'Processing...' })}</span>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>
                      {t('public.common.pay', { defaultValue: 'Pay' })} {formatCurrency(sevaPackage.price)}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && completedBooking && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto" />
            <h3 className="font-display text-2xl font-bold text-[#3E2B1F]">
              {t('public.seva.confirmedTitle', { defaultValue: 'Seva Confirmed!' })}
            </h3>
            <p className="text-xs sm:text-sm text-[#6F5B47]">
              {t('public.seva.bookingReference', { defaultValue: 'Your Seva booking reference is' })}{' '}
              <span className="font-mono text-[#B8860B] font-bold text-sm">
                {String(completedBooking.booking_reference)}
              </span>
            </p>

            <div className="p-4 sm:p-5 rounded-xl bg-[#FAF4EB] border border-[#E8DDC7] text-left text-xs sm:text-sm space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#6F5B47]">{t('public.seva.devoteeLabel', { defaultValue: 'Devotee:' })}</span>
                <span className="font-semibold text-[#3E2B1F]">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F5B47]">
                  {t('public.seva.performanceDate', { defaultValue: 'Performance Date:' })}
                </span>
                <span className="font-semibold text-[#3E2B1F]">{sevaDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F5B47]">{t('public.seva.paymentId', { defaultValue: 'Payment ID:' })}</span>
                <span className="font-mono text-emerald-700 font-semibold">
                  {String(completedBooking.razorpay_payment_id || 'Captured')}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-[#D6B36A] hover:bg-[#B8860B] font-semibold text-white transition-all shadow-md"
            >
              {t('public.common.done', { defaultValue: 'Done' })}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
