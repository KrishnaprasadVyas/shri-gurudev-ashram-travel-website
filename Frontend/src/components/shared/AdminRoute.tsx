import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from "react-i18next";

/** Requires user to be an admin. Redirects to /portal if not admin. */
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

  if (userProfile && userProfile.role !== 'admin') {
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
