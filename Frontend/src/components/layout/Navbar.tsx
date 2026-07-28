import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ashramlogo from '../../assets/Logo.png';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const closeMobile = () => setMobileOpen(false);

  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English 🇬🇧');
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
    { code: 'en', label: 'English 🇬🇧' },
    { code: 'hi', label: 'हिन्दी 🇮🇳' },
    { code: 'mr', label: 'मराठी 🇮🇳' },
  ];

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Yatras', path: '/yatras' },
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
    <header 
      ref={headerRef}
      className={`fixed top-0 z-[100] w-full bg-[#F8F3EA] border-b border-[#D6B36A] shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <nav className="flex justify-between items-center px-6 md:px-10 lg:px-16 py-4 md:py-5 max-w-[1600px] mx-auto w-full gap-4">
        
        {/* Left Side: Navigation Links (Desktop) */}
        <div className="hidden lg:flex flex-1 items-center gap-8 xl:gap-10">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `group relative font-display text-[17px] lg:text-[18px] font-semibold transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-[#B8860B]'
                    : 'text-[#4B3621] hover:text-[#B8860B]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.name}
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
              className="h-[80px] md:h-[120px] w-auto object-contain drop-shadow-sm transition-transform group-hover:scale-105 duration-500"
            />
            <div className="text-[#4B3621] font-bold text-[15px] md:text-[18px] leading-[1.2] text-center mt-1.5 tracking-normal">
              माँ वैष्णवी टूरिज़्म
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
                  ADMIN DASHBOARD
                </Link>
              )}
              <Link
                to="/portal"
                className="bg-[#3E2B1F] text-[#FAF7F2] px-6 py-2.5 rounded-full font-label-caps text-xs xl:text-sm hover:bg-[#B8860B] transition-all duration-300 shadow-sm active:scale-95 whitespace-nowrap"
              >
                MY PORTAL
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-display text-[17px] lg:text-[18px] text-[#4B3621] hover:text-[#B8860B] transition-colors whitespace-nowrap px-4 font-semibold"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-[#D6B36A] hover:bg-[#B8860B] text-white h-[46px] px-8 rounded-full flex items-center justify-center font-display text-[17px] font-semibold transition-colors duration-300 whitespace-nowrap"
              >
                REGISTER
              </Link>
            </>
          )}
          {/* Desktop Language Selector */}
          <div className="relative ml-2" ref={langDropdownRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 text-[#4B3621] hover:text-[#B8860B] transition-colors font-display text-[17px] font-semibold"
            >
              <Globe className="w-5 h-5" />
              <span>{selectedLang.split(' ')[0]}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {langOpen && (
              <div className="absolute top-full right-0 mt-3 w-40 bg-[#F8F3EA] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#D6B36A]/30 overflow-hidden py-2 animate-fade-in-up">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang.label);
                      setLangOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[#4B3621] hover:bg-[#D6B36A]/10 hover:text-[#B8860B] transition-colors font-display text-[16px] font-medium"
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex flex-1 justify-end lg:hidden">
          <button
            className="text-[#3E2B1F] p-2 shrink-0 hover:bg-[#3E2B1F]/5 rounded-full transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="material-symbols-outlined text-[28px]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#F8F3EA] border-t border-[#D6B36A] shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col px-6 py-4 gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `font-body-md text-body-md py-3 px-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'text-[#B8860B] font-bold bg-[#B8860B]/5'
                      : 'text-[#4B3621] hover:text-[#B8860B] hover:bg-[#4B3621]/5'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {/* Mobile Auth Buttons */}
            <div className="mt-4 pt-4 border-t border-[#E9DCC5] flex flex-col gap-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={closeMobile}
                      className="border border-amber-600/40 text-amber-600 px-6 py-3 rounded-full font-label-caps text-sm hover:bg-amber-600/10 transition-all duration-300 text-center"
                    >
                      ADMIN DASHBOARD
                    </Link>
                  )}
                  <Link
                    to="/portal"
                    onClick={closeMobile}
                    className="bg-[#3E2B1F] text-[#FAF7F2] px-6 py-3 rounded-full font-label-caps text-sm hover:bg-[#B8860B] transition-all duration-300 shadow-sm text-center"
                  >
                    MY PORTAL
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="font-label-caps text-sm text-[#4B3621] hover:text-[#B8860B] transition-colors py-3 px-2 text-center"
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobile}
                    className="bg-[#D6B36A] text-white px-6 py-3 rounded-full font-display text-[17px] font-semibold hover:bg-[#B8860B] transition-all duration-300 text-center"
                  >
                    REGISTER FREE
                  </Link>

                  {/* Mobile Language Selector */}
                  <div className="mt-2 border-t border-[#D6B36A]/30 pt-4 pb-2">
                    <div className="flex items-center gap-2 mb-3 px-2 text-[#4B3621] font-display text-[17px] font-semibold">
                      <Globe className="w-5 h-5" />
                      <span>Language</span>
                    </div>
                    <div className="flex flex-col gap-1 pl-7">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLang(lang.label);
                            closeMobile();
                          }}
                          className={`text-left py-2 font-display text-[16px] transition-colors ${
                            selectedLang === lang.label 
                              ? 'text-[#B8860B] font-semibold' 
                              : 'text-[#4B3621] hover:text-[#B8860B]'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
