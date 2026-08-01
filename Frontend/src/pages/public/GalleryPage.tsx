import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { GalleryHero } from '@/components/gallery/GalleryHero'
import { useTranslation } from "react-i18next";

const photos = [
  'photo-1544620347-c4fd4a3d5957', // temple
  'photo-1506905925346-21bda4d32df4', // mountains
  'photo-1470071459604-3b5ec3a7fe05', // spiritual landscape
  'photo-1518181835702-6eef8b4b2113', // temple ritual
  'photo-1561361513-2d000a50f0dc', // indian temple
  'photo-1545063914-a1a6ec821021', // pilgrimage
  'photo-1582719478250-c89cae4dc85b', // holy river
  'photo-1588392382834-a891154bca4d', // devotee
  'photo-1612200906755-8ead1ce46bff', // ashram
  'photo-1596402184320-417e7178b2cd', // spiritual
  'photo-1605537964076-31adf13e93a0', // yatra pilgrims
  'photo-1587653915936-d61f96f0e8e5', // temple ghat
]

interface LightboxProps {
  index: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  total: number
  src: string
}

function Lightbox({ index, onClose, onNext, onPrev, total, src }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onPrev() }}
        className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div
        className="max-w-4xl max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={`Gallery photo ${index + 1}`}
          className="max-w-full max-h-[85vh] rounded-2xl object-contain"
        />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {index + 1} / {total}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onNext() }}
        className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

const heights = ['h-64', 'h-48', 'h-72', 'h-56', 'h-64', 'h-52', 'h-72', 'h-48', 'h-60', 'h-56', 'h-64', 'h-48']

export function GalleryPage() {
  const { t } = useTranslation();
  usePageTitle(t('footer.gallery'))
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 640)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const photoUrls = photos.map(
    (id) => `https://images.unsplash.com/${id}?w=800&q=80&fit=crop`,
  )

  const openLightbox = (i: number) => setLightbox(i)
  const closeLightbox = () => setLightbox(null)
  const next = () => setLightbox((i) => (i !== null ? (i + 1) % photos.length : 0))
  const prev = () => setLightbox((i) => (i !== null ? (i - 1 + photos.length) % photos.length : 0))

  return (
    <>
      <GalleryHero />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 md:pt-8 pb-16 md:pb-24">

      {/* Masonry grid */}
      <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {photoUrls.map((src, i) => {
            const shouldRender = isDesktop || isExpanded || i < 4;
            if (!shouldRender) return null;

            return (
              <motion.div
                key={i}
                layout
                initial={!isDesktop && i >= 4 ? { opacity: 0, y: 30 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: !isDesktop && i >= 4 ? (i - 4) * 0.05 : 0 }}
                className={`relative ${heights[i % heights.length]} rounded-2xl cursor-pointer group break-inside-avoid overflow-hidden`}
                style={{ marginBottom: '1rem' }}
                onClick={() => openLightbox(i)}
              >
                <img
                  src={src}
                  alt={`Yatra gallery ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* View More Toggle */}
      {!isDesktop && photoUrls.length > 4 && (
        <motion.button
          layout
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-8 mb-4 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('gallery.showLess')}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('gallery.viewMore')}</span>
            </>
          )}
        </motion.button>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox
          index={lightbox}
          src={photoUrls[lightbox]}
          total={photos.length}
          onClose={closeLightbox}
          onNext={next}
          onPrev={prev}
        />
      )}
    </div>
    </>
  )
}
