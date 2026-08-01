import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

export const CallToAction: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-section-gap px-margin-mobile md:px-margin-desktop text-center max-w-3xl mx-auto animate-fade-in-up">
      <h2 className="font-headline-md text-headline-md text-primary mb-6">{t('about.cta.title')}</h2>
      <p className="font-body-lg text-on-surface-variant mb-10 leading-relaxed">
        {t('about.cta.desc')}
      </p>
      <Link
        to="/yatras"
        className="btn-primary"
      >
        {t('about.cta.btn')}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
      </Link>
    </section>
  );
};
