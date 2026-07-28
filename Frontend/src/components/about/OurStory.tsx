import React from 'react';
import { ReadMore } from '../shared/ReadMore';

export const OurStory: React.FC = () => {
  return (
    <section className="relative pt-6 md:pt-8 pb-[120px] bg-[#FFFDF8] overflow-hidden flex flex-col items-center">
      
      {/* Background Soft Glow behind portrait */}
      <div 
        className="absolute top-[180px] left-1/2 -translate-x-1/2 w-[500px] md:w-[600px] h-[500px] md:h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(rgba(255,215,120,0.18), transparent 70%)' }}
      ></div>

      <div className="relative z-10 w-full flex flex-col items-center text-center px-6">
        
        {/* GURUDEV Label */}
        <div className="text-[#B8860B] text-[13px] md:text-[14px] font-semibold uppercase tracking-[0.35em] mb-6">
          GURUDEV
        </div>

        {/* Circular Image */}
        <div className="w-[300px] md:w-[350px] h-[300px] md:h-[350px] rounded-full overflow-hidden border-[5px] border-[#E3B341] shadow-[0_15px_40px_rgba(0,0,0,0.12)] mb-8 flex-shrink-0 relative">
          <img 
            src="/assets/gurudev.jpg"
            alt="Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj"
            className="w-full h-full object-cover object-[65%_-38%]"
            loading="lazy"
          />
        </div>

        {/* Name */}
        <h2 className="font-display text-[#7A3F10] text-[28px] md:text-[32px] lg:text-[36px] leading-[1.1] font-bold mb-6 max-w-4xl">
          Param Pujya Shri Swami<br />Harichaitanyanand Saraswatiji Maharaj
        </h2>

        {/* Subtitle */}
        <p className="font-body text-[#666666] text-[16px] md:text-[18px] max-w-[900px] leading-relaxed mb-8">
          Founder and spiritual guide of माँ वैष्णवी टूरिज़्म<br />
          (Palaskhed Sapkal, Chikhli, Buldhana)<br />
          and Swami Harichaitanya Shanti Ashram Trust<br />
          (Datala, Malkapur)
        </p>

        {/* Divider */}
        <div className="w-[70px] h-[2px] bg-[#B8860B] mb-10"></div>

        {/* Description */}
        <div className="font-body text-[#3E2B1F] text-base leading-relaxed md:text-[22px] md:leading-[1.9] max-w-[900px] w-full text-left md:text-center mx-auto">
          <ReadMore 
            text={`Gurudev Ji has shown countless devotees the path of <strong>Bhakti</strong> (Devotion), <strong>Gyan</strong> (Wisdom), and Nishkam <strong>Seva</strong> (Selfless Service). Through daily Satsang, Gita Path, Haripath, Annadan, Education, Medical Service, Gaushala, Gurukulam, Adivasi Seva, Anath Ashram, and Seva Tirth Dham, the Ashram continues to serve society with compassion and dedication.\n\nThe purpose of every seva is the purification of the mind and the upliftment of society. Inspired by Gurudev Ji, the Ashram continues to connect devotees across India through spirituality, service, and sacred Yatras.`}
          />
        </div>

      </div>
    </section>
  );
};

