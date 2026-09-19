import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'
import { supabaseAdmin } from '../../src/services/supabaseAdmin.js'

describe('MAVT WhatsApp Automation & Trip Dispatch Suite (Sections 20-24 & Acceptance Tests 29-32)', () => {
  const SUPER_ADMIN_TOKEN = 'Bearer dev-token-admin1:Admin Officer:admin@mavt.in:super_admin'
  const BOOKING_STAFF_TOKEN = 'Bearer dev-token-staff1:Booking Staff:staff@mavt.in:booking_staff'
  const CUSTOMER_TOKEN = 'Bearer dev-token-customer1:Devotee User:devotee@example.com:user'

  let incompleteBookingId: string
  let completeBookingId: string
  let completePassengerId: string
  let ticketPdfId: string
  let testMessageId: string

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()

    // 1. Create Incomplete Booking (Tourism Yatra without Train or Room assigned)
    const incRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        serviceOption: 'yatra_room_train',
        trainArrangement: 'tourism_arranged',
        leadName: 'Amit Kumar',
        leadPhone: '9811122233',
        whatsappNumber: '9811122233',
        travelerCount: 1,
        passengers: [{ fullName: 'Amit Kumar', age: 32, gender: 'M', phone: '9811122233', travelClass: 'ac' }],
      })
    expect(incRes.status).toBe(201)
    incompleteBookingId = incRes.body.booking.id

    // 2. Create Complete Booking with Train & Room Assigned
    const compRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        serviceOption: 'yatra_room_train',
        trainArrangement: 'tourism_arranged',
        leadName: 'Sunita Sharma',
        leadPhone: '9877788899',
        whatsappNumber: '9877788899',
        travelerCount: 1,
        passengers: [{ fullName: 'Sunita Sharma', age: 45, gender: 'F', phone: '9877788899', travelClass: 'ac' }],
      })
    expect(compRes.status).toBe(201)
    completeBookingId = compRes.body.booking.id
    completePassengerId = compRes.body.passengers[0].id

    // Seed confirmed Ticket PDF
    const { data: ticketPdf } = await supabaseAdmin
      .from('ticket_pdfs')
      .insert({
        pnr: '2345678901',
        train_number: '12425',
        journey_date: '2026-10-02',
        journey_type: 'going',
        file_name: 'confirmed_ticket.pdf',
        file_path: 'uploads/tickets/confirmed_ticket.pdf',
      })
      .select('*')
      .single()
    ticketPdfId = ticketPdf.id

    // Map passenger to Going Ticket
    await supabaseAdmin.from('ticket_passenger_mappings').insert({
      ticket_pdf_id: ticketPdfId,
      passenger_id: completePassengerId,
      pnr: '2345678901',
      journey_type: 'going',
      coach: 'B1',
      seat_berth: '24',
    })

    // Map passenger to Return Ticket
    await supabaseAdmin.from('ticket_passenger_mappings').insert({
      ticket_pdf_id: ticketPdfId,
      passenger_id: completePassengerId,
      pnr: '2345678901',
      journey_type: 'return',
      coach: 'B2',
      seat_berth: '30',
    })

    // Create Room & allocate passenger
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .insert({
        hotel_ashram_name: 'Shri Mata Vaishno Devi Shrine Board Niwas',
        building: 'Block A',
        floor: '2nd Floor',
        room_number: '204',
        room_type: 'AC Double Bed',
        capacity: 2,
        status: 'available',
      })
      .select('*')
      .single()

    await supabaseAdmin.from('room_allocations').insert({
      room_id: room.id,
      passenger_id: completePassengerId,
      booking_id: completeBookingId,
      allocated_by: 'Test Staff',
    })
  })

  // Acceptance Test 29: WhatsApp does not send final trip message before required applicable information is ready
  it('Acceptance Test 29: blocks sending WhatsApp trip details when required travel details are missing', async () => {
    // 1. Check readiness endpoint
    const readyRes = await request(app)
      .get(`/api/whatsapp/readiness/${incompleteBookingId}`)
      .set('Authorization', BOOKING_STAFF_TOKEN)

    expect(readyRes.status).toBe(200)
    expect(readyRes.body.ready).toBe(false)
    expect(readyRes.body.missingFields).toContain('Going Train Ticket & PNR')
    expect(readyRes.body.missingFields).toContain('Return Train Ticket & PNR')
    expect(readyRes.body.missingFields).toContain('Room Allocation')

    // 2. Attempt send trip details
    const sendRes = await request(app)
      .post('/api/whatsapp/send-trip-details')
      .set('Authorization', BOOKING_STAFF_TOKEN)
      .send({ bookingId: incompleteBookingId })

    expect(sendRes.status).toBe(400)
    expect(sendRes.body.error).toContain('Required information is missing')
    expect(sendRes.body.error).toContain('Section 21 mandates complete travel details')
  })

  // Acceptance Test 30: Single-click WhatsApp sends correct recipient + correct details + correct ticket PDF
  it('Acceptance Test 30: single-click WhatsApp sends correct recipient, Hindi message body, and signed ticket PDF attachment', async () => {
    // 1. Check readiness is true
    const readyRes = await request(app)
      .get(`/api/whatsapp/readiness/${completeBookingId}`)
      .set('Authorization', BOOKING_STAFF_TOKEN)

    expect(readyRes.status).toBe(200)
    expect(readyRes.body.ready).toBe(true)

    // 2. Single-click dispatch
    const sendRes = await request(app)
      .post('/api/whatsapp/send-trip-details')
      .set('Authorization', BOOKING_STAFF_TOKEN)
      .send({
        bookingId: completeBookingId,
        idempotencyKey: 'test-wa-key-001',
      })

    expect(sendRes.status).toBe(200)
    expect(sendRes.body.success).toBe(true)
    const msg = sendRes.body.data
    expect(msg).toBeDefined()
    expect(msg.recipient_phone).toBe('9877788899')
    expect(msg.status).toBe('sent')
    expect(msg.template_name).toBe('yatra_trip_details')
    testMessageId = msg.id

    // Check Hindi message content structure
    expect(msg.message_body).toContain('माँ वैष्णवी पर्यटन')
    expect(msg.message_body).toContain('प्रिय यात्री जी')
    expect(msg.message_body).toContain('GOING TRAIN')
    expect(msg.message_body).toContain('PNR: 2345678901')
    expect(msg.message_body).toContain('RETURN TRAIN')
    expect(msg.message_body).toContain('ROOM DETAILS')
    expect(msg.message_body).toContain('Room No.: 204')
    expect(msg.message_body).toContain('आपका Train Ticket PDF इस WhatsApp message के साथ भेजा गया है')

    // Check signed PDF media URL
    expect(msg.media_url).toBeDefined()
    expect(msg.media_url).toContain(`/api/train-tickets/${ticketPdfId}/download?token=`)
  })

  // Idempotency: duplicate dispatch returns existing record without duplicating
  it('prevents duplicate WhatsApp sends via idempotency key', async () => {
    const replayRes = await request(app)
      .post('/api/whatsapp/send-trip-details')
      .set('Authorization', BOOKING_STAFF_TOKEN)
      .send({
        bookingId: completeBookingId,
        idempotencyKey: 'test-wa-key-001',
      })

    expect(replayRes.status).toBe(200)
    expect(replayRes.body.isIdempotentReplay).toBe(true)
    expect(replayRes.body.data.id).toBe(testMessageId)
  })

  // Acceptance Test 31: WhatsApp failure is logged and resend works for authorized user
  it('Acceptance Test 31: logs message failure and allows authorized staff to resend', async () => {
    // 1. Simulate failure webhook callback from BSP
    const webhookRes = await request(app)
      .post('/api/whatsapp/webhook')
      .send({
        id: testMessageId,
        status: 'failed',
        error_code: 'ERR_DELIVERY_TIMEOUT',
        error_message: 'Recipient handset unreachable',
      })

    expect(webhookRes.status).toBe(200)

    // Verify status updated in logs
    const logRes = await request(app)
      .get(`/api/whatsapp/logs/${completeBookingId}`)
      .set('Authorization', BOOKING_STAFF_TOKEN)

    expect(logRes.status).toBe(200)
    const failedMsg = logRes.body.logs.find((l: any) => l.id === testMessageId)
    expect(failedMsg.status).toBe('failed')
    expect(failedMsg.error_code).toBe('ERR_DELIVERY_TIMEOUT')

    // 2. Resend message by staff
    const resendRes = await request(app)
      .post('/api/whatsapp/resend')
      .set('Authorization', BOOKING_STAFF_TOKEN)
      .send({ messageId: testMessageId })

    expect(resendRes.status).toBe(200)
    expect(resendRes.body.data.status).toBe('sent')
    expect(resendRes.body.data.error_code).toBeNull()
  })

  // Acceptance Test 32: All important actions have audit logs
  it('Acceptance Test 32: immutable audit logs recorded for send and resend operations', async () => {
    const auditRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .query({ entityId: completeBookingId })

    expect(auditRes.status).toBe(200)
    const logs = auditRes.body.logs

    const sendLog = logs.find((l: any) => l.action === 'WHATSAPP_TRIP_DETAILS_SENT')
    expect(sendLog).toBeDefined()
    expect(sendLog.entity_id).toBe(completeBookingId)

    const resendLog = logs.find((l: any) => l.action === 'WHATSAPP_MESSAGE_RESENT')
    expect(resendLog).toBeDefined()
    expect(resendLog.entity_id).toBe(completeBookingId)
  })

  // Security: Customer is forbidden from sending WhatsApp staff messages
  it('blocks unauthenticated or non-staff users from accessing WhatsApp dispatch endpoints', async () => {
    const unauthRes = await request(app)
      .post('/api/whatsapp/send-trip-details')
      .send({ bookingId: completeBookingId })
    expect(unauthRes.status).toBe(401)

    const customerRes = await request(app)
      .post('/api/whatsapp/send-trip-details')
      .set('Authorization', CUSTOMER_TOKEN)
      .send({ bookingId: completeBookingId })
    expect(customerRes.status).toBe(403)
  })
})
