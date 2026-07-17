import React from 'react';

const DecorativeDivider = () => (
  <div className="flex items-center justify-center gap-5 my-8">
    <div className="h-[1px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#C98B1A] to-[#C98B1A]" />
    <div className="w-2 h-2 rotate-45 border border-[#C98B1A] bg-[#C98B1A]/20 shadow-[0_0_8px_rgba(201,139,26,0.3)] shrink-0" />
    <div className="h-[1px] w-20 sm:w-28 bg-gradient-to-l from-transparent via-[#C98B1A] to-[#C98B1A]" />
  </div>
);

/* Delicate Minimalist Geometric Texture (Lines/Lattice only — NO circles or rings) */
const MinimalistGeometryTexture = () => (
  <svg
    viewBox="0 0 600 600"
    fill="none"
    className="absolute inset-0 w-full h-full text-[#C98B1A] opacity-[0.03] pointer-events-none select-none"
  >
    <path d="M0 100 L600 100 M0 200 L600 200 M0 300 L600 300 M0 400 L600 400 M0 500 L600 500" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8" />
    <path d="M100 0 L100 600 M200 0 L200 600 M300 0 L300 600 M400 0 L400 600 M500 0 L500 600" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8" />
    <path d="M0 0 L600 600 M600 0 L0 600" stroke="currentColor" strokeWidth="0.5" />
  </svg>
);

export const ContactHero: React.FC = () => {
  return (
    <section className="relative min-h-[480px] md:h-[540px] flex items-center justify-center text-center px-6 overflow-hidden py-24 md:py-0 bg-surface border-b border-outline-variant/20">
      {/* Warm Ivory Background & Soft Saffron Radial Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-[radial-gradient(ellipse_at_center,rgba(201,139,26,0.12)_0%,rgba(232,163,56,0.03)_50%,transparent_75%)] blur-3xl"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C98B1A]/20 to-transparent"></div>
      </div>

      {/* Subtle Minimalist Geometry Texture */}
      <MinimalistGeometryTexture />

      <div className="relative z-10 max-w-3xl mx-auto animate-fade-in-up flex flex-col items-center mt-6 md:mt-10">
        {/* White Ashram Logo sitting naturally in generous whitespace */}
        <img
          src="/assets/Ashram vector logo_2022_white-01.png"
          alt="Shri Gurudev Ashram Official Logo"
          width={320}
          height={320}
          loading="eager"
          fetchPriority="high"
          className="w-64 sm:w-72 md:w-[320px] max-w-[80vw] h-auto max-h-[35vh] object-contain mx-auto mb-6 md:mb-8 drop-shadow-[0_4px_20px_rgba(201,139,26,0.5)] select-none transition-transform duration-700 hover:scale-105"
        />

        {/* Small Eyebrow */}
        <span className="font-label-caps text-xs md:text-sm text-secondary uppercase tracking-[0.25em] mb-4 block font-semibold">
          Visit Shri Gurudev Ashram
        </span>

        {/* Large Heading */}
        <h1 className="font-display-lg text-4xl sm:text-5xl md:text-6xl text-primary font-bold tracking-tight mb-4">
          Contact & Visit the Ashram
        </h1>

        {/* Short Description */}
        <p className="font-body-lg text-base sm:text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-2xl mx-auto font-light">
          Whether you wish to participate in a Sacred Yatra, seek spiritual guidance, make a donation, or visit the Ashram, our team is always happy to assist you.
        </p>

        {/* Elegant Spiritual Divider */}
        <DecorativeDivider />
      </div>
    </section>
  );
};
