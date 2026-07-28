import React from 'react';
import { kedarnath } from '@/assets/images';
import whitelogo from '@/assets/whitelogo.svg';

const SpiritualDivider = () => (
  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 pb-4">
    <div className="h-[1px] w-32 sm:w-64 bg-gradient-to-r from-transparent to-[#C98B1A]" />
    <span className="text-[#C98B1A] text-xl select-none">✦</span>
    <div className="h-[1px] w-32 sm:w-64 bg-gradient-to-l from-transparent to-[#C98B1A]" />
  </div>
);

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[540px] md:min-h-[620px] flex flex-col items-center justify-start text-center px-4 sm:px-6 overflow-hidden pt-10 md:pt-16 pb-8 md:pb-12">
      {/* Pilgrimage Background — Kedarnath */}
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover object-center transform scale-105"
          alt="Sacred Kedarnath Pilgrimage — माँ वैष्णवी टूरिज़्म Yatra"
          src={kedarnath}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0d06]/80 via-black/20 to-black/30"></div>
        {/* Soft saffron glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(201,139,26,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto animate-fade-in-up flex flex-col items-center">
        {/* White Ashram Logo — Primary Brand Identity */}
        <img
          src={whitelogo}
          alt="Shri Gurudev Ashram Official Logo"
          width={320}
          height={320}
          loading="eager"
          className="w-64 sm:w-72 md:w-[320px] max-w-[80vw] h-auto max-h-[35vh] object-contain mx-auto mb-2 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] select-none transition-transform duration-700 hover:scale-105"
        />
        
        {/* Small Label */}
        <span className="font-label-caps text-xs sm:text-sm text-[#d48c29] uppercase tracking-[0.25em] mb-4 block font-semibold">
          Sacred Pilgrimages Under Gurudev's Blessings
        </span>

        {/* Main Heading */}
        <h1 className="font-display-lg text-4xl sm:text-5xl md:text-6xl lg:text-[64px] text-white font-bold tracking-tight mb-4 drop-shadow-md">
          Maa Vaishnavi Tourism
        </h1>

        <p className="font-body-lg text-base sm:text-lg md:text-xl text-white/85 leading-relaxed max-w-2xl mx-auto font-medium">
          Walk the timeless paths of Bharat through sacred pilgrimages guided by Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj.
        </p>
      </div>
      <SpiritualDivider />
    </section>
  );
};
