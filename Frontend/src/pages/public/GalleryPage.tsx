import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { GalleryHero } from '@/components/gallery/GalleryHero'

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
  usePageTitle('Gallery')
  const [lightbox, setLightbox] = useState<number | null>(null)

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
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {photoUrls.map((src, i) => (
          <div
            key={i}
            className={`relative ${heights[i % heights.length]} rounded-2xl  cursor-pointer group break-inside-avoid mb-4`}
            onClick={() => openLightbox(i)}
          >
            <img
              src={src}
              alt={`Yatra gallery ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl" />
          </div>
        ))}
      </div>

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
