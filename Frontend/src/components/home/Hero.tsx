import React from 'react';
import { Link } from 'react-router-dom';
import whitelogo from '../../assets/whitelogo.svg';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] md:min-h-[80vh] flex items-center justify-center overflow-hidden pt-8 md:pt-16 pb-4 md:pb-4">
      <div className="absolute inset-0 z-0 bg-black">
        <img
          className="w-full h-full object-cover opacity-80"
          alt="माँ वैष्णवी टूरिज़्म — Sacred Abode, Palaskhed Sapkal"
          src="/assets/Home_Page.JPG"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden="true"></div>
        <div className="absolute inset-0 hero-gradient" aria-hidden="true"></div>
      </div>

      <div className="relative z-10 text-center px-4 md:px-margin-mobile max-w-4xl mx-auto flex flex-col items-center">
        {/* Logo with transparent background, exact size/spacing, and crisp presentation */}
        <img
          src={whitelogo}
          alt="Shri Gurudev Ashram Official Logo"
          className="w-64 sm:w-80 md:w-[350px] lg:w-[420px] max-w-[85vw] h-auto max-h-[38vh] md:max-h-[42vh] object-contain select-none transition-transform duration-700 hover:scale-105 mx-auto mb-2 md:mb-3 bg-transparent border-none p-0 shadow-none drop-shadow-[0_8px_30px_rgba(201,139,26,0.65)]"
        />

        <span className="section-eyebrow !text-white animate-fade-in mb-3 md:mb-4">
          🙏 UNDER THE BLESSINGS OF GURUDEV
        </span>
        <h1 className="font-display-lg-mobile md:font-display-lg text-[40px] leading-[48px] md:text-[56px] md:leading-[64px] font-bold text-white balance-text mb-4 md:mb-6">
          Begin Your Sacred Journey
        </h1>
        <p className="font-body-lg text-[16px] md:text-[18px] text-white/90 max-w-2xl mx-auto italic mb-6 md:mb-8 px-4">
          "Every Yatra begins with devotion and ends with inner transformation."
        </p>

        <div className="pt-2 md:pt-4 flex flex-col md:flex-row gap-4 justify-center w-full md:w-auto px-4 md:px-0">
          <Link to="/yatras" className="btn-primary w-full md:w-auto min-h-[44px]">
            Explore Sacred Yatras
          </Link>
          <Link to="/about" className="btn-outline border-white text-white hover:bg-white hover:text-on-surface w-full md:w-auto min-h-[44px]">
            Our Philosophy
          </Link>
        </div>
      </div>
    </section>
  );
};
