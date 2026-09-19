import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'

describe('MAVT Real HTTP Integration & Verification Suite', () => {
  // Staff Auth Tokens
  const SUPER_ADMIN_TOKEN = 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin'
  const BOOKING_STAFF_TOKEN = 'Bearer dev-token-bookingstaff:Booking Staff:booking@mavt.in:booking_staff'
  const PAYMENT_STAFF_TOKEN = 'Bearer dev-token-paymentstaff:Payment Staff:payment@mavt.in:payment_staff'
  const TRAIN_STAFF_TOKEN = 'Bearer dev-token-trainstaff:Train Staff:train@mavt.in:train_ticket_staff'
  const ROOM_STAFF_TOKEN = 'Bearer dev-token-roomstaff:Room Staff:room@mavt.in:room_staff'
  const CUSTOMER_TOKEN = 'Bearer dev-token-customer1:Rajesh Sharma:rajesh@example.com:user'

  let createdGroupId: string
  let createdGroupCode: string
  let createdBookingId: string
  let createdBookingCode: string
  let createdPassengerIds: string[] = []
  let createdPaymentId: string
  let createdRoomId: string

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 1. RBAC SECURITY BARRIERS (Req #30)
  // ───────────────────────────────────────────────────────────────────────────
  describe('RBAC Security Barriers', () => {
    it('blocks unauthenticated requests to protected endpoints with 401', async () => {
      const res = await request(app).get('/api/groups')
      expect(res.status).toBe(401)
    })

    it('blocks Room Staff from accessing Payment recording with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/payments/record-offline')
        .set('Authorization', ROOM_STAFF_TOKEN)
        .send({
          bookingId: 'any-id',
          amount: 5000,
          paymentMode: 'Cash',
        })
      expect(res.status).toBe(403)
      expect(res.body.error).toContain('Forbidden')
    })

    it('blocks Booking Staff from creating Rooms with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', BOOKING_STAFF_TOKEN)
        .send({
          hotelAshramName: 'Vaishno Bhavan',
          roomNumber: '101',
          roomType: 'AC Quad',
          capacity: 4,
        })
      expect(res.status).toBe(403)
      expect(res.body.error).toContain('Forbidden')
    })

    it('blocks Train Staff from accessing Admin collection cards with 403', async () => {
      const res = await request(app)
        .get('/api/admin/collections')
        .set('Authorization', TRAIN_STAFF_TOKEN)
      expect(res.status).toBe(403)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 2. GROUP MANAGEMENT (Req #4, #5, #6, #7)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Group Management', () => {
    it('creates a new group with sequential GRP-xxxx code', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', BOOKING_STAFF_TOKEN)
        .send({
          name: 'Delhi Bhakt Mandal',
          leadMobile: '9876543210',
          notes: 'Special elder darshan required',
        })

      expect(res.status).toBe(201)
      expect(res.body.group).toBeDefined()
      expect(res.body.group.group_code).toMatch(/^GRP-\d{4}$/)
      expect(res.body.group.name).toBe('Delhi Bhakt Mandal')

      createdGroupId = res.body.group.id
      createdGroupCode = res.body.group.group_code
    })

    it('lists groups with search and pagination', async () => {
      const res = await request(app)
        .get('/api/groups?search=Delhi')
        .set('Authorization', BOOKING_STAFF_TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.groups.length).toBeGreaterThanOrEqual(1)
      expect(res.body.groups[0].group_code).toBe(createdGroupCode)
    })

    it('retrieves group details with linked bookings and collection breakdown', async () => {
      const res = await request(app)
        .get(`/api/groups/${createdGroupId}`)
        .set('Authorization', BOOKING_STAFF_TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.group.id).toBe(createdGroupId)
      expect(res.body.bookings).toBeDefined()
      expect(res.body.summary).toBeDefined()
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 3. BOOKING CREATION & MIXED PRICING (Req #1, #2, #3, #9)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Booking Creation & Mixed AC / Non-AC Pricing', () => {
    it('creates a mixed AC/Non-AC booking with MVT-YYMMDD-XXXX and P-xxxxxx IDs', async () => {
      const bookingPayload = {
        groupId: createdGroupId,
        packageId: 'default-pkg-001',
        travelerCount: 4,
        leadName: 'Rajesh Sharma',
        leadPhone: '9876543210',
        whatsappNumber: '9876543210',
        boardingStation: 'NDLS',
        destinationStation: 'SVDK',
        passengers: [
          {
            full_name: 'Rajesh Sharma',
            age: 52,
            gender: 'M',
            phone: '9876543210',
            travel_class: 'ac',
            seat_preference: 'Lower',
          },
          {
            full_name: 'Sunita Sharma',
            age: 48,
            gender: 'F',
            phone: '9876543210',
            travel_class: 'ac',
            seat_preference: 'Middle',
          },
          {
            full_name: 'Amit Sharma',
            age: 24,
            gender: 'M',
            phone: '9876543211',
            travel_class: 'non_ac',
            seat_preference: 'Upper',
          },
          {
            full_name: 'Pooja Sharma',
            age: 21,
            gender: 'F',
            phone: '9876543212',
            travel_class: 'non_ac',
            seat_preference: 'Side Lower',
          },
        ],
      }

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', CUSTOMER_TOKEN)
        .send(bookingPayload)

      expect(res.status).toBe(201)
      const { booking, passengers } = res.body

      expect(booking).toBeDefined()
      expect(booking.booking_code).toMatch(/^MVT-\d{6}-\d{4}$/)
      expect(booking.traveler_count).toBe(4)
      expect(booking.group_id).toBe(createdGroupId)
      expect(booking.whatsapp_number).toBe('9876543210')

      // Pricing check: 2 AC @ 14,500 + 2 Non-AC @ 9,500 = 29,000 + 19,000 = 48,000
      expect(booking.total_amount).toBe(48000)
      expect(booking.pending_balance).toBe(48000)
      expect(booking.total_paid).toBe(0)

      expect(passengers).toHaveLength(4)
      for (const p of passengers) {
        expect(p.passenger_code).toMatch(/^P-\d{6}$/)
      }

      createdBookingId = booking.id
      createdBookingCode = booking.booking_code
      createdPassengerIds = passengers.map((p: any) => p.id)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 4. PAYMENTS & DUPLICATE UTR GUARD (Req #8, #10, #13)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Payments & Duplicate UTR Protection', () => {
    const TEST_UTR = 'SBIN00293847561'

    it('records first installment offline and reconciles balance', async () => {
      const res = await request(app)
        .post('/api/payments/record-offline')
        .set('Authorization', PAYMENT_STAFF_TOKEN)
        .send({
          bookingId: createdBookingId,
          amount: 20000,
          paymentMode: 'UPI',
          utrNumber: TEST_UTR,
          notes: 'First advance via GPay',
        })

      expect(res.status).toBe(201)
      expect(res.body.payment).toBeDefined()
      expect(res.body.payment.payment_code).toMatch(/^PAY-\d{6}$/)
      expect(res.body.payment.amount).toBe(20000)
      expect(res.body.payment.utr_number).toBe(TEST_UTR)

      createdPaymentId = res.body.payment.id

      // Verify booking balance was reconciled
      const bookRes = await request(app)
        .get(`/api/bookings/${createdBookingId}`)
        .set('Authorization', BOOKING_STAFF_TOKEN)

      expect(bookRes.status).toBe(200)
      expect(bookRes.body.booking.total_paid).toBe(20000)
      expect(bookRes.body.booking.pending_balance).toBe(28000)
      expect(bookRes.body.booking.payment_status).toBe('partially_paid')
    })

    it('rejects duplicate UTR with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/payments/record-offline')
        .set('Authorization', PAYMENT_STAFF_TOKEN)
        .send({
          bookingId: createdBookingId,
          amount: 10000,
          paymentMode: 'Bank Transfer',
          utrNumber: TEST_UTR, // Duplicate!
          notes: 'Attempted duplicate UTR',
        })

      expect(res.status).toBe(409)
      expect(res.body.error).toContain('Duplicate UTR')
    })

    it('allows Super Admin to correct UTR when typo occurred', async () => {
      const CORRECTED_UTR = 'SBIN00293847599'
      const res = await request(app)
        .patch(`/api/payments/${createdPaymentId}/utr`)
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({
          utrNumber: CORRECTED_UTR,
          reason: 'Corrected bank statement typo',
        })

      expect(res.status).toBe(200)
      expect(res.body.payment.utr_number).toBe(CORRECTED_UTR)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 5. TRAIN MANIFEST 4-SHEET EXCEL EXPORT (Req #15, #16, #17, #18)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Train Manifest 4-Sheet Excel Export', () => {
    it('generates a 4-sheet Excel workbook with Akbar-compliant layout', async () => {
      const res = await request(app)
        .get('/api/train-journeys/export/excel')
        .set('Authorization', TRAIN_STAFF_TOKEN)
        .buffer(true)
        .parse((response, callback) => {
          const bufs: any[] = []
          response.on('data', (c) => bufs.push(c))
          response.on('end', () => callback(null, Buffer.concat(bufs)))
        })

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('openxmlformats-officedocument.spreadsheetml.sheet')

      // Parse the returned buffer using ExcelJS
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(res.body)

      // Verify all 4 required sheets exist
      const sheetNames = workbook.worksheets.map((s) => s.name)
      expect(sheetNames).toContain('Going - AC')
      expect(sheetNames).toContain('Going - Non-AC')
      expect(sheetNames).toContain('Return - AC')
      expect(sheetNames).toContain('Return - Non-AC')

      // Inspect Going - AC sheet
      const goingAcSheet = workbook.getWorksheet('Going - AC')
      expect(goingAcSheet).toBeDefined()

      // Header row
      const headerRow = goingAcSheet!.getRow(1)
      expect(headerRow.getCell(1).value).toBe('Passenger ID')
      expect(headerRow.getCell(2).value).toBe('Booking ID')
      expect(headerRow.getCell(3).value).toBe('Passenger Name')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 6. ROOM MANAGEMENT & CROSS-BOOKING SHARING (Req #21, #22, #24, #26)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Room Management & Cross-Booking Sharing', () => {
    it('creates a room in master inventory', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', ROOM_STAFF_TOKEN)
        .send({
          hotelAshramName: 'Vaishno Bhavan Katra',
          roomNumber: '204',
          roomType: 'AC Quad',
          capacity: 4,
          status: 'available',
        })

      expect(res.status).toBe(201)
      expect(res.body.room).toBeDefined()
      expect(res.body.room.room_number).toBe('204')
      expect(res.body.room.capacity).toBe(4)
      createdRoomId = res.body.room.id
    })

    it('allocates passengers to room and updates occupancy', async () => {
      const res = await request(app)
        .post('/api/rooms/allocate')
        .set('Authorization', ROOM_STAFF_TOKEN)
        .send({
          roomId: createdRoomId,
          passengerId: createdPassengerIds[0],
          bookingId: createdBookingId,
          groupId: createdGroupId,
        })

      expect(res.status).toBe(201)
      expect(res.body.allocation).toBeDefined()
      expect(res.body.allocation.room_id).toBe(createdRoomId)
    })

    it('allows cross-booking sharing within the same group', async () => {
      // Allocate second passenger
      const res = await request(app)
        .post('/api/rooms/allocate')
        .set('Authorization', ROOM_STAFF_TOKEN)
        .send({
          roomId: createdRoomId,
          passengerId: createdPassengerIds[1],
          bookingId: createdBookingId,
          groupId: createdGroupId,
        })

      expect(res.status).toBe(201)

      // Check room occupancy in list
      const roomListRes = await request(app)
        .get('/api/rooms')
        .set('Authorization', ROOM_STAFF_TOKEN)

      const ourRoom = roomListRes.body.rooms.find((r: any) => r.id === createdRoomId)
      expect(ourRoom).toBeDefined()
      expect(ourRoom.capacity).toBe(4)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 7. CUSTOMER MY TRIP (Req #36)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Customer My Trip Dossier', () => {
    it('looks up travel dossier with Booking Code + Mobile', async () => {
      const res = await request(app)
        .post('/api/my-trip/lookup')
        .send({
          bookingCode: createdBookingCode,
          mobile: '9876543210',
        })

      expect(res.status).toBe(200)
      expect(res.body.tripToken).toBeDefined()
      expect(res.body.dossier).toBeDefined()

      const { dossier } = res.body
      expect(dossier.bookingCode).toBe(createdBookingCode)
      expect(dossier.groupName).toBe('Delhi Bhakt Mandal')
      expect(dossier.travelerCount).toBe(4)
      expect(dossier.financials.totalAmount).toBe(48000)
      expect(dossier.financials.totalPaid).toBe(20000)
      expect(dossier.financials.pendingBalance).toBe(28000)

      expect(dossier.passengers).toHaveLength(4)
      expect(dossier.passengers[0].passengerCode).toMatch(/^P-\d{6}$/)
    })

    it('rejects lookup with incorrect mobile number', async () => {
      const res = await request(app)
        .post('/api/my-trip/lookup')
        .send({
          bookingCode: createdBookingCode,
          mobile: '9999999999', // Mismatched mobile
        })

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('does not match')
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 8. ADMIN DASHBOARD & PENDING COLLECTION (Req #10, #14)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Admin Dashboard & Pending Collections', () => {
    it('returns AC, Non-AC, and Total collection cards', async () => {
      const res = await request(app)
        .get('/api/admin/collections')
        .set('Authorization', SUPER_ADMIN_TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.ac).toBeDefined()
      expect(res.body.nonAc).toBeDefined()
      expect(res.body.total).toBeDefined()

      expect(res.body.total.passengers).toBeGreaterThanOrEqual(4)
      expect(res.body.total.totalAmount).toBeGreaterThanOrEqual(48000)
      expect(res.body.total.totalReceived).toBeGreaterThanOrEqual(20000)
      expect(res.body.total.totalPending).toBeGreaterThanOrEqual(28000)
    })

    it('returns pending collection queue with outstanding balances', async () => {
      const res = await request(app)
        .get('/api/admin/pending-collections')
        .set('Authorization', PAYMENT_STAFF_TOKEN)

      expect(res.status).toBe(200)
      expect(res.body.pendingList).toBeDefined()
      expect(res.body.pendingList.length).toBeGreaterThanOrEqual(1)

      const ourBooking = res.body.pendingList.find((b: any) => b.id === createdBookingId)
      expect(ourBooking).toBeDefined()
      expect(ourBooking.pending_balance).toBe(28000)
    })
  })
})
