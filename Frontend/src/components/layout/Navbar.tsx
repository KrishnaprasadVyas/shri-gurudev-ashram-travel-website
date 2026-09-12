import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ashramlogo from '../../assets/Logo.png';
import { useTranslation } from 'react-i18next';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const closeMobile = () => setMobileOpen(false);

  const [langOpen, setLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // If scrolling up or at the very top, show navbar
      if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        setIsVisible(true);
      }
      // If scrolling down and past the threshold, hide navbar
      else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
  ];
  const currentLangCode = (i18n.language || 'en').split('-')[0].toLowerCase();
  const currentLang = languages.find(l => l.code === currentLangCode) || languages[0];


  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Yatras', path: '/yatras' },
    { name: 'Seva', path: '/seva' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateNavHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty('--app-nav-height', `${headerRef.current.offsetHeight}px`);
      }
    };
    // Allow slight delay for fonts/images to render
    setTimeout(updateNavHeight, 100);
    window.addEventListener('resize', updateNavHeight);
    return () => window.removeEventListener('resize', updateNavHeight);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 z-[100] w-full bg-[#F8F3EA] border-b border-[#D6B36A] shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-transform duration-300 ${isVisible || mobileOpen ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <nav className="flex justify-between items-center px-6 md:px-10 lg:px-16 py-1 md:py-1 max-w-[1600px] mx-auto w-full gap-4">

          {/* Left Side: Navigation Links (Desktop) */}
          <div className="hidden lg:flex flex-1 items-center gap-8 xl:gap-10">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `group relative font-display text-[17px] lg:text-[18px] font-semibold transition-colors duration-300 cursor-pointer whitespace-nowrap ${isActive
                    ? 'text-[#B8860B]'
                    : 'text-[#4B3621] hover:text-[#B8860B]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {t(`navbar.${link.name.toLowerCase()}`)}
                    <span className={`absolute -bottom-1.5 left-0 h-[2px] bg-[#D6B36A] transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Center: Large Ashram Logo */}
          <div className="flex justify-center lg:flex-none">
            <Link to="/" className="flex flex-col items-center group cursor-pointer shrink-0">
              <img
                src={ashramlogo}
                alt="Shri Gurudev Ashram Logo"
                style={{ filter: 'brightness(1.1) contrast(1.15)' }}
                className="h-[66px] md:h-[92px] w-auto object-contain drop-shadow-sm transition-transform group-hover:scale-105 duration-500"
              />
              <div className="text-[#4B3621] font-bold text-[13px] md:text-[15px] leading-tight text-center mt-1 tracking-normal">
                {t('navbar.maaVaishnaviTourism')}
              </div>
            </Link>
          </div>

          {/* Right Side: Actions (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-end items-center gap-4 shrink-0">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="font-label-caps text-xs xl:text-sm text-amber-600 hover:text-amber-500 border border-amber-600/40 px-5 py-2 rounded-full transition-colors whitespace-nowrap"
                  >
                    {t('navbar.adminDashboard')}
                  </Link>
                )}
                <Link
                  to="/portal"
                  className="bg-[#3E2B1F] text-[#FAF7F2] px-6 py-2.5 rounded-full font-label-caps text-xs xl:text-sm hover:bg-[#B8860B] transition-all duration-300 shadow-sm active:scale-95 whitespace-nowrap"
                >
                  {t('navbar.myPortal')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-display text-[17px] lg:text-[18px] text-[#4B3621] hover:text-[#B8860B] transition-colors whitespace-nowrap px-4 font-semibold"
                >
                  {t('navbar.login')}
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#D6B36A] hover:bg-[#B8860B] text-white h-[46px] px-8 rounded-full flex items-center justify-center font-display text-[17px] font-semibold transition-colors duration-300 whitespace-nowrap"
                >
                  {t('navbar.register')}
                </Link>
              </>
            )}
            {/* Desktop Language Selector */}
            <div className="relative ml-2" ref={langDropdownRef}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={langOpen}
                aria-label="Select Language"
                onClick={() => setLangOpen(!langOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setLangOpen(false);
                }}
                className="flex items-center gap-1.5 text-[#4B3621] hover:text-[#B8860B] px-3 py-1.5 rounded-full hover:bg-[#B8860B]/10 transition-colors font-display text-[16px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B]"
              >
                <Globe className="w-4 h-4 text-[#B8860B] shrink-0" aria-hidden="true" />
                <span>{currentLang.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#6F5B47] transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {langOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute top-full right-0 mt-2 w-36 bg-[#FFFDF8] rounded-2xl shadow-[0_10px_35px_rgba(75,54,33,0.14)] border border-[#E8DDC7] overflow-hidden py-1.5 z-50 animate-fade-in-up"
                >
                  {languages.map((lang) => {
                    const isActive = currentLangCode === lang.code;
                    return (
                      <button
                        key={lang.code}
                        role="menuitem"
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 font-display text-[15px] transition-colors flex items-center justify-between ${
                          isActive
                            ? 'bg-[#B8860B]/10 text-[#B8860B] font-bold'
                            : 'text-[#4B3621] hover:bg-[#FAF4EB] hover:text-[#B8860B] font-medium'
                        }`}
                      >
                        <span>{lang.label}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>


          {/* Mobile Hamburger Button */}
          <div className="flex flex-1 justify-end lg:hidden">
            <button
              className="text-[#3E2B1F] p-2 shrink-0 hover:bg-[#3E2B1F]/5 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <X className="w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300" />
              ) : (
                <Menu className="w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Right-Slide Drawer via Framer Motion */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[105] lg:hidden"
              onClick={closeMobile}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-[#F8F3EA] shadow-2xl z-[110] lg:hidden flex flex-col"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#D6B36A]/30 shrink-0">
                <span className="font-display font-bold text-[#4B3621] text-lg"></span>
                <button
                  className="text-[#3E2B1F] p-2 shrink-0 hover:bg-[#3E2B1F]/5 rounded-full transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                  onClick={closeMobile}
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>

              <div className="flex flex-col px-4 sm:px-6 py-6 gap-3 overflow-y-auto flex-1">
                <motion.div
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={{
                    open: {
                      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
                    },
                    closed: {
                      transition: { staggerChildren: 0.05, staggerDirection: -1 }
                    }
                  }}
                  className="flex flex-col gap-2"
                >
                  {navLinks.map((link) => (
                    <motion.div
                      key={link.name}
                      variants={{
                        open: { opacity: 1, x: 0 },
                        closed: { opacity: 0, x: 20 }
                      }}
                    >
                      <NavLink
                        to={link.path}
                        onClick={closeMobile}
                        className={({ isActive }) =>
                          `font-body-md text-body-md py-3.5 px-4 rounded-xl transition-all duration-200 min-h-[48px] flex items-center w-full ${isActive
                            ? 'text-[#B8860B] font-bold bg-[#B8860B]/10 shadow-sm'
                            : 'text-[#4B3621] hover:text-[#B8860B] hover:bg-[#4B3621]/5'
                          }`
                        }
                      >
                        {t(`navbar.${link.name.toLowerCase()}`)}
                      </NavLink>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Mobile Auth Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 pt-6 border-t border-[#E9DCC5] flex flex-col gap-4"
                >
                  {user ? (
                    <>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={closeMobile}
                          className="border-2 border-amber-600/40 text-amber-600 px-6 py-3.5 rounded-full font-label-caps text-sm hover:bg-amber-600/10 transition-all duration-300 text-center min-h-[48px] flex items-center justify-center font-bold"
                        >
                          {t('navbar.adminDashboard')}
                        </Link>
                      )}
                      <Link
                        to="/portal"
                        onClick={closeMobile}
                        className="bg-[#3E2B1F] text-[#FAF7F2] px-6 py-3.5 rounded-full font-label-caps text-sm hover:bg-[#B8860B] transition-all duration-300 shadow-md text-center min-h-[48px] flex items-center justify-center font-bold"
                      >
                        {t('navbar.myPortal')}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={closeMobile}
                        className="font-label-caps text-sm text-[#4B3621] hover:text-[#B8860B] hover:bg-[#4B3621]/5 rounded-xl transition-colors py-3.5 px-4 text-center min-h-[48px] flex items-center justify-center font-bold"
                      >
                        {t('navbar.loginMobile')}
                      </Link>
                      <Link
                        to="/login"
                        onClick={closeMobile}
                        className="bg-[#D6B36A] text-white px-6 py-3.5 rounded-full font-display text-[17px] font-semibold hover:bg-[#B8860B] transition-all duration-300 shadow-md text-center min-h-[48px] flex items-center justify-center"
                      >
                        {t('navbar.registerFree')}
                      </Link>
                    </>
                  )}

                  {/* Mobile Language Selector (always accessible) */}
                  <div className="mt-4 border-t border-[#E9DCC5] pt-5 pb-2">
                    <div className="flex items-center gap-2 mb-3 px-1 text-[#4B3621] font-display text-[16px] font-semibold">
                      <Globe className="w-4 h-4 text-[#B8860B]" />
                      <span>{t('navbar.language', { defaultValue: 'Language' })}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {languages.map((lang) => {
                        const isActive = currentLangCode === lang.code;
                        return (
                          <button
                            key={lang.code}
                            onClick={() => {
                              i18n.changeLanguage(lang.code);
                              closeMobile();
                            }}
                            className={`py-2.5 px-2 rounded-xl font-display text-[15px] transition-all text-center min-h-[44px] flex items-center justify-center border ${
                              isActive
                                ? 'bg-[#B8860B] text-white font-bold border-[#B8860B] shadow-sm'
                                : 'bg-[#FFFDF8] text-[#4B3621] hover:text-[#B8860B] border-[#E8DDC7] font-medium'
                            }`}
                          >
                            {lang.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
