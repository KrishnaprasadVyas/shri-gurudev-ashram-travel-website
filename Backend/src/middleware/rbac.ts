import { NextFunction, Request, Response } from 'express'
import { HttpError } from '../errors.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { AuthenticatedRequest } from './auth.js'

export type StaffRole =
  | 'super_admin'
  | 'booking_staff'
  | 'payment_staff'
  | 'train_ticket_staff'
  | 'room_staff'
  | 'admin'
  | 'user'

export type StaffRequest = AuthenticatedRequest & {
  userRole?: StaffRole
  userName?: string
}

/**
 * Middleware that verifies the user has one of the allowed staff roles.
 * 'super_admin' and legacy 'admin' always have full authorization.
 */
export function requireRole(...allowedRoles: StaffRole[]) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const authRequest = request as StaffRequest

      if (!authRequest.userId) {
        throw new HttpError(401, 'Authentication required')
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('role, full_name')
        .eq('id', authRequest.userId)
        .single()

      if (error || !user) {
        throw new HttpError(403, 'User record not found or access denied')
      }

      const role = (user.role || 'user') as StaffRole
      authRequest.userRole = role
      authRequest.userName = user.full_name

      // Super admin or legacy admin bypasses all role checks
      if (role === 'super_admin' || role === 'admin') {
        return next()
      }

      if (!allowedRoles.includes(role)) {
        throw new HttpError(
          403,
          `Forbidden: Role '${role}' lacks permission for this action. Allowed: ${allowedRoles.join(', ')}`,
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Preset middlewares for convenient route protection:
export const requireSuperAdmin = requireRole('super_admin')
export const requireBookingStaff = requireRole('super_admin', 'booking_staff')
export const requirePaymentStaff = requireRole('super_admin', 'payment_staff')
export const requireTrainStaff = requireRole('super_admin', 'train_ticket_staff')
export const requireRoomStaff = requireRole('super_admin', 'room_staff')
