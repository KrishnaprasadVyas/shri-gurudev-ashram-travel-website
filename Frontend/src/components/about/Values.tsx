import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Heart, HandHeart, Sparkles, Users } from 'lucide-react';



import { useTranslation } from "react-i18next";

export const Values: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const valueCards = [
    {
      icon: Heart,
      title: t('about.values.bhakti'),
      desc: t('about.values.bhaktiDesc'),
    },
    {
      icon: HandHeart,
      title: t('about.values.seva'),
      desc: t('about.values.sevaDesc'),
    },
    {
      icon: Sparkles,
      title: t('about.values.sadhana'),
      desc: t('about.values.sadhanaDesc'),
    },
    {
      icon: Users,
      title: t('about.values.sanskar'),
      desc: t('about.values.sanskarDesc'),
    },
  ];

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <div className="text-center mb-16">
        <span className="section-eyebrow">{t('about.values.eyebrow')}</span>
        <h2 className="section-heading">{t('about.values.title')}</h2>
        <p className="section-desc max-w-xl mx-auto">
          {t('about.values.desc')}
        </p>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {valueCards.map((card, index) => {
            const shouldRender = isDesktop || isExpanded || index < 1;
            if (!shouldRender) return null;

            return (
              <motion.div
                key={card.title}
                layout
                initial={!isDesktop && index >= 1 ? { opacity: 0, y: 30 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                  duration: 0.5,
                  ease: [0.21, 0.47, 0.32, 0.98],
                  delay: !isDesktop && index >= 1 ? (index - 1) * 0.1 : 0
                }}
                className="card-sacred p-8 text-center flex flex-col items-center"
              >
                <card.icon className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="font-headline-sm text-primary mb-2">{card.title}</h3>
                <p className="text-sm text-on-surface-variant">{card.desc}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* View More Toggle */}
      {!isDesktop && valueCards.length > 1 && (
        <motion.button
          layout
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-6 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('public.common.showLess')}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('about.values.viewAll')}</span>
            </>
          )}
        </motion.button>
      )}
    </section>
  );
};
