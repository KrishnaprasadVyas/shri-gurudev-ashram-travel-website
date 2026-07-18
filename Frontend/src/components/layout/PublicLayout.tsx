import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed">
      <Navbar />
      <main 
        className="flex-1"
        style={!isHome ? { paddingTop: 'var(--app-nav-height, 150px)' } : undefined}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
