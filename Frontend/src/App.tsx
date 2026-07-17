import { Routes, Route } from 'react-router-dom'

// Layouts
import { PublicLayout } from './components/layout/PublicLayout'
import { PortalLayout } from './components/layout/PortalLayout'
import { AdminLayout } from './components/layout/AdminLayout'

// Route Guards
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { AdminRoute } from './components/shared/AdminRoute'
import { GuestRoute } from './components/shared/GuestRoute'

// Public Pages
import { HomePage } from './pages/public/HomePage'
import { AboutPage } from './pages/public/AboutPage'
import { YatrasPage } from './pages/public/YatrasPage'
import { YatraDetailPage } from './pages/public/YatraDetailPage'
import { GalleryPage } from './pages/public/GalleryPage'
import { FaqPage } from './pages/public/FaqPage'
import { ContactPage } from './pages/public/ContactPage'

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'

// Portal Pages
import { PortalHomePage } from './pages/portal/PortalHomePage'
import { BookingsPage } from './pages/portal/BookingsPage'
import { BookingDetailPage } from './pages/portal/BookingDetailPage'
import { BookPage } from './pages/portal/BookPage'
import { ProfilePage } from './pages/portal/ProfilePage'
import { VerifyPage } from './pages/portal/VerifyPage'

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage'
import { AdminVerificationsPage } from './pages/admin/AdminVerificationsPage'
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage'
import { AdminBookingDetailPage } from './pages/admin/AdminBookingDetailPage'
import { AdminPackagesPage } from './pages/admin/AdminPackagesPage'
import { AdminNewPackagePage } from './pages/admin/AdminNewPackagePage'
import { AdminEditPackagePage } from './pages/admin/AdminEditPackagePage'

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4 bg-[#0a0908]">
      <div className="text-6xl mb-4">🪷</div>
      <h1 className="font-display text-4xl font-bold text-gradient-saffron">Page Not Found</h1>
      <p className="text-[#f2f0eb]/50">The page you're looking for doesn't exist.</p>
      <a
        href="/"
        className="mt-4 px-6 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
      >
        Back to Home
      </a>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* ── Public pages ─────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="yatras" element={<YatrasPage />} />
        <Route path="yatras/:id" element={<YatraDetailPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>

      {/* ── Auth pages (guests only — redirect if logged in) ── */}
      <Route element={<GuestRoute />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
      </Route>

      {/* ── User Portal (requires auth) ───────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="portal" element={<PortalLayout />}>
          <Route index element={<PortalHomePage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="book/:packageId" element={<BookPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="verify" element={<VerifyPage />} />
        </Route>
      </Route>

      {/* ── Admin Panel (requires admin role) ────────────── */}
      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="verifications" element={<AdminVerificationsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
          <Route path="packages" element={<AdminPackagesPage />} />
          <Route path="packages/new" element={<AdminNewPackagePage />} />
          <Route path="packages/:id/edit" element={<AdminEditPackagePage />} />
        </Route>
      </Route>

      {/* ── 404 ──────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
