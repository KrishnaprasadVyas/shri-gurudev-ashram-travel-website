import { NextFunction, Request, Response } from 'express'
import { HttpError } from '../errors.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { AuthenticatedRequest } from './auth.js'

/**
 * Middleware that first runs requireAuth (validates Bearer token),
 * then checks that the user's role in the users table is 'admin'.
 * Usage: router.get('/route', requireAuth, requireAdmin, handler)
 */
export async function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const authRequest = request as AuthenticatedRequest

    if (!authRequest.userId) {
      throw new HttpError(401, 'Authentication required')
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authRequest.userId)
      .single()

    if (error || !user) {
      throw new HttpError(403, 'Admin access required')
    }

    if (user.role !== 'admin') {
      throw new HttpError(403, 'Admin access required')
    }

    next()
  } catch (error) {
    next(error)
  }
}
