import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

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
        isScrolled ? 'bg-surface shadow-md py-2' : 'bg-surface/80 py-3'
      }`}
    >
      <nav className="flex justify-between items-center px-margin-desktop min-h-[96px] max-w-container-max mx-auto">
        <Link
          to="/"
          className="flex items-center gap-3.5 font-headline-sm text-headline-sm text-primary tracking-tight cursor-pointer group"
        >
          <img
            src="/assets/Ashram vector logo_2022_white-01.png"
            alt="Shri Gurudev Ashram Logo"
            className="w-24 sm:w-28 md:w-[120px] h-auto object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform group-hover:scale-105 duration-300"
          />
          <span className="font-semibold tracking-wide text-primary text-base sm:text-lg">Shri Gurudev Ashram</span>
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
        <div className="hidden md:flex items-center gap-4">
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
        </div>
        <button className="md:hidden text-primary">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </nav>
    </header>
  );
};
