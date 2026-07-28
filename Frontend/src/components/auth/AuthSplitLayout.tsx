import React from 'react';
import { Link } from 'react-router-dom';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

export const AuthSplitLayout: React.FC<AuthSplitLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#FAF8F5] font-body-md text-on-surface overflow-x-hidden">
      {/* Left Panel (~45%): Editorial Spiritual Panel */}
      <div className="w-full lg:w-[45%] min-h-[420px] lg:min-h-[100dvh] relative flex flex-col justify-between p-8 sm:p-12 lg:p-14 overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-outline-variant/20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/Home_Page.JPG"
            alt="Shri Gurudev Ashram Sacred Abode"
            className="w-full h-full object-cover object-center transform scale-105 filter contrast-[105%]"
          />
          {/* Warm Saffron Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0d06]/95 via-[#C98B1A]/45 to-black/60"></div>
          {/* Ambient background glow at logo position */}
          {/* Wide ambient sunlight bleed — fills the upper panel softly */}
          <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#E4B04A]/22 rounded-full blur-[70px] pointer-events-none"></div>
        </div>

        {/* Main Content: Logo + Text — all centered */}
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-lg mx-auto pt-6 lg:pt-4">

          {/* ── HERO LOGO ── */}
          <Link
            to="/"
            className="relative inline-block group transition-transform duration-700 hover:scale-[1.03] mb-12 sm:mb-14 lg:mb-16"
            aria-label="माँ वैष्णवी टूरिज़्म — Home"
          >
            {/* Outer ambient sunlight bleed — wide, very soft, low opacity */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-20 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 90% 80% at 50% 52%, rgba(228,176,74,0.22) 0%, rgba(228,176,74,0.08) 55%, transparent 78%)',
                transform: 'scale(2.1)',
                filter: 'blur(38px)',
              }}
            />
            {/* Inner halo — tighter, slightly brighter, feels like the source of light */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(232,163,56,0.30) 0%, rgba(201,139,26,0.10) 60%, transparent 82%)',
                transform: 'scale(1.45)',
                filter: 'blur(22px)',
              }}
            />
            <img
              src="/assets/Ashram vector logo_2022_white-01.png"
              alt="Shri Gurudev Ashram Official Logo"
              className="
                w-[160px] sm:w-[220px] lg:w-[300px]
                h-auto
                object-contain
                select-none
                filter brightness-[1.1] contrast-[1.03] drop-shadow-[0_8px_36px_rgba(228,176,74,0.70)]
              "
              draggable="false"
            />
          </Link>

          {/* ── TEXT HIERARCHY ── */}
          <div className="space-y-4 w-full">
            {/* 1. Eyebrow */}
            <span className="font-label-caps text-xs tracking-[0.32em] uppercase text-[#E8A338] font-bold block">
              🙏 Sacred Portal
            </span>

            {/* 2. Primary heading */}
            <h1 className="font-display-lg text-3xl sm:text-4xl lg:text-5xl text-white font-bold tracking-tight leading-tight drop-shadow-md">
              Welcome to माँ वैष्णवी टूरिज़्म
            </h1>

            {/* 3. Supporting description */}
            <p className="font-body-lg text-sm sm:text-base text-white/85 leading-relaxed font-light max-w-sm mx-auto lg:max-w-none">
              Continue your spiritual journey through Sacred Yatras, Seva, and Ashram activities under the divine blessings of Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj.
            </p>
          </div>
        </div>

        {/* Bottom: Sanskrit Verse */}
        <div className="relative z-10 pt-8 lg:pt-10 border-t border-white/20 mt-10 w-full max-w-lg mx-auto text-center">
          <p className="font-display-lg text-xl sm:text-2xl text-[#f5efe4] tracking-wide mb-1 drop-shadow">
            ॥ श्रद्धावान् लभते ज्ञानम् ॥
          </p>
          <p className="font-label-caps text-[10px] sm:text-xs tracking-[0.35em] uppercase text-[#E8A338] font-semibold mb-2">
            ŚRADDHĀVĀN LABHATE JÑĀNAM
          </p>
          <p className="font-body-md text-xs sm:text-sm text-white/75 italic font-light">
            "He who has faith attains true knowledge."
          </p>
        </div>
      </div>

      {/* Right Panel (~55%): Premium Floating Authentication Card */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-4 sm:p-8 lg:p-16 min-h-[600px] lg:min-h-[100dvh] relative z-10">
        <div className="w-full max-w-lg bg-[#fffdf8] rounded-3xl p-8 sm:p-12 lg:p-14 border border-outline-variant/30 shadow-2xl relative overflow-hidden animate-fade-in-up my-8 lg:my-0">
          {/* Subtle top saffron accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C98B1A] via-[#E8A338] to-[#C98B1A]"></div>
          {children}
        </div>
      </div>
    </div>
  );
};
