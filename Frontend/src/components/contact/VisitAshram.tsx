import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation, Compass } from 'lucide-react';
import { useTranslation } from "react-i18next";

export const VisitAshram: React.FC = () => {
    const { t } = useTranslation();
  const scrollToMap = () => {
    const mapElement = document.getElementById('ashram-map-section');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 md:py-28 bg-[#fffdf8] border-t border-b border-outline-variant/20 overflow-hidden relative">
      <div className="max-w-container-max mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Large Ashram Image (Col Span 6) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/30 aspect-[4/3] group">
              <img
                src="/assets/Home_Page.JPG"
                alt="Shri Gurudev Ashram Sacred Premises"
                className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="bg-surface/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-label-caps uppercase tracking-widest text-primary shadow-sm inline-flex items-center gap-2">
                  {t('public.contact.location')}
                </span>
              </div>
            </div>
            {/* Decorative Saffron Aura */}
            <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-[#C98B1A]/15 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          </div>

          {/* Right: Editorial Content (Col Span 6) */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <span className="font-label-caps text-xs md:text-sm text-secondary uppercase tracking-[0.25em] block font-semibold">
              {t('public.contact.abodeTitle')}
            </span>

            <h2 className="font-display-lg text-3xl sm:text-4xl md:text-5xl text-primary font-bold tracking-tight leading-tight">
              {t('public.contact.experiencePeace')}
            </h2>

            <p className="font-body-lg text-base sm:text-lg text-on-surface-variant leading-relaxed font-light">
              {t('public.contact.inviteDesc')}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={scrollToMap}
                className="inline-flex items-center justify-center gap-2.5 bg-primary text-on-primary px-8 py-4 rounded-xl font-label-caps text-xs tracking-widest uppercase hover:bg-secondary transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                {t('public.common.getDirections')}
              </button>
              <Link
                to="/yatras"
                className="inline-flex items-center justify-center gap-2.5 border border-primary text-primary hover:bg-primary hover:text-on-primary px-8 py-4 rounded-xl font-label-caps text-xs tracking-widest uppercase transition-all duration-300 shadow-sm active:scale-95"
              >
                <Compass className="w-4 h-4" />
                {t('about.cta.btn')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
