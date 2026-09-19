import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'
import { supabaseAdmin } from '../../src/services/supabaseAdmin.js'

describe('Individual Reports Verification Suite', () => {
  const STAFF_TOKEN = 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin'

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()

    // Seed test group and booking
    const { data: grp } = await supabaseAdmin
      .from('groups')
      .insert({ group_code: 'GRP-3301', name: 'Ayodhya Darshan', lead_mobile: '9870001122' })
      .select('*')
      .single()

    await supabaseAdmin
      .from('bookings')
      .insert({
        group_id: grp.id,
        booking_code: 'MVT-270427-3301',
        lead_passenger_name: 'Harish Mehta',
        mobile: '9870001122',
        traveler_count: 2,
        total_amount: 29000,
        total_paid: 10000,
        pending_balance: 19000,
        booking_status: 'confirmed',
        payment_status: 'partially_paid',
      })
  })

  it('verifies Report 1: all-bookings', async () => {
    const res = await request(app).get('/api/reports/all-bookings').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(Array.isArray(res.body.report)).toBe(true)
  })

  it('verifies Report 2: all-passengers', async () => {
    const res = await request(app).get('/api/reports/all-passengers').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(Array.isArray(res.body.report)).toBe(true)
  })

  it('verifies Report 3: group-wise-passenger', async () => {
    const res = await request(app).get('/api/reports/group-wise-passenger').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(Array.isArray(res.body.report)).toBe(true)
  })

  it('verifies Report 4: ac-passenger', async () => {
    const res = await request(app).get('/api/reports/ac-passenger').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(Array.isArray(res.body.report)).toBe(true)
  })

  it('verifies Report 5: non-ac-passenger', async () => {
    const res = await request(app).get('/api/reports/non-ac-passenger').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(Array.isArray(res.body.report)).toBe(true)
  })

  it('verifies Report 6: pending-collection', async () => {
    const res = await request(app).get('/api/reports/pending-collection').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(Array.isArray(res.body.report)).toBe(true)
    // Only includes bookings with pending_balance > 0
    for (const b of res.body.report) {
      expect(Number(b.pending_balance)).toBeGreaterThan(0)
    }
  })

  it('verifies Report 7: payment-utr', async () => {
    const res = await request(app).get('/api/reports/payment-utr').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(Array.isArray(res.body.report)).toBe(true)
  })

  it('verifies Report 8: room occupancy report', async () => {
    const res = await request(app).get('/api/reports/room').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(Array.isArray(res.body.report)).toBe(true)
  })

  it('verifies Report 9: yatra-summary aggregation', async () => {
    const res = await request(app).get('/api/reports/yatra-summary').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(res.body.report.totalBookings).toBeGreaterThanOrEqual(1)
    expect(res.body.report.totalAmount).toBeGreaterThanOrEqual(29000)
    expect(res.body.report.totalPaid).toBeGreaterThanOrEqual(10000)
    expect(res.body.report.pendingBalance).toBeGreaterThanOrEqual(19000)
  })

  it('verifies Report 10: group-breakdown report', async () => {
    const res = await request(app).get('/api/reports/group-breakdown').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
    expect(Array.isArray(res.body.report)).toBe(true)
    const grp = res.body.report.find((g: any) => g.groupCode === 'GRP-3301')
    expect(grp).toBeDefined()
    expect(grp.bookingCount).toBe(1)
    expect(grp.totalAmount).toBe(29000)
  })

  it('verifies Report 11: Section 10 Collection Cards', async () => {
    const res = await request(app).get('/api/admin/collections').set('Authorization', STAFF_TOKEN)
    expect(res.status).toBe(200)
    expect(res.body.ac).toBeDefined()
    expect(res.body.nonAc).toBeDefined()
    expect(res.body.total).toBeDefined()
  })
})
