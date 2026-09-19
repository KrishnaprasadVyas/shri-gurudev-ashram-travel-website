import crypto from 'crypto'
import { supabaseAdmin } from './supabaseAdmin.js'
import { logAudit } from './auditLogger.js'
import { generateTicketDownloadToken } from '../routes/trainJourneys.js'
import { HttpError } from '../errors.js'

export interface WhatsAppMessagePayload {
  bookingId: string
  actorId?: string
  actorName?: string
  actorRole?: string
  recipientPhone?: string
  idempotencyKey?: string
  forceSendIncomplete?: boolean
}

export interface ReadinessCheckResult {
  ready: boolean
  serviceOption: string
  missingFields: string[]
  details: {
    hasGoingTrain: boolean
    hasReturnTrain: boolean
    hasRoom: boolean
    recipientPhone: string
    passengerName: string
  }
}

/**
 * Checks whether a booking has all required information ready for WhatsApp trip details dispatch
 * Section 21 of Requirement Specification:
 * - Tourism-arranged Train + Room: requires both confirmed ticket and room information
 * - Room-only: requires room confirmed; train NOT required
 * - Self-arranged train: requires room confirmed; train NOT mandatory
 */
export async function checkWhatsAppTripReadiness(bookingId: string): Promise<ReadinessCheckResult> {
  const { data: booking, error: bErr } = await supabaseAdmin
    .from('bookings')
    .select('*, groups(*)')
    .eq('id', bookingId)
    .single()

  if (bErr || !booking) {
    throw new HttpError(404, `Booking with ID ${bookingId} not found`)
  }

  const { data: passengers } = await supabaseAdmin
    .from('passengers')
    .select('*')
    .eq('booking_id', bookingId)

  const passList = passengers || []
  const passengerIds = passList.map((p: any) => p.id)

  let hasGoingTrain = false
  let hasReturnTrain = false
  let hasRoom = false

  if (passengerIds.length > 0) {
    // Check train mappings
    const { data: mappings } = await supabaseAdmin
      .from('ticket_passenger_mappings')
      .select('journey_type')
      .in('passenger_id', passengerIds)

    if (mappings && mappings.length > 0) {
      hasGoingTrain = mappings.some((m: any) => m.journey_type === 'going')
      hasReturnTrain = mappings.some((m: any) => m.journey_type === 'return')
    }

    // Check room allocations
    const { data: allocations } = await supabaseAdmin
      .from('room_allocations')
      .select('id')
      .in('passenger_id', passengerIds)

    if (allocations && allocations.length > 0) {
      hasRoom = true
    }
  }

  // Also check direct room booking info if only_room
  if (booking.service_option === 'only_room' && (booking.hotel_name || booking.room_rent)) {
    hasRoom = true
  }

  const serviceOption = booking.service_option || 'yatra_room_train'
  const trainArrangement = booking.train_arrangement || 'tourism_arranged'
  const missingFields: string[] = []

  if (serviceOption === 'yatra_room_train' && trainArrangement === 'tourism_arranged') {
    if (!hasGoingTrain) missingFields.push('Going Train Ticket & PNR')
    if (!hasReturnTrain) missingFields.push('Return Train Ticket & PNR')
    if (!hasRoom) missingFields.push('Room Allocation')
  } else if (serviceOption === 'only_room') {
    if (!hasRoom) missingFields.push('Room Allocation / Stay Confirmation')
  } else if (serviceOption === 'yatra_room_train_self' || trainArrangement === 'customer_self_arranged') {
    if (!hasRoom) missingFields.push('Room Allocation')
  }

  const recipientPhone = booking.whatsapp_number || booking.mobile || booking.phone_number || ''
  const passengerName = booking.lead_passenger_name || booking.full_name || 'Devotee'

  return {
    ready: missingFields.length === 0,
    serviceOption,
    missingFields,
    details: {
      hasGoingTrain,
      hasReturnTrain,
      hasRoom,
      recipientPhone,
      passengerName,
    },
  }
}

/**
 * Builds the official Hindi WhatsApp message body conforming to Section 22
 */
