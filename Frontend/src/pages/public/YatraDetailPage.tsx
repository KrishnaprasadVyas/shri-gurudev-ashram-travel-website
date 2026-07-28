import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Clock, Users, IndianRupee, ArrowLeft, Plane, Train, Home, HeartHandshake } from 'lucide-react'
import { usePackage } from '@/hooks/usePackages'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { LoadingState } from '@/components/shared/States'
import { formatCurrency } from '@/lib/utils'

export function YatraDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: pkg, isLoading, isError } = usePackage(id)

  // Interactive Calculator State
  const [travelerCount, setTravelerCount] = useState(1)
  const [transportType, setTransportType] = useState<'Flight' | 'Train'>('Train')
  const [busType, setBusType] = useState<'AC Train' | 'Non-AC Train'>('AC Train')
  const [roomType, setRoomType] = useState<'AC Room' | 'Non-AC Room'>('AC Room')
  const [attachedSeva, setAttachedSeva] = useState<'none' | 'guruji_aarti' | 'yajman'>('none')

  usePageTitle(pkg?.title ?? 'Yatra Detail')

  useEffect(() => {
    if (isError) navigate('/yatras', { replace: true })
  }, [isError, navigate])

  if (isLoading) return <LoadingState variant="detail" />
  if (!pkg) return null

  const isSoldOut = pkg.remaining_seats === 0

  // Pricing calculations
  const basePrice = Number(pkg.price)
  const flightAddon = transportType === 'Flight' ? Number(pkg.flight_price || 0) : 0
  const trainAcAddon = transportType === 'Train' && busType === 'AC Train' ? Number(pkg.train_ac_price || 0) : 0
  const trainNonAcAddon = transportType === 'Train' && busType === 'Non-AC Train' ? Number(pkg.train_non_ac_price || 0) : 0
  const transportAddon = flightAddon + trainAcAddon + trainNonAcAddon

  const acRoomAddon = roomType === 'AC Room' ? Number(pkg.room_ac_price || 0) : 0
  const nonAcRoomAddon = roomType === 'Non-AC Room' ? Number(pkg.room_non_ac_price || 0) : 0
  const roomAddon = acRoomAddon + nonAcRoomAddon

  const pricePerPerson = basePrice + transportAddon + roomAddon
  const subtotal = pricePerPerson * travelerCount

  const sevaPrice = attachedSeva === 'guruji_aarti' ? 2100 : attachedSeva === 'yajman' ? 5100 : 0
  const totalAmount = subtotal + sevaPrice
  const gatewayFee = Math.round(totalAmount * 0.02)
  const estimatedPayable = totalAmount + gatewayFee

  const handleBook = () => {
    if (!pkg) return
    const query = new URLSearchParams({
      count: String(travelerCount),
      transport: transportType,
      bus: busType,
      room: roomType,
      seva: attachedSeva,
    }).toString()

    if (user) {
      navigate(`/portal/book/${pkg.id}?${query}`)
    } else {
      navigate('/login', { state: { redirectTo: `/portal/book/${pkg.id}?${query}` } })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          to="/yatras"
          className="inline-flex items-center gap-1.5 text-sm text-[#f2f0eb]/50 hover:text-amber-400 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Yatras
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero image */}
          <div className="rounded-2xl overflow-hidden h-72 sm:h-96 relative">
            {pkg.image_url ? (
              <img
                src={pkg.image_url}
                alt={pkg.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-orange-900/20 flex items-center justify-center">
                <span className="text-8xl">🪷</span>
              </div>
            )}
          </div>

          {/* Title & metadata */}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#f2f0eb] mb-4">
              {pkg.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#f2f0eb]/60 mb-6">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-400" />
                {pkg.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-amber-400" />
                {pkg.total_seats} total seats
              </span>
              <span className="flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4 text-amber-400" />
                Base {formatCurrency(pkg.price)} per person
              </span>
            </div>
          </div>

          {/* About Yatra */}
          <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20">
            <h2 className="text-[#f2f0eb] font-semibold text-lg mb-4">About This Yatra</h2>
            <p className="text-[#f2f0eb]/60 leading-relaxed whitespace-pre-line">
              {pkg.description}
            </p>
          </div>

          {/* Interactive Dynamic Price & Customization Calculator */}
          <div className="p-6 rounded-2xl bg-[#121110] border border-amber-900/20 space-y-6">
            <h2 className="text-[#f2f0eb] font-semibold text-lg flex items-center gap-2">
              <span className="text-amber-400">⚡</span> Customize & Estimate Cost
            </h2>

            {/* Travelers count */}
            <div>
              <label className="block text-sm text-[#f2f0eb]/70 mb-2">Number of Travelers</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTravelerCount(Math.max(1, travelerCount - 1))}
                  className="w-10 h-10 rounded-lg bg-amber-900/20 border border-amber-900/40 text-amber-400 font-bold hover:bg-amber-900/40"
                >
                  -
                </button>
                <span className="text-lg font-bold text-[#f2f0eb] w-8 text-center">{travelerCount}</span>
                <button
                  onClick={() => setTravelerCount(Math.min(pkg.remaining_seats || 20, travelerCount + 1))}
                  className="w-10 h-10 rounded-lg bg-amber-900/20 border border-amber-900/40 text-amber-400 font-bold hover:bg-amber-900/40"
                >
                  +
                </button>
              </div>
            </div>

            {/* Transport Mode */}
            <div>
              <label className="block text-sm text-[#f2f0eb]/70 mb-2">Mode of Transport</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTransportType('Train')}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-sm transition-all ${
                    transportType === 'Train'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                      : 'bg-black/30 border-white/10 text-[#f2f0eb]/60 hover:border-white/20'
                  }`}
                >
                  <Train className="h-4 w-4" /> Train Journey
                </button>
                <button
                  type="button"
                  onClick={() => setTransportType('Flight')}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-sm transition-all ${
                    transportType === 'Flight'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                      : 'bg-black/30 border-white/10 text-[#f2f0eb]/60 hover:border-white/20'
                  }`}
                >
                  <Plane className="h-4 w-4" /> Flight Surcharge (+{formatCurrency(pkg.flight_price || 0)})
                </button>
              </div>
            </div>

            {transportType === 'Train' && (
              <div>
                <label className="block text-sm text-[#f2f0eb]/70 mb-2">Train Coach Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBusType('AC Train')}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      busType === 'AC Train'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                        : 'bg-black/30 border-white/10 text-[#f2f0eb]/60'
                    }`}
                  >
                    AC Train (+{formatCurrency(pkg.train_ac_price || 0)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusType('Non-AC Train')}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      busType === 'Non-AC Train'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                        : 'bg-black/30 border-white/10 text-[#f2f0eb]/60'
                    }`}
                  >
                    Non-AC Train (+{formatCurrency(pkg.train_non_ac_price || 0)})
                  </button>
                </div>
              </div>
            )}

            {/* Room Type */}
            <div>
              <label className="block text-sm text-[#f2f0eb]/70 mb-2">Accommodation Choice</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRoomType('AC Room')}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-sm transition-all ${
                    roomType === 'AC Room'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                      : 'bg-black/30 border-white/10 text-[#f2f0eb]/60'
                  }`}
                >
                  <Home className="h-4 w-4" /> AC Room (+{formatCurrency(pkg.room_ac_price || 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setRoomType('Non-AC Room')}
                  className={`p-3 rounded-xl border flex items-center gap-2 text-sm transition-all ${
                    roomType === 'Non-AC Room'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                      : 'bg-black/30 border-white/10 text-[#f2f0eb]/60'
                  }`}
                >
                  <Home className="h-4 w-4" /> Non-AC Room (+{formatCurrency(pkg.room_non_ac_price || 0)})
                </button>
              </div>
            </div>

            {/* Optional Attached Seva */}
            <div>
              <label className="block text-sm text-[#f2f0eb]/70 mb-2">Optional Yatra Seva Attachment</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAttachedSeva('none')}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-all ${
                    attachedSeva === 'none'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                      : 'bg-black/30 border-white/10 text-[#f2f0eb]/60'
                  }`}
                >
                  No Extra Seva
                </button>
                <button
                  type="button"
                  onClick={() => setAttachedSeva('guruji_aarti')}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-all ${
                    attachedSeva === 'guruji_aarti'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                      : 'bg-black/30 border-white/10 text-[#f2f0eb]/60'
                  }`}
                >
                  <HeartHandshake className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                  Guruji Aarti (+₹2,100)
                </button>
                <button
                  type="button"
                  onClick={() => setAttachedSeva('yajman')}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-all ${
                    attachedSeva === 'yajman'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-medium'
                      : 'bg-black/30 border-white/10 text-[#f2f0eb]/60'
                  }`}
                >
                  <HeartHandshake className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                  Yajman Seva (+₹5,100)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Booking card (sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 p-6 rounded-2xl bg-[#121110] border border-amber-900/20 space-y-5">
            <div>
              <p className="text-xs text-[#f2f0eb]/50 mb-1">Total Dynamic Calculation</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-amber-400">
                  {formatCurrency(totalAmount)}
                </span>
                <span className="text-xs text-[#f2f0eb]/40">({travelerCount} traveler{travelerCount > 1 ? 's' : ''})</span>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-amber-900/20 pt-4">
              <div className="flex justify-between text-[#f2f0eb]/60">
                <span>Base ({formatCurrency(basePrice)} x {travelerCount})</span>
                <span>{formatCurrency(basePrice * travelerCount)}</span>
              </div>
              {transportAddon > 0 && (
                <div className="flex justify-between text-[#f2f0eb]/60">
                  <span>Transport Add-on ({formatCurrency(transportAddon)} x {travelerCount})</span>
                  <span>+{formatCurrency(transportAddon * travelerCount)}</span>
                </div>
              )}
              {roomAddon > 0 && (
                <div className="flex justify-between text-[#f2f0eb]/60">
                  <span>Room Add-on ({formatCurrency(roomAddon)} x {travelerCount})</span>
                  <span>+{formatCurrency(roomAddon * travelerCount)}</span>
                </div>
              )}
              {sevaPrice > 0 && (
                <div className="flex justify-between text-[#f2f0eb]/60">
                  <span>Attached Seva</span>
                  <span>+{formatCurrency(sevaPrice)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#f2f0eb]/40 pt-2 border-t border-white/5">
                <span>Est. Convenience Fee (2%)</span>
                <span>+{formatCurrency(gatewayFee)}</span>
              </div>
              <div className="flex justify-between text-[#f2f0eb] font-semibold text-sm pt-1">
                <span>Estimated Total Payable</span>
                <span className="text-amber-400">{formatCurrency(estimatedPayable)}</span>
              </div>
            </div>

            <div className="border-t border-amber-900/20" />

            {isSoldOut ? (
              <div className="text-center py-2">
                <span className="text-red-400 font-medium text-sm">This Yatra is fully booked</span>
              </div>
            ) : (
              <button
                onClick={handleBook}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                {user ? 'Proceed to Book' : 'Login to Book'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
