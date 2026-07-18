import React from 'react';

const SpiritualDivider = () => (
  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 pb-4">
    <div className="h-[1px] w-32 sm:w-64 bg-gradient-to-r from-transparent to-[#C98B1A]" />
    <span className="text-[#C98B1A] text-xl select-none">✦</span>
    <div className="h-[1px] w-32 sm:w-64 bg-gradient-to-l from-transparent to-[#C98B1A]" />
  </div>
);

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[500px] md:min-h-[600px] flex flex-col items-center justify-start text-center px-6 overflow-hidden bg-surface border-b border-outline-variant/20 pt-10 md:pt-16 pb-16 md:pb-20">
      {/* Editorial Ivory Background with Subtle Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(201,139,26,0.1)_0%,rgba(232,163,56,0.03)_50%,transparent_70%)] blur-2xl"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C98B1A]/20 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl animate-fade-in-up flex flex-col items-center">
        {/* White Ashram Logo */}
        <img
          src="/assets/Ashram vector logo_2022_white-01.png"
          alt="Shri Gurudev Ashram Official Logo"
          width={320}
          height={320}
          loading="eager"
          fetchPriority="high"
          className="w-64 sm:w-72 md:w-[320px] max-w-[80vw] h-auto max-h-[35vh] object-contain mx-auto mb-2 drop-shadow-[0_4px_20px_rgba(201,139,26,0.5)] select-none transition-transform duration-700 hover:scale-105"
        />
        
        {/* Subtle Eyebrow */}
        <span className="font-label-caps text-sm text-secondary uppercase tracking-[0.3em] mb-4 block font-semibold">
          About Us
        </span>
        
        {/* Elegant Heading */}
        <h1 className="font-display-lg text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-primary mb-4 font-bold tracking-tight leading-tight">
          Where Every Journey <br className="hidden sm:block" /> Becomes a Spiritual Awakening
        </h1>
        
        {/* Short Description */}
        <p className="font-body-lg text-lg sm:text-xl md:text-2xl text-on-surface-variant mb-8 leading-relaxed max-w-2xl mx-auto font-light">
          "Every pilgrimage begins with faith and ends with inner transformation."
        </p>
      </div>
      <SpiritualDivider />
    </section>
  );
};
