import { useState, useEffect } from 'react'
import { Sparkles, Calendar, HeartHandshake, ShieldCheck, ArrowRight } from 'lucide-react'
import type { SevaPackage } from '@/types/travel'
import apiClient from '@/lib/apiClient'
import { formatCurrency } from '@/lib/utils'
import { SevaBookingModal } from '@/components/seva/SevaBookingModal'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useTranslation } from 'react-i18next'

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
    image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800',
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
    image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=800',
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
  const { t } = useTranslation()
  usePageTitle(t('seva.title', { defaultValue: 'Sacred Seva Catalog' }))
  const [packages, setPackages] = useState<SevaPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<SevaPackage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    let active = true

    const loadPackages = async () => {
      try {
        const res = await apiClient.get('/api/public/seva-packages')
        if (active) {
          if (Array.isArray(res.data?.packages) && res.data.packages.length > 0) {
            setPackages(res.data.packages)
          } else {
            setPackages(DEFAULT_SEVA_PACKAGES)
          }
        }
      } catch {
        if (active) {
          setPackages(DEFAULT_SEVA_PACKAGES)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadPackages()
    return () => {
      active = false
    }
  }, [])


  const getPackageTitle = (pkg: SevaPackage) => {
    if (pkg.seva_type) {
      const key = `seva.packages.${pkg.seva_type}.title`
      const translated = t(key)
      if (translated && translated !== key) return translated
    }
    return pkg.title
  }

  const getPackageDesc = (pkg: SevaPackage) => {
    if (pkg.seva_type) {
      const key = `seva.packages.${pkg.seva_type}.description`
      const translated = t(key)
      if (translated && translated !== key) return translated
    }
    return pkg.description || t('seva.defaultDesc', { defaultValue: 'Devotional seva offering at Shri Gurudev Ashram.' })
  }

  const handleOpenBooking = (pkg: SevaPackage) => {
    setSelectedPackage(pkg)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3E2B1F] py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D6B36A]/15 border border-[#D6B36A]/30 text-[#8C6A0A] text-xs font-semibold uppercase tracking-wider shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#B8860B]" />
            <span>{t('seva.badge', { defaultValue: 'Devotional Seva Booking' })}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#3E2B1F] tracking-tight">
            {t('seva.title', { defaultValue: 'Sacred Seva & Ritual Offerings' })}
          </h1>
          <p className="text-[#6F5B47] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            {t('seva.desc', {
              defaultValue:
                'Participate in holy Aarti, Yajman poojas, Gaushala seva, and temple rituals at Shri Gurudev Ashram. Book your date online and receive digital confirmation.',
            })}
          </p>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-88 rounded-2xl bg-[#F1E7D7]/60 animate-pulse border border-[#E8DDC7]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="group rounded-2xl bg-[#FFFDF8] border border-[#E8DDC7] hover:border-[#D6B36A] hover:shadow-[0_12px_32px_rgba(75,54,33,0.12)] overflow-hidden flex flex-col transition-all duration-300"
              >
                {/* Card Image */}
                <div className="h-48 sm:h-52 relative overflow-hidden bg-[#F1E7D7]">
                  {pkg.image_url ? (
                    <img
                      src={pkg.image_url}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // graceful fallback on broken image
                        (e.currentTarget as HTMLImageElement).src = '/assets/temple_sunrise_bg.png'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F5EFE4] to-[#E9DCC5]">
                      <HeartHandshake className="h-12 w-12 text-[#B8860B]/60" />
                    </div>
                  )}

                  {/* Price Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#FFFDF8]/95 backdrop-blur-md text-[#755B00] text-xs font-bold border border-[#D6B36A]/40 shadow-sm">
                    {formatCurrency(pkg.price)}
                  </div>

                  {/* Category Badge */}
                  {pkg.category && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#FAF7F2]/90 backdrop-blur-md text-[#8C6A0A] text-[11px] font-semibold border border-[#D6B36A]/30 shadow-sm">
                      {pkg.category}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#3E2B1F] group-hover:text-[#B8860B] transition-colors leading-snug">
                      {getPackageTitle(pkg)}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6F5B47] mt-2 line-clamp-3 leading-relaxed">
                      {getPackageDesc(pkg)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E8DDC7] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#6F5B47] font-medium">
                      <Calendar className="h-3.5 w-3.5 text-[#B8860B] shrink-0" />
                      <span>{t('seva.selectableDates', { defaultValue: 'Selectable Dates' })}</span>
                    </div>
                    <button
                      onClick={() => handleOpenBooking(pkg)}
                      disabled={!pkg.booking_enabled || !pkg.is_active}
                      className="px-3.5 py-2 rounded-xl bg-[#D6B36A] hover:bg-[#B8860B] text-white text-xs font-semibold shadow-sm transition-all duration-200 flex items-center gap-1 shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{t('seva.bookSeva', { defaultValue: 'Book Seva' })}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#FAF4EB] border border-[#E8DDC7] shadow-[0_4px_20px_rgba(90,70,20,0.04)] grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center md:text-left">
          <div className="flex items-start gap-4">
            <span className="p-3.5 rounded-2xl bg-[#D6B36A]/15 text-[#8C6A0A] shrink-0">
              <Calendar className="h-6 w-6 text-[#B8860B]" />
            </span>
            <div>
              <h3 className="text-[#3E2B1F] font-bold text-sm sm:text-base">
                {t('seva.flexibleDatesTitle', { defaultValue: 'Flexible Date Selection' })}
              </h3>
              <p className="text-xs sm:text-sm text-[#6F5B47] mt-1 leading-relaxed">
                {t('seva.flexibleDatesDesc', {
                  defaultValue:
                    'Select your preferred date for Aarti or Yajman pooja. Availability updated in real-time.',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="p-3.5 rounded-2xl bg-[#D6B36A]/15 text-[#8C6A0A] shrink-0">
              <ShieldCheck className="h-6 w-6 text-[#B8860B]" />
            </span>
            <div>
              <h3 className="text-[#3E2B1F] font-bold text-sm sm:text-base">
                {t('seva.instantReceiptTitle', { defaultValue: 'Instant Digital Receipt' })}
              </h3>
              <p className="text-xs sm:text-sm text-[#6F5B47] mt-1 leading-relaxed">
                {t('seva.instantReceiptDesc', {
                  defaultValue:
                    'Immediate payment confirmation via Razorpay with digital Seva reference number.',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="p-3.5 rounded-2xl bg-[#D6B36A]/15 text-[#8C6A0A] shrink-0">
              <HeartHandshake className="h-6 w-6 text-[#B8860B]" />
            </span>
            <div>
              <h3 className="text-[#3E2B1F] font-bold text-sm sm:text-base">
                {t('seva.sacredSankalpTitle', { defaultValue: 'Sacred Sankalp' })}
              </h3>
              <p className="text-xs sm:text-sm text-[#6F5B47] mt-1 leading-relaxed">
                {t('seva.sacredSankalpDesc', {
                  defaultValue:
                    'Enter custom Sankalp requests to be recited during the holy rituals by Ashram priests.',
                })}
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
    </div>
  )
}
