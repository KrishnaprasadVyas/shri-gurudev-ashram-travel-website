import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Router } from 'express'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { SIGNED_URL_SECRET } from '../config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_BASE_DIR = path.resolve(__dirname, '../../uploads/verifications')

// Signed URL utilities for admin file viewing
const SIGNED_URL_EXPIRY = 300

function generateAdminSignedToken(filePath: string, expiresAt: number): string {
  return crypto.createHmac('sha256', SIGNED_URL_SECRET).update(`${filePath}:${expiresAt}`).digest('hex')
}

/** Wraps a DB error so that raw messages are not leaked to the client. */
function dbError(error: { message: string } | null, fallback: string): HttpError {
  if (process.env.NODE_ENV === 'development') {
    return new HttpError(500, error?.message ?? fallback)
  }
  console.error('[DB Error]', error?.message ?? fallback)
  return new HttpError(500, fallback)
}

export const adminRouter = Router()

// All admin routes require auth + admin role
const protect = [requireAuth, requireAdmin]

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
adminRouter.get('/stats', ...protect, async (_req, res, next) => {
  try {
    const [
      { count: totalUsers },
      { count: totalBookings },
      { count: pendingVerifications },
      { count: activePackages },
      revenueResult,
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('booking_passengers')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'submitted'),
      supabaseAdmin
        .from('travel_packages')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabaseAdmin
        .from('bookings')
        .select('total_amount')
        .eq('status', 'paid'),
    ])

    const totalRevenue = (revenueResult.data ?? []).reduce(
      (sum: number, b: { total_amount: number }) => sum + (b.total_amount ?? 0),
      0,
    )

    res.json({
      totalUsers: totalUsers ?? 0,
      totalBookings: totalBookings ?? 0,
      totalRevenue,
      pendingVerifications: pendingVerifications ?? 0,
      activePackages: activePackages ?? 0,
    })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
adminRouter.get('/users', ...protect, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    const search = String(req.query.search ?? '').trim()
    const status = String(req.query.status ?? '').trim()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin.from('users').select('*', { count: 'exact' })

    if (search) {
      // B.6: Sanitize search input to prevent PostgREST operator injection
      const sanitized = search.replace(/[,\.\(\)%\*]/g, '')
      if (sanitized) {
        query = query.or(
          `full_name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,email.ilike.%${sanitized}%`,
        )
      }
    }
    if (status) {
      query = query.eq('verification_status', status)
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw dbError(error, 'Failed to fetch users')

    // Fetch booking counts for each user
    const userIds = (users ?? []).map((u: { id: string }) => u.id)
    const bookingCounts: Record<string, number> = {}

    if (userIds.length > 0) {
      const { data: bookingData } = await supabaseAdmin
        .from('bookings')
        .select('user_id')
        .in('user_id', userIds)

      ;(bookingData ?? []).forEach((b: { user_id: string }) => {
        bookingCounts[b.user_id] = (bookingCounts[b.user_id] ?? 0) + 1
      })
    }

    const usersWithCount = (users ?? []).map((u: { id: string }) => ({
      ...u,
      bookingCount: bookingCounts[u.id] ?? 0,
    }))

    res.json({ users: usersWithCount, total: count ?? 0, page, limit })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
adminRouter.get('/users/:id', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params

    const [userResult, bookingsResult] = await Promise.all([
      supabaseAdmin.from('users').select('*').eq('id', id).single(),
      supabaseAdmin
        .from('bookings')
        .select('*, travel_packages(title)')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (userResult.error || !userResult.data) {
      throw new HttpError(404, 'User not found')
    }

    res.json({ user: userResult.data, bookings: bookingsResult.data ?? [] })
  } catch (error) {
    next(error)
  }
})

// ─── PUT /api/admin/users/:id/verification ─────────────────────────────────────
adminRouter.put('/users/:id/verification', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body as { status: string; notes?: string }

    if (!['verified', 'rejected'].includes(status)) {
      throw new HttpError(400, 'status must be "verified" or "rejected"')
    }

    const updateData: Record<string, string> = { verification_status: status }
    if (notes) updateData.admin_notes = notes

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !user) throw dbError(error, 'Verification update failed')

    res.json({ user })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/verifications (New per-passenger queue) ────────────────────
adminRouter.get('/verifications', ...protect, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    const status = String(req.query.status ?? 'submitted').trim()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('booking_passengers')
      .select(`
        *,
        bookings (
          booking_reference,
          status,
          user_id,
          users (full_name, email, phone)
        ),
        passenger_documents (*)
      `, { count: 'exact' })

    if (status) query = query.eq('verification_status', status)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw dbError(error, 'Failed to fetch verifications')

    res.json({ verifications: data ?? [], total: count ?? 0, page, limit })
  } catch (error) {
    next(error)
  }
})

// ─── PUT /api/admin/passengers/:id/verification ───────────────────────────────
adminRouter.put('/passengers/:id/verification', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body as { status: string; notes?: string }

    if (!['verified', 'rejected'].includes(status)) {
      throw new HttpError(400, 'status must be "verified" or "rejected"')
    }

    if (status === 'rejected' && (!notes || !notes.trim())) {
      throw new HttpError(400, 'Admin notes are required when rejecting a passenger')
    }

    // 1. Update passenger
    const { data: passenger, error: passError } = await supabaseAdmin
      .from('booking_passengers')
      .update({
        verification_status: status,
        admin_notes: status === 'rejected' ? notes!.trim() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, bookings (id, status, user_id, booking_reference)')
      .single()

    if (passError || !passenger) throw dbError(passError, 'Failed to update passenger verification')

    const booking = passenger.bookings as { id: string, status: string, user_id: string, booking_reference: string }

    // 2. Fetch all passengers for this booking to check overall status
    const { data: allPassengers, error: allPassError } = await supabaseAdmin
      .from('booking_passengers')
      .select('verification_status, full_name')
      .eq('booking_id', booking.id)

    if (allPassError) throw dbError(allPassError, 'Failed to fetch siblings')

    const allVerified = allPassengers.every(p => p.verification_status === 'verified')
    const anyRejected = allPassengers.some(p => p.verification_status === 'rejected')

    let bookingUpdatePromise: PromiseLike<unknown> = Promise.resolve()
    if (allVerified && booking.status === 'verification_pending') {
      // Transition booking to verified!
      bookingUpdatePromise = supabaseAdmin
        .from('bookings')
        .update({ status: 'verified', updated_at: new Date().toISOString() })
        .eq('id', booking.id)
        .then(() => {})
    }

    // 3. Create Notification
    const notifType = status === 'verified' ? 'verification_approved' : 'verification_rejected'
    const notifTitle = status === 'verified' 
      ? `Verification Approved: ${passenger.full_name}`
      : `Verification Rejected: ${passenger.full_name}`
    const notifMessage = status === 'verified'
      ? `Documents verified for passenger ${passenger.full_name}.`
      : `Issues found with documents for ${passenger.full_name}: ${notes}`

    const notifPromise = supabaseAdmin.from('notifications').insert({
      user_id: booking.user_id,
      type: notifType,
      title: notifTitle,
      message: notifMessage,
      metadata: { bookingId: booking.id, passengerId: passenger.id }
    })

    await Promise.all([bookingUpdatePromise, notifPromise])

    res.json({ passenger })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/bookings ──────────────────────────────────────────────────
adminRouter.get('/bookings', ...protect, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit ?? 20)))
    const status = String(req.query.status ?? '').trim()
    const packageId = String(req.query.packageId ?? '').trim()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('bookings')
      .select('*, users(full_name, email, phone), travel_packages(title), payments(*)', {
        count: 'exact',
      })

    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.not('status', 'in', '("draft","documents_pending")')
    }

    if (packageId) query = query.eq('package_id', packageId)

    const { data: bookings, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw dbError(error, 'Failed to fetch bookings')

    const flat = (bookings ?? []).map((b: Record<string, unknown>) => {
      const pmts = (b.payments as Array<{ status: string; razorpay_payment_id?: string }>) || []
      const paidPmt = pmts.find(p => p.status === 'captured')
      const isPaid = Boolean(paidPmt) || ['verification_pending', 'verified', 'ticket_generated', 'completed', 'paid'].includes(String(b.status))
      return {
        ...b,
        userName: (b.users as { full_name?: string } | null)?.full_name ?? '',
        packageTitle: (b.travel_packages as { title?: string } | null)?.title ?? '',
        isPaid,
        razorpayPaymentId: paidPmt?.razorpay_payment_id ?? null,
      }
    })

    res.json({ bookings: flat, total: count ?? 0, page, limit })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/bookings/:id ──────────────────────────────────────────────
adminRouter.get('/bookings/:id', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params

    const [bookingResult, paymentsResult] = await Promise.all([
      supabaseAdmin
        .from('bookings')
        .select('*, users(*), travel_packages(*), booking_passengers(*)')
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('payments')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (bookingResult.error || !bookingResult.data) {
      throw new HttpError(404, 'Booking not found')
    }

    const booking = bookingResult.data as Record<string, unknown>

    res.json({
      booking: {
        ...booking,
        users: undefined,
        travel_packages: undefined,
      },
      user: booking.users,
      package: booking.travel_packages,
      passengers: booking.booking_passengers ?? [],
      payments: paymentsResult.data ?? [],
    })
  } catch (error) {
    next(error)
  }
})

// ─── PATCH /api/admin/bookings/:id ────────────────────────────────────────────
// C.3: Update admin_notes on a booking
adminRouter.patch('/bookings/:id', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params
    const { admin_notes } = req.body as { admin_notes?: string }

    if (admin_notes === undefined) {
      throw new HttpError(400, 'admin_notes field is required')
    }

    const authRequest = req as unknown as AuthenticatedRequest

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({ admin_notes: admin_notes?.trim() || null })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !booking) throw dbError(error, 'Failed to update booking notes')

    // Log the status event
    await supabaseAdmin.from('booking_status_log').insert({
      booking_id: id,
      status: (booking as Record<string, unknown>).status as string,
      changed_by: authRequest.userId,
      note: 'Admin notes updated',
    })

    res.json({ booking })
  } catch (error) {
    next(error)
  }
})

