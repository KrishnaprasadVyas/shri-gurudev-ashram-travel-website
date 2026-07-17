import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { HttpError } from '../errors.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { verifyFirebaseToken } from '../services/firebaseAdmin.js'

export type AuthenticatedRequest = Request & {
  userId: string
}

// ---------------------------------------------------------------------------
// Helper: decode the JWT payload without verifying the signature.
// Used only to inspect the `iss` claim so we can route to the correct
// token verifier.  The actual cryptographic check is always performed
// downstream (Firebase Admin SDK or Supabase Admin SDK).
// ---------------------------------------------------------------------------
function getJwtIssuer(token: string): string {
  try {
    const payloadB64 = token.split('.')[1]
    if (!payloadB64) return ''
    const json = Buffer.from(payloadB64, 'base64url').toString('utf-8')
    const payload = JSON.parse(json) as { iss?: string }
    return payload.iss ?? ''
  } catch {
    return ''
  }
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')

    if (!token) {
      throw new HttpError(401, 'Missing authorization token')
    }

    // -----------------------------------------------------------------------
    // PATH 1 — Development mock token (DEMO_AUTH mode)
    // Format: dev-token-<userId>:<fullName>:<email>
    // -----------------------------------------------------------------------
    if (process.env.NODE_ENV === 'development' && token.startsWith('dev-token-')) {
      const tokenBody = token.substring('dev-token-'.length)
      const parts = tokenBody.split(':')
      const userId = parts[0]
      if (!userId) {
        throw new HttpError(401, 'Invalid dev authorization token')
      }

      const fullName = parts[1] ? decodeURIComponent(parts[1]) : ''
      const email = parts[2] ? decodeURIComponent(parts[2]) : ''

      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (checkError) {
        throw new HttpError(500, checkError.message)
      }

      if (!existingUser) {
        const phoneMatch = userId.match(/^00000000-0000-0000-0000-(\d{10})00$/)
        const phone = phoneMatch ? phoneMatch[1] : '9999999999'
        const role = phone === '9000000000' ? 'admin' : 'user'
        const insertData = {
          id: userId,
          full_name: fullName || `Test User ${phone}`,
          phone: phone,
          email: email || `user_${phone}@example.com`,
          role: role,
          verification_status: 'not_submitted',
        }

        const { error: insertError } = await supabaseAdmin.from('users').insert(insertData)
        if (insertError) {
          throw new HttpError(500, `Failed to create mock user: ${insertError.message}`)
        }
      }

      ;(request as AuthenticatedRequest).userId = userId
      return next()
    }

    // -----------------------------------------------------------------------
    // PATH 2 — Firebase ID Token
    // Detected by the `iss` claim starting with
    // "https://securetoken.google.com/"
    // -----------------------------------------------------------------------
    const issuer = getJwtIssuer(token)

    if (issuer.startsWith('https://securetoken.google.com/')) {
      // verifyFirebaseToken returns null when FIREBASE_PROJECT_ID is not set.
      const decoded = await verifyFirebaseToken(token)
      if (!decoded) {
        throw new HttpError(
          401,
          'Firebase is not configured on this server. Set FIREBASE_PROJECT_ID.'
        )
      }

      // Extract the 10-digit Indian phone number from the Firebase token.
      const rawPhone = decoded.phone_number ?? ''
      // Strip +91 prefix and any non-digit characters.
      const phoneDigits = rawPhone.replace(/^\+91/, '').replace(/\D/g, '')

      if (!phoneDigits || phoneDigits.length !== 10) {
        throw new HttpError(401, 'Phone number not found or invalid in Firebase token')
      }

      // Look up the existing Supabase user row by phone number.
      // Firebase UIDs are not UUIDs, so we use the phone as the stable key.
      const { data: existingUser, error: lookupError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', phoneDigits)
        .maybeSingle()

      if (lookupError) {
        throw new HttpError(500, `User lookup failed: ${lookupError.message}`)
      }

      if (existingUser) {
        ;(request as AuthenticatedRequest).userId = existingUser.id
      } else {
        // First sign-in for this phone number — create the user profile.
        const newId = randomUUID()
        const { error: insertError } = await supabaseAdmin.from('users').insert({
          id: newId,
          phone: phoneDigits,
          full_name: decoded.name ?? `User ${phoneDigits.slice(-4)}`,
          email: decoded.email ?? null,
          role: 'user',
          verification_status: 'not_submitted',
        })

        if (insertError) {
          throw new HttpError(500, `Failed to create user profile: ${insertError.message}`)
        }

        ;(request as AuthenticatedRequest).userId = newId
      }

      return next()
    }

    // -----------------------------------------------------------------------
    // PATH 3 — Supabase JWT (fallback / legacy)
    // -----------------------------------------------------------------------
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
