import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X, Sparkles } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'

const routeHeaders: Record<string, { title: string; subtitle: string }> = {
  '/admin': {
    title: 'Dashboard',
    subtitle: 'Manage pilgrims, yatras, bookings and the Ashram ecosystem.',
  },
  '/admin/users': {
    title: 'Users Management',
    subtitle: 'View and manage registered devotees across all spiritual programs.',
  },
  '/admin/verifications': {
    title: 'Verification Queue',
    subtitle: 'Review identity documents submitted by seekers before confirming pilgrimage registrations.',
  },
  '/admin/bookings': {
    title: 'Bookings & Reservations',
    subtitle: 'Track and manage all sacred pilgrimage reservations and financial ledgers.',
  },
  '/admin/packages/new': {
    title: 'Configure New Yatra',
    subtitle: 'Define package itinerary, pricing, duration and sacred destination highlights.',
  },
  '/admin/packages': {
    title: 'Pilgrimage Packages',
    subtitle: 'Create, edit and manage sacred yatra travel catalogs for devotees.',
  },
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Determine dynamic title and subtitle depending on current path
  let headerInfo = {
    title: 'Administration Portal',
    subtitle: 'Manage माँ वैष्णवी टूरिज़्म sacred operations and devotee services.',
  }

  // Exact match first
  if (routeHeaders[location.pathname]) {
    headerInfo = routeHeaders[location.pathname]
  } else if (location.pathname.startsWith('/admin/bookings/')) {
    headerInfo = {
      title: 'Booking Details & Ledger',
      subtitle: 'Review reservation specifics, traveler credentials and payment receipts.',
    }
  } else if (location.pathname.startsWith('/admin/users/')) {
    headerInfo = {
      title: 'Devotee Dossier',
      subtitle: 'Review seeker profile, verification timeline and historical pilgrimage attendance.',
    }
  } else if (location.pathname.startsWith('/admin/packages/') && location.pathname.includes('/edit')) {
    headerInfo = {
      title: 'Modify Yatra Package',
      subtitle: 'Update schedule details, seat quotas and visual presentation.',
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
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] z-50 border-r border-[#E9DCC5] bg-[#FFFFFF] shadow-[0_20px_60px_rgba(62,43,31,0.2)] animate-in slide-in-from-left duration-300">
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
              <span>Sacred Administration</span>
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
