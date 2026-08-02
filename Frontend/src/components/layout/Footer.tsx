import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ashramlogo from '../../assets/ashramlogo.png';
import whitelogo from '../../assets/whitelogo.svg';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from "react-i18next";

/* ─── Inline SVG Icons ─── */
const FacebookIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 0.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.582 6.186a2.66 2.66 0 0 0-1.876-1.884C18.053 3.86 12 3.86 12 3.86s-6.053 0-7.706.442a2.66 2.66 0 0 0-1.876 1.884C1.97 7.854 1.97 12 1.97 12s0 4.146.448 5.814a2.66 2.66 0 0 0 1.876 1.884C5.947 20.14 12 20.14 12 20.14s6.053 0 7.706-.442a2.66 2.66 0 0 0 1.876-1.884C22.03 16.146 22.03 12 22.03 12s0-4.146-.448-5.814zM9.82 15.228V8.772L15.343 12l-5.522 3.228z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
  </svg>
);

/* ─── Other Inline SVG Icons ─── */
const LocationIcon = () => (
  <svg className="w-4 h-4 text-[#C98B1A] shrink-0 mt-[3px]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4 text-[#C98B1A] shrink-0 mt-[2px]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4 text-[#C98B1A] shrink-0 mt-[3px]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-4 h-4 text-[#C98B1A] shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-4 h-4 text-[#C98B1A] shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z" />
  </svg>
);

