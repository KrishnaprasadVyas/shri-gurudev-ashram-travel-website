import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'
import { supabaseAdmin } from '../../src/services/supabaseAdmin.js'

describe('MAVT ID Proof Duplicate Check & Override Suite (Section 6)', () => {
  const SUPER_ADMIN_TOKEN = 'Bearer dev-token-admin1:Admin Officer:admin@mavt.in:super_admin'
  const BOOKING_STAFF_TOKEN = 'Bearer dev-token-staff1:Booking Staff:staff@mavt.in:booking_staff'

  let firstPassengerId: string
  let firstBookingCode: string
  const TEST_AADHAAR = '445566778899'

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()

    // 1. Create first booking with passenger having TEST_AADHAAR
    const bRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        leadName: 'Rameshwar Dayal',
        leadPhone: '9899001122',
        travelerCount: 1,
        passengers: [
          {
            fullName: 'Rameshwar Dayal',
            age: 50,
            gender: 'M',
            phone: '9899001122',
            travelClass: 'ac',
            aadhaarNumber: TEST_AADHAAR,
            idProofNumber: TEST_AADHAAR,
          },
        ],
      })

    expect(bRes.status).toBe(201)
    firstBookingCode = bRes.body.booking.booking_code
    firstPassengerId = bRes.body.passengers[0].id
  })

  it('detects duplicate ID proof number and returns warning with existing passenger/booking/group details', async () => {
    const checkRes = await request(app)
      .post('/api/passengers/check-duplicate-id')
      .set('Authorization', BOOKING_STAFF_TOKEN)
      .send({ idProofNumber: TEST_AADHAAR })

    expect(checkRes.status).toBe(200)
    expect(checkRes.body.isDuplicate).toBe(true)
    expect(checkRes.body.warning).toContain(TEST_AADHAAR)
    expect(checkRes.body.existingPassenger).toBeDefined()
    expect(checkRes.body.existingPassenger.id).toBe(firstPassengerId)
    expect(checkRes.body.existingPassenger.fullName).toBe('Rameshwar Dayal')
    expect(checkRes.body.existingPassenger.bookingCode).toBe(firstBookingCode)
  })

  it('returns isDuplicate: false for a non-registered ID proof number', async () => {
    const checkRes = await request(app)
      .post('/api/passengers/check-duplicate-id')
      .set('Authorization', BOOKING_STAFF_TOKEN)
      .send({ idProofNumber: '999988887777' })

    expect(checkRes.status).toBe(200)
    expect(checkRes.body.isDuplicate).toBe(false)
  })

  it('does NOT reject repeat ID automatically and records admin override decision in immutable audit logs', async () => {
    // 1. Create a second booking with the same devotee for a future trip
    const secondRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        leadName: 'Rameshwar Dayal',
        leadPhone: '9899001122',
        travelerCount: 1,
        passengers: [
          {
            fullName: 'Rameshwar Dayal',
            age: 50,
            gender: 'M',
            phone: '9899001122',
            travelClass: 'non_ac',
            aadhaarNumber: TEST_AADHAAR,
            idProofNumber: TEST_AADHAAR,
          },
        ],
      })

    expect(secondRes.status).toBe(201)
    const secondPassengerId = secondRes.body.passengers[0].id

    // 2. Admin chooses to override / link existing devotee
    const overrideRes = await request(app)
      .post('/api/passengers/override-duplicate-id')
      .set('Authorization', BOOKING_STAFF_TOKEN)
      .send({
        passengerId: secondPassengerId,
        idProofNumber: TEST_AADHAAR,
        linkExistingPassengerId: firstPassengerId,
        overrideReason: 'Devotee confirmed recurring pilgrimage for second season',
      })

    expect(overrideRes.status).toBe(200)
    expect(overrideRes.body.success).toBe(true)

    // 3. Verify audit log was recorded with PASSENGER_ID_DUPLICATE_OVERRIDE
    const auditRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .query({ entityId: secondPassengerId })

    expect(auditRes.status).toBe(200)
    const log = auditRes.body.logs.find((l: any) => l.action === 'PASSENGER_ID_DUPLICATE_OVERRIDE')
    expect(log).toBeDefined()
    expect(log.entity_id).toBe(secondPassengerId)
  })
})
