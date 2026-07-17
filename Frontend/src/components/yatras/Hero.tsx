import React from 'react';
import { kedarnath } from '@/assets/images';

const DecorativeDivider = () => (
  <div className="flex items-center justify-center gap-5 my-6">
    <div className="h-[1px] w-20 sm:w-24 bg-gradient-to-r from-transparent via-white/60 to-white/60" />
    <div className="w-2.5 h-2.5 rotate-45 border border-white/60 bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.2)] shrink-0" />
    <div className="h-[1px] w-20 sm:w-24 bg-gradient-to-l from-transparent via-white/60 to-white/60" />
  </div>
);

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[640px] md:min-h-[720px] flex items-center justify-center text-center px-4 sm:px-6 overflow-hidden py-20 md:py-24">
      {/* Pilgrimage Background — Kedarnath */}
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover object-center transform scale-105"
          alt="Sacred Kedarnath Pilgrimage — Shri Gurudev Ashram Yatra"
          src={kedarnath}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0d06]/80 via-black/20 to-black/30"></div>
        {/* Soft saffron glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(201,139,26,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto animate-fade-in-up flex flex-col items-center mt-6 md:mt-12">
        {/* White Ashram Logo — Primary Brand Identity */}
        <img
          src="/assets/Ashram vector logo_2022_white-01.png"
          alt="Shri Gurudev Ashram Official Logo"
          className="w-64 sm:w-72 md:w-[288px] lg:w-[320px] h-auto object-contain mb-6 md:mb-8 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] select-none transition-transform duration-700 hover:scale-105"
        />

        {/* Small Label */}
        <span className="font-label-caps text-xs sm:text-sm text-[#d48c29] uppercase tracking-[0.25em] mb-4 block font-semibold">
          Sacred Pilgrimages Under Gurudev's Blessings
        </span>

        {/* Main Heading */}
        <h1 className="font-display-lg text-4xl sm:text-5xl md:text-6xl lg:text-[64px] text-white font-bold tracking-tight mb-2 drop-shadow-md">
          Sacred Yatras
        </h1>

        {/* Decorative Divider */}
        <DecorativeDivider />

        {/* Description */}
        <p className="font-body-lg text-base sm:text-lg md:text-xl text-white/85 leading-relaxed max-w-2xl mx-auto font-medium">
          Walk the timeless paths of Bharat through sacred pilgrimages guided by Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj.
        </p>
      </div>
    </section>
  );
};
