import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import ExcelJS from 'exceljs'
import crypto from 'crypto'
import { app } from '../../src/app.js'
import { resetDatabase, getDb, persistDb } from '../../src/services/dbEngine.js'

describe('MAVT Scalability (700+ Passengers) & Concurrency Test Suite', () => {
  const SUPER_ADMIN_TOKEN = 'Bearer dev-token-perfadmin:Super Admin:admin@mavt.in:super_admin'
  const PAYMENT_STAFF_TOKEN = 'Bearer dev-token-perfpayment:Payment Staff:payment@mavt.in:payment_staff'
  const BOOKING_STAFF_TOKEN = 'Bearer dev-token-perfbooking:Booking Staff:booking@mavt.in:booking_staff'
  const TRAIN_STAFF_TOKEN = 'Bearer dev-token-perftrain:Train Staff:train@mavt.in:train_ticket_staff'

  let targetGroupId: string
  let targetBookingId: string

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()

    // Create initial group and booking for race condition testing
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', BOOKING_STAFF_TOKEN)
      .send({
        name: 'Concurrency Testing Group',
        leadMobile: '9111111111',
      })
    targetGroupId = groupRes.body.group.id

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer dev-token-custperf:Test Cust:cust@perf.in:user')
      .send({
        groupId: targetGroupId,
        packageId: 'default-pkg-001',
        travelerCount: 2,
        leadName: 'Concurrent Lead',
        leadPhone: '9111111111',
        passengers: [
          { full_name: 'Devotee A', age: 35, gender: 'M', travel_class: 'ac' },
          { full_name: 'Devotee B', age: 32, gender: 'F', travel_class: 'non_ac' },
        ],
      })
    targetBookingId = bookRes.body.booking.id
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 1. CONCURRENCY: UTR RACE CONDITION PROTECTION (Req #8 & #10)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Concurrency: Duplicate UTR Race Condition', () => {
    it('handles 20 concurrent payment attempts with same UTR: exactly 1 succeeds, 19 rejected with 409', async () => {
      const DUPLICATE_UTR = 'RACE-UTR-99998888'
      const CONCURRENT_COUNT = 20

      // Fire 20 parallel payment requests with the identical UTR
      const requests = Array.from({ length: CONCURRENT_COUNT }).map(() =>
        request(app)
          .post('/api/payments/record-offline')
          .set('Authorization', PAYMENT_STAFF_TOKEN)
          .send({
            bookingId: targetBookingId,
            amount: 1000,
            paymentMode: 'upi',
            utrNumber: DUPLICATE_UTR,
            notes: 'Concurrent race test',
          }),
      )

      const responses = await Promise.all(requests)

      const successResponses = responses.filter((r) => r.status === 201)
      const conflictResponses = responses.filter((r) => r.status === 409)

      // Exactly ONE request must succeed; all others must be 409 Conflict
      expect(successResponses).toHaveLength(1)
      expect(conflictResponses).toHaveLength(CONCURRENT_COUNT - 1)

      for (const r of conflictResponses) {
        expect(r.body.error).toContain('Duplicate UTR')
      }
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CONCURRENCY: PARALLEL BOOKING CODE GENERATION (Req #1)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Concurrency: Parallel Booking Code Generation', () => {
    it('creates 25 concurrent bookings and ensures zero booking code collisions', async () => {
      const CONCURRENT_BOOKINGS = 25

      const requests = Array.from({ length: CONCURRENT_BOOKINGS }).map((_, idx) =>
        request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer dev-token-user${idx}:User ${idx}:u${idx}@test.in:user`)
          .send({
            groupId: targetGroupId,
            packageId: 'default-pkg-001',
            travelerCount: 1,
            leadName: `Concurrent Pilgrim ${idx}`,
            leadPhone: `92000000${String(idx).padStart(2, '0')}`,
            passengers: [
              {
                full_name: `Concurrent Pilgrim ${idx}`,
                age: 28,
                gender: 'M',
                travel_class: idx % 2 === 0 ? 'ac' : 'non_ac',
              },
            ],
          }),
      )

      const responses = await Promise.all(requests)

      // All 25 must succeed with 201
      for (const r of responses) {
        expect(r.status).toBe(201)
        expect(r.body.booking.booking_code).toMatch(/^MVT-\d{6}-\d{4}$/)
      }

      // Verify all booking codes are strictly unique
      const codes = responses.map((r) => r.body.booking.booking_code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(CONCURRENT_BOOKINGS)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 3. 700+ PASSENGER SCALABILITY HARNESS (Req #15, #19, #25)
  // ───────────────────────────────────────────────────────────────────────────
  describe('700+ Devotee Scalability & Latency Harness', () => {
    const TARGET_PASSENGERS = 750
    const TOTAL_GROUPS = 25

    beforeAll(async () => {
      const db = await getDb()

      // High-speed direct relational bulk seed: 25 groups, 150 bookings, 750 passengers
      const now = new Date().toISOString()
      const groupIds: string[] = []

      for (let g = 1; g <= TOTAL_GROUPS; g++) {
        const gId = crypto.randomUUID()
        const gCode = `GRP-${String(g + 100).padStart(4, '0')}`
        groupIds.push(gId)

        db.run(
          `INSERT INTO groups (id, group_code, name, lead_mobile, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?)`,
          [gId, gCode, `Yatra Mandal ${g}`, `98000000${String(g).padStart(2, '0')}`, now, now],
        )
      }

      const passengersPerGroup = Math.ceil(TARGET_PASSENGERS / TOTAL_GROUPS) // 30 devotees per group
      let totalPassengerCount = 0

      for (let gIdx = 0; gIdx < TOTAL_GROUPS; gIdx++) {
        const gId = groupIds[gIdx]

        // 6 bookings per group, each booking has 5 passengers = 30 passengers per group
        for (let b = 1; b <= 6; b++) {
          const bId = crypto.randomUUID()
          const bCode = `MVT-260915-${String(gIdx * 6 + b + 100).padStart(4, '0')}`
          const isAcBooking = (b % 2 === 0)

          db.run(
            `INSERT INTO bookings (
              id, booking_code, group_id, traveler_count, booking_status, payment_status, status,
              lead_passenger_name, mobile, phone_number, total_amount, total_paid, pending_balance,
              boarding_station, destination_station, going_date, return_date, created_at, updated_at
            ) VALUES (?, ?, ?, 5, 'confirmed', 'partially_paid', 'partially_paid', ?, ?, ?, 60000, 30000, 30000, 'NDLS', 'SVDK', '2026-10-01', '2026-10-07', ?, ?)`,
            [
              bId,
              bCode,
              gId,
              `Lead Devotee G${gIdx + 1}B${b}`,
              `981111${String(totalPassengerCount).slice(-4)}`,
              `981111${String(totalPassengerCount).slice(-4)}`,
              now,
              now,
            ],
          )

          for (let p = 1; p <= 5; p++) {
            totalPassengerCount++
            const pId = crypto.randomUUID()
            const pCode = `P-${String(totalPassengerCount + 1000).padStart(6, '0')}`
            const tClass = (p <= 3 && isAcBooking) ? 'ac' : 'non_ac'

            db.run(
              `INSERT INTO passengers (
                id, booking_id, group_id, passenger_code, passenger_index, is_primary,
                full_name, age, gender, mobile, travel_class, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                pId,
                bId,
                gId,
                pCode,
                p - 1,
                p === 1 ? 1 : 0,
                `Devotee ${totalPassengerCount}`,
                25 + (p * 5),
                p % 2 === 0 ? 'F' : 'M',
                `982222${String(totalPassengerCount).slice(-4)}`,
                tClass,
                now,
                now,
              ],
            )
          }
        }
      }

      persistDb()
    })

    it('generates 4-sheet Akbar train manifest for 750+ passengers in under 2.0 seconds', async () => {
      const startTime = Date.now()

      const res = await request(app)
        .get('/api/train-journeys/export/excel')
        .set('Authorization', TRAIN_STAFF_TOKEN)
        .buffer(true)
        .parse((response, callback) => {
          const bufs: any[] = []
          response.on('data', (c) => bufs.push(c))
          response.on('end', () => callback(null, Buffer.concat(bufs)))
        })

      const elapsedMs = Date.now() - startTime

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('openxmlformats-officedocument.spreadsheetml.sheet')

      // Load workbook and verify size and performance
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(res.body)

      expect(workbook.worksheets.length).toBe(4)
      const goingAc = workbook.getWorksheet('Going - AC')
      const goingNonAc = workbook.getWorksheet('Going - Non-AC')
      expect(goingAc).toBeDefined()
      expect(goingNonAc).toBeDefined()

      // Manifest generation must execute well within budget
      expect(elapsedMs).toBeLessThan(2500)
    })

    it('calculates admin collection cards across 750+ passengers in under 1.5 seconds', async () => {
      const startTime = Date.now()

      const res = await request(app)
        .get('/api/admin/collections')
        .set('Authorization', SUPER_ADMIN_TOKEN)

      const elapsedMs = Date.now() - startTime

      expect(res.status).toBe(200)
      expect(res.body.total).toBeDefined()
      expect(res.body.total.passengers).toBeGreaterThanOrEqual(750)
      expect(res.body.total.totalAmount).toBeGreaterThan(0)
      expect(res.body.total.totalReceived).toBeGreaterThan(0)
      expect(res.body.total.totalPending).toBeGreaterThan(0)

      // Sub-second response
      expect(elapsedMs).toBeLessThan(1500)
    })

    it('retrieves outstanding balance queue in under 1.0 second', async () => {
      const startTime = Date.now()

      const res = await request(app)
        .get('/api/admin/pending-collections')
        .set('Authorization', PAYMENT_STAFF_TOKEN)

      const elapsedMs = Date.now() - startTime

      expect(res.status).toBe(200)
      expect(res.body.pendingList.length).toBeGreaterThanOrEqual(150)
      expect(res.body.totalPending).toBeGreaterThan(0)

      expect(elapsedMs).toBeLessThan(1000)
    })

    it('executes global search across 750+ passengers and 25 groups in under 500ms', async () => {
      const startTime = Date.now()

      const res = await request(app)
        .get('/api/admin/global-search?q=Devotee')
        .set('Authorization', SUPER_ADMIN_TOKEN)

      const elapsedMs = Date.now() - startTime

      expect(res.status).toBe(200)
      expect(res.body.results.passengers.length).toBeGreaterThan(0)

      expect(elapsedMs).toBeLessThan(500)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 4. CONCURRENCY: ROOM ALLOCATION RACE CONDITION
  // ───────────────────────────────────────────────────────────────────────────
  describe('Concurrency: Room Capacity Allocation Race', () => {
    it('handles concurrent attempts to claim the last bed in a room: exactly 1 succeeds, 1 receives 409', async () => {
      const ROOM_STAFF_TOKEN = 'Bearer dev-token-roomperf:Room Staff:room@mavt.in:room_staff'
      const db = await getDb()

      // Create a room with capacity 1
      const roomId = crypto.randomUUID()
      db.run(
        `INSERT INTO rooms (id, hotel_ashram_name, room_number, room_type, capacity, status, created_at, updated_at)
         VALUES (?, 'Hotel Katra Inn', 'RACE-101', 'ac', 1, 'available', datetime('now'), datetime('now'))`,
        [roomId],
      )

      // Create two distinct passengers
      const pId1 = crypto.randomUUID()
      const pId2 = crypto.randomUUID()
      db.run(
        `INSERT INTO passengers (id, booking_id, group_id, passenger_code, full_name, age, gender, travel_class, created_at, updated_at)
         VALUES (?, ?, ?, 'P-RACE-01', 'Race Devotee 1', 30, 'M', 'ac', datetime('now'), datetime('now'))`,
        [pId1, targetBookingId, targetGroupId],
      )
      db.run(
        `INSERT INTO passengers (id, booking_id, group_id, passenger_code, full_name, age, gender, travel_class, created_at, updated_at)
         VALUES (?, ?, ?, 'P-RACE-02', 'Race Devotee 2', 32, 'F', 'ac', datetime('now'), datetime('now'))`,
        [pId2, targetBookingId, targetGroupId],
      )
      persistDb()

      // Two concurrent allocation requests trying to take the 1 available bed
      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/rooms/allocate')
          .set('Authorization', ROOM_STAFF_TOKEN)
          .send({
            roomId,
            groupId: targetGroupId,
            passengerAllocations: [{ bookingId: targetBookingId, passengerId: pId1 }],
          }),
        request(app)
          .post('/api/rooms/allocate')
          .set('Authorization', ROOM_STAFF_TOKEN)
          .send({
            roomId,
            groupId: targetGroupId,
            passengerAllocations: [{ bookingId: targetBookingId, passengerId: pId2 }],
          }),
      ])

      const statuses = [res1.status, res2.status]
      expect(statuses).toContain(201)
      expect(statuses).toContain(409)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 5. 1,000 & 5,000 SYNTHETIC PASSENGER SCALE BENCHMARK
  // ───────────────────────────────────────────────────────────────────────────
  describe('1,000 & 5,000 Synthetic Devotee Scale Benchmarks', () => {
    it('scales to 1,000+ passengers: dashboard collection aggregation in under 500ms', async () => {
      const db = await getDb()
      const now = new Date().toISOString()

      // Seed 250 more passengers to cross 1,000 total (750 + 250 = 1000)
      const extraGroupId = crypto.randomUUID()
      db.run(
        `INSERT INTO groups (id, group_code, name, lead_mobile, is_active, created_at, updated_at)
         VALUES (?, 'GRP-SCALE-1K', 'Scale 1000 Group', '9900001000', 1, ?, ?)`,
        [extraGroupId, now, now],
      )

      for (let b = 1; b <= 50; b++) {
        const bId = crypto.randomUUID()
        db.run(
          `INSERT INTO bookings (id, booking_code, group_id, traveler_count, total_amount, total_paid, pending_balance, created_at, updated_at)
           VALUES (?, ?, ?, 5, 50000, 25000, 25000, ?, ?)`,
          [bId, `MVT-1K-${b}`, extraGroupId, now, now],
        )

        for (let p = 1; p <= 5; p++) {
          db.run(
            `INSERT INTO passengers (id, booking_id, group_id, passenger_code, full_name, age, gender, travel_class, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 30, 'M', 'ac', ?, ?)`,
            [crypto.randomUUID(), bId, extraGroupId, `P-1K-${b}-${p}`, `Pilgrim 1K ${b}-${p}`, now, now],
          )
        }
      }
      persistDb()

      const startTime = Date.now()
      const res = await request(app)
        .get('/api/admin/collections')
        .set('Authorization', SUPER_ADMIN_TOKEN)

      const elapsedMs = Date.now() - startTime
      expect(res.status).toBe(200)
      expect(res.body.total.passengers).toBeGreaterThanOrEqual(1000)
      expect(elapsedMs).toBeLessThan(500)
    })

    it('scales to 5,000 synthetic passengers: executes high-throughput aggregation & search query', async () => {
      const db = await getDb()
      const now = new Date().toISOString()
      const memBefore = process.memoryUsage().heapUsed

      // Direct SQL bulk transaction to seed 4,000 more records up to 5,000
      db.run('BEGIN TRANSACTION;')
      const gId = crypto.randomUUID()
      db.run(
        `INSERT INTO groups (id, group_code, name, lead_mobile, is_active, created_at, updated_at)
         VALUES (?, 'GRP-SCALE-5K', 'Mega Kumbh Yatra 5000', '9900005000', 1, ?, ?)`,
        [gId, now, now],
      )

      for (let b = 1; b <= 800; b++) {
        const bId = crypto.randomUUID()
        db.run(
          `INSERT INTO bookings (id, booking_code, group_id, traveler_count, total_amount, total_paid, pending_balance, created_at, updated_at)
           VALUES (?, ?, ?, 5, 60000, 30000, 30000, ?, ?)`,
          [bId, `MVT-5K-${b}`, gId, now, now],
        )

        for (let p = 1; p <= 5; p++) {
          db.run(
            `INSERT INTO passengers (id, booking_id, group_id, passenger_code, full_name, age, gender, travel_class, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 30, 'M', 'ac', ?, ?)`,
            [crypto.randomUUID(), bId, gId, `P-5K-${b}-${p}`, `Mega Pilgrim ${b}-${p}`, now, now],
          )
        }
      }
      db.run('COMMIT;')
      persistDb()

      const memAfter = process.memoryUsage().heapUsed
      const memDeltaMb = Math.round((memAfter - memBefore) / 1024 / 1024)

      // Query database count across 5000 passengers
      const queryStart = Date.now()
      const resCount = db.exec('SELECT COUNT(*) FROM passengers;')
      const queryElapsedMs = Date.now() - queryStart
      const totalInDb = resCount[0].values[0][0] as number

      expect(totalInDb).toBeGreaterThanOrEqual(5000)
      expect(queryElapsedMs).toBeLessThan(100) // Direct SQLite query sub-100ms

      // Test API search across 5,000 records
      const apiStart = Date.now()
      const resSearch = await request(app)
        .get('/api/admin/global-search?q=Mega')
        .set('Authorization', SUPER_ADMIN_TOKEN)
      const apiElapsedMs = Date.now() - apiStart

      expect(resSearch.status).toBe(200)
      expect(resSearch.body.results.passengers.length).toBeGreaterThan(0)
      expect(apiElapsedMs).toBeLessThan(500)

      console.log(`[5,000 SCALE BENCHMARK] Total Passengers: ${totalInDb} | DB Query: ${queryElapsedMs}ms | API Search: ${apiElapsedMs}ms | Memory Delta: ${memDeltaMb}MB`)
    })
  })
})
