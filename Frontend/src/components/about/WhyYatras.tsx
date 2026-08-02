import React from 'react';
import { Footprints, Users, Leaf } from 'lucide-react';
import { ReadMore } from '../shared/ReadMore';
import { useTranslation } from "react-i18next";

export const WhyYatras: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="bg-surface-container-low py-16 md:py-section-gap">
      <div className="px-4 md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="order-2 lg:order-1 rounded-xl overflow-hidden shadow-sm aspect-video lg:aspect-square relative">
            <img className="w-full h-full object-cover" alt="" src="/assets/TULSI MALA.jpg" loading="lazy" />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="font-label-caps text-label-caps text-secondary mb-2 block tracking-widest">{t('about.whyYatras.eyebrow')}</span>
            <h2 className="font-headline-md text-headline-md text-primary mb-6">{t('about.whyYatras.title')}</h2>
            <div className="space-y-6 text-on-surface-variant leading-relaxed font-body-md">
              <ReadMore>
                <p>
                  {t('about.whyYatras.desc')}
                </p>
                <ul className="space-y-6 mt-6">
                  <li className="flex gap-4 items-start">
                    <div className="bg-primary-container/20 p-2.5 rounded-full text-primary shrink-0">
                      <Footprints className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <strong className="text-on-surface block mb-1">{t('about.whyYatras.routine')}</strong>
                      <p className="text-sm">{t('about.whyYatras.routineDesc')}</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="bg-primary-container/20 p-2.5 rounded-full text-primary shrink-0">
                      <Users className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <strong className="text-on-surface block mb-1">{t('about.whyYatras.sangha')}</strong>
                      <p className="text-sm">{t('about.whyYatras.sanghaDesc')}</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="bg-primary-container/20 p-2.5 rounded-full text-primary shrink-0">
                      <Leaf className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <strong className="text-on-surface block mb-1">{t('about.whyYatras.geography')}</strong>
                      <p className="text-sm">{t('about.whyYatras.geographyDesc')}</p>
                    </div>
                  </li>
                </ul>
              </ReadMore>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