// ─── POST /api/admin/bookings/:id/reconcile ───────────────────────────────────
// C.2: Manual payment reconciliation for failed/ambiguous webhooks
adminRouter.post('/bookings/:id/reconcile', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params
    const { razorpay_payment_id, razorpay_order_id, action } = req.body as {
      razorpay_payment_id?: string
      razorpay_order_id?: string
      action?: 'capture' | 'fail' | 'cancel'
    }

    if (!action || !['capture', 'fail', 'cancel'].includes(action)) {
      throw new HttpError(400, "action must be 'capture', 'fail', or 'cancel'")
    }

    const authRequest = req as unknown as AuthenticatedRequest

    // Load booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError || !booking) throw new HttpError(404, 'Booking not found')

    if (action === 'capture') {
      // Use the atomic RPC to capture payment
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('booking_id', id)
        .maybeSingle()

      const orderId = razorpay_order_id ?? (existingPayment as Record<string, unknown> | null)?.razorpay_order_id as string
      const paymentId = razorpay_payment_id ?? (existingPayment as Record<string, unknown> | null)?.razorpay_payment_id as string

      if (!orderId) throw new HttpError(400, 'razorpay_order_id is required for capture')
      if (!paymentId) throw new HttpError(400, 'razorpay_payment_id is required for capture')

      const { error: captureError } = await supabaseAdmin.rpc('capture_booking_payment' as never, {
        p_booking_id: id,
        p_razorpay_order_id: orderId,
        p_razorpay_payment_id: paymentId,
        p_razorpay_signature: null,
        p_payment_method: 'razorpay',
        p_gateway_fee: null,
      } as never)

      if (captureError) throw dbError(captureError, 'Failed to capture payment')

      // Log reconciliation
      await supabaseAdmin.from('booking_status_log').insert({
        booking_id: id,
        status: 'paid',
        changed_by: authRequest.userId,
        note: `Manual reconciliation: payment captured (${paymentId})`,
      })
    } else if (action === 'fail') {
      // Mark payment as failed and booking as payment_failed
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('booking_id', id)
        .neq('status', 'captured')

      await supabaseAdmin
        .from('bookings')
        .update({ status: 'payment_failed' })
        .eq('id', id)

      await supabaseAdmin.from('booking_status_log').insert({
        booking_id: id,
        status: 'payment_failed',
        changed_by: authRequest.userId,
        note: 'Manual reconciliation: payment marked as failed',
      })
    } else if (action === 'cancel') {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)

      await supabaseAdmin.from('booking_status_log').insert({
        booking_id: id,
        status: 'cancelled',
        changed_by: authRequest.userId,
        note: 'Manual reconciliation: booking cancelled by admin',
      })
    }

    // Return updated booking
    const { data: updatedBooking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    res.json({ booking: updatedBooking })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/bookings/:id/history ──────────────────────────────────────
// C.4: Read the booking status audit trail
adminRouter.get('/bookings/:id/history', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: history, error } = await supabaseAdmin
      .from('booking_status_log')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: true })

    if (error) throw dbError(error, 'Failed to fetch booking history')

    res.json({ history: history ?? [] })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/packages ──────────────────────────────────────────────────
