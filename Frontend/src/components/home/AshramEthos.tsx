import React from 'react';
import { motion } from 'framer-motion';
import { ReadMore } from '../shared/ReadMore';
import { useTranslation } from 'react-i18next';

export const AshramEthos: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-12 md:py-section-gap px-4 md:px-margin-desktop max-w-container-max mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        <div className="order-2 md:order-1 space-y-8">
          <div className="space-y-4">
            <span className="section-eyebrow">{t('home.ethos.eyebrow')}</span>
            <div className="w-12 h-1 bg-primary"></div>
          </div>

          <div className="font-body-lg text-base md:text-body-lg text-on-surface-variant leading-relaxed space-y-6 max-w-prose">
            <ReadMore
              text={t('home.ethos.description')}
            />
            <div className="mt-8 border-l-2 border-primary pl-6 py-2">
              <p className="font-display-lg text-2xl text-primary italic leading-snug">
                {t('home.ethos.quote')}
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2 relative flex flex-col items-center mb-4 md:mb-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full aspect-[3/4] lg:aspect-[4/5] rounded-2xl overflow-hidden shadow-xl shadow-primary/5 border border-primary/20 group transform transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10">
              <img
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                style={{ objectPosition: '65% -38%' }}
                alt="Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj"
                src="/assets/gurudev.jpg"
                loading="lazy"
              />
            </div>
            <div className="mt-5 text-center font-display-lg text-[22px] sm:text-[28px] md:text-[32px] lg:text-[34px] leading-[1.2] font-semibold text-primary">
              {t('home.ethos.gurudevTitle')}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
