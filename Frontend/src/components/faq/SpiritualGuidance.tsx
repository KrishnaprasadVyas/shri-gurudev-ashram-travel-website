import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";

export const SpiritualGuidance: React.FC = () => {
    const { t } = useTranslation();
  return (
    <section className="py-20 md:py-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        viewport={{ once: true, amount: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center"
      >
        {/* Left: Large Image */}
        <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-lg aspect-[4/3] lg:aspect-square relative group">
          <img
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt={t('public.faq.quoteAlt')}
            src="/assets/TULSI MALA.jpg"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-primary/5 mix-blend-multiply"></div>
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] pointer-events-none"></div>
        </div>

        {/* Right: Content */}
        <div className="order-1 lg:order-2">
          <span className="font-label-caps text-xs tracking-[0.2em] text-secondary mb-4 block uppercase font-semibold">
            {t('public.faq.personalAssistance')}
          </span>
          <h2 className="font-display-lg text-3xl sm:text-4xl md:text-[42px] font-bold text-primary mb-6 leading-tight tracking-tight">
            {t('public.faq.needGuidance')}
          </h2>
          <div className="space-y-5 text-on-surface-variant leading-relaxed font-body-md text-lg font-light mb-10">
            <p>
              {t('public.faq.guidanceDesc1')}
            </p>
            <p>
              {t('public.faq.guidanceDesc2')} <strong className="font-medium text-on-surface">{t('public.common.addressBuldhana')}</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition-all hover:-translate-y-1 shadow-lg tracking-wider text-sm select-none"
            >
              {t('public.common.contactAshram')}
            </Link>
            <Link
              to="/yatras"
              className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-on-primary px-8 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-md tracking-wider text-sm select-none"
            >
              {t('about.cta.btn')}
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
