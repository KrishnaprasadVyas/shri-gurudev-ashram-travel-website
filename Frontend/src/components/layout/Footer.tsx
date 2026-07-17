import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ashramlogo from '../../assets/ashramlogo.png';

/* ─── Inline SVG Icons ─── */
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

const AshramLogo = () => (
  <img
    src={ashramlogo}
    alt="Shri Gurudev Ashram Logo"
    className="w-40 sm:w-44 md:w-52 lg:w-60 xl:w-[280px] h-auto object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105"
    style={{ filter: 'brightness(1.15) contrast(1.15)' }}
  />
);

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
    className="w-9 h-9 rounded-full bg-[#F5EFE4]/90 flex items-center justify-center text-[#1a0d06]
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
    className="flex items-center gap-1.5 text-[#C9B79D] hover:text-[#C98B1A] transition-all duration-200 group"
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
      <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 lg:px-14 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.6fr_1px_1.1fr_1px_0.8fr_1px_1.1fr_1px_1fr] gap-y-6 md:gap-y-8 items-start"
        >
          {/* ── Col 1 : Ashram Info ── */}
          <div className="flex flex-col items-center text-center lg:pr-6">
            <div className="flex flex-col items-center text-center mb-4">
              <AshramLogo />

              <h3 className="mt-2.5 font-display-lg text-2xl lg:text-[26px] text-[#F5EFE4] font-bold leading-tight">
                Shri Gurudev Ashram
              </h3>
            </div>

            <p className="text-[13px] leading-[1.65] text-[#C9B79D] max-w-[350px] text-center mx-auto">
              Dedicated to Param Pujya Shri Swami
              Harichaitanyanand Saraswatiji Maharaj.
              Seeking the Divine within through
              tradition, service, and silence.
            </p>
            {/* Social */}
            <div className="flex justify-center gap-3 mt-4">
              <SocialBtn href="https://www.facebook.com/SwamiHarichaitanyanandS/" label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
              </SocialBtn>
              <SocialBtn href="https://www.youtube.com/@shrigurudevashram" label="YouTube">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" /></svg>
              </SocialBtn>
              <SocialBtn href="https://www.instagram.com/swami_harichaitanyaji_/" label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" /></svg>
              </SocialBtn>
              <SocialBtn href="https://x.com/Harichaitanyaji" label="X (Twitter)">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </SocialBtn>
            </div>
          </div>

          {/* Divider 1 */}
          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-[#C98B1A]/15 to-transparent" />

          {/* ── Col 2 : Contact ── */}
          <div className="flex flex-col lg:px-6">
            <h4 className="font-display-lg text-[16px] text-[#F5EFE4] font-bold mb-4 tracking-wide">Contact Information</h4>
            <ul className="space-y-3.5 text-[13px] text-[#C9B79D]">
              <li className="flex items-start gap-3">
                <LocationIcon />
                <span className="leading-[1.7]">
                  Shri Gurudev Ashram, Palaskhed Sapkal,<br />
                  Tehsil Chikhli, District Buldhana,<br />
                  Maharashtra - 443001
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
                  <a href="mailto:info@shrigurudevashram.org" className="hover:text-[#C98B1A] transition-colors text-[#C98B1A]">info@shrigurudevashram.org</a>
                  <a href="mailto:info@shantiashramtrust.org" className="hover:text-[#C98B1A] transition-colors text-[#C98B1A]">info@shantiashramtrust.org</a>
                </div>
              </li>
            </ul>
          </div>

          {/* Divider 2 */}
          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-[#C98B1A]/15 to-transparent" />

          {/* ── Col 3 : Quick Links ── */}
          <div className="flex flex-col lg:px-6">
            <h4 className="font-display-lg text-[16px] text-[#F5EFE4] font-bold mb-4 tracking-wide">Quick Links</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <QuickLink to="/" label="Home" />
              <QuickLink to="/faq" label="FAQ" />
              <QuickLink to="/about" label="About" />
              <QuickLink to="/contact" label="Contact" />
              <QuickLink to="/yatras" label="Yatras" />
              <QuickLink to="/login" label="Login" />
              <QuickLink to="/gallery" label="Gallery" />
              <QuickLink to="/signup" label="Register Free" />
            </div>
          </div>

          {/* Divider 3 */}
          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-[#C98B1A]/15 to-transparent" />

          {/* ── Col 4 : Temple Information ── */}
          <div className="flex flex-col lg:px-6">
            <h4 className="font-display-lg text-[16px] text-[#F5EFE4] font-bold mb-4 tracking-wide">Temple Information</h4>
            <h5 className="text-[11px] tracking-[0.15em] uppercase text-[#C98B1A] font-bold mb-3">Darshan Timings</h5>

            <div className="space-y-3 text-[13px]">
              {/* Morning */}
              <div className="flex items-start gap-2.5">
                <SunIcon />
                <div className="flex flex-col">
                  <span className="text-[#F5EFE4] font-medium">Morning Session</span>
                  <span className="text-[#C9B79D] text-[12px]">04:30 AM to 01:00 PM</span>
                </div>
              </div>
              {/* Evening */}
              <div className="flex items-start gap-2.5">
                <MoonIcon />
                <div className="flex flex-col">
                  <span className="text-[#F5EFE4] font-medium">Evening Session</span>
                  <span className="text-[#C9B79D] text-[12px]">04:30 PM to 09:00 PM</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#C9B79D]/60 mt-4 leading-relaxed italic">
              * Temple timings may be<br />changed on special occasions.
            </p>
          </div>

          {/* Divider 4 */}
          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-[#C98B1A]/15 to-transparent" />

          {/* ── Col 5 : Aartis & Discourses ── */}
          <div className="flex flex-col lg:pl-6">
            <h4 className="font-display-lg text-[11px] tracking-[0.15em] uppercase text-[#C98B1A] font-bold mb-4">Aartis and Discourses</h4>

            <div className="space-y-3 text-[13px]">
              {[
                { name: 'Kakda Aarti', time: '04:00 AM' },
                { name: 'Daily Morning Aarti', time: '06:00 AM' },
                { name: 'Haripath', time: '06:00 PM' },
                { name: 'Gita Path', time: '08:00 PM' },
              ].map((row) => (
                <div key={row.name} className="flex justify-between items-center">
                  <span className="text-[#C9B79D]">{row.name}</span>
                  <span className="text-[#F5EFE4] font-medium whitespace-nowrap ml-4">{row.time}</span>
                </div>
              ))}
            </div>
          </div>

        </motion.div>
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C98B1A]/25 to-transparent" />

      <div className="max-w-[1280px] mx-auto px-6 md:px-10 lg:px-14 py-3.5 flex flex-col md:flex-row justify-between items-center gap-2.5">
        <p className="text-[12px] text-[#C9B79D]/70 text-center md:text-left">
          © 2026 Shri Gurudev Ashram, Palaskhed Sapkal. All rights reserved.
        </p>

        <div className="hidden md:block">
          <OrnamentDivider />
        </div>

        <div className="flex items-center gap-3 text-[12px] text-[#C9B79D]/70">
          <a href="https://shrigurudevashram.org" target="_blank" rel="noreferrer"
            className="hover:text-[#C98B1A] transition-colors">
            Official Website
          </a>
          <span className="w-px h-3 bg-[#C9B79D]/30" />
          <span>Designed with <span className="text-red-500">❤️</span> for Devotees</span>
        </div>
      </div>
    </footer>
  );
};