export function buildWhatsAppMessageBody(data: {
  bookingCode: string
  groupCode?: string
  passengerName: string
  serviceOption: string
  goingTrain?: { trainNoName: string; journeyDate: string; pnr: string; seatCoach: string; boarding: string; destination: string }
  returnTrain?: { trainNoName: string; journeyDate: string; pnr: string; seatCoach: string }
  room?: { hotel: string; building: string; floor: string; roomNumber: string; roomType: string }
  hasTicketPdf: boolean
}): string {
  const lines: string[] = []

  lines.push('🛕 माँ वैष्णवी पर्यटन')
  lines.push('प्रिय यात्री जी,')
  lines.push('आपकी यात्रा संबंधी जानकारी:')
  lines.push('')
  lines.push(`🆔 Booking ID: ${data.bookingCode}`)
  if (data.groupCode) {
    lines.push(`👥 Group ID: ${data.groupCode}`)
  }
  lines.push(`👤 Passenger Name: ${data.passengerName}`)
  lines.push('')

  // Going train section (only if tourism/available)
  if (data.goingTrain && data.serviceOption !== 'only_room') {
    lines.push('🚆 GOING TRAIN')
    lines.push(`Train No./Name: ${data.goingTrain.trainNoName || 'Special Pilgrimage Express'}`)
    lines.push(`Journey Date: ${data.goingTrain.journeyDate || 'As scheduled'}`)
    lines.push(`PNR: ${data.goingTrain.pnr || 'Allocated'}`)
    lines.push(`Coach/Seat: ${data.goingTrain.seatCoach || 'Confirmed'}`)
    lines.push(`Boarding: ${data.goingTrain.boarding || 'NDLS'}`)
    lines.push(`Destination: ${data.goingTrain.destination || 'SVDK'}`)
    lines.push('')
  }

  // Return train section
  if (data.returnTrain && data.serviceOption !== 'only_room') {
    lines.push('🚆 RETURN TRAIN')
    lines.push(`Train No./Name: ${data.returnTrain.trainNoName || 'Special Pilgrimage Express'}`)
    lines.push(`Journey Date: ${data.returnTrain.journeyDate || 'As scheduled'}`)
    lines.push(`PNR: ${data.returnTrain.pnr || 'Allocated'}`)
    lines.push(`Coach/Seat: ${data.returnTrain.seatCoach || 'Confirmed'}`)
    lines.push('')
  }

  // Room details section
  if (data.room) {
    lines.push('🏨 ROOM DETAILS')
    lines.push(`Hotel/Ashram: ${data.room.hotel || 'Ashram Niwas'}`)
    if (data.room.building) lines.push(`Building: ${data.room.building}`)
    if (data.room.floor) lines.push(`Floor: ${data.room.floor}`)
    lines.push(`Room No.: ${data.room.roomNumber || 'Assigned upon arrival'}`)
    lines.push(`Room Type: ${data.room.roomType || 'AC Room'}`)
    lines.push('')
  }

  if (data.hasTicketPdf && data.serviceOption !== 'only_room') {
    lines.push('📎 आपका Train Ticket PDF इस WhatsApp message के साथ भेजा गया है।')
    lines.push('')
  }

  lines.push('🛕 माँ वैष्णवी पर्यटन')
  return lines.join('\n')
}

/**
 * Sends trip details over WhatsApp via Cloud API / Mock BSP provider
 * Persists record in whatsapp_messages table and logs immutable audit trail
 */
