import React from 'react';

export const Testimonials: React.FC = () => {
  return (
    <section className="py-16 md:py-section-gap px-4 md:px-margin-mobile text-center relative overflow-hidden bg-surface-container-low">
      {/* Background Image with warm white overlay */}
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover opacity-15"
          alt=""
          aria-hidden="true"
          src="/assets/temple_sunrise_bg.png"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-surface/70 mix-blend-color-burn"></div>
      </div>
      
      <div className="max-w-3xl mx-auto relative z-10 space-y-8 animate-fade-in-up">
        {/* Lotus Ornament & Om Inscription */}
        <div className="flex flex-col items-center justify-center gap-2">
          <span className="text-[#C98B1A] text-xl font-bold tracking-[0.2em] mb-1 font-headline-md select-none">॥ ॐ ॥</span>
          <div className="flex items-center justify-center gap-4 w-full mb-2">
            <div className="h-[1px] w-16 bg-[#C98B1A]/30" />
            <img
              src="/assets/Ashram vector logo_2022_white-01.png"
              alt="Shri Gurudev Ashram Logo"
              className="h-16 w-16 md:h-20 md:w-20 object-contain shrink-0 drop-shadow-[0_3px_10px_rgba(117,91,0,0.25)] filter brightness-95 select-none"
            />
            <div className="h-[1px] w-16 bg-[#C98B1A]/30" />
          </div>
        </div>
        
        {/* Sanskrit Verse */}
        <div className="space-y-5">
          <h2 className="font-display-lg text-[26px] sm:text-[34px] md:text-[38px] text-[#755b00] font-bold leading-relaxed tracking-wide select-none">
            गङ्गे च यमुने चैव गोदावरि सरस्वति।<br />
            नर्मदे सिन्धु कावेरी जलेऽस्मिन् सन्निधिं कुरु॥
          </h2>
          
          {/* Transliteration */}
          <div className="font-label-caps text-[11px] sm:text-[12px] tracking-[0.25em] text-[#807661] uppercase font-semibold leading-relaxed">
            Gaṅge Ca Yamune Caiva Godāvari Sarasvatī<br />
            Narmade Sindhu Kāverī Jale'smin Sannidhiṁ Kuru
          </div>
        </div>
        
        <div className="w-12 h-px bg-[#C98B1A]/30 mx-auto" />
        
        {/* Meaning */}
        <p className="font-display-lg text-base sm:text-lg italic text-[#4e4634] leading-relaxed max-w-2xl mx-auto font-light">
          "O sacred rivers—Ganga, Yamuna, Godavari, Saraswati, Narmada, Sindhu, and Kaveri—may your divine presence sanctify this place."
        </p>
      </div>
    </section>
  );
};