adminRouter.get('/packages', ...protect, async (_req, res, next) => {
  try {
    const { data: packages, error } = await supabaseAdmin
      .from('travel_packages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw dbError(error, 'Failed to fetch packages')
    res.json({ packages: packages ?? [] })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/packages/:id ──────────────────────────────────────────────
adminRouter.get('/packages/:id', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params
    const { data: pkg, error } = await supabaseAdmin
      .from('travel_packages')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !pkg) throw new HttpError(404, 'Package not found')
    res.json({ package: pkg })
  } catch (error) {
    next(error)
  }
})


// ─── POST /api/admin/packages ─────────────────────────────────────────────────
// B.7: Complete package validation helper
function validatePackageFields(body: Record<string, unknown>, isCreate: boolean) {
  const errors: string[] = []
  if (isCreate) {
    if (!body.title || typeof body.title !== 'string' || !String(body.title).trim()) errors.push('title is required')
    if (!body.description || typeof body.description !== 'string' || !String(body.description).trim()) errors.push('description is required')
    if (body.price === undefined || body.price === null) errors.push('price is required')
    if (!body.duration) errors.push('duration is required')
    if (body.total_seats === undefined || body.total_seats === null) errors.push('total_seats is required')
  }
  if (body.description !== undefined && typeof body.description === 'string' && body.description.length > 5000) {
    errors.push('description must be 5000 characters or fewer')
  }
  if (body.price !== undefined) {
    const price = Number(body.price)
    if (!Number.isFinite(price) || price <= 0) errors.push('price must be a positive number')
  }
  
  // Validate optional preference pricing
  const prefFields = ['flight_price', 'train_ac_price', 'train_non_ac_price', 'room_ac_price', 'room_non_ac_price']
  for (const field of prefFields) {
    if (body[field] !== undefined) {
      const val = Number(body[field])
      if (!Number.isFinite(val) || val < 0) errors.push(`${field} must be a non-negative number`)
    }
  }
  if (body.total_seats !== undefined) {
    const seats = Number(body.total_seats)
    if (!Number.isInteger(seats) || seats < 0) errors.push('total_seats must be a non-negative integer')
  }
  if (body.remaining_seats !== undefined) {
    const rem = Number(body.remaining_seats)
    if (!Number.isInteger(rem) || rem < 0) errors.push('remaining_seats must be a non-negative integer')
  }
  // Cross-field: remaining_seats <= total_seats
  const total = body.total_seats !== undefined ? Number(body.total_seats) : undefined
  const remaining = body.remaining_seats !== undefined ? Number(body.remaining_seats) : undefined
  if (total !== undefined && remaining !== undefined && remaining > total) {
    errors.push('remaining_seats cannot exceed total_seats')
  }
  if (errors.length > 0) throw new HttpError(400, errors.join('; '))
}

adminRouter.post('/packages', ...protect, async (req, res, next) => {
  try {
    validatePackageFields(req.body, true)
    const {
      title,
      description,
      price,
      duration,
      total_seats,
      remaining_seats,
      image_url,
      is_active,
      flight_price,
      train_ac_price,
      train_non_ac_price,
      room_ac_price,
      room_non_ac_price,
    } = req.body

    const { data: pkg, error } = await supabaseAdmin
      .from('travel_packages')
      .insert({
        title: String(title).trim(),
        description: String(description).trim(),
        price: Number(price),
        duration,
        total_seats: Number(total_seats),
        remaining_seats: Number(remaining_seats ?? total_seats),
        image_url: image_url ?? null,
        is_active: is_active !== false,
        flight_price: flight_price !== undefined ? Number(flight_price) : 0,
        train_ac_price: train_ac_price !== undefined ? Number(train_ac_price) : 0,
        train_non_ac_price: train_non_ac_price !== undefined ? Number(train_non_ac_price) : 0,
        room_ac_price: room_ac_price !== undefined ? Number(room_ac_price) : 0,
        room_non_ac_price: room_non_ac_price !== undefined ? Number(room_non_ac_price) : 0,
      })
      .select('*')
      .single()

    if (error || !pkg) throw dbError(error, 'Failed to create package')
    res.status(201).json({ package: pkg })
  } catch (error) {
    next(error)
  }
})

// ─── PUT /api/admin/packages/:id ──────────────────────────────────────────────
// B.5: Allowlist of editable package fields
const PACKAGE_EDITABLE_FIELDS = [
  'title', 'description', 'price', 'duration', 'total_seats',
  'remaining_seats', 'image_url', 'is_active', 'start_date', 'end_date',
  'departure_location', 'highlights', 'inclusions', 'exclusions',
  'flight_price', 'train_ac_price', 'train_non_ac_price', 'room_ac_price', 'room_non_ac_price'
] as const

adminRouter.put('/packages/:id', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params
    const body = req.body as Record<string, unknown>

    // B.7: Validate fields
    validatePackageFields(body, false)

    // B.5: Only allow known editable fields
    const updates: Record<string, unknown> = {}
    for (const field of PACKAGE_EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, 'No valid fields to update')
    }

    if (updates.price !== undefined) updates.price = Number(updates.price)
    if (updates.total_seats !== undefined) updates.total_seats = Number(updates.total_seats)
    if (updates.remaining_seats !== undefined) updates.remaining_seats = Number(updates.remaining_seats)

    const { data: pkg, error } = await supabaseAdmin
      .from('travel_packages')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !pkg) throw dbError(error, 'Failed to update package')
    res.json({ package: pkg })
  } catch (error) {
    next(error)
  }
})

