import React from 'react';
import { Link } from 'react-router-dom';
import ashramLogo from '../../assets/ashramlogo.png';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen pt-32 sm:pt-36 md:pt-40 pb-16 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 bg-black">
        <img
          className="w-full h-full object-cover opacity-80"
          alt="Shri Gurudev Ashram — Sacred Abode, Palaskhed Sapkal"
          src="/assets/Home_Page.JPG"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden="true"></div>
        <div className="absolute inset-0 hero-gradient" aria-hidden="true"></div>
      </div>
      
      <div className="relative z-10 text-center px-margin-mobile max-w-5xl mx-auto flex flex-col items-center">
        {/* Logo */}
        <img
          src={ashramLogo}
          alt="Shri Gurudev Ashram Official Logo"
          className="w-64 sm:w-72 md:w-[340px] lg:w-[400px] xl:w-[440px] h-auto object-contain mx-auto mb-6 md:mb-8 drop-shadow-[0_8px_30px_rgba(201,139,26,0.65)] select-none transition-transform duration-700 hover:scale-[1.03]"
          style={{ filter: 'brightness(1.25) contrast(1.15)' }}
        />

        <span
          className="section-eyebrow text-[#F4C430] animate-fade-in mb-4"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}
        >
          🙏 Under the Blessings of Gurudev
        </span>
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white balance-text mb-6">
          Begin Your Sacred Journey
        </h1>
        <p className="font-body-lg text-body-lg text-white/90 max-w-2xl mx-auto italic">
          "Every Yatra begins with devotion and ends with inner transformation."
        </p>
        
        <div className="pt-10 flex flex-col md:flex-row gap-4 justify-center">
          <Link to="/yatras" className="btn-primary">
            Explore Sacred Yatras
          </Link>
          <Link to="/about" className="btn-outline border-white text-white hover:bg-white hover:text-on-surface">
            Our Philosophy
          </Link>
        </div>
      </div>
    </section>
  );
};
