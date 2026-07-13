import { NextFunction, Request, Response } from 'express'
import { HttpError } from '../errors.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

export type AuthenticatedRequest = Request & {
  userId: string
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')

    if (!token) {
      throw new HttpError(401, 'Missing authorization token')
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      throw new HttpError(401, 'Invalid authorization token')
    }

    ;(request as AuthenticatedRequest).userId = data.user.id
    next()
  } catch (error) {
    next(error)
  }
}