export async function sendTripDetailsOnWhatsApp(payload: WhatsAppMessagePayload) {
  const { bookingId, actorId, actorName = 'Admin Staff', actorRole = 'super_admin', recipientPhone, idempotencyKey, forceSendIncomplete } = payload

  // Check idempotency if key provided
  if (idempotencyKey) {
    const { data: existing } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existing && existing.status !== 'failed') {
      return {
        message: existing,
        isIdempotentReplay: true,
      }
    }
  }

  // 1. Check readiness
  const readiness = await checkWhatsAppTripReadiness(bookingId)
  if (!readiness.ready && !forceSendIncomplete) {
    throw new HttpError(
      400,
      `Cannot send WhatsApp trip details: Required information is missing (${readiness.missingFields.join(', ')}). Section 21 mandates complete travel details before sending final trip message.`
    )
  }

  // 2. Fetch full booking details
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*, groups(*)')
    .eq('id', bookingId)
    .single()

  const { data: passengers } = await supabaseAdmin
    .from('passengers')
    .select('*')
    .eq('booking_id', bookingId)

  const passList = passengers || []
  const passengerIds = passList.map((p: any) => p.id)

  let goingTrainData: any = null
  let returnTrainData: any = null
  let primaryTicketPdfId: string | null = null

  if (passengerIds.length > 0) {
    const { data: mappings } = await supabaseAdmin
      .from('ticket_passenger_mappings')
      .select('*, ticket_pdfs(*)')
      .in('passenger_id', passengerIds)

    const mapList = mappings || []
    const going = mapList.filter((m: any) => m.journey_type === 'going')
    if (going.length > 0) {
      primaryTicketPdfId = going[0].ticket_pdf_id
      goingTrainData = {
        trainNoName: going[0].ticket_pdfs?.train_number ? `Train ${going[0].ticket_pdfs.train_number}` : 'Express',
        journeyDate: going[0].ticket_pdfs?.journey_date || booking.going_date,
        pnr: going[0].pnr,
        seatCoach: going.map((g: any) => `${g.coach || ''} ${g.seat_berth || ''}`.trim()).filter(Boolean).join(', ') || 'Confirmed',
        boarding: booking.boarding_station || 'NDLS',
        destination: booking.destination_station || 'SVDK',
      }
    }

    const ret = mapList.filter((m: any) => m.journey_type === 'return')
    if (ret.length > 0) {
      if (!primaryTicketPdfId) primaryTicketPdfId = ret[0].ticket_pdf_id
      returnTrainData = {
        trainNoName: ret[0].ticket_pdfs?.train_number ? `Train ${ret[0].ticket_pdfs.train_number}` : 'Express',
        journeyDate: ret[0].ticket_pdfs?.journey_date || booking.return_date,
        pnr: ret[0].pnr,
        seatCoach: ret.map((r: any) => `${r.coach || ''} ${r.seat_berth || ''}`.trim()).filter(Boolean).join(', ') || 'Confirmed',
      }
    }
  }

  // Room details
  let roomData: any = null
  if (passengerIds.length > 0) {
    const { data: allocations } = await supabaseAdmin
      .from('room_allocations')
      .select('*, rooms(*)')
      .in('passenger_id', passengerIds)

    if (allocations && allocations.length > 0 && allocations[0].rooms) {
      const r = allocations[0].rooms
      roomData = {
        hotel: r.hotel_ashram_name,
        building: r.building,
        floor: r.floor,
        roomNumber: r.room_number,
        roomType: r.room_type,
      }
    }
  }

  if (!roomData && booking.hotel_name) {
    roomData = {
      hotel: booking.hotel_name,
      building: 'Main Block',
      floor: 'Ground',
      roomNumber: 'Assigned upon arrival',
      roomType: booking.room_type || 'AC Room',
    }
  }

  // Signed PDF streaming download link
  let signedMediaUrl: string | null = null
  if (primaryTicketPdfId) {
    const token = generateTicketDownloadToken(primaryTicketPdfId, 7 * 24 * 3600) // 7-day token
    signedMediaUrl = `/api/train-tickets/${primaryTicketPdfId}/download?token=${token}`
  }

  // Recipient resolution
  const targetPhone = recipientPhone?.trim() || booking.whatsapp_number || booking.mobile || booking.phone_number
  if (!targetPhone) {
    throw new HttpError(400, 'No recipient phone or WhatsApp number found for this booking')
  }

  const messageBody = buildWhatsAppMessageBody({
    bookingCode: booking.booking_code || booking.booking_reference,
    groupCode: booking.groups?.group_code,
    passengerName: booking.lead_passenger_name || 'Devotee',
    serviceOption: booking.service_option || 'yatra_room_train',
    goingTrain: goingTrainData,
    returnTrain: returnTrainData,
    room: roomData,
    hasTicketPdf: Boolean(signedMediaUrl),
  })

  const messageId = `wa_msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

  // 3. Insert into central database
  const { data: savedMsg, error: msgError } = await supabaseAdmin
    .from('whatsapp_messages')
    .insert({
      id: messageId,
      booking_id: bookingId,
      group_id: booking.group_id || null,
      passenger_id: passList[0]?.id || null,
      recipient_phone: targetPhone,
      recipient_name: booking.lead_passenger_name,
      template_name: 'yatra_trip_details',
      message_body: messageBody,
      media_url: signedMediaUrl,
      status: 'sent', // Simulated WhatsApp Cloud API delivery
      idempotency_key: idempotencyKey || null,
      sent_by: actorId || null,
      sent_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (msgError) {
    throw new HttpError(500, `Failed to store WhatsApp message: ${msgError.message}`)
  }

  // 4. Log immutable audit trail
  await logAudit({
    actorId: actorId || null,
    actorName: actorName || 'Staff Member',
    actorRole: actorRole || 'staff',
    action: 'WHATSAPP_TRIP_DETAILS_SENT',
    entityType: 'booking',
    entityId: bookingId,
    newValues: {
      messageId,
      recipientPhone: targetPhone,
      template: 'yatra_trip_details',
      hasTicketPdf: Boolean(signedMediaUrl),
    },
    reason: `WhatsApp trip details sent to ${targetPhone}`,
  })

  return {
    message: savedMsg,
    isIdempotentReplay: false,
  }
}

/**
 * Resends a previously stored WhatsApp message
 */
export async function resendWhatsAppMessage(messageId: string, actor: { id?: string; name: string; role: string }) {
  const { data: existing, error } = await supabaseAdmin
    .from('whatsapp_messages')
    .select('*')
    .eq('id', messageId)
    .single()

  if (error || !existing) {
    throw new HttpError(404, `WhatsApp message ${messageId} not found`)
  }

  const { data: updated, error: updError } = await supabaseAdmin
    .from('whatsapp_messages')
    .update({
      status: 'sent',
      error_code: null,
      error_message: null,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select('*')
    .single()

  if (updError) {
    throw new HttpError(500, `Failed to update resend status: ${updError.message}`)
  }

  await logAudit({
    actorId: actor.id || null,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'WHATSAPP_MESSAGE_RESENT',
    entityType: 'booking',
    entityId: existing.booking_id,
    oldValues: { previousStatus: existing.status },
    newValues: { status: 'sent', messageId },
    reason: `WhatsApp message resent to ${existing.recipient_phone}`,
  })

  return updated
}
