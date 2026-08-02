import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

export interface YatraCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  dates: string;
  price: string;
  imageUrl: string;
}

export const YatraCard: React.FC<YatraCardProps> = ({
  id,
  title,
  description,
  duration,
  dates,
  price,
  imageUrl,
}) => {
    const { t } = useTranslation();
  return (
    <div className="yatra-card group bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col hover:shadow-lg transition-all duration-500">
      <div className="relative h-56 md:h-64 overflow-hidden">
        <img
          className="yatra-image w-full h-full object-cover"
          alt={title}
          src={imageUrl}
        />
        <div className="absolute top-4 left-4 bg-primary text-on-primary px-3 py-1 rounded font-label-caps">
          {duration}
        </div>
      </div>
      
      <div className="p-5 md:p-8 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-secondary text-[20px]">calendar_today</span>
          <span className="font-label-caps text-on-surface-variant">{dates}</span>
        </div>
        
        <h3 className="font-headline-sm text-headline-sm text-primary mb-4">{title}</h3>
        
        <p className="font-body-md text-on-surface-variant mb-8 line-clamp-3">
          {description}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-6 border-t border-outline-variant/20">
          <span className="text-secondary font-bold text-lg">{price}</span>
          <Link
            to={`/yatras/${id}`}
            className="flex items-center gap-2 text-primary font-bold hover:text-secondary transition-colors group"
          >
            <span className="font-label-caps">{t('public.yatras.yatraCard.viewDetails', { defaultValue: 'VIEW DETAILS' })}</span>
            <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
};
