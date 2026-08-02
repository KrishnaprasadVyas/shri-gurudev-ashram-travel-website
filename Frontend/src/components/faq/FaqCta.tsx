import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

export const FaqCta: React.FC = () => {
    const { t } = useTranslation();
  return (
    <section className="py-section-gap px-margin-mobile md:px-margin-desktop text-center max-w-3xl mx-auto animate-fade-in-up">
      <h2 className="font-headline-md text-headline-md text-primary mb-6">
        {t('public.faq.stillHaveQuestions')}
      </h2>
      <p className="font-body-lg text-on-surface-variant mb-10 leading-relaxed">
        {t('public.faq.assistDesc')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition-all hover:-translate-y-1 shadow-lg w-full sm:w-auto tracking-wider uppercase text-sm select-none"
        >
          {t('public.common.contactAshram')}
        </Link>
        <Link
          to="/yatras"
          className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-on-primary px-8 py-4 rounded-xl font-bold transition-all hover:-translate-y-1 shadow-md w-full sm:w-auto tracking-wider uppercase text-sm select-none"
        >
          {t('about.cta.btn')}
        </Link>
      </div>
    </section>
  );
};
