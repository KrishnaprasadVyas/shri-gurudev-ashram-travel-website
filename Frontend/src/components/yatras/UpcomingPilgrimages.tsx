import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePackages } from '@/hooks/usePackages';
import { kedarnath, varanasi, thanjavur, desert } from '@/assets/images';
import { useTranslation } from "react-i18next";

const fallbackImages = [kedarnath, varanasi, thanjavur, desert];

export const UpcomingPilgrimages: React.FC = () => {
    const { t } = useTranslation();
  const { data: packages, isLoading, error } = usePackages();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <section id="upcoming" className="pt-10 pb-16 md:pt-14 md:pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface">
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <span className="font-label-caps text-xs tracking-[0.2em] text-secondary mb-3 block uppercase font-semibold">
          {t('public.yatras.upcoming.divineJourneys')}
        </span>
        <h2 className="font-display-lg text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4 tracking-tight">
          {t('public.yatras.upcoming.title')}
        </h2>
        <p className="font-body-lg text-lg text-on-surface-variant font-light">
          {t('public.yatras.upcoming.desc')}
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm animate-pulse flex flex-col h-full">
              <div className="h-72 w-full bg-surface-container-low" />
              <div className="p-8 flex-grow flex flex-col gap-4">
                <div className="h-6 bg-surface-container-low rounded w-3/4" />
                <div className="h-4 bg-surface-container-low rounded w-full" />
                <div className="h-4 bg-surface-container-low rounded w-5/6" />
                <div className="h-20 bg-surface-container-low rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-600 font-medium text-lg mb-2">Unable to load pilgrimages</p>
          <p className="text-on-surface-variant text-sm">Please try refreshing the page.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && packages && packages.length === 0 && (
        <div className="text-center py-16">
          <p className="text-on-surface-variant text-lg font-light">No upcoming pilgrimages at the moment. Please check back soon.</p>
        </div>
      )}

      {/* Package cards */}
      {!isLoading && !error && packages && packages.length > 0 && (
        <>
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            <AnimatePresence mode="popLayout">
              {packages.map((pkg, index) => {
                const shouldRender = isDesktop || isExpanded || index < 1;
                if (!shouldRender) return null;

                return (
                  <motion.div
                    key={pkg.id}
                    layout
                    initial={!isDesktop && index >= 1 ? { opacity: 0, y: 30 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ 
                      duration: 0.5, 
                      ease: [0.21, 0.47, 0.32, 0.98],
                      delay: !isDesktop && index >= 1 ? (index - 1) * 0.1 : 0 
                    }}
                    className="group bg-surface rounded-2xl overflow-hidden border border-outline-variant/30 hover:border-[#C98B1A]/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col h-full"
                  >
                    {/* Identical Image Height */}
                    <div className="relative h-72 w-full shrink-0 overflow-hidden bg-surface-container-low">
                      <img
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        alt={pkg.title}
                        src={pkg.image_url ?? fallbackImages[index % fallbackImages.length]}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
                      
                      {/* Seats Badge */}
                      <div className="absolute top-4 left-4 bg-[#C98B1A] text-white px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md border border-white/20">
                        {pkg.remaining_seats > 0 ? `${pkg.remaining_seats} ${t('public.yatras.upcoming.seatsLeft')}` : t('public.yatras.upcoming.fullyBooked')}
                      </div>
                    </div>

                    {/* Card Body with Equal Height Flex Grow */}
                    <div className="p-8 flex-grow flex flex-col justify-between bg-surface">
                      <div>
                        {/* Temple Name */}
                        <h3 className="font-display-lg text-xl md:text-2xl font-bold text-[#3a2d00] group-hover:text-[#C98B1A] transition-colors duration-300 mb-3 leading-snug">
                          {pkg.title}
                        </h3>

                        {/* Description */}
                        <p className="font-body-md text-on-surface-variant text-sm leading-relaxed mb-6 font-light">
                          {pkg.description}
                        </p>

                        {/* Information Rows */}
                        <div className="space-y-2.5 py-4 my-4 border-y border-outline-variant/30 text-xs text-on-surface-variant bg-[#f5efe4]/40 -mx-8 px-8">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold tracking-wider text-secondary uppercase text-[11px]">{t('public.yatras.filters.sortDuration')}</span>
                            <span className="font-medium text-on-surface">{pkg.duration}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold tracking-wider text-secondary uppercase text-[11px]">{t('public.yatras.upcoming.priceLabel')}</span>
                            <span className="font-medium text-on-surface">₹{pkg.price.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold tracking-wider text-secondary uppercase text-[11px]">{t('public.yatras.upcoming.seatsLabel')}</span>
                            <span className="font-medium text-on-surface">{pkg.remaining_seats} / {pkg.total_seats}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Aligned at bottom */}
                      <div className="mt-auto pt-5 border-t border-outline-variant/30 flex items-center justify-between gap-3">
                        <span className="text-[#C98B1A] font-semibold text-xs sm:text-sm tracking-wide">
                          ₹{pkg.price.toLocaleString('en-IN')} {t('public.yatras.upcoming.perPerson')}
                        </span>
                        
                        <Link
                          to={`/portal/book/${pkg.id}`}
                          className="inline-flex items-center gap-1.5 bg-[#f5efe4] group-hover:bg-[#C98B1A] text-[#3a2d00] group-hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-sm hover:shadow shrink-0"
                        >
                          <span>{t('public.yatras.upcoming.bookNow')}</span>
                          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* View More Yatras Toggle */}
          {!isDesktop && packages.length > 1 && (
            <motion.button
              layout
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-8 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
              aria-expanded={isExpanded}
              aria-controls="upcoming-pilgrimages-grid"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('faq.showLess')}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('public.yatras.upcoming.viewMore')}</span>
                </>
              )}
            </motion.button>
          )}
        </>
      )}
    </section>
  );
};
