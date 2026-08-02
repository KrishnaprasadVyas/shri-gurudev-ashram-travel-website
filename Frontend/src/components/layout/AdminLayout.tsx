import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Sparkles } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Scroll lock for drawer
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Close drawer on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const routeHeaders: Record<string, { title: string; subtitle: string }> = {
    '/admin': {
      title: t('admin.layout.dashboardTitle'),
      subtitle: t('admin.layout.dashboardSubtitle'),
    },
    '/admin/users': {
      title: t('admin.layout.usersTitle'),
      subtitle: t('admin.layout.usersSubtitle'),
    },
    '/admin/verifications': {
      title: t('admin.layout.verificationsTitle'),
      subtitle: t('admin.layout.verificationsSubtitle'),
    },
    '/admin/bookings': {
      title: t('admin.layout.bookingsTitle'),
      subtitle: t('admin.layout.bookingsSubtitle'),
    },
    '/admin/packages/new': {
      title: t('admin.layout.newPackageTitle'),
      subtitle: t('admin.layout.newPackageSubtitle'),
    },
    '/admin/packages': {
      title: t('admin.layout.packagesTitle'),
      subtitle: t('admin.layout.packagesSubtitle'),
    },
    '/admin/seva-packages': {
      title: t('admin.layout.sevaTitle'),
      subtitle: t('admin.layout.sevaSubtitle'),
    },
    '/admin/reports': {
      title: t('admin.layout.reportsTitle'),
      subtitle: t('admin.layout.reportsSubtitle'),
    },
  }

  // Determine dynamic title and subtitle depending on current path
  let headerInfo = {
    title: t('admin.layout.defaultTitle'),
    subtitle: t('admin.layout.defaultSubtitle'),
  }

  // Exact match first
  if (routeHeaders[location.pathname]) {
    headerInfo = routeHeaders[location.pathname]
  } else if (location.pathname.startsWith('/admin/bookings/')) {
    headerInfo = {
      title: t('admin.layout.bookingDetailsTitle'),
      subtitle: t('admin.layout.bookingDetailsSubtitle'),
    }
  } else if (location.pathname.startsWith('/admin/users/')) {
    headerInfo = {
      title: t('admin.layout.devoteeDossierTitle'),
      subtitle: t('admin.layout.devoteeDossierSubtitle'),
    }
  } else if (location.pathname.startsWith('/admin/packages/') && location.pathname.includes('/edit')) {
    headerInfo = {
      title: t('admin.layout.modifyPackageTitle'),
      subtitle: t('admin.layout.modifyPackageSubtitle'),
    }
  } else {
    const matchedKey = Object.keys(routeHeaders)
      .reverse()
      .find((key) => key !== '/admin' && location.pathname.startsWith(key))
    if (matchedKey && routeHeaders[matchedKey]) {
      headerInfo = routeHeaders[matchedKey]
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3E2B1F] font-body-md flex admin-layout selection:bg-[#B8860B]/20 selection:text-[#3E2B1F]">
      {/* Desktop Full Sidebar (w-280px on xl+) */}
      <aside className="hidden xl:flex flex-col w-[280px] flex-shrink-0 border-r border-[#E9DCC5] bg-[#FFFFFF] fixed inset-y-0 left-0 z-30 shadow-[0_4px_30px_rgba(62,43,31,0.04)] transition-all duration-300">
        <AdminSidebar isCollapsed={false} />
      </aside>

      {/* Tablet Collapsible Sidebar (w-84px on md to xl) */}
      <aside className="hidden md:flex xl:hidden flex-col w-[84px] flex-shrink-0 border-r border-[#E9DCC5] bg-[#FFFFFF] fixed inset-y-0 left-0 z-30 shadow-[0_4px_30px_rgba(62,43,31,0.04)] transition-all duration-300">
        <AdminSidebar isCollapsed={true} />
      </aside>

      {/* Mobile Slide-out Drawer Overlay & Drawer (< md screens) */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className={`md:hidden fixed right-0 top-0 bottom-0 w-[280px] z-50 border-l border-[#E9DCC5] bg-[#FFFFFF] shadow-[-20px_0_60px_rgba(62,43,31,0.2)] transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <AdminSidebar isCollapsed={false} />
          </aside>
        </>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 md:ml-[84px] xl:ml-[280px] min-h-screen flex flex-col transition-all duration-300">
        {/* Reusable Sticky Top Header */}
        <header className="sticky top-0 z-20 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E9DCC5] px-5 sm:px-8 py-5 flex items-center justify-between gap-4 shadow-[0_2px_12px_rgba(62,43,31,0.03)] transition-all duration-200 min-h-[76px]">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2.5 rounded-xl bg-[#F5EFE4] border border-[#E9DCC5] text-[#6F5B47] hover:text-[#3E2B1F] hover:border-[#B8860B] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-2xs"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle Navigation Drawer"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] tracking-tight leading-tight">
                {headerInfo.title}
              </h1>
              <p className="font-body-md text-xs sm:text-sm text-[#6F5B47] font-normal leading-relaxed hidden sm:block">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 font-label-caps text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-[#B8860B] bg-[#F5EFE4] border border-[#E9DCC5] px-3.5 py-1.5 rounded-full shadow-2xs">
              <Sparkles className="h-3 w-3 text-[#B8860B]" />
              <span>{t('admin.layout.sacredAdministration')}</span>
            </span>
          </div>
        </header>

        {/* Page Transitions: Smooth fade-in wrapper on route change */}
        <main
          key={location.pathname}
          className="flex-1 p-5 sm:p-8 space-y-8 max-w-[1600px] w-full mx-auto animate-in fade-in duration-300"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
