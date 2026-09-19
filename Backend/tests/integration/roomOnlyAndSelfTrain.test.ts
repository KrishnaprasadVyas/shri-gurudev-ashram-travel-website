import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'

describe('MAVT Room-Only Guest & Self-Arranged Train Suite (Section 18 & 19)', () => {
  const SUPER_ADMIN_TOKEN = 'Bearer dev-token-admin1:Admin Officer:admin@mavt.in:super_admin'
  const CUSTOMER_TOKEN = 'Bearer dev-token-customer1:Rajesh Sharma:rajesh@example.com:user'

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()
  })

  // Acceptance Test 24: Room-only guest works without train/PNR/ticket
  it('Acceptance Test 24: allows Room-Only guest booking without train/PNR/ticket fields', async () => {
    const roomOnlyPayload = {
      serviceOption: 'only_room',
      trainArrangement: 'none',
      bookingChannel: 'Admin-Panel',
      leadName: 'Smt. Shanti Devi',
      leadPhone: '9811223344',
      hotelName: 'Vaishnavi Bhawan',
      checkInDate: '2026-10-10',
      checkOutDate: '2026-10-13',
      roomRent: 4500,
      roomType: 'Deluxe AC Room',
      travelerCount: 2,
      passengers: [
        {
          fullName: 'Smt. Shanti Devi',
          age: 62,
          gender: 'F',
          phone: '9811223344',
          travelClass: 'ac',
          aadhaarNumber: '123456789012',
        },
        {
          fullName: 'Shri Ram Prasad',
          age: 65,
          gender: 'M',
          phone: '9811223345',
          travelClass: 'ac',
          aadhaarNumber: '123456789013',
        },
      ],
    }

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .send(roomOnlyPayload)

    expect(res.status).toBe(201)
    expect(res.body.booking).toBeDefined()
    expect(res.body.booking.service_option).toBe('only_room')
    expect(res.body.booking.train_arrangement).toBe('none')
    expect(res.body.booking.booking_channel).toBe('Admin-Panel')
    expect(res.body.booking.boarding_station).toBeNull()
    expect(res.body.booking.destination_station).toBeNull()
    expect(Number(res.body.booking.total_amount)).toBe(4500)
    expect(Number(res.body.booking.room_rent)).toBe(4500)
    expect(res.body.booking.hotel_name).toBe('Vaishnavi Bhawan')
  })

  // Acceptance Test 25: Self-arranged train guest can use room service without train details
  it('Acceptance Test 25: allows Self-Arranged Train guest booking without mandatory train details', async () => {
    const selfTrainPayload = {
      packageId: 'default-pkg-001',
      serviceOption: 'yatra_room_train_self',
      trainArrangement: 'customer_self_arranged',
      bookingChannel: 'Customer-Web',
      leadName: 'Vikram Singh',
      leadPhone: '9877665544',
      travelerCount: 1,
      passengers: [
        {
          fullName: 'Vikram Singh',
          age: 35,
          gender: 'M',
          phone: '9877665544',
          travelClass: 'ac',
        },
      ],
    }

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', CUSTOMER_TOKEN)
      .send(selfTrainPayload)

    expect(res.status).toBe(201)
    expect(res.body.booking).toBeDefined()
    expect(res.body.booking.service_option).toBe('yatra_room_train_self')
    expect(res.body.booking.train_arrangement).toBe('customer_self_arranged')
    expect(res.body.booking.booking_channel).toBe('Customer-Web')
  })

  // Acceptance Test 26: Admin can later add train details
  it('Acceptance Test 26: allows Admin to later add train details to a room-only or self-arranged booking', async () => {
    // 1. Create room only booking
    const bRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .send({
        serviceOption: 'only_room',
        leadName: 'Gopal Krishna',
        leadPhone: '9822334455',
        travelerCount: 1,
        hotelName: 'Shri Ram Ashram',
        roomRent: 2000,
        passengers: [{ fullName: 'Gopal Krishna', age: 40, gender: 'M', phone: '9822334455' }],
      })

    expect(bRes.status).toBe(201)
    const bookingId = bRes.body.booking.id

    // 2. Admin adds train details later
    const trainUpdateRes = await request(app)
      .post(`/api/bookings/${bookingId}/train-details`)
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .send({
        boardingStation: 'NDLS',
        destinationStation: 'SVDK',
        goingDate: '2026-10-10',
        returnDate: '2026-10-15',
        trainArrangement: 'tourism_arranged',
        notes: 'Devotee later requested office train assistance',
      })

    expect(trainUpdateRes.status).toBe(200)
    expect(trainUpdateRes.body.booking.boarding_station).toBe('NDLS')
    expect(trainUpdateRes.body.booking.going_date).toBe('2026-10-10')
    expect(trainUpdateRes.body.booking.train_arrangement).toBe('tourism_arranged')

    // 3. Verify audit log was recorded
    const auditRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .query({ entityId: bookingId })

    expect(auditRes.status).toBe(200)
    const log = auditRes.body.logs.find((l: any) => l.action === 'BOOKING_TRAIN_DETAILS_ADDED')
    expect(log).toBeDefined()
    expect(log.entity_id).toBe(bookingId)
  })

  // Acceptance Test 27: Customer My Trip shows only applicable services
  it('Acceptance Test 27: Customer My Trip dossier suppresses train sections for Room-Only guests', async () => {
    // 1. Create room only booking
    const bRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', SUPER_ADMIN_TOKEN)
      .send({
        serviceOption: 'only_room',
        leadName: 'Radha Rani',
        leadPhone: '9833445566',
        travelerCount: 1,
        hotelName: 'Shri Hari Ashram Niwas',
        roomRent: 3000,
        passengers: [{ fullName: 'Radha Rani', age: 30, gender: 'F', phone: '9833445566' }],
      })

    const bookingCode = bRes.body.booking.booking_code

    // 2. Customer looks up dossier
    const lookupRes = await request(app)
      .post('/api/my-trip/lookup')
      .send({
        bookingCode,
        mobile: '9833445566',
      })

    expect(lookupRes.status).toBe(200)
    const { dossier } = lookupRes.body
    expect(dossier).toBeDefined()
    expect(dossier.serviceOption).toBe('only_room')
    expect(dossier.goingTrain).toBeNull()
    expect(dossier.returnTrain).toBeNull()
    expect(dossier.rooms).toBeDefined()
    expect(dossier.rooms.length).toBeGreaterThan(0)
    expect(dossier.rooms[0].hotelAshramName).toBe('Shri Hari Ashram Niwas')
    expect(dossier.travelInstructions).toContain('ashram reception')
  })
})
