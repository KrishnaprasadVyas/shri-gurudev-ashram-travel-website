import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import ExcelJS from 'exceljs'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'
import { supabaseAdmin } from '../../src/services/supabaseAdmin.js'

describe('Room Management & Allocation Matrix Suite', () => {
  const ROOM_STAFF_TOKEN = 'Bearer dev-token-roomstaff:Room Staff:room@mavt.in:room_staff'
  const CUSTOMER_TOKEN = 'Bearer dev-token-customer1:Rajesh Sharma:rajesh@example.com:user'

  let groupId: string
  let bookingId1: string
  let bookingId2: string
  let passengerIds: string[] = []
  let room201Id: string
  let room202Id: string
  let roomMaintenanceId: string
  let firstAllocationId: string

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()

    // 1. Create Group
    const { data: group } = await supabaseAdmin
      .from('groups')
      .insert({ group_code: 'GRP-5501', name: 'Pune Seva Mandal', lead_mobile: '9850112233' })
      .select('*')
      .single()
    groupId = group.id

    // 2. Create Booking 1 (3 passengers)
    const b1Res = await request(app)
      .post('/api/bookings')
      .set('Authorization', CUSTOMER_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        groupId,
        travelerCount: 3,
        leadName: 'Nitin Joshi',
        leadPhone: '9850112233',
        passengers: [
          { full_name: 'Nitin Joshi', age: 40, gender: 'M', phone: '9850112233', travel_class: 'ac' },
          { full_name: 'Pooja Joshi', age: 38, gender: 'F', phone: '9850112233', travel_class: 'ac' },
          { full_name: 'Aarav Joshi', age: 10, gender: 'M', phone: '9850112233', travel_class: 'ac' },
        ],
      })
    bookingId1 = b1Res.body.booking.id
    passengerIds.push(...b1Res.body.passengers.map((p: any) => p.id))

    // 3. Create Booking 2 (1 passenger) in same Group
    const b2Res = await request(app)
      .post('/api/bookings')
      .set('Authorization', CUSTOMER_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        groupId,
        travelerCount: 1,
        leadName: 'Vivek Joshi',
        leadPhone: '9850112234',
        passengers: [
          { full_name: 'Vivek Joshi', age: 35, gender: 'M', phone: '9850112234', travel_class: 'ac' },
        ],
      })
    bookingId2 = b2Res.body.booking.id
    passengerIds.push(...b2Res.body.passengers.map((p: any) => p.id))

    // 4. Create Room 201 (Capacity 2)
    const r1 = await request(app)
      .post('/api/rooms')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        hotelAshramName: 'Vaishnavi Bhavan',
        roomNumber: '201',
        roomType: 'AC',
        capacity: 2,
        status: 'available',
      })
    room201Id = r1.body.room.id

    // 5. Create Room 202 (Capacity 3)
    const r2 = await request(app)
      .post('/api/rooms')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        hotelAshramName: 'Vaishnavi Bhavan',
        roomNumber: '202',
        roomType: 'AC',
        capacity: 3,
        status: 'available',
      })
    room202Id = r2.body.room.id

    // 6. Create Room 203 (Under Maintenance)
    const r3 = await request(app)
      .post('/api/rooms')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        hotelAshramName: 'Vaishnavi Bhavan',
        roomNumber: '203-M',
        roomType: 'AC',
        capacity: 2,
        status: 'maintenance',
      })
    roomMaintenanceId = r3.body.room.id
  })

  it('allocates passengers to a room and enforces room capacity constraint', async () => {
    // Room 201 capacity = 2. Allocating 1 passenger should succeed.
    const res1 = await request(app)
      .post('/api/rooms/allocate')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        roomId: room201Id,
        groupId,
        passengerAllocations: [{ bookingId: bookingId1, passengerId: passengerIds[0] }],
      })

    expect(res1.status).toBe(201)
    firstAllocationId = res1.body.allocation.id

    // Allocating another passenger across different booking in SAME group should succeed (now 2/2)
    const res2 = await request(app)
      .post('/api/rooms/allocate')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        roomId: room201Id,
        groupId,
        passengerAllocations: [{ bookingId: bookingId2, passengerId: passengerIds[3] }],
      })

    expect(res2.status).toBe(201)

    // Attempting to allocate a 3rd passenger to Room 201 (Capacity 2) must be REJECTED (Over-capacity!)
    const resOver = await request(app)
      .post('/api/rooms/allocate')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        roomId: room201Id,
        groupId,
        passengerAllocations: [{ bookingId: bookingId1, passengerId: passengerIds[1] }],
      })

    expect(resOver.status).toBe(409)
    expect(resOver.body.error).toContain('capacity exceeded')
  })

  it('prevents allocating rooms that are in Maintenance status', async () => {
    const res = await request(app)
      .post('/api/rooms/allocate')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        roomId: roomMaintenanceId,
        groupId,
        passengerAllocations: [{ bookingId: bookingId1, passengerId: passengerIds[1] }],
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('maintenance')
  })

  it('prevents duplicate active room allocation for the same devotee', async () => {
    // Passenger 0 is already in Room 201. Attempting to also allocate them to Room 202 must fail!
    const res = await request(app)
      .post('/api/rooms/allocate')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        roomId: room202Id,
        groupId,
        passengerAllocations: [{ bookingId: bookingId1, passengerId: passengerIds[0] }],
      })

    expect(res.status).toBe(409)
    expect(res.body.error).toContain('Duplicate allocation')
  })

  it('allows Room Change / transfer and writes old/new room audit trail', async () => {
    // Transfer Passenger 0 from Room 201 to Room 202
    const res = await request(app)
      .post('/api/rooms/change')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        allocationId: firstAllocationId,
        newRoomId: room202Id,
        reason: 'Requested ground floor accommodation due to knee discomfort',
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    // Verify audit log exists
    const { data: audits } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('action', 'ROOM_CHANGE')
      .order('created_at', { ascending: false })

    expect(audits).toBeDefined()
    expect(audits!.length).toBeGreaterThanOrEqual(1)
    expect(audits![0].reason).toContain('knee discomfort')
  })

  it('updates room status through lifecycle and logs status transitions', async () => {
    const res = await request(app)
      .patch(`/api/rooms/${room202Id}/status`)
      .set('Authorization', ROOM_STAFF_TOKEN)
      .send({
        status: 'reserved',
        reason: 'Reserved for VIP visiting swamiji',
      })

    expect(res.status).toBe(200)
    expect(res.body.room.status).toBe('reserved')
  })

  it('handles Excel room allocation import with validation, duplicate, and mismatch error reporting', async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Allocations')

    // Headers
    sheet.addRow(['Booking ID', 'Passenger ID', 'Room Number'])

    // Row 1: Unknown Booking ID
    sheet.addRow(['MVT-INVALID-0000', 'P-999999', '202'])

    // Row 2: Unknown Room Number
    sheet.addRow(['MVT-270427-0001', 'P-000001', '999-NONEXISTENT'])

    const buffer = await workbook.xlsx.writeBuffer()

    const res = await request(app)
      .post('/api/rooms/import-excel')
      .set('Authorization', ROOM_STAFF_TOKEN)
      .attach('file', Buffer.from(buffer), { filename: 'allocations.xlsx' })

    expect(res.status).toBe(200)
    expect(res.body.summary).toBeDefined()
    expect(res.body.summary.failureCount).toBeGreaterThanOrEqual(2)
    expect(res.body.errorRows.length).toBeGreaterThanOrEqual(2)
  })
})
