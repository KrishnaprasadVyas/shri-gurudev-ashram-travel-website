import { useState, useEffect } from 'react'
import { Sparkles, Calendar, HeartHandshake, ShieldCheck, ArrowRight } from 'lucide-react'
import type { SevaPackage } from '@/types/travel'
import apiClient from '@/lib/apiClient'
import { formatCurrency } from '@/lib/utils'
import { SevaBookingModal } from '@/components/seva/SevaBookingModal'
import { usePageTitle } from '@/hooks/usePageTitle'

const DEFAULT_SEVA_PACKAGES: SevaPackage[] = [
  {
    id: 'default-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    seva_type: 'guruji_aarti',
    title: 'Guruji Aarti Seva',
    description: 'Perform special Aarti seva and receive divine blessings.',
    image_url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&q=80&w=800',
    price: 2100,
    is_active: true,
    booking_enabled: true,
    allow_date_selection: true,
    max_bookings_per_day: 50,
    display_order: 1,
    color: '#d97706',
    icon: 'Sparkles',
    category: 'Aarti',
    available_from: null,
    available_until: null,
  },
  {
    id: 'default-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    seva_type: 'yajman',
    title: 'Yajman Seva',
    description: 'Become a lead Yajman for sacred poojas and rituals.',
    image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800',
    price: 5100,
    is_active: true,
    booking_enabled: true,
    allow_date_selection: true,
    max_bookings_per_day: 20,
    display_order: 2,
    color: '#ea580c',
    icon: 'HeartHandshake',
    category: 'Pooja',
    available_from: null,
    available_until: null,
  },
  {
    id: 'default-3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    seva_type: 'gau_seva',
    title: 'Gau Seva',
    description: 'Support Ashram Gaushala with fodder and care for sacred cows.',
    image_url: 'https://images.unsplash.com/photo-1570042707227-2c938c823d70?auto=format&fit=crop&q=80&w=800',
    price: 1100,
    is_active: true,
    booking_enabled: true,
    allow_date_selection: true,
    max_bookings_per_day: 100,
    display_order: 3,
    color: '#16a34a',
    icon: 'HeartHandshake',
    category: 'Gaushala',
    available_from: null,
    available_until: null,
  },
  {
    id: 'default-4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    seva_type: 'temple_seva',
    title: 'Temple Seva & Flower Alankar',
    description: 'Offer fresh flower garlands and temple maintenance seva.',
    image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800',
    price: 501,
    is_active: true,
    booking_enabled: true,
    allow_date_selection: true,
    max_bookings_per_day: 100,
    display_order: 4,
    color: '#9333ea',
    icon: 'Sparkles',
    category: 'Temple',
    available_from: null,
    available_until: null,
  },
]

export function SevaPage() {
  usePageTitle('Sacred Seva Catalog')
  const [packages, setPackages] = useState<SevaPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<SevaPackage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchSevaPackages = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/api/public/seva-packages')
      if (Array.isArray(res.data?.packages) && res.data.packages.length > 0) {
        setPackages(res.data.packages)
      } else {
        setPackages(DEFAULT_SEVA_PACKAGES)
      }
    } catch {
      setPackages(DEFAULT_SEVA_PACKAGES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSevaPackages()
  }, [])

  const handleOpenBooking = (pkg: SevaPackage) => {
    setSelectedPackage(pkg)
    setIsModalOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          Devotional Seva Booking
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#f2f0eb]">
          Sacred Seva & Ritual Offerings
        </h1>
        <p className="text-[#f2f0eb]/60 text-base leading-relaxed">
          Participate in holy Aarti, Yajman poojas, Gaushala seva, and temple rituals at Shri Gurudev Ashram. Book your date online and receive digital confirmation.
        </p>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-amber-900/10 animate-pulse border border-amber-900/20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="group rounded-2xl bg-[#121110] border border-amber-900/20 hover:border-amber-500/40 overflow-hidden flex flex-col transition-all hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]"
            >
              {/* Card Image */}
              <div className="h-48 relative overflow-hidden bg-black/40">
                {pkg.image_url ? (
                  <img
                    src={pkg.image_url}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/40 to-orange-950/20">
                    <HeartHandshake className="h-12 w-12 text-amber-500/40" />
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-xs font-bold border border-amber-500/30">
                  {formatCurrency(pkg.price)}
                </div>
                {pkg.category && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md text-[#f2f0eb] text-[11px] font-medium border border-amber-500/30">
                    {pkg.category}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#f2f0eb] group-hover:text-amber-400 transition-colors">
                    {pkg.title}
                  </h3>
                  <p className="text-xs text-[#f2f0eb]/60 mt-2 line-clamp-3 leading-relaxed">
                    {pkg.description || 'Devotional seva offering at Shri Gurudev Ashram.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-amber-900/20 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#f2f0eb]/50">
                    <Calendar className="h-3.5 w-3.5 text-amber-400" />
                    <span>Selectable Dates</span>
                  </div>
                  <button
                    onClick={() => handleOpenBooking(pkg)}
                    disabled={!pkg.booking_enabled || !pkg.is_active}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white text-xs font-semibold border border-amber-500/30 transition-all flex items-center gap-1"
                  >
                    Book Seva <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-amber-950/20 via-[#121110] to-orange-950/20 border border-amber-900/20 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
        <div className="flex items-start gap-4">
          <span className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
            <Calendar className="h-6 w-6" />
          </span>
          <div>
            <h4 className="text-[#f2f0eb] font-bold text-sm">Flexible Date Selection</h4>
            <p className="text-xs text-[#f2f0eb]/50 mt-1">
              Select your preferred date for Aarti or Yajman pooja. Availability updated in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <span className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h4 className="text-[#f2f0eb] font-bold text-sm">Instant Digital Receipt</h4>
            <p className="text-xs text-[#f2f0eb]/50 mt-1">
              Immediate payment confirmation via Razorpay with digital Seva reference number.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <span className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
            <HeartHandshake className="h-6 w-6" />
          </span>
          <div>
            <h4 className="text-[#f2f0eb] font-bold text-sm">Sacred Sankalp</h4>
            <p className="text-xs text-[#f2f0eb]/50 mt-1">
              Enter custom Sankalp requests to be recited during the holy rituals by Ashram priests.
            </p>
          </div>
        </div>
      </div>

      {/* Seva Booking Modal */}
      <SevaBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sevaPackage={selectedPackage}
      />
    </div>
  )
}
