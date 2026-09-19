import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import crypto from 'crypto'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'
import { supabaseAdmin } from '../../src/services/supabaseAdmin.js'
import { razorpayWebhookSecret } from '../../src/services/razorpay.js'

describe('Payment Security & Webhook Integration Suite', () => {
  const SUPER_ADMIN_TOKEN = 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin'
  const PAYMENT_STAFF_TOKEN = 'Bearer dev-token-paymentstaff:Payment Staff:payment@mavt.in:payment_staff'
  const BOOKING_STAFF_TOKEN = 'Bearer dev-token-bookingstaff:Booking Staff:booking@mavt.in:booking_staff'
  const CUSTOMER_TOKEN = 'Bearer dev-token-customer1:Rajesh Sharma:rajesh@example.com:user'

  let bookingId: string
  let bookingCode: string
  let firstPaymentId: string

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()

    // 1. Create a group
    const { data: group } = await supabaseAdmin
      .from('groups')
      .insert({
        group_code: 'GRP-9901',
        name: 'Gupta Parivar',
        lead_mobile: '9811223344',
      })
      .select('*')
      .single()

    // 2. Create a booking with total amount 38,000 (2 AC = 29,000 + 1 Non-AC = 9,000 approx)
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', CUSTOMER_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        groupId: group.id,
        travelerCount: 3,
        leadName: 'Ramesh Gupta',
        leadPhone: '9811223344',
        passengers: [
          { full_name: 'Ramesh Gupta', age: 50, gender: 'M', phone: '9811223344', travel_class: 'ac' },
          { full_name: 'Seema Gupta', age: 46, gender: 'F', phone: '9811223344', travel_class: 'ac' },
          { full_name: 'Ankit Gupta', age: 22, gender: 'M', phone: '9811223345', travel_class: 'non_ac' },
        ],
      })

    expect(bookingRes.status).toBe(201)
    bookingId = bookingRes.body.booking.id
    bookingCode = bookingRes.body.booking.booking_code
  })

  it('records a partial advance payment and correctly reconciles pending balance', async () => {
    const res = await request(app)
      .post('/api/payments/record-offline')
      .set('Authorization', PAYMENT_STAFF_TOKEN)
      .send({
        bookingId,
        amount: 15000,
        paymentMode: 'Bank Transfer',
        utrNumber: 'HDFC0012345678',
        notes: 'Initial token deposit',
      })

    expect(res.status).toBe(201)
    expect(res.body.payment).toBeDefined()
    expect(res.body.payment.amount).toBe(15000)
    expect(res.body.payment.verification_status).toBe('verified')
    firstPaymentId = res.body.payment.id

    // Check booking balance
    const bRes = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', BOOKING_STAFF_TOKEN)

    expect(bRes.body.booking.total_paid).toBe(15000)
    expect(bRes.body.booking.pending_balance).toBe(bRes.body.booking.total_amount - 15000)
    expect(bRes.body.booking.payment_status).toBe('partially_paid')
  })

  it('records multiple installments on the same booking until fully paid', async () => {
    const bRes1 = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', BOOKING_STAFF_TOKEN)

    const remaining = bRes1.body.booking.pending_balance

    // Pay remaining balance in full
    const res = await request(app)
      .post('/api/payments/record-offline')
      .set('Authorization', PAYMENT_STAFF_TOKEN)
      .send({
        bookingId,
        amount: remaining,
        paymentMode: 'UPI',
        utrNumber: 'UPI98765432101',
        notes: 'Final installment settlement',
      })

    expect(res.status).toBe(201)

    // Check booking balance is now zero and fully paid
    const bRes2 = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', BOOKING_STAFF_TOKEN)

    expect(bRes2.body.booking.pending_balance).toBe(0)
    expect(bRes2.body.booking.payment_status).toBe('fully_paid')
    expect(bRes2.body.booking.total_paid).toBe(bRes2.body.booking.total_amount)
  })

  it('strictly rejects duplicate UTR with HTTP 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/payments/record-offline')
      .set('Authorization', PAYMENT_STAFF_TOKEN)
      .send({
        bookingId,
        amount: 5000,
        paymentMode: 'UPI',
        utrNumber: 'HDFC0012345678', // Exact duplicate of first payment!
        notes: 'Attempting duplicate UTR',
      })

    expect(res.status).toBe(409)
    expect(res.body.error).toContain('Duplicate UTR')
  })

  it('rejects duplicate UTR with differing case and leading/trailing whitespace', async () => {
    const res = await request(app)
      .post('/api/payments/record-offline')
      .set('Authorization', PAYMENT_STAFF_TOKEN)
      .send({
        bookingId,
        amount: 5000,
        paymentMode: 'UPI',
        utrNumber: '   hdfc0012345678   ', // Lowercase + Whitespace!
        notes: 'Attempting tricky duplicate UTR',
      })

    expect(res.status).toBe(409)
    expect(res.body.error).toContain('Duplicate UTR')
  })

  it('handles concurrent duplicate UTR race condition allowing only one success', async () => {
    const RACE_UTR = 'RACE_UTR_CONCURRENT_001'
    const results = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        request(app)
          .post('/api/payments/record-offline')
          .set('Authorization', PAYMENT_STAFF_TOKEN)
          .send({
            bookingId,
            amount: 1000,
            paymentMode: 'Cash',
            utrNumber: RACE_UTR,
          }),
      ),
    )

    const successes = results.filter((r) => r.status === 201)
    const conflicts = results.filter((r) => r.status === 409)

    expect(successes.length).toBe(1)
    expect(conflicts.length).toBe(9)
  })

  it('rejects UTR correction attempt by non-super-admin staff with 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/payments/${firstPaymentId}/utr`)
      .set('Authorization', PAYMENT_STAFF_TOKEN) // Payment staff cannot correct UTR!
      .send({
        utrNumber: 'NEW_UTR_123',
        reason: 'Typo correction',
      })

    expect(res.status).toBe(403)
  })

  it('allows Super Admin to correct UTR and writes immutable audit log', async () => {
    const CORRECTED_UTR = 'HDFC0012349999'
    const res = await request(app)
      .patch(`/api/payments/${firstPaymentId}/utr`)
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .send({
        utrNumber: CORRECTED_UTR,
        reason: 'Bank passbook reconciliation confirmed last 4 digits were 9999',
      })

    expect(res.status).toBe(200)
    expect(res.body.payment.utr_number).toBe(CORRECTED_UTR)

    // Verify audit log entry exists
    const { data: audits } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('entity_id', firstPaymentId)
      .eq('action', 'UTR_CORRECTION')

    expect(audits).toBeDefined()
    expect(audits!.length).toBeGreaterThanOrEqual(1)
    expect(audits![0].reason).toContain('Bank passbook reconciliation')
  })

  it('validates Razorpay webhook signature and rejects invalid signatures', async () => {
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_rzp_mock_12345',
            order_id: 'order_mock_123',
            amount: 500000,
            status: 'captured',
          },
        },
      },
    })

    // Invalid signature
    const resInvalid = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', 'invalid_signature_hex_12345')
      .set('x-razorpay-event-id', 'evt_mock_001')
      .set('content-type', 'application/json')
      .send(payload)

    expect(resInvalid.status).toBe(400)
    expect(resInvalid.body.error).toContain('Invalid Razorpay webhook signature')
  })

  it('processes valid Razorpay webhook and maintains idempotency on duplicate delivery', async () => {
    const eventId = `evt_${Date.now()}_test`
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_rzp_idempotent_01',
            order_id: 'order_mock_idem_01',
            amount: 100000,
            status: 'captured',
          },
        },
      },
    }
    // Seed pending payment matching order_id
    await supabaseAdmin.from('payments').insert({
      booking_id: bookingId,
      payment_code: 'PAY-RZP-IDEM',
      amount: 1000,
      payment_mode: 'razorpay',
      razorpay_order_id: 'order_mock_idem_01',
      verification_status: 'pending',
      status: 'created',
    })

    const rawBody = JSON.stringify(payloadObj)
    const validSignature = crypto
      .createHmac('sha256', razorpayWebhookSecret || 'ashramapp')
      .update(rawBody)
      .digest('hex')

    // First webhook delivery
    const res1 = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', validSignature)
      .set('x-razorpay-event-id', eventId)
      .set('content-type', 'application/json')
      .send(rawBody)

    expect(res1.status).toBe(200)
    expect(res1.body.received).toBe(true)

    // Second webhook delivery with IDENTICAL eventId
    const res2 = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', validSignature)
      .set('x-razorpay-event-id', eventId)
      .set('content-type', 'application/json')
      .send(rawBody)

    expect(res2.status).toBe(200)
    expect(res2.body.received).toBe(true)
    expect(res2.body.duplicate).toBe(true) // Idempotency recognized!
  })
})