const ChevronIcon = () => (
  <svg className="w-2.5 h-2.5 text-[#C98B1A] shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

const AshramLogo = () => {
  const { t } = useTranslation();
  return (
  <img
    src={whitelogo}
    alt={"Shri Gurudev Ashram Logo"}
    className="w-40 sm:w-44 md:w-52 lg:w-60 xl:w-[280px] h-auto object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105"
  />
  );
};

/* ─── Ornamental Bottom SVG ─── */
const OrnamentDivider = () => (
  <svg width="140" height="18" viewBox="0 0 140 18" fill="none" className="text-[#C98B1A] opacity-60">
    {/* Left line */}
    <line x1="0" y1="9" x2="50" y2="9" stroke="currentColor" strokeWidth="1" />
    <circle cx="52" cy="9" r="1.8" fill="currentColor" />
    <circle cx="57" cy="9" r="1.2" fill="currentColor" />
    {/* Center diamond */}
    <path d="M70 2 L78 9 L70 16 L62 9 Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M70 5 L75 9 L70 13 L65 9 Z" fill="currentColor" opacity="0.4" />
    {/* Right line */}
    <circle cx="83" cy="9" r="1.2" fill="currentColor" />
    <circle cx="88" cy="9" r="1.8" fill="currentColor" />
    <line x1="90" y1="9" x2="140" y2="9" stroke="currentColor" strokeWidth="1" />
  </svg>
);

/* ─── Social Button ─── */
const SocialBtn: React.FC<{ href: string; label: string; children: React.ReactNode }> = ({ href, label, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    aria-label={label}
    className="w-11 h-11 md:w-9 md:h-9 rounded-full bg-[#F5EFE4]/90 flex items-center justify-center text-[#1a0d06]
               hover:bg-[#C98B1A] hover:text-white hover:shadow-[0_0_14px_rgba(201,139,26,0.45)]
               hover:-translate-y-[2px] transition-all duration-300 ease-out"
  >
    {children}
  </a>
);

/* ─── Quick-Link Row ─── */
const QuickLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link
    to={to}
    className="flex items-center gap-1.5 text-[#C9B79D] hover:text-[#C98B1A] transition-all duration-200 group min-h-[44px]"
  >
    <span className="group-hover:translate-x-0.5 transition-transform duration-200 flex items-center gap-1.5">
      <ChevronIcon />
      <span className="text-[13px]">{label}</span>
    </span>
  </Link>
);

/* ═══════════════════════════════════════════════════════════════
   FOOTER COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export const Footer: React.FC = () => {
    const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <footer className="relative z-20 overflow-hidden text-[#F5EFE4] font-body-md"
      style={{
        background: 'linear-gradient(180deg, #1a0d06 0%, #26140a 40%, #1a0d06 80%, #120a05 100%)',
      }}
    >
      {/* Subtle warm centre glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,139,26,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Top saffron hairline */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C98B1A]/40 to-transparent" />

      {/* ─── Main Grid ─── */}
      <div className="relative w-full max-w-[1920px] mx-auto px-6 md:px-12 lg:px-16 xl:px-24 2xl:px-32 pt-10 pb-8 flex flex-col items-center">
        <motion.div
          layout
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_1px_1fr_1px_1fr_1px_1fr_1px_1.1fr] gap-y-10 items-start overflow-hidden w-full transition-all duration-500"
          style={
            !isDesktop && !isExpanded
              ? {
                  maxHeight: '320px',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)'
                }
              : {
                  maxHeight: '3000px',
                  WebkitMaskImage: 'none',
                  maskImage: 'none'
                }
          }
        >
          {/* ── Col 1 : Ashram Info ── */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:pr-8 xl:pr-12">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-4">
              <AshramLogo />

              <h3 className="mt-2.5 font-display-lg text-2xl lg:text-[26px] text-[#F5EFE4] font-bold leading-tight">
                {t('navbar.maaVaishnaviTourism')}
              </h3>
            </div>

            <p className="text-[13px] leading-[1.65] text-[#C9B79D] max-w-[350px] text-center lg:text-left mx-auto lg:mx-0">
              {t('footer.tagline')}
            </p>
            {/* Social */}
            <div className="flex justify-center lg:justify-start gap-3 mt-5">
              <SocialBtn href="https://www.facebook.com/SwamiHarichaitanyanandS/" label={"Facebook"}>
                <FacebookIcon />
              </SocialBtn>
              <SocialBtn href="https://www.youtube.com/@shrigurudevashram" label={"YouTube"}>
                <YoutubeIcon />
              </SocialBtn>
              <SocialBtn href="https://www.instagram.com/swami_harichaitanyaji_/" label={"Instagram"}>
                <InstagramIcon />
              </SocialBtn>
              <SocialBtn href="https://x.com/Harichaitanyaji" label={"X (Twitter)"}>
                <TwitterIcon />
              </SocialBtn>
            </div>
          </div>

          {/* Divider 1 */}
          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-[#C98B1A]/20 to-transparent" />

          {/* ── Col 2 : Contact ── */}
          <div className="flex flex-col lg:px-8 xl:px-10">
            <h4 className="font-display-lg text-[16px] text-[#F5EFE4] font-bold mb-4 tracking-wide">{t('footer.contactTitle')}</h4>
            <ul className="space-y-3.5 text-[13px] text-[#C9B79D]">
              <li className="flex items-start gap-3">
                <LocationIcon />
                <span className="leading-[1.7]">
                  
                                                    {"माँ वैष्णवी टूरिज़्म, Palaskhed Sapkal,"}<br />
                  
                                                    {"Tehsil Chikhli, District Buldhana,"}<br />
                  
                                                    {"Maharashtra - 443001"}
                                                  </span>
              </li>
              <li className="flex items-start gap-3">
                <PhoneIcon />
                <div className="flex flex-col gap-1">
                  <a href="tel:+919158740007" className="hover:text-[#C98B1A] transition-colors">+91 9158740007</a>
                  <a href="tel:+919834151577" className="hover:text-[#C98B1A] transition-colors">+91 9834151577</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MailIcon />
                <div className="flex flex-col gap-1">
                  <a href="mailto:info@shrigurudevashram.org" className="hover:text-[#C98B1A] transition-colors text-[#C98B1A]">{"info@shrigurudevashram.org"}</a>
                  <a href="mailto:info@shantiashramtrust.org" className="hover:text-[#C98B1A] transition-colors text-[#C98B1A]">{"info@shantiashramtrust.org"}</a>
                </div>
              </li>
            </ul>
          </div>

          {/* Divider 2 */}
          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-[#C98B1A]/20 to-transparent" />

          {/* ── Col 3 : Quick Links ── */}
          <div className="flex flex-col lg:px-8 xl:px-10">
            <h4 className="font-display-lg text-[16px] text-[#F5EFE4] font-bold mb-4 tracking-wide">{t('footer.quickLinks')}</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <QuickLink to="/" label={t('footer.home')} />
              <QuickLink to="/faq" label={t('footer.faq')} />
              <QuickLink to="/about" label={t('footer.about')} />
              <QuickLink to="/contact" label={t('footer.contact')} />
              <QuickLink to="/yatras" label={t('footer.yatras')} />
              <QuickLink to="/login" label={t('footer.login')} />
              <QuickLink to="/gallery" label={t('footer.gallery')} />
              <QuickLink to="/signup" label={t('footer.registerFree')} />
            </div>
          </div>

          {/* Divider 3 */}
          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-[#C98B1A]/20 to-transparent" />

          {/* ── Col 4 : Temple Information ── */}
          <div className="flex flex-col lg:px-8 xl:px-10">
            <h4 className="font-display-lg text-[16px] text-[#F5EFE4] font-bold mb-4 tracking-wide">{t('footer.templeInfo')}</h4>
            <h5 className="text-[11px] tracking-[0.15em] uppercase text-[#C98B1A] font-bold mb-3">{t('footer.darshanTimings')}</h5>

            <div className="space-y-3 text-[13px]">
              {/* Morning */}
              <div className="flex items-start gap-2.5">
                <SunIcon />
                <div className="flex flex-col">
                  <span className="text-[#F5EFE4] font-medium">{t('footer.morningSession')}</span>
                  <span className="text-[#C9B79D] text-[12px]">{t('footer.morningTime')}</span>
                </div>
              </div>
              {/* Evening */}
              <div className="flex items-start gap-2.5">
                <MoonIcon />
                <div className="flex flex-col">
                  <span className="text-[#F5EFE4] font-medium">{t('footer.eveningSession')}</span>
                  <span className="text-[#C9B79D] text-[12px]">{t('footer.eveningTime')}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#C9B79D]/60 mt-4 leading-relaxed italic">
              {t('footer.timingNote')}
            </p>
          </div>

          {/* Divider 4 */}
          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-[#C98B1A]/20 to-transparent" />

          {/* ── Col 5 : Aartis & Discourses ── */}
          <div className="flex flex-col lg:pl-8 xl:pl-10">
            <h4 className="font-display-lg text-[11px] tracking-[0.15em] uppercase text-[#C98B1A] font-bold mb-4">{t('footer.aartisTitle')}</h4>

            <div className="space-y-3 text-[13px]">
              {[
                { name: t('footer.kakdaAarti'), time: '04:00 AM' },
                { name: t('footer.morningAarti'), time: '06:00 AM' },
                { name: t('footer.haripath'), time: '06:00 PM' },
                { name: t('footer.gitaPath'), time: '08:00 PM' },
              ].map((row) => (
                <div key={row.name} className="flex justify-between items-center gap-4">
                  <span className="text-[#C9B79D]">{row.name}</span>
                  <span className="text-[#F5EFE4] font-medium whitespace-nowrap">{row.time}</span>
                </div>
              ))}
            </div>
          </div>

        </motion.div>

        {!isDesktop && (
          <motion.button
            layout
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-6 w-full flex items-center justify-center gap-2 py-4 border-y border-[#C98B1A]/20 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-5 h-5" />
                <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('footer.showLess')}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                <span className="font-label-caps text-xs tracking-wider uppercase font-bold">{t('footer.viewMore')}</span>
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C98B1A]/25 to-transparent" />

      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 lg:px-16 xl:px-24 2xl:px-32 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[12px] text-[#C9B79D]/70 text-center md:text-left">
          {t('footer.copyright')}
        </p>

        <div className="hidden md:block">
          <OrnamentDivider />
        </div>

        <div className="flex items-center gap-3 text-[12px] text-[#C9B79D]/70">
          <a href="https://shrigurudevashram.org" target="_blank" rel="noreferrer"
            className="hover:text-[#C98B1A] transition-colors">
            {t('footer.officialWebsite')}
          </a>
          <span className="w-px h-3 bg-[#C9B79D]/30" />
          <span>{t('footer.designedFor').split('❤️')[0]} <span className="text-red-500">❤️</span> {t('footer.designedFor').split('❤️')[1]}</span>
        </div>
      </div>
    </footer>
  );
};
