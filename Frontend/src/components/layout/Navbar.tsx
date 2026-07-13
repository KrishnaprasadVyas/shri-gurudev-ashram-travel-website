import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change (via link clicks)
  const closeMobile = () => setMobileOpen(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Yatras', path: '/yatras' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-md border-b border-outline-variant/30 ${
        isScrolled ? 'bg-surface shadow-md' : 'bg-surface/80'
      }`}
    >
      <nav className="flex justify-between items-center px-margin-desktop py-3 max-w-container-max mx-auto">
        <Link
          to="/"
          className="flex items-center gap-3 font-headline-sm text-headline-sm text-primary tracking-tight cursor-pointer group"
        >
          <img
            src="/assets/Ashram vector logo_2022_white-01.png"
            alt="Shri Gurudev Ashram Logo"
            className="w-14 h-14 md:w-[64px] md:h-[64px] object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover:scale-105 duration-300"
          />
          <span className="font-semibold tracking-wide text-primary">Shri Gurudev Ashram</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `font-body-md text-body-md transition-colors duration-300 cursor-pointer transition-transform active:scale-95 ${
                  isActive
                    ? 'text-primary font-bold border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-secondary'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="font-label-caps text-label-caps text-amber-500 hover:text-amber-400 border border-amber-500/40 px-4 py-1.5 rounded-full transition-colors"
                >
                  ADMIN DASHBOARD
                </Link>
              )}
              <Link
                to="/portal"
                className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-caps text-label-caps hover:bg-secondary transition-all duration-300 shadow-sm active:scale-95"
              >
                MY PORTAL
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors"
              >
                LOGIN
              </Link>
              <Link
                to="/signup"
                className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-caps text-label-caps hover:bg-secondary transition-all duration-300 shadow-sm active:scale-95"
              >
                REGISTER FREE
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger / close button */}
        <button
          className="md:hidden text-primary p-2"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="material-symbols-outlined text-[28px]">
            {mobileOpen ? 'close' : 'menu'}
          </span>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-outline-variant/30 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col px-6 py-4 gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `font-body-md text-body-md py-3 px-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'text-primary font-bold bg-primary/5'
                      : 'text-on-surface-variant hover:text-secondary hover:bg-surface-container-low'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            {/* Mobile auth buttons */}
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={closeMobile}
                      className="border border-amber-500/40 text-amber-500 px-6 py-3 rounded-full font-label-caps text-label-caps hover:bg-amber-500/10 transition-all duration-300 text-center"
                    >
                      ADMIN DASHBOARD
                    </Link>
                  )}
                  <Link
                    to="/portal"
                    onClick={closeMobile}
                    className="bg-primary text-on-primary px-6 py-3 rounded-full font-label-caps text-label-caps hover:bg-secondary transition-all duration-300 shadow-sm text-center"
                  >
                    MY PORTAL
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors py-3 px-2 text-center"
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobile}
                    className="bg-primary text-on-primary px-6 py-3 rounded-full font-label-caps text-label-caps hover:bg-secondary transition-all duration-300 shadow-sm text-center"
                  >
                    REGISTER FREE
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
