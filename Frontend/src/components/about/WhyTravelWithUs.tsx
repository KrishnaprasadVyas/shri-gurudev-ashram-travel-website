import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BookOpen, Heart, Users, Sparkles, Activity, Utensils } from 'lucide-react';



import { useTranslation } from "react-i18next";

export const WhyTravelWithUs: React.FC = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const features = [
    {
      icon: Sparkles,
      title: t('about.whyTravelWithUs.satsang'),
      desc: t('about.whyTravelWithUs.satsangDesc'),
    },
    {
      icon: Utensils,
      title: t('about.whyTravelWithUs.annadan'),
      desc: t('about.whyTravelWithUs.annadanDesc'),
    },
    {
      icon: BookOpen,
      title: t('about.whyTravelWithUs.gurukul'),
      desc: t('about.whyTravelWithUs.gurukulDesc'),
    },
    {
      icon: Heart,
      title: t('about.whyTravelWithUs.gaushala'),
      desc: t('about.whyTravelWithUs.gaushalaDesc'),
    },
    {
      icon: Activity,
      title: t('about.whyTravelWithUs.medical'),
      desc: t('about.whyTravelWithUs.medicalDesc'),
    },
    {
      icon: Users,
      title: t('about.whyTravelWithUs.adiwasi'),
      desc: t('about.whyTravelWithUs.adiwasiDesc'),
    },
  ];

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <section className="bg-surface-container py-16 md:py-section-gap px-4 md:px-margin-desktop">
      <div className="max-w-container-max mx-auto">
        <div className="text-center mb-16">
          <span className="section-eyebrow">{t('about.whyTravelWithUs.eyebrow')}</span>
          <h2 className="section-heading max-w-2xl mx-auto">{t('about.whyTravelWithUs.title')}</h2>
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {features.map((feat, index) => {
              const shouldRender = isDesktop || isExpanded || index < 1;
              if (!shouldRender) return null;

              return (
                <motion.div
                  key={feat.title}
                  layout
                  initial={!isDesktop && index >= 1 ? { opacity: 0, y: 30 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.21, 0.47, 0.32, 0.98],
                    delay: !isDesktop && index >= 1 ? (index - 1) * 0.1 : 0
                  }}
                  className="card-sacred p-8 flex gap-6"
                >
                  <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 text-primary">
                    <feat.icon className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary mb-2">{feat.title}</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* View More Toggle */}
        {!isDesktop && features.length > 1 && (
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
                <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('about.whyTravelWithUs.viewMore')}</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </section>
  );
};

