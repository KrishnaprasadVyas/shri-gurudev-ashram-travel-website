import { Routes, Route, Navigate } from 'react-router-dom'

import { PublicLayout } from './components/layout/PublicLayout'
import { PortalLayout } from './components/layout/PortalLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { AuthLayout } from './components/layout/AuthLayout'

// Route Guards
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { AdminRoute } from './components/shared/AdminRoute'
import { GuestRoute } from './components/shared/GuestRoute'

// Public Pages
import { HomePage } from './pages/public/HomePage'
import { AboutPage } from './pages/public/AboutPage'
import { YatrasPage } from './pages/public/YatrasPage'
import { YatraDetailPage } from './pages/public/YatraDetailPage'
import { SevaPage } from './pages/public/SevaPage'
import { GalleryPage } from './pages/public/GalleryPage'
import { FaqPage } from './pages/public/FaqPage'
import { ContactPage } from './pages/public/ContactPage'
import { MyTripPage } from './pages/public/MyTripPage'
// Auth Pages
import { LoginPage } from './pages/auth/LoginPage'

// Portal Pages
import { PortalHomePage } from './pages/portal/PortalHomePage'
import { BookingsPage } from './pages/portal/BookingsPage'
import { BookingDetailPage } from './pages/portal/BookingDetailPage'
import { BookPage } from './pages/portal/BookPage'
import { ProfilePage } from './pages/portal/ProfilePage'

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
import { AdminSevaPackagesPage } from './pages/admin/AdminSevaPackagesPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminGroupsPage } from './pages/admin/AdminGroupsPage'
import { AdminGroupDetailPage } from './pages/admin/AdminGroupDetailPage'
import { AdminPassengersPage } from './pages/admin/AdminPassengersPage'
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage'
import { AdminPendingCollectionPage } from './pages/admin/AdminPendingCollectionPage'
import { AdminTrainExportPage } from './pages/admin/AdminTrainExportPage'
import { AdminTicketUploadPage } from './pages/admin/AdminTicketUploadPage'
import { AdminRoomsPage } from './pages/admin/AdminRoomsPage'
import { AdminRoomAllocationPage } from './pages/admin/AdminRoomAllocationPage'
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { useTranslation } from "react-i18next";

function NotFoundPage() {
    const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4 bg-[#0a0908]">
      <div className="text-6xl mb-4">🪷</div>
      <h1 className="font-display text-4xl font-bold text-gradient-saffron">{t('notFound.title', { defaultValue: 'Page Not Found' })}</h1>
      <p className="text-[#f2f0eb]/50">{t('notFound.desc', { defaultValue: "The page you're looking for doesn't exist." })}</p>
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
        <Route path="seva" element={<SevaPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="my-trip" element={<MyTripPage />} />
      </Route>

      {/* ── Auth pages (guests only — redirect if logged in) ── */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<Navigate to="/login" replace />} />
        </Route>
      </Route>

      {/* ── User Portal (requires auth) ───────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="portal" element={<PortalLayout />}>
          <Route index element={<PortalHomePage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="book/:packageId" element={<BookPage />} />
          <Route path="profile" element={<ProfilePage />} />
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
          <Route path="seva-packages" element={<AdminSevaPackagesPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="groups" element={<AdminGroupsPage />} />
          <Route path="groups/:id" element={<AdminGroupDetailPage />} />
          <Route path="passengers" element={<AdminPassengersPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="pending-collection" element={<AdminPendingCollectionPage />} />
          <Route path="train-export" element={<AdminTrainExportPage />} />
          <Route path="ticket-upload" element={<AdminTicketUploadPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route path="room-allocation" element={<AdminRoomAllocationPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* ── 404 ──────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