// ─── DELETE /api/admin/packages/:id (soft delete — set is_active=false) ───────
adminRouter.delete('/packages/:id', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: pkg, error } = await supabaseAdmin
      .from('travel_packages')
      .update({ is_active: false })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !pkg) throw dbError(error, 'Failed to deactivate package')
    res.json({ package: pkg })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/users/:id/verification-file-url ───────────────────────────
// B.4: Admin endpoint to generate signed URLs for any user's verification files
adminRouter.get('/users/:id/verification-file-url', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params
    const filePath = String(req.query.path ?? '').trim()

    if (!filePath) {
      throw new HttpError(400, 'path query parameter is required')
    }

    // Verify the file path is scoped to the specified user
    const expectedPrefix = `uploads/verifications/${id}/`
    if (!filePath.startsWith(expectedPrefix)) {
      throw new HttpError(400, 'File path does not match the specified user')
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY
    const token = generateAdminSignedToken(filePath, expiresAt)

    res.json({
      url: `/api/users/verification-file?path=${encodeURIComponent(filePath)}&expires=${expiresAt}&token=${token}`,
      expiresAt,
    })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/admin/passengers/:passengerId/document-url ──────────────────────
adminRouter.get('/passengers/:passengerId/document-url', ...protect, async (req, res, next) => {
  try {
    const { passengerId } = req.params
    const filePath = String(req.query.path ?? '').trim()

    if (!filePath) {
      throw new HttpError(400, 'path query parameter is required')
    }

    if (!filePath.startsWith('uploads/bookings/') || !filePath.includes(`/${passengerId}/`)) {
      throw new HttpError(400, 'File path does not match the specified passenger')
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY
    const token = generateAdminSignedToken(filePath, expiresAt)

    res.json({
      url: `/api/users/verification-file?path=${encodeURIComponent(filePath)}&expires=${expiresAt}&token=${token}`,
      expiresAt,
    })
  } catch (error) {
    next(error)
  }
})
