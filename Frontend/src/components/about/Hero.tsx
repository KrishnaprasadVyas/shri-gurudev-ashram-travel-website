import React from 'react';

const SpiritualDivider = () => (
  <div className="flex items-center justify-center gap-6 my-8">
    <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-[#C98B1A]" />
    <span className="text-[#C98B1A] text-xl select-none">✦</span>
    <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-[#C98B1A]" />
  </div>
);

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[640px] md:h-[680px] flex items-center justify-center text-center px-margin-mobile overflow-hidden bg-surface border-b border-outline-variant/20 py-20 md:py-0">
      {/* Editorial Ivory Background with Subtle Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(201,139,26,0.1)_0%,rgba(232,163,56,0.03)_50%,transparent_70%)] blur-2xl"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C98B1A]/20 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-4xl animate-fade-in-up mt-8 md:mt-12 flex flex-col items-center">
        {/* Large Ashram Logo — Primary Brand Identity */}
        <img
          src="/assets/Ashram vector logo_2022_white-01.png"
          alt="Shri Gurudev Ashram Official Logo"
          width={320}
          height={320}
          loading="eager"
          fetchPriority="high"
          className="w-64 sm:w-72 md:w-[320px] max-w-[80vw] h-auto max-h-[35vh] object-contain mx-auto mb-6 md:mb-8 drop-shadow-[0_4px_20px_rgba(201,139,26,0.5)] select-none transition-transform duration-700 hover:scale-105"
        />

        <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest mb-4 block font-semibold">
          Sacred Pilgrimages Under Gurudev's Blessings
        </span>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-6 font-bold tracking-tight">
          Where Every Journey Becomes a Spiritual Awakening
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 leading-relaxed max-w-2xl mx-auto font-light">
          "Every pilgrimage begins with faith and ends with inner transformation."
        </p>
        <SpiritualDivider />
      </div>
    </section>
  );
};
