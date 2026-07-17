import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, BookOpen, User, ShieldCheck } from 'lucide-react'
import { PortalSidebar } from './PortalSidebar'

const mobileNavItems = [
  { to: '/portal', label: 'Home', icon: Home, end: true },
  { to: '/portal/bookings', label: 'Bookings', icon: BookOpen, end: false },
  { to: '/portal/profile', label: 'Profile', icon: User, end: false },
  { to: '/portal/verify', label: 'Verify', icon: ShieldCheck, end: false },
]

export function PortalLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3E2B1F] flex font-body-md selection:bg-[#B8860B]/20 selection:text-[#3E2B1F]">
      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[272px] flex-shrink-0 border-r border-[#E9DCC5] bg-[#FFFFFF] fixed inset-y-0 left-0 z-30 shadow-[0_4px_30px_rgba(62,43,31,0.04)]">
        <PortalSidebar />
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 lg:ml-[272px] min-h-screen pb-24 lg:pb-16">
        <div
          key={location.pathname}
          className="max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-10 xl:px-12 py-8 lg:py-10 animate-in fade-in duration-300"
        >
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-lg border-t border-[#E9DCC5] shadow-[0_-8px_30px_rgba(62,43,31,0.06)]"
        aria-label="Mobile navigation"
      >
        <div className="flex">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3.5 text-[10px] font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'text-[#B8860B] font-bold'
                    : 'text-[#6F5B47]/70 active:text-[#3E2B1F]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 inset-x-4 h-[2px] rounded-full bg-[#B8860B]" />
                  )}
                  <item.icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`} />
                  <span className="tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
