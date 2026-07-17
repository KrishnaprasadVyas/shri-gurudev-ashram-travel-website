import { Link } from 'react-router-dom'
import {
  ShieldX,
  ShieldCheck,
  BookOpen,
  Map,
  ArrowRight,
  User,
  LifeBuoy,
  Calendar,
  Sparkles,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useMyBookings } from '@/hooks/useBookings'
import { usePageTitle } from '@/hooks/usePageTitle'

export function PortalHomePage() {
  usePageTitle('My Portal')
  const { userProfile } = useAuth()
  const { data: bookings, isLoading } = useMyBookings()

  const name = userProfile?.full_name?.split(' ')[0] ?? 'Sacred Seeker'
  const verStatus = userProfile?.verification_status ?? 'not_submitted'

  // Dynamic greeting based on time of day
  const getGreetingTime = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const upcomingYatrasCount = bookings?.filter(
    (b) => b.status === 'paid' || b.status === 'payment_pending'
  ).length ?? 0

  const profileCompletion = verStatus === 'verified' && userProfile?.phone ? '100%' : verStatus === 'submitted' ? '85%' : '60%'

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* ── Hero Section ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F5EFE4] border border-[#E9DCC5] text-[#B8860B] font-label-caps text-[11px] font-bold tracking-[0.16em] uppercase shadow-2xs">
          <Sparkles className="h-3 w-3" />
          <span>Devotee Portal</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3E2B1F] tracking-tight leading-[1.15]">
          {getGreetingTime()}, {name} 🙏
        </h1>
        <p className="text-sm sm:text-base text-[#6F5B47] font-normal max-w-xl leading-relaxed">
          Continue your spiritual journey through sacred pilgrimages under Gurudev Ji&apos;s divine guidance.
        </p>
      </div>

      {/* ── Verification Alerts ──────────────────────────── */}
      {verStatus === 'not_submitted' && (
        <div className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] border border-[#C68A00]/30 shadow-[0_8px_30px_rgba(62,43,31,0.05)] transition-all duration-300 hover:border-[#C68A00]/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#C68A00]/15 border border-[#C68A00]/30 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldX className="h-6 w-6 text-[#C68A00]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h2 className="font-display text-lg font-bold text-[#3E2B1F]">Complete Identity Verification</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C68A00]/15 text-[#C68A00] font-label-caps text-[10px] font-bold uppercase tracking-wider">
                    Required
                  </span>
                </div>
                <p className="text-sm text-[#6F5B47] max-w-lg leading-relaxed">
                  Verify your identity before booking any sacred Yatra. Takes less than 3 minutes.
                </p>
              </div>
            </div>
            <Link
              to="/portal/verify"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#B8860B] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] transition-all duration-250 shrink-0 shadow-sm hover:-translate-y-0.5"
            >
              Verify Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {verStatus === 'submitted' && (
        <div className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] border border-[#C68A00]/30 shadow-[0_8px_30px_rgba(62,43,31,0.05)] transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C68A00]/15 border border-[#C68A00]/30 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-[#C68A00]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <h2 className="font-display text-lg font-bold text-[#3E2B1F]">Verification Under Review</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#C68A00]/15 text-[#C68A00] font-label-caps text-[10px] font-bold uppercase tracking-wider">
                  In Progress
                </span>
              </div>
              <p className="text-sm text-[#6F5B47]">Your documents are being reviewed. We&apos;ll notify you within 24 to 48 hours.</p>
            </div>
          </div>
        </div>
      )}

      {verStatus === 'rejected' && (
        <div className="p-6 sm:p-7 rounded-3xl bg-[#FFFFFF] border border-[#C0392B]/30 shadow-[0_8px_30px_rgba(62,43,31,0.05)] transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#C0392B]/15 border border-[#C0392B]/30 flex items-center justify-center shrink-0">
                <ShieldX className="h-6 w-6 text-[#C0392B]" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#3E2B1F] mb-1">Verification Action Required</h2>
                <p className="text-sm text-[#6F5B47] max-w-lg leading-relaxed">
                  Your previous submission was not accepted. Please re-upload clearer identity documents.
                </p>
              </div>
            </div>
            <Link
              to="/portal/verify"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#C0392B] text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all duration-250 shrink-0 shadow-sm hover:-translate-y-0.5"
            >
              Resubmit <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {verStatus === 'verified' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border border-[#2E7D32]/30 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/15 border border-[#2E7D32]/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-[#2E7D32]" />
          </div>
          <p className="text-sm text-[#2E7D32] font-bold">Identity Verified ✓ — You can now book and attend all sacred Yatras.</p>
        </div>
      )}

      {/* ── Statistics Grid ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Verification', value: verStatus === 'verified' ? 'Verified' : verStatus === 'submitted' ? 'Under Review' : 'Required', icon: ShieldCheck, sub: verStatus === 'verified' ? 'Identity confirmed ✓' : 'Required for booking' },
          { label: 'Total Bookings', value: isLoading ? '—' : String(bookings?.length ?? 0), icon: BookOpen, sub: 'Sacred journey passes' },
          { label: 'Upcoming Yatras', value: isLoading ? '—' : String(upcomingYatrasCount), icon: Map, sub: 'Confirmed pilgrimages' },
          { label: 'Profile Status', value: profileCompletion, icon: User, sub: profileCompletion === '100%' ? 'Fully set up' : 'Finish setup' },
        ].map((card) => (
          <div
            key={card.label}
            className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B]/40 transition-all duration-300 shadow-[0_8px_30px_rgba(62,43,31,0.04)] hover:shadow-md group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-label-caps text-[10px] font-bold text-[#6F5B47] uppercase tracking-[0.16em]">{card.label}</span>
              <div className="w-9 h-9 rounded-xl bg-[#F5EFE4] border border-[#E9DCC5] flex items-center justify-center group-hover:bg-[#FFF7E8] group-hover:border-[#B8860B]/30 transition-colors duration-300">
                <card.icon className="h-4 w-4 text-[#B8860B] group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] tracking-tight">{card.value}</p>
              <p className="text-[12px] text-[#6F5B47] mt-1 font-normal">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#3E2B1F] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { to: '/yatras', icon: Map, title: 'Browse Yatras', desc: 'Explore upcoming pilgrimages & itineraries', cta: 'Explore' },
            { to: '/portal/bookings', icon: BookOpen, title: 'My Bookings', desc: 'View pilgrimage passes & payment receipts', cta: 'View' },
            { to: '/portal/profile', icon: User, title: 'My Profile', desc: 'Update personal information & contact info', cta: 'Edit' },
            { to: '/contact', icon: LifeBuoy, title: 'Support', desc: 'Get assistance from Ashram administration', cta: 'Contact' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group p-6 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] hover:border-[#B8860B]/50 transition-all duration-300 shadow-[0_8px_30px_rgba(62,43,31,0.04)] hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between min-h-[170px]"
            >
              <div>
                <div className="w-11 h-11 rounded-2xl bg-[#F5EFE4] border border-[#E9DCC5] flex items-center justify-center mb-4 group-hover:bg-[#FFF7E8] group-hover:border-[#B8860B]/30 transition-colors duration-300 shadow-2xs">
                  <action.icon className="h-5 w-5 text-[#B8860B] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-display text-base font-bold text-[#3E2B1F] mb-1 group-hover:text-[#B8860B] transition-colors">{action.title}</h3>
                <p className="text-[12px] text-[#6F5B47] leading-relaxed font-normal">{action.desc}</p>
              </div>
              <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-[#E9DCC5]">
                <span className="font-label-caps text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.16em]">{action.cta}</span>
                <ArrowRight className="h-4 w-4 text-[#B8860B] group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Activity + Quote ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3 p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E9DCC5]">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-[#B8860B]" />
              <h3 className="font-display text-lg font-bold text-[#3E2B1F]">Recent Activity</h3>
            </div>
            {bookings && bookings.length > 0 && (
              <Link to="/portal/bookings" className="font-label-caps text-[11px] font-bold text-[#B8860B] hover:text-[#D4AF37] uppercase tracking-wider inline-flex items-center gap-1 transition-colors">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-[#6F5B47]">Loading your records...</div>
          ) : !bookings || bookings.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-[#E9DCC5] rounded-2xl bg-[#F5EFE4]/30 my-auto">
              <Calendar className="h-8 w-8 text-[#B8860B]/70 mx-auto mb-2" />
              <p className="font-display text-base font-bold text-[#3E2B1F]">No recent activity</p>
              <p className="text-xs text-[#6F5B47] max-w-xs mx-auto leading-relaxed">
                Your pilgrimage reservations and boarding passes will appear here once booked.
              </p>
            </div>
          ) : (
            <div className="space-y-3 my-auto">
              {bookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-2xl bg-[#F5EFE4]/50 border border-[#E9DCC5] hover:border-[#B8860B]/30 hover:bg-[#FFF7E8]/60 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-[#3E2B1F] truncate">
                      {booking.booking_reference ? `Yatra #${booking.booking_reference}` : 'Pilgrimage Reservation'}
                    </p>
                    <p className="text-[12px] text-[#6F5B47] mt-0.5 flex items-center gap-2">
                      <span>{booking.traveler_count} traveler(s)</span>
                      <span className="text-[#E9DCC5]">•</span>
                      <span className="font-semibold text-[#3E2B1F]">₹{booking.total_amount.toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                  <span
                    className={`font-label-caps text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      booking.status === 'paid'
                        ? 'bg-[#2E7D32]/15 text-[#2E7D32] border-[#2E7D32]/30'
                        : booking.status === 'cancelled'
                        ? 'bg-[#C0392B]/15 text-[#C0392B] border-[#C0392B]/30'
                        : 'bg-[#C68A00]/15 text-[#C68A00] border-[#C68A00]/30'
                    }`}
                  >
                    {booking.status === 'paid' ? 'Confirmed' : booking.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivational Quote Card */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)] flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#B8860B]/10 blur-3xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-[#F5EFE4] border border-[#E9DCC5] flex items-center justify-center text-3xl mb-5 relative z-10 shadow-sm">
            🪷
          </div>

          <h3 className="font-display text-lg font-bold text-[#B8860B] tracking-wide mb-3 relative z-10">
            ॥ श्रद्धावान् लभते ज्ञानम् ॥
          </h3>

          <div className="h-px w-20 bg-[#E9DCC5] mb-4" />

          <blockquote className="text-sm text-[#3E2B1F] font-serif italic leading-relaxed max-w-sm relative z-10">
            &ldquo;He who has faith attains true spiritual knowledge and divine peace.&rdquo;
          </blockquote>

          <span className="font-label-caps text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8860B] mt-5 relative z-10 bg-[#F5EFE4] border border-[#E9DCC5] px-3.5 py-1 rounded-full">
            Ashram Wisdom
          </span>
        </div>
      </div>
    </div>
  )
}
