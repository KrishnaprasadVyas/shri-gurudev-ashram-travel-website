import crypto from 'crypto'
import { Router } from 'express'
import { HttpError } from '../errors.js'
import { razorpayWebhookSecret } from '../services/razorpay.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

export const razorpayWebhookRouter = Router()

razorpayWebhookRouter.post('/', async (request, response, next) => {
  try {
    const signature = request.headers['x-razorpay-signature']
    const eventId = request.headers['x-razorpay-event-id']
    const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.from(JSON.stringify(request.body))

    if (typeof signature !== 'string') {
      throw new HttpError(400, 'Missing Razorpay webhook signature')
    }

    if (!isValidWebhookSignature(rawBody, signature)) {
      throw new HttpError(400, 'Invalid Razorpay webhook signature')
    }

    if (typeof eventId !== 'string') {
      throw new HttpError(400, 'Missing Razorpay webhook event id')
    }

    // Check if this event has already been fully processed
    const { data: existingEvent } = await supabaseAdmin
      .from('razorpay_webhook_events')
      .select('status')
      .eq('event_id', eventId)
      .maybeSingle()

    if (existingEvent?.status === 'done') {
      response.json({ received: true, duplicate: true })
      return
    }

    // Insert or update the event to 'processing' status
    if (!existingEvent) {
      const { error: insertError } = await supabaseAdmin
        .from('razorpay_webhook_events')
        .insert({ event_id: eventId, status: 'processing' })

      // Handle race condition: another request inserted between our check and insert
      if (insertError?.code === '23505') {
        const { data: raceEvent } = await supabaseAdmin
          .from('razorpay_webhook_events')
          .select('status')
          .eq('event_id', eventId)
          .maybeSingle()

        if (raceEvent?.status === 'done') {
          response.json({ received: true, duplicate: true })
          return
        }
      } else if (insertError) {
        throw new HttpError(500, 'Failed to record webhook event')
      }
    } else {
      // Re-process a 'failed' or 'processing' event
      await supabaseAdmin
        .from('razorpay_webhook_events')
        .update({ status: 'processing' })
        .eq('event_id', eventId)
    }

    const payload = JSON.parse(rawBody.toString('utf8'))

    try {
      if (payload.event === 'payment.captured') {
        await reconcileCapturedPayment(payload.payload?.payment?.entity)
      }

      if (payload.event === 'payment.failed') {
        await reconcileFailedPayment(payload.payload?.payment?.entity)
      }

      // Mark as done only AFTER reconciliation succeeds
      await supabaseAdmin
        .from('razorpay_webhook_events')
        .update({ status: 'done' })
        .eq('event_id', eventId)
    } catch (reconcileError) {
      // Mark as failed so retries can reprocess
      await supabaseAdmin
        .from('razorpay_webhook_events')
        .update({ status: 'failed' })
        .eq('event_id', eventId)
      throw reconcileError
    }

    response.json({ received: true })
  } catch (error) {
    next(error)
  }
})


function isValidWebhookSignature(rawBody: Buffer, signature: string) {
  const expectedSignature = crypto
    .createHmac('sha256', razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex')

  return expectedSignature.length === signature.length && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
}

async function reconcileCapturedPayment(payment: any) {
  if (!payment?.id || !payment?.order_id) {
    return
  }

  const { data: existingPayment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('razorpay_order_id', payment.order_id)
    .maybeSingle()

  if (paymentError || !existingPayment) {
    throw new HttpError(404, paymentError?.message ?? 'Payment record not found for Razorpay order')
  }

  if (existingPayment.status === 'captured') {
    return
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', existingPayment.booking_id)
    .single()

  if (bookingError || !booking) {
    throw new HttpError(404, bookingError?.message ?? 'Booking not found for payment')
  }

  const { error: captureError } = await supabaseAdmin.rpc('capture_booking_payment' as never, {
    p_booking_id: booking.id,
    p_razorpay_order_id: payment.order_id,
    p_razorpay_payment_id: payment.id,
    p_razorpay_signature: existingPayment.razorpay_signature,
    p_payment_method: payment.method ?? existingPayment.payment_method,
    p_gateway_fee: payment.fee ? Number(payment.fee) / 100 : existingPayment.gateway_fee,
  } as never)

  if (captureError) {
    throw new HttpError(500, captureError.message)
  }
}

async function reconcileFailedPayment(payment: any) {
  if (!payment?.order_id) {
    return
  }

  const { error } = await supabaseAdmin
    .from('payments')
    .update({
      razorpay_payment_id: payment.id ?? null,
      payment_method: payment.method ?? 'razorpay',
      status: 'failed',
    })
    .eq('razorpay_order_id', payment.order_id)
    .neq('status', 'captured')

  if (error) {
    throw new HttpError(500, error.message)
  }
}
