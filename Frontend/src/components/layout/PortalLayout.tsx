import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { PortalSidebar } from './PortalSidebar'
import { useTranslation } from "react-i18next";

export function PortalLayout() {
    const { t } = useTranslation();
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Scroll lock when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3E2B1F] flex flex-col lg:flex-row font-body-md selection:bg-[#B8860B]/20 selection:text-[#3E2B1F]">
      {/* ── Mobile Top Nav (Hamburger) ───────────────────── */}
      <div className="lg:hidden flex justify-between items-center bg-[#FFFFFF] px-4 py-3 border-b border-[#E9DCC5] sticky top-0 z-30 shadow-sm shrink-0">
        <div className="font-display font-bold text-[#3E2B1F] text-lg truncate">{t('navbar.maaVaishnaviTourism')}</div>
        <button
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#B8860B] hover:bg-[#F5EFE4] rounded-full transition-colors"
          onClick={() => setMobileMenuOpen(true)}
          aria-label={t('public.common.openPortalMenu')}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[272px] flex-shrink-0 border-r border-[#E9DCC5] bg-[#FFFFFF] fixed inset-y-0 left-0 z-30 shadow-[0_4px_30px_rgba(62,43,31,0.04)]">
        <PortalSidebar />
      </aside>

      {/* ── Mobile Right Drawer ──────────────────────────── */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] bg-[#FFFFFF] z-[110] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b border-[#E9DCC5] shrink-0">
          <span className="font-display font-bold text-[#3E2B1F] text-lg">{t('public.common.menu')}</span>
          <button 
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#B8860B] hover:bg-[#F5EFE4] rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label={t('public.common.closeMenu')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PortalSidebar />
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 lg:ml-[272px] min-h-screen">
        <div
          key={location.pathname}
          className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-10 xl:px-12 py-6 lg:py-10 animate-in fade-in duration-300"
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
