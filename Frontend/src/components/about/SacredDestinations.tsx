import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { 
  kedarnath, 
  stoneTemple, 
  anandaRetreat 
} from '@/assets/images';
import { useTranslation } from "react-i18next";

interface Destination {
  name: string;
  description: string;
  image: string;
}



export const SacredDestinations: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const destinations: Destination[] = [
    {
      name: t('public.about.destinations.kedarnath'),
      description: t('public.about.destinations.kedarnathDesc'),
      image: kedarnath,
    },
    {
      name: t('public.about.destinations.badrinath'),
      description: t('public.about.destinations.badrinathDesc'),
      image: stoneTemple,
    },
    {
      name: t('public.about.destinations.dwarka'),
      description: t('public.about.destinations.dwarkaDesc'),
      image: anandaRetreat,
    },
  ];

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <section className="py-16 md:py-32 px-4 md:px-margin-desktop bg-surface-container-low max-w-container-max mx-auto overflow-hidden">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <span className="section-eyebrow">{t('public.about.destinations.title')}</span>
        <h2 className="section-heading">{t('public.about.destinations.title')}</h2>
        <p className="section-desc">
          {t('public.about.destinations.desc')}
        </p>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {destinations.map((dest, idx) => {
            const shouldRender = isDesktop || isExpanded || idx < 1;
            if (!shouldRender) return null;

            return (
              <motion.div
                key={dest.name}
                layout
                initial={!isDesktop && idx >= 1 ? { opacity: 0, y: 30 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: !isDesktop && idx >= 1 ? (idx - 1) * 0.1 : idx * 0.1 
                }}
                className="card-sacred overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                  <img 
                    src={dest.image} 
                    alt={`${dest.name} — Sacred Yatra Destination`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                
                <div className="p-4 md:p-6 flex-1 flex flex-col justify-between border-t border-amber-900/5">
                  <div>
                    <h3 className="font-headline-sm text-2xl text-primary font-bold tracking-wide">{dest.name}</h3>
                    <span className="font-label-caps text-xs text-secondary tracking-widest uppercase block mt-1.5 mb-3 font-semibold">{t('public.about.destinations.sacredYatra')}</span>
                    <p className="text-sm text-on-surface-variant leading-relaxed font-light">{dest.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                    <span className="text-xs font-label-caps text-secondary font-bold tracking-wider">{t('public.common.comingSoon')}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C98B1A]" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* View More Toggle */}
      {!isDesktop && destinations.length > 1 && (
        <motion.button
          layout
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-6 mb-4 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('public.common.showLess')}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('public.about.destinations.viewMore')}</span>
            </>
          )}
        </motion.button>
      )}

      <div className="text-center mt-12">
        <Link 
          to="/yatras" 
          className="btn-primary"
        >
          <span>{t('public.about.destinations.exploreAll')}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
};
