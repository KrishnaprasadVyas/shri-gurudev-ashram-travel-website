import React from 'react';
import { motion } from 'framer-motion';

export const GurudevBlessings: React.FC = () => {
  return (
    <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-surface overflow-hidden border-b border-outline-variant/20">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
        viewport={{ once: true, amount: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
      >
        {/* Left: Premium Gurudev Image matching About page exact framing */}
        <div className="order-1 lg:col-span-5 relative group flex flex-col items-center w-full max-w-[520px] mx-auto mb-10 lg:mb-0">
          <div className="absolute -inset-6 bg-primary/5 rounded-[3rem] blur-2xl transition-all duration-700 group-hover:bg-primary/10 pointer-events-none"></div>
          
          <div className="w-full rounded-[2rem] overflow-hidden shadow-2xl relative z-10 aspect-[3/4] border border-outline-variant/30 bg-surface-container-lowest">
            <img 
              className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-[1.03]" 
              style={{ objectPosition: '65% -38%' }}
              alt="Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj" 
              src="/assets/gurudev.jpg" 
              loading="lazy"
            />
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] pointer-events-none"></div>
          </div>
          
          {/* Below image typography identical to About page */}
          <div className="mt-5 text-center font-display-lg text-[22px] sm:text-[28px] md:text-[32px] lg:text-[34px] leading-[1.2] font-semibold text-primary z-10">
            <p>Param Pujya Shri Swami</p>
            <p>Harichaitanyanand Saraswatiji Maharaj</p>
          </div>
        </div>

        {/* Right: Biography Content */}
        <div className="order-2 lg:col-span-7 lg:pl-10">
          <span className="font-label-caps text-xs tracking-[0.2em] text-secondary mb-4 block uppercase font-semibold">
            Under the Blessings of Gurudev
          </span>
          <div className="space-y-6 text-on-surface-variant leading-relaxed font-body-md text-lg font-light">
            <p>
              Founder and spiritual guide of <strong className="font-medium text-on-surface">Shri Gurudev Ashram (Palaskhed Sapkal, Chikhli, Buldhana)</strong> and <strong className="font-medium text-on-surface">Swami Harichaitanya Shanti Ashram Trust (Datala, Malkapur)</strong>.
            </p>
            <p>
              Gurudev Ji has guided countless devotees on the path of Bhakti, Gyan, Nishkam Seva and Sacred Yatras, inspiring thousands to live a life rooted in spirituality, compassion and discipline.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
