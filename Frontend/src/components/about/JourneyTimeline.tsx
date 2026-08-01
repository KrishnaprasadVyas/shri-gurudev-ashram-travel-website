import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";

export const JourneyTimeline: React.FC = () => {
    const { t } = useTranslation();
  return (
    <section className="py-16 md:py-32 px-4 md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
      <div className="text-center mb-16 animate-fade-in-up">
        <span className="font-label-caps text-label-caps text-secondary mb-2 block tracking-widest">{t('public.about.milestones.title')}</span>
        <h2 className="font-headline-md text-headline-md text-primary mb-4">{t('public.about.milestones.journey')}</h2>
        <p className="text-on-surface-variant max-w-xl mx-auto">{t('public.about.milestones.desc')}</p>
      </div>

      <div className="relative border-l border-[#C98B1A]/30 ml-4 md:ml-[50%] md:-translate-x-[0.5px]">
        {/* Timeline item 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 relative flex items-center md:-translate-x-[50%] md:w-[100%]"
        >
          <div className="absolute w-4.5 h-4.5 bg-[#C98B1A] rounded-full -left-[9.5px] md:left-[50%] md:-translate-x-[9px] ring-4 ring-surface shadow-sm"></div>
          <div className="ml-8 md:ml-0 md:w-[50%] md:pr-12 md:text-right">
            <span className="font-label-caps text-secondary font-bold block mb-1">1992</span>
            <h3 className="font-bold text-lg text-primary mb-2">{t('public.about.milestones.established')}</h3>
            <p className="text-sm text-on-surface-variant md:ml-auto md:max-w-md">{t('public.about.milestones.establishedDesc')}</p>
          </div>
        </motion.div>

        {/* Timeline item 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 relative flex items-center md:flex-row-reverse md:translate-x-[50%] md:w-[100%]"
        >
          <div className="absolute w-4.5 h-4.5 bg-[#C98B1A] rounded-full -left-[9.5px] md:left-0 md:-translate-x-[9px] ring-4 ring-surface shadow-sm"></div>
          <div className="ml-8 md:ml-0 md:w-[50%] md:pl-12 md:text-left">
            <span className="font-label-caps text-secondary font-bold block mb-1">2005</span>
            <h3 className="font-bold text-lg text-primary mb-2">{t('public.about.milestones.yatraTradition')}</h3>
            <p className="text-sm text-on-surface-variant md:mr-auto md:max-w-md">{t('public.about.milestones.yatraDesc')}</p>
          </div>
        </motion.div>

        {/* Timeline item 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 relative flex items-center md:-translate-x-[50%] md:w-[100%]"
        >
          <div className="absolute w-4.5 h-4.5 bg-[#C98B1A] rounded-full -left-[9.5px] md:left-[50%] md:-translate-x-[9px] ring-4 ring-surface shadow-sm"></div>
          <div className="ml-8 md:ml-0 md:w-[50%] md:pr-12 md:text-right">
            <span className="font-label-caps text-secondary font-bold block mb-1">2018</span>
            <h3 className="font-bold text-lg text-primary mb-2">{t('public.about.milestones.guided')}</h3>
            <p className="text-sm text-on-surface-variant md:ml-auto md:max-w-md">{t('public.about.milestones.guidedDesc')}</p>
          </div>
        </motion.div>

        {/* Timeline item 4 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center md:flex-row-reverse md:translate-x-[50%] md:w-[100%]"
        >
          <div className="absolute w-4.5 h-4.5 bg-[#C98B1A] rounded-full -left-[9.5px] md:left-0 md:-translate-x-[9px] ring-4 ring-surface shadow-sm"></div>
          <div className="ml-8 md:ml-0 md:w-[50%] md:pl-12 md:text-left">
            <span className="font-label-caps text-secondary font-bold block mb-1">{t('public.about.milestones.present')}</span>
            <h3 className="font-bold text-lg text-primary mb-2">{t('public.about.milestones.destinations')}</h3>
            <p className="text-sm text-on-surface-variant md:mr-auto md:max-w-md">{t('public.about.milestones.destinationsDesc')}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
