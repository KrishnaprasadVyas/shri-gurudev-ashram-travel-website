import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Train,
  BedDouble,
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function MyTripPage() {
  const { t } = useTranslation()
  const [bookingCode, setBookingCode] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [trip, setTrip] = useState<any | null>(null)
  const [paying, setPaying] = useState(false)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingCode.trim() || !mobile.trim()) {
      toast.error('Please enter both Booking ID and registered Mobile Number')
      return
    }

    try {
      setLoading(true)
      const res = await apiClient.post('/api/my-trip/lookup', {
        bookingCode: bookingCode.trim(),
        mobile: mobile.trim(),
      })

      setTrip(res.data.trip)
      if (res.data.token) {
        localStorage.setItem('mavt_trip_token', res.data.token)
      }
      toast.success('Yatra dossier loaded successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking not found or mobile mismatch')
    } finally {
      setLoading(false)
    }
  }

  const handlePayBalance = async () => {
    if (!trip || !trip.bookingId) return
    try {
      setPaying(true)
      const res = await apiClient.post('/api/payments/create-order', {
        bookingId: trip.bookingId,
        amountToPay: trip.financials?.pendingBalance,
      })

      const { order } = res.data

      // Razorpay checkout modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock',
        amount: order.amount,
        currency: order.currency,
        name: 'Maa Vaishnavi Tourism',
        description: `Balance Payment for Booking ${trip.bookingCode}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await apiClient.post('/api/payments/verify', {
              bookingId: trip.bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Balance payment successful!')
            // Refresh dossier
            const refreshed = await apiClient.post('/api/my-trip/lookup', {
              bookingCode: trip.bookingCode,
              mobile,
            })
            setTrip(refreshed.data.trip)
          } catch (err: any) {
            toast.error(err.response?.data?.error || 'Payment verification failed')
          }
        },
        prefill: {
          name: trip.passengers?.[0]?.name,
          contact: mobile,
        },
        theme: {
          color: '#B8860B',
        },
      }

      if (typeof (window as any).Razorpay !== 'undefined') {
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        toast.info(`Razorpay Gateway initiated for ₹${trip.financials?.pendingBalance}`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to initialize payment')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 sm:px-6 lg:px-8 font-body-md text-[#3E2B1F]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF7E8] border border-[#E9DCC5] text-xs font-bold text-[#B8860B] uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" /> MAVT Devotee Portal
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#3E2B1F]">
            My Pilgrimage Trip
          </h1>
          <p className="text-sm text-[#6F5B47] max-w-lg mx-auto">
            View your sacred journey details, download confirmed train tickets, and manage room allocations directly.
          </p>
        </div>

        {/* Lookup Card */}
        {!trip && (
          <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E9DCC5] shadow-sm max-w-md mx-auto space-y-6">
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1.5">
                  Booking ID (e.g. MVT-270427-0001)
                </label>
                <input
                  type="text"
                  required
                  placeholder="MVT-..."
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E9DCC5] bg-[#FFFBF5] text-[#3E2B1F] focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1.5">
                  Registered Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E9DCC5] bg-[#FFFBF5] text-[#3E2B1F] focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full bg-[#B8860B] hover:bg-[#9A7009] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Find My Trip
              </button>
            </form>
          </div>
        )}

        {/* Section 36 Mockup Implementation */}
        {trip && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Summary Banner */}
            <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E9DCC5] shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9DCC5] pb-4">
                <div>
                  <span className="text-xs font-bold text-[#B8860B] uppercase tracking-widest">
                    {trip.groupName || 'Pilgrimage Group'}
                  </span>
                  <h2 className="font-display text-2xl font-bold text-[#3E2B1F] mt-0.5">
                    Booking: {trip.bookingCode}
                  </h2>
                  <p className="text-xs text-[#6F5B47] mt-1 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-[#B8860B]" /> {trip.travelerCount} Devotee(s) in Party
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20">
                    {trip.bookingStatus || 'Confirmed'}
                  </span>
                  <button
                    onClick={() => setTrip(null)}
                    className="text-xs text-[#6F5B47] underline hover:text-[#3E2B1F] cursor-pointer"
                  >
                    Change Lookup
                  </button>
                </div>
              </div>

              {/* Financial Box */}
              <div className="p-4 rounded-2xl bg-[#FFF7E8] border border-[#E9DCC5] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#6F5B47] uppercase tracking-wider">Payment Summary</p>
                  <p className="text-lg font-bold text-[#3E2B1F] mt-0.5">
                    ₹{trip.financials?.totalPaid?.toLocaleString('en-IN')} paid / ₹
                    {trip.financials?.pendingBalance?.toLocaleString('en-IN')} pending
                  </p>
                </div>

                {trip.financials?.pendingBalance > 0 && (
                  <button
                    onClick={handlePayBalance}
                    disabled={paying}
                    className="px-6 py-2.5 rounded-full bg-[#B8860B] hover:bg-[#9A7009] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Pay Balance (₹{trip.financials?.pendingBalance?.toLocaleString('en-IN')})
                  </button>
                )}
              </div>
            </div>

            {/* Train Services (Section 19: Only shown if NOT room-only) */}
            {trip.serviceOption !== 'only_room' ? (
              <>
                {trip.trainArrangement === 'customer_self_arranged' && (
                  <div className="bg-[#FFF7E8] p-4 rounded-2xl border border-[#E9DCC5] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6F5B47]">
                    <span className="font-bold text-[#B8860B] uppercase tracking-wider">Self-Arranged Train Travel</span>
                    <span>Passenger is arranging railway travel independently. Train booking details are optional.</span>
                  </div>
                )}

                {/* Going Train Card */}
                <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#E9DCC5] shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-[#FFF7E8] text-[#B8860B] border border-[#E9DCC5]">
                        <Train className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#3E2B1F]">GOING TRAIN</h3>
                        <p className="text-xs text-[#6F5B47]">
                          PNR: <strong className="text-[#3E2B1F]">{trip.goingTrain?.pnr || (trip.trainArrangement === 'customer_self_arranged' ? 'Self Arranged' : 'Allocation in Progress')}</strong> | Coach:{' '}
                          <strong className="text-[#3E2B1F]">{trip.goingTrain?.coach || 'TBD'}</strong> | Seats:{' '}
                          <strong className="text-[#3E2B1F]">{trip.goingTrain?.seats || 'TBD'}</strong>
                        </p>
                      </div>
                    </div>

                    {trip.goingTrain?.downloadUrl && (
                      <a
                        href={trip.goingTrain.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#FFF7E8] border border-[#B8860B] text-[#B8860B] font-bold text-xs hover:bg-[#B8860B] hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" /> View/Download Ticket
                      </a>
                    )}
                  </div>
                </div>

                {/* Return Train Card */}
                <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#E9DCC5] shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-[#FFF7E8] text-[#B8860B] border border-[#E9DCC5]">
                        <Train className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#3E2B1F]">RETURN TRAIN</h3>
                        <p className="text-xs text-[#6F5B47]">
                          PNR: <strong className="text-[#3E2B1F]">{trip.returnTrain?.pnr || (trip.trainArrangement === 'customer_self_arranged' ? 'Self Arranged' : 'Allocation in Progress')}</strong> | Coach:{' '}
                          <strong className="text-[#3E2B1F]">{trip.returnTrain?.coach || 'TBD'}</strong> | Seats:{' '}
                          <strong className="text-[#3E2B1F]">{trip.returnTrain?.seats || 'TBD'}</strong>
                        </p>
                      </div>
                    </div>

                    {trip.returnTrain?.downloadUrl && (
                      <a
                        href={trip.returnTrain.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#FFF7E8] border border-[#B8860B] text-[#B8860B] font-bold text-xs hover:bg-[#B8860B] hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" /> View/Download Ticket
                      </a>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {/* Room & Stay Card */}
            <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#E9DCC5] shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FFF7E8] text-[#B8860B] border border-[#E9DCC5]">
                  <BedDouble className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#3E2B1F]">
                    {trip.serviceOption === 'only_room' ? 'HOTEL / ASHRAM STAY DETAILS' : 'ROOM ALLOCATION'}
                  </h3>
                  <p className="text-xs text-[#6F5B47] mt-0.5">
                    {trip.rooms && trip.rooms.length > 0 ? (
                      trip.rooms.map((r: any, i: number) => (
                        <span key={i} className="inline-block mr-3 font-semibold text-[#3E2B1F]">
                          Room {r.roomNumber} ({r.hotelAshramName || trip.hotelName || 'Ashram Niwas'})
                        </span>
                      ))
                    ) : (
                      <span>{trip.hotelName ? `${trip.hotelName} — Rooms assigned upon arrival` : 'Rooms will be assigned at check-in desk upon arrival'}</span>
                    )}
                  </p>
                  {(trip.checkInDate || trip.checkOutDate) && (
                    <p className="text-[11px] text-[#6F5B47] mt-1">
                      Check-in: <strong className="text-[#3E2B1F]">{trip.checkInDate || 'TBD'}</strong> | Check-out: <strong className="text-[#3E2B1F]">{trip.checkOutDate || 'TBD'}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Devotee Passenger List */}
            <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#E9DCC5] shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold text-[#3E2B1F]">Devotee Party Details</h3>
              <div className="divide-y divide-[#E9DCC5]">
                {trip.passengers?.map((p: any) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-[#3E2B1F]">
                        {p.name} ({p.age}y, {p.gender})
                      </p>
                      <span className="text-[11px] text-[#6F5B47]">Passenger Code: {p.passengerCode}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        p.travelClass === 'ac' ? 'bg-[#FFF7E8] text-[#B8860B] border border-[#E9DCC5]' : 'bg-[#E5E7EB] text-[#4B5563]'
                      }`}
                    >
                      {p.travelClass === 'ac' ? 'AC Travel' : 'Non-AC'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Instructions */}
            <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-[#E9DCC5] text-xs text-[#6F5B47] space-y-1">
              <p className="font-bold text-[#3E2B1F]">Important Travel Instructions:</p>
              <p>{trip.travelInstructions}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
