import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from "react-i18next";

export const AuthLayout: React.FC = () => {
    const { t } = useTranslation();
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-[#FAF8F5]">
      {/* Floating Back Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 sm:top-8 sm:left-10 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium drop-shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('public.common.backToHome')}
      </Link>

      <Outlet />
    </div>
  );
};
