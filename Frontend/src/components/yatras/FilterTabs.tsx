import React from 'react';
import { useTranslation } from "react-i18next";

interface FilterTabsProps {
  activeTab: 'upcoming' | 'past';
  onTabChange: (tab: 'upcoming' | 'past') => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();
  return (
    <section className="max-w-container-max mx-auto px-margin-desktop mb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-outline-variant/30 pb-6">
        <div className="flex bg-surface-container-low p-1 rounded-xl">
          <button
            onClick={() => onTabChange('upcoming')}
            className={`px-8 py-2.5 rounded-lg font-label-caps transition-all duration-300 ${
              activeTab === 'upcoming'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {t('public.yatras.filters.upcoming')}
          </button>
          <button
            onClick={() => onTabChange('past')}
            className={`px-8 py-2.5 rounded-lg font-label-caps transition-all duration-300 ${
              activeTab === 'past'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {t('public.yatras.filters.pastJourneys')}
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-on-surface-variant">
          <span className="font-label-caps">{t('public.yatras.filters.sortBy')}</span>
          <select className="bg-transparent border-none focus:ring-0 font-body-md text-primary cursor-pointer outline-none">
            <option>{t('public.yatras.filters.sortDateAsc')}</option>
            <option>{t('public.yatras.filters.sortPriceAsc')}</option>
            <option>{t('public.yatras.filters.sortDuration')}</option>
          </select>
        </div>
      </div>
    </section>
  );
};
