import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'
import { supabaseAdmin } from '../../src/services/supabaseAdmin.js'

describe('Customer My Trip Dossier & IDOR Security Suite', () => {
  const CUSTOMER_TOKEN = 'Bearer dev-token-customer1:Rajesh Sharma:rajesh@example.com:user'

  let bookingCodeA: string
  let bookingCodeB: string
  let mobileA = '9876543210'
  let mobileB = '9123456789'
  let tripTokenA: string

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()

    // 1. Create Group A & Booking A (Customer A)
    const { data: grpA } = await supabaseAdmin
      .from('groups')
      .insert({ group_code: 'GRP-1001', name: 'Sharma Mandal', lead_mobile: mobileA })
      .select('*')
      .single()

    const bResA = await request(app)
      .post('/api/bookings')
      .set('Authorization', CUSTOMER_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        groupId: grpA.id,
        travelerCount: 2,
        leadName: 'Rajesh Sharma',
        leadPhone: mobileA,
        passengers: [
          { full_name: 'Rajesh Sharma', age: 45, gender: 'M', phone: mobileA, travel_class: 'ac' },
          { full_name: 'Priya Sharma', age: 40, gender: 'F', phone: '9876543211', travel_class: 'ac' },
        ],
      })
    bookingCodeA = bResA.body.booking.booking_code

    // 2. Create Group B & Booking B (Customer B)
    const { data: grpB } = await supabaseAdmin
      .from('groups')
      .insert({ group_code: 'GRP-1002', name: 'Verma Parivar', lead_mobile: mobileB })
      .select('*')
      .single()

    const bResB = await request(app)
      .post('/api/bookings')
      .set('Authorization', CUSTOMER_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        groupId: grpB.id,
        travelerCount: 1,
        leadName: 'Deepak Verma',
        leadPhone: mobileB,
        passengers: [
          { full_name: 'Deepak Verma', age: 33, gender: 'M', phone: mobileB, travel_class: 'non_ac' },
        ],
      })
    bookingCodeB = bResB.body.booking.booking_code
  })

  it('authenticates customer with valid Booking ID and lead mobile number', async () => {
    const res = await request(app)
      .post('/api/my-trip/lookup')
      .send({
        bookingCode: bookingCodeA,
        mobile: mobileA,
      })

    expect(res.status).toBe(200)
    expect(res.body.tripToken).toBeDefined()
    expect(res.body.dossier).toBeDefined()
    expect(res.body.dossier.bookingCode).toBe(bookingCodeA)
    expect(res.body.dossier.groupName).toBe('Sharma Mandal')
    tripTokenA = res.body.tripToken
  })

  it('authenticates accompanying passenger with valid Booking ID and accompanying mobile', async () => {
    const res = await request(app)
      .post('/api/my-trip/lookup')
      .send({
        bookingCode: bookingCodeA,
        mobile: '9876543211', // Accompanying passenger Priya Sharma
      })

    expect(res.status).toBe(200)
    expect(res.body.tripToken).toBeDefined()
    expect(res.body.dossier.bookingCode).toBe(bookingCodeA)
  })

  it('rejects lookup when mobile number does not match the booking', async () => {
    const res = await request(app)
      .post('/api/my-trip/lookup')
      .send({
        bookingCode: bookingCodeA,
        mobile: mobileB, // Mismatched mobile from another customer!
      })

    expect(res.status).toBe(403)
    expect(res.body.error).toContain('does not match')
  })

  it('rejects lookup when Booking ID is invalid or does not exist', async () => {
    const res = await request(app)
      .post('/api/my-trip/lookup')
      .send({
        bookingCode: 'MVT-999999-9999',
        mobile: mobileA,
      })

    expect(res.status).toBe(404)
    expect(res.body.error).toContain('No booking found')
  })

  it('rejects tampered or forged trip tokens when requesting dossier directly', async () => {
    const tamperedToken = tripTokenA.slice(0, -5) + 'xxxxx'
    const res = await request(app)
      .get(`/api/my-trip/dossier?token=${tamperedToken}`)

    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Invalid or expired session token')
  })

  it('prevents IDOR: Token from Customer A cannot be used to read Customer B data', async () => {
    const resA = await request(app)
      .get(`/api/my-trip/dossier?token=${tripTokenA}`)

    expect(resA.status).toBe(200)
    // Asserts that dossier strictly returns Customer A's booking
    expect(resA.body.trip.bookingCode).toBe(bookingCodeA)
    expect(resA.body.trip.bookingCode).not.toBe(bookingCodeB)
    expect(resA.body.trip.groupName).toBe('Sharma Mandal')
  })

  it('isolates payment information: dossier only returns payments belonging to this booking', async () => {
    const res = await request(app)
      .get(`/api/my-trip/dossier?token=${tripTokenA}`)

    expect(res.status).toBe(200)
    const payments = res.body.trip.payments
    for (const p of payments) {
      expect(p.booking_id).toBe(res.body.trip.bookingId)
    }
  })

  it('masks sensitive identification fields in public dossier response', async () => {
    const res = await request(app)
      .get(`/api/my-trip/dossier?token=${tripTokenA}`)

    expect(res.status).toBe(200)
    const passengers = res.body.trip.passengers
    for (const p of passengers) {
      // Sensitive fields such as raw Aadhaar or national ID must not be exposed in customer dossier
      expect((p as any).aadhaar_number).toBeUndefined()
      expect((p as any).id_proof_number).toBeUndefined()
    }
  })
})
