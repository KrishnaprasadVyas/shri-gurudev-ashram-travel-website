import { NavLink, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Map, User, ShieldCheck, LogOut, AlertTriangle, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import ashramlogo from '@/assets/ashramlogo.png'

const navItems = [
  { to: '/portal', label: 'Home', icon: Home, end: true },
  { to: '/portal/bookings', label: 'My Bookings', icon: BookOpen, end: false },
  { to: '/yatras', label: 'Browse Yatras', icon: Map, end: false },
  { to: '/portal/profile', label: 'My Profile', icon: User, end: false },
]

const statusConfig = {
  not_submitted: { label: 'Not Verified', className: 'bg-[#6F5B47]/15 text-[#6F5B47] border-[#6F5B47]/30' },
  submitted: { label: 'Under Review', className: 'bg-[#C68A00]/15 text-[#C68A00] border-[#C68A00]/30' },
  verified: { label: 'Verified', className: 'bg-[#2E7D32]/15 text-[#2E7D32] border-[#2E7D32]/30' },
  rejected: { label: 'Rejected', className: 'bg-[#C0392B]/15 text-[#C0392B] border-[#C0392B]/30' },
}

export function PortalSidebar() {
  const { userProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const verStatus = userProfile?.verification_status ?? 'not_submitted'
  const status = statusConfig[verStatus] ?? statusConfig.not_submitted

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto select-none bg-[#FFFFFF] text-[#3E2B1F]">
      {/* ── Branding ─────────────────────────────────────── */}
      <div className="px-7 py-8 border-b border-[#E9DCC5] flex items-center gap-4 shrink-0 bg-[#FFFFFF]">
        <div
          onClick={() => navigate('/')}
          className="w-11 h-11 rounded-2xl bg-[#F5EFE4] border border-[#E9DCC5] flex items-center justify-center p-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-[#FFF7E8] shrink-0 shadow-sm"
          title="Return to Portal Dashboard"
          role="button"
          aria-label="Go to portal home"
        >
          <img
            src={ashramlogo}
            alt="Shri Gurudev Ashram Logo"
            className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(184,134,11,0.25)]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold text-[#3E2B1F] truncate tracking-wide leading-tight">
            Shri Gurudev Ashram
          </p>
          <p className="font-label-caps text-[10px] font-bold tracking-[0.18em] uppercase text-[#B8860B] mt-0.5">
            Devotee Portal
          </p>
        </div>
      </div>



      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-5 py-6 space-y-1.5" aria-label="Portal navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-250 ease-out ${
                isActive
                  ? 'bg-[#FFF7E8] text-[#B8860B] font-bold border border-[#E9DCC5] shadow-[0_2px_12px_rgba(184,134,11,0.06)]'
                  : 'text-[#6F5B47] hover:text-[#3E2B1F] hover:bg-[#F5EFE4]/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Gold left bar indicator */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#B8860B] shadow-[0_0_8px_rgba(184,134,11,0.4)]" />
                )}

                <item.icon
                  className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-[#B8860B] scale-105' : 'text-[#B8860B]/70 group-hover:text-[#B8860B]'
                  }`}
                />

                <span className="tracking-wide">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User Profile & Logout ────────────────────────── */}
      <div className="p-5 border-t border-[#E9DCC5] bg-[#FFFFFF] shrink-0">
        <div className="p-4 rounded-2xl bg-[#F5EFE4]/60 border border-[#E9DCC5] space-y-4 shadow-sm transition-all duration-300 hover:border-[#B8860B]/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#D4AF37] flex items-center justify-center text-white font-display font-bold text-sm shadow-sm ring-2 ring-[#B8860B]/20">
                {(userProfile?.full_name ?? userProfile?.email ?? 'U').charAt(0).toUpperCase()}
              </div>
              {verStatus === 'verified' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#2E7D32] border-2 border-[#FFFFFF] flex items-center justify-center shadow-2xs">
                  <Sparkles className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#3E2B1F] truncate">
                {userProfile?.full_name ?? 'Sacred Seeker'}
              </p>
              <span className={`inline-block mt-0.5 px-2 py-[1px] rounded-md text-[9px] font-bold uppercase tracking-wider border ${status.className}`}>
                {status.label}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-bold text-[#B8860B] border border-[#B8860B] hover:bg-[#FFF7E8] hover:text-[#3E2B1F] transition-all duration-250 cursor-pointer shadow-2xs"
            aria-label="Sign out of portal"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
