import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePackages } from '@/hooks/usePackages';
import { gangaAarti, shikharMeditation, anandaRetreat, aboutDiya, aboutTempleGate, heroBg } from '@/assets/images';
import { useTranslation } from 'react-i18next';

const fallbackImages = [aboutDiya, gangaAarti, shikharMeditation, heroBg, aboutTempleGate, anandaRetreat];

export const SpiritualPaths: React.FC = () => {
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
    <section className="bg-surface-container-low py-12 md:py-section-gap px-4 md:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="section-eyebrow">{t('home.yatras.eyebrow')}</span>
          <h2 className="section-heading">{t('home.yatras.title')}</h2>
          <p className="section-desc italic">{t('home.yatras.desc')}</p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative overflow-hidden rounded-xl bg-surface shadow-sm border border-outline-variant/30 aspect-[4/5] sm:aspect-square md:aspect-[4/5] animate-pulse">
                <div className="absolute inset-0 bg-surface-container-low" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-600 font-medium text-lg mb-2">{t('home.yatras.errorTitle')}</p>
            <p className="text-on-surface-variant text-sm">{t('home.yatras.errorDesc')}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && packages && packages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-lg font-light">{t('home.yatras.emptyState')}</p>
          </div>
        )}

        {/* Package cards */}
        {!isLoading && !error && packages && packages.length > 0 && (
          <>
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                        delay: !isDesktop && index >= 1 ? (index - 1) * 0.1 : 0
                      }}
                      className="h-full"
                    >
                      <Link to={`/yatras/${pkg.id}`} className="group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer border border-outline-variant/30 block w-full h-full aspect-[4/5] sm:aspect-square md:aspect-[4/5]">
                        <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={pkg.title} src={pkg.image_url ?? fallbackImages[index % fallbackImages.length]} loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 p-6 text-white w-full flex flex-col justify-end h-full">
                          <div className="flex justify-between items-center mb-4">
                            <span className="bg-primary/90 px-3 py-1 rounded-full text-[10px] font-label-caps tracking-widest inline-block text-white">
                              {pkg.duration} • ₹{pkg.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] font-label-caps tracking-widest text-white/80 uppercase">
                              {t('home.yatras.seatsLeft', { count: pkg.remaining_seats })}
                            </span>
                          </div>
                          <h3 className="text-2xl font-headline-sm mb-2 text-white">{pkg.title}</h3>
                          <p className="text-white/80 text-sm mb-6 line-clamp-3">{pkg.description}</p>
                          <div className="mt-auto pt-4 border-t border-white/20 font-label-caps tracking-widest text-xs flex items-center justify-between text-white group-hover:text-primary transition-colors">
                            <span>{t('home.yatras.viewDetails')}</span>
                            <svg className="w-[18px] h-[18px] transform group-hover:translate-x-2 transition-transform duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* View More Toggle */}
            {!isDesktop && packages.length > 1 && (
              <motion.button
                layout
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-6 mb-4 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-5 h-5" />
                    <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('home.yatras.showLess')}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-5 h-5" />
                    <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('home.yatras.viewMore')}</span>
                  </>
                )}
              </motion.button>
            )}
          </>
        )}
      </div>
    </section>
  );
};
