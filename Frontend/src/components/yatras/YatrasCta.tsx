import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

export const YatrasCta: React.FC = () => {
    const { t } = useTranslation();
  return (
    <section className="py-section-gap px-margin-mobile md:px-margin-desktop text-center max-w-3xl mx-auto animate-fade-in-up">
      <h2 className="font-display-lg text-3xl sm:text-4xl text-primary font-bold mb-4">
        {t('public.yatras.cta.title', { defaultValue: 'Begin Your Sacred Journey with माँ वैष्णवी टूरिज़्म' })}
      </h2>
      <p className="font-body-lg text-on-surface-variant mb-10 leading-relaxed">
        {t('public.yatras.cta.desc')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
        <a
          href="#upcoming"
          className="btn-primary w-full sm:w-auto justify-center"
        >
          {t('about.cta.btn')}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </a>
        <Link
          to="/contact"
          className="btn-outline w-full sm:w-auto justify-center"
        >
          {t('public.common.contactAshram')}
        </Link>
      </div>
    </section>
  );
};
