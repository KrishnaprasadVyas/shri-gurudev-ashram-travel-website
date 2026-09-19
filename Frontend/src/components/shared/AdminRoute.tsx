import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from "react-i18next";

const ADMIN_ROLES = ['admin', 'super_admin', 'booking_staff', 'payment_staff', 'train_ticket_staff', 'room_staff']

/** Requires user to have an administrative or operational staff role. Redirects to /portal if not authorized. */
export function AdminRoute() {
    const { t } = useTranslation();
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (userProfile && !ADMIN_ROLES.includes(userProfile.role)) {
    return <Navigate to="/portal" replace />
  }

  // While profile is loading but user is logged in, show spinner
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <Outlet />
}
