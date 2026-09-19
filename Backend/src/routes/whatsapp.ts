import { Router } from 'express'
import { HttpError } from '../errors.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole, StaffRequest } from '../middleware/rbac.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import {
  checkWhatsAppTripReadiness,
  sendTripDetailsOnWhatsApp,
  resendWhatsAppMessage,
} from '../services/whatsappService.js'

export const whatsappRouter = Router()

/**
 * GET /api/whatsapp/readiness/:bookingId
 * Evaluates whether ticket and room details are assigned and ready for sending
 */
whatsappRouter.get(
  '/readiness/:bookingId',
  requireAuth,
  requireRole('super_admin', 'admin', 'booking_staff', 'train_ticket_staff', 'room_staff'),
  async (req, res, next) => {
    try {
      const { bookingId } = req.params
      const result = await checkWhatsAppTripReadiness(String(bookingId))
      res.json(result)
    } catch (err) {
      next(err)
    }
  }
)

/**
 * POST /api/whatsapp/send-trip-details
 * Dispatches trip details + ticket PDF to devotee on WhatsApp with single-click action
 */
whatsappRouter.post(
  '/send-trip-details',
  requireAuth,
  requireRole('super_admin', 'admin', 'booking_staff', 'train_ticket_staff', 'room_staff'),
  async (req, res, next) => {
    try {
      const staffReq = req as unknown as StaffRequest
      const { bookingId, recipientPhone, idempotencyKey, forceSendIncomplete } = req.body

      if (!bookingId) {
        throw new HttpError(400, 'bookingId is required')
      }

      const result = await sendTripDetailsOnWhatsApp({
        bookingId,
        actorId: staffReq.userId,
        actorName: staffReq.userName || 'Staff Member',
        actorRole: staffReq.userRole || 'staff',
        recipientPhone,
        idempotencyKey,
        forceSendIncomplete: Boolean(forceSendIncomplete),
      })

      res.status(200).json({
        success: true,
        message: result.isIdempotentReplay ? 'Idempotent replay of previously sent message' : 'Trip details successfully sent on WhatsApp',
        data: result.message,
        isIdempotentReplay: result.isIdempotentReplay,
      })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * POST /api/whatsapp/resend
 * Resends a previously queued or failed WhatsApp message
 */
whatsappRouter.post(
  '/resend',
  requireAuth,
  requireRole('super_admin', 'admin', 'booking_staff', 'train_ticket_staff', 'room_staff'),
  async (req, res, next) => {
    try {
      const staffReq = req as unknown as StaffRequest
      const { messageId } = req.body

      if (!messageId) {
        throw new HttpError(400, 'messageId is required')
      }

      const updated = await resendWhatsAppMessage(messageId, {
        id: staffReq.userId,
        name: staffReq.userName || 'Staff Member',
        role: staffReq.userRole || 'staff',
      })

      res.status(200).json({
        success: true,
        message: 'Message resent successfully',
        data: updated,
      })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * GET /api/whatsapp/logs/:bookingId
 * Retrieves all sent/queued WhatsApp messages for a given booking
 */
whatsappRouter.get(
  '/logs/:bookingId',
  requireAuth,
  requireRole('super_admin', 'admin', 'booking_staff', 'train_ticket_staff', 'room_staff'),
  async (req, res, next) => {
    try {
      const { bookingId } = req.params

      const { data: logs, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new HttpError(500, `Failed to retrieve WhatsApp logs: ${error.message}`)
      }

      res.json({ logs: logs || [] })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * POST /api/whatsapp/webhook
 * Status callback webhook for WhatsApp Cloud API / BSP
 */
whatsappRouter.post('/webhook', async (req, res, next) => {
  try {
    const { id, status, error_code, error_message } = req.body

    if (!id || !status) {
      throw new HttpError(400, 'Message id and status are required in webhook payload')
    }

    const validStatuses = ['queued', 'sent', 'delivered', 'read', 'failed']
    if (!validStatuses.includes(status)) {
      throw new HttpError(400, `Invalid status '${status}'`)
    }

    const { data: updated, error } = await supabaseAdmin
      .from('whatsapp_messages')
      .update({
        status,
        error_code: error_code || null,
        error_message: error_message || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new HttpError(500, `Failed to update status from webhook: ${error.message}`)
    }

    res.json({ success: true, updated })
  } catch (err) {
    next(err)
  }
})
