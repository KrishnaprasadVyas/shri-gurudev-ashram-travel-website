import React from 'react';

const SpiritualDivider = () => (
  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 pb-4">
    <div className="h-[1px] w-32 sm:w-64 bg-gradient-to-r from-transparent to-[#C98B1A]" />
    <span className="text-[#C98B1A] text-xl select-none">✦</span>
    <div className="h-[1px] w-32 sm:w-64 bg-gradient-to-l from-transparent to-[#C98B1A]" />
  </div>
);

export const GalleryHero: React.FC = () => {
  return (
    <section className="relative flex flex-col items-center justify-start text-center px-4 sm:px-6 overflow-hidden pt-10 md:pt-16 pb-0">
      <div className="relative z-10 w-full max-w-4xl animate-fade-in-up flex flex-col items-center">
        {/* White Ashram Logo */}
        <img
          src="/assets/Ashram vector logo_2022_white-01.png"
          alt="Shri Gurudev Ashram Official Logo"
          width={320}
          height={320}
          loading="eager"
          className="w-64 sm:w-72 md:w-[320px] max-w-[80vw] h-auto max-h-[35vh] object-contain mx-auto mb-2 drop-shadow-[0_4px_20px_rgba(201,139,26,0.5)] select-none transition-transform duration-700 hover:scale-105"
        />
        
        {/* Page Title */}
        <h1 className="font-label-caps text-xs md:text-sm text-amber-400 uppercase tracking-[0.25em] mb-0 block font-semibold">
          Sacred Moments
        </h1>
      </div>
    </section>
  );
};
