import crypto from 'crypto'
import { Router } from 'express'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { requirePaymentStaff, requireSuperAdmin } from '../middleware/rbac.js'
import { razorpay, razorpayKeySecret } from '../services/razorpay.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { getNextPaymentCode } from '../services/idGenerators.js'
import { reconcilePaymentBalance, sanitizeUtr } from '../services/pricingEngine.js'
import { logAudit } from '../services/auditLogger.js'

export const paymentsRouter = Router()

/**
 * Validates HMAC signature for Razorpay verification
 */
function isValidPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!razorpayKeySecret) return false
  const expected = crypto.createHmac('sha256', razorpayKeySecret).update(`${orderId}|${paymentId}`).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

/**
 * Reconciles booking balance and payment status across all verified payments
 */
export async function updateBookingPaymentBalance(bookingId: string): Promise<void> {
  const { data: booking, error: bErr } = await supabaseAdmin
    .from('bookings')
    .select('id, total_amount, booking_status')
    .eq('id', bookingId)
    .single()

  if (bErr || !booking) return

  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('amount')
    .eq('booking_id', bookingId)
    .eq('verification_status', 'verified')

  const verified = payments || []
  const { totalPaid, pendingBalance, paymentStatus } = reconcilePaymentBalance(
    Number(booking.total_amount),
    verified,
  )

  await supabaseAdmin
    .from('bookings')
    .update({
      total_paid: totalPaid,
      pending_balance: pendingBalance,
      payment_status: paymentStatus,
      // If payment is made, booking status becomes confirmed unless cancelled
      booking_status: booking.booking_status === 'enquiry' || booking.booking_status === 'pending'
        ? (totalPaid > 0 ? 'confirmed' : booking.booking_status)
        : booking.booking_status,
      status: totalPaid >= booking.total_amount ? 'paid' : (totalPaid > 0 ? 'partially_paid' : 'payment_pending'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
}

/**
 * Checks for existing duplicate UTR across the entire payments database (Req #8 & #10)
 */
export async function checkDuplicateUtr(utr: string, excludePaymentId?: string): Promise<void> {
  const sanitized = sanitizeUtr(utr)
  if (!sanitized) return

  let query = supabaseAdmin
    .from('payments')
    .select('id, payment_code, amount, booking_id, bookings(booking_code)')
    .ilike('utr_number', sanitized)

  if (excludePaymentId) {
    query = query.neq('id', excludePaymentId)
  }

  const { data: existing, error } = await query.maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new HttpError(500, error.message)
  }

  if (existing) {
    const origBooking = (existing.bookings as any)?.booking_code || existing.booking_id
    throw new HttpError(
      409,
      `Duplicate UTR rejected: Transaction identifier '${sanitized}' has already been recorded in Payment ${existing.payment_code} for Booking ${origBooking}. Same UTR cannot be reused.`,
    )
  }
}

/**
 * GET /api/payments/booking/:bookingId - List all payment installments for a booking
 */
paymentsRouter.get('/booking/:bookingId', requireAuth, async (req, res, next) => {
  try {
    const { bookingId } = req.params

    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (error) throw new HttpError(500, error.message)

    res.json({ payments: payments || [] })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/payments/create-order - Create Razorpay order for outstanding balance
 */
paymentsRouter.post('/create-order', requireAuth, async (req, res, next) => {
  try {
    const { bookingId, amountToPay } = req.body

    if (!bookingId) throw new HttpError(400, 'bookingId is required')

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (error || !booking) throw new HttpError(404, 'Booking not found')

    const total = Number(booking.total_amount)
    const paid = Number(booking.total_paid || 0)
    const outstanding = Math.max(0, total - paid)

    if (outstanding <= 0) {
      throw new HttpError(400, 'Booking is already fully paid')
    }

    // Customer can pay full outstanding balance or partial installment if provided
    let payable = outstanding
    if (amountToPay && Number(amountToPay) > 0 && Number(amountToPay) <= outstanding) {
      payable = Number(amountToPay)
    }

    const amountInPaise = Math.round(payable * 100)

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking.booking_code || booking.booking_reference || booking.id,
      notes: {
        bookingId: booking.id,
      },
    })

    const paymentCode = await getNextPaymentCode()

    // Create pending payment record
    const { data: paymentRecord, error: pErr } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: booking.id,
        payment_code: paymentCode,
        amount: payable,
        payment_mode: 'razorpay',
        razorpay_order_id: order.id,
        verification_status: 'pending',
        status: 'created',
      })
      .select('*')
      .single()

    if (pErr) throw new HttpError(500, pErr.message)

    res.json({
      order,
      payment: paymentRecord,
      outstandingBalance: outstanding,
      payableAmount: payable,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/payments/verify - Verify Razorpay payment and capture installment
 */
paymentsRouter.post('/verify', requireAuth, async (req, res, next) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpError(400, 'Missing verification parameters')
    }

    if (!isValidPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      throw new HttpError(400, 'Invalid Razorpay signature')
    }

    // UTR duplicate check on Razorpay payment ID as transaction reference
    await checkDuplicateUtr(razorpay_payment_id)

    // Update payment record to verified
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        utr_number: razorpay_payment_id,
        verification_status: 'verified',
        status: 'captured',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('booking_id', bookingId)
      .select('*')
      .single()

    if (error || !payment) throw new HttpError(500, error?.message || 'Payment update failed')

    // Reconcile booking balance
    await updateBookingPaymentBalance(bookingId)

    res.json({ success: true, payment })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/payments/record-offline - Staff records manual payment (Cash, Bank Transfer, UPI, Cheque)
 * Enforces UTR duplicate protection strictly!
 */
paymentsRouter.post('/record-offline', requireAuth, requirePaymentStaff, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest
    const { bookingId, amount, paymentMode, utrNumber, notes } = req.body

    if (!bookingId) throw new HttpError(400, 'bookingId is required')
    const amt = Number(amount)
    if (!amt || amt <= 0) throw new HttpError(400, 'Valid positive amount is required')

    const normalizedMode = String(paymentMode || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
    const allowedModes = ['bank_transfer', 'upi', 'cash', 'cheque', 'razorpay']
    if (!normalizedMode || !allowedModes.includes(normalizedMode)) {
      throw new HttpError(400, `Invalid paymentMode. Allowed: ${allowedModes.join(', ')}`)
    }

    // Strict duplicate UTR check (Req #8 & #10)
    const sanitizedUtr = sanitizeUtr(utrNumber)
    if (sanitizedUtr) {
      await checkDuplicateUtr(sanitizedUtr)
    }

    const paymentCode = await getNextPaymentCode()

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: bookingId,
        payment_code: paymentCode,
        amount: amt,
        payment_mode: normalizedMode,
        utr_number: sanitizedUtr || null,
        verification_status: 'verified',
        status: 'captured',
        verified_by: authReq.userId,
        verified_at: new Date().toISOString(),
        notes: notes?.trim() || null,
      })
      .select('*')
      .single()

    if (error) throw new HttpError(500, error.message)

    await updateBookingPaymentBalance(bookingId)

    await logAudit({
      actorId: authReq.userId,
      action: 'PAYMENT_RECORD_OFFLINE',
      entityType: 'payment',
      entityId: payment.id,
      newValues: payment,
      reason: `Recorded offline payment of ₹${amt} (${paymentMode}) with UTR: ${sanitizedUtr || 'N/A'}`,
    })

    res.status(201).json({ success: true, payment })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/payments/:id/correct-utr - Super Admin UTR Correction with Audit Trail
 */
paymentsRouter.patch(['/:id/correct-utr', '/:id/utr'], requireAuth, requireSuperAdmin, async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { id } = req.params as { id: string }
    const { newUtr, utrNumber, reason } = req.body
    const targetUtr = newUtr || utrNumber

    if (!targetUtr || !targetUtr.trim()) throw new HttpError(400, 'newUtr or utrNumber is required')
    if (!reason || !reason.trim()) throw new HttpError(400, 'Reason is required for UTR correction')

    const sanitized = sanitizeUtr(targetUtr)
    await checkDuplicateUtr(sanitized, id)

    const { data: payment, error: fetchErr } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !payment) throw new HttpError(404, 'Payment record not found')

    const oldUtr = payment.utr_number

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('payments')
      .update({ utr_number: sanitized, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (updateErr) throw new HttpError(500, updateErr.message)

    await logAudit({
      actorId: authReq.userId,
      action: 'UTR_CORRECTION',
      entityType: 'payment',
      entityId: id,
      oldValues: { utr_number: oldUtr },
      newValues: { utr_number: sanitized },
      reason: reason.trim(),
    })

    res.json({ success: true, payment: updated })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/payments - List all payments for Admin/Staff
 */
paymentsRouter.get('/', requirePaymentStaff, async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const paymentMode = req.query.paymentMode as string | undefined
    const verificationStatus = req.query.verificationStatus as string | undefined
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Number(req.query.limit || 50))
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('payments')
      .select('*, bookings(id, booking_code, lead_passenger_name, mobile, total_amount, total_paid, pending_balance, groups(group_code))', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`payment_code.ilike.%${search}%,utr_number.ilike.%${search}%`)
    }
    if (paymentMode) {
      query = query.eq('payment_mode', paymentMode)
    }
    if (verificationStatus) {
      query = query.eq('verification_status', verificationStatus)
    }

    const { data: payments, error, count } = await query.range(offset, offset + limit - 1)
    if (error) throw new HttpError(500, error.message)

    res.json({ payments: payments || [], total: count || 0, page, limit })
  } catch (error) {
    next(error)
  }
})
