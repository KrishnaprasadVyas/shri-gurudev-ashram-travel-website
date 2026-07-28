import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  BookOpen,
  Map,
  LogOut,
  Bell,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { QUERY_KEYS } from '@/lib/queryKeys'
import apiClient from '@/lib/apiClient'
import ashramlogo from '@/assets/ashramlogo.png'
import type { AdminStats } from '@/types/admin'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck, end: false },
  { to: '/admin/bookings', label: 'Bookings', icon: BookOpen, end: false },
  { to: '/admin/packages', label: 'Packages', icon: Map, end: false },
]

interface AdminSidebarProps {
  isCollapsed?: boolean
}

export function AdminSidebar({ isCollapsed = false }: AdminSidebarProps) {
  const { userProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const { data: stats } = useQuery<AdminStats>({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/admin/stats')
      return data
    },
    refetchInterval: 60_000,
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto admin-sidebar-scroll select-none bg-[#FFFFFF] text-[#3E2B1F] border-r border-[#E9DCC5]">
      {/* Branding Section */}
      <div className={`px-6 py-8 border-b border-[#E9DCC5] flex flex-col items-center text-center bg-[#FFFFFF] shrink-0 transition-all duration-300 ${isCollapsed ? 'px-3 py-6' : ''}`}>
        <div
          onClick={() => navigate('/')}
          className={`rounded-2xl bg-[#F5EFE4] border border-[#E9DCC5] shadow-sm flex items-center justify-center p-3 mb-3.5 group cursor-pointer transition-transform duration-300 hover:scale-105 hover:bg-[#FFF7E8] ${
            isCollapsed ? 'w-12 h-12 p-2 mb-1' : 'w-22 h-22 sm:w-24 sm:h-24'
          }`}
          title="Return to Administration Dashboard"
        >
          <img
            src={ashramlogo}
            alt="Shri Gurudev Ashram Logo"
            className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(184,134,11,0.25)]"
          />
        </div>

        {!isCollapsed && (
          <div className="space-y-1 animate-in fade-in duration-200">
            <h2 className="font-display text-xl font-bold tracking-wide text-[#3E2B1F] leading-tight">
              माँ वैष्णवी टूरिज़्म
            </h2>
            <p className="font-label-caps text-[11px] font-bold tracking-[0.2em] text-[#B8860B] uppercase">
              Admin Portal
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
        {navItems.map((item) => {
          const isPending = item.label === 'Verifications' && (stats?.pendingVerifications ?? 0) > 0

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-body-md text-sm font-semibold transition-all duration-200 ease-out min-h-[46px] ${
                  isActive
                    ? 'bg-[#FFF7E8] text-[#B8860B] font-bold border border-[#E9DCC5] shadow-[0_2px_12px_rgba(184,134,11,0.06)]'
                    : 'text-[#6F5B47] hover:text-[#3E2B1F] hover:bg-[#F5EFE4]/60'
                } ${isCollapsed ? 'justify-center px-2 py-3.5' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-[#B8860B] shadow-[0_0_8px_rgba(184,134,11,0.4)]" />
                  )}

                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-all duration-200 ${
                      isActive
                        ? 'text-[#B8860B] scale-105'
                        : 'text-[#B8860B]/70 group-hover:text-[#B8860B] group-hover:translate-x-0.5'
                    }`}
                  />

                  {!isCollapsed && <span className="flex-1 tracking-wide">{item.label}</span>}

                  {isPending && (
                    <span
                      className={`flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#C68A00] text-white text-[11px] font-bold shadow-sm ${
                        isCollapsed ? 'absolute top-2 right-2 min-w-[18px] h-[18px] text-[9px] px-1' : ''
                      }`}
                    >
                      {stats!.pendingVerifications > 9 ? '9+' : stats!.pendingVerifications}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User Profile Section */}
      <div className={`p-5 border-t border-[#E9DCC5] bg-[#FFFFFF] shrink-0 ${isCollapsed ? 'p-3' : ''}`}>
        <div className={`p-4 rounded-3xl bg-[#F5EFE4]/60 border border-[#E9DCC5] shadow-sm transition-all duration-200 hover:border-[#B8860B]/40 space-y-3.5 ${isCollapsed ? 'p-2.5 space-y-2' : ''}`}>
          <div className={`flex items-center justify-between gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`rounded-2xl bg-gradient-to-br from-[#B8860B] to-[#D4AF37] flex items-center justify-center text-white font-display font-bold shadow-sm shrink-0 ring-2 ring-[#B8860B]/20 ${
                  isCollapsed ? 'w-9 h-9 text-base' : 'w-11 h-11 text-lg'
                }`}
                title={userProfile?.full_name ?? 'Admin Profile'}
              >
                {(userProfile?.full_name ?? 'A').charAt(0).toUpperCase()}
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#3E2B1F] truncate tracking-wide">
                    {userProfile?.full_name ?? 'Admin'}
                  </p>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-[#B8860B]/15 text-[#B8860B] font-label-caps text-[10px] font-bold tracking-[0.16em] uppercase border border-[#B8860B]/25">
                    Administrator
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div
                className="relative p-2 rounded-xl text-[#6F5B47] hover:text-[#3E2B1F] hover:bg-[#FFF7E8] transition-colors cursor-pointer shrink-0"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B8860B]" />
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            title={isCollapsed ? 'Sign Out of Portal' : undefined}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-[#B8860B] bg-[#FFFFFF] border border-[#B8860B] hover:bg-[#FFF7E8] hover:text-[#3E2B1F] transition-all duration-200 min-h-[42px] shadow-2xs ${
              isCollapsed ? 'px-2 py-2' : ''
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
