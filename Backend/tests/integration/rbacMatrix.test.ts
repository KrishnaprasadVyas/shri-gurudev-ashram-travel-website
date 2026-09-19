import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'

describe('Exhaustive Server-Side RBAC Authorization Matrix Suite', () => {
  const SUPER_ADMIN = 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin'
  const BOOKING_STAFF = 'Bearer dev-token-bookingstaff:Booking Staff:booking@mavt.in:booking_staff'
  const PAYMENT_STAFF = 'Bearer dev-token-paymentstaff:Payment Staff:payment@mavt.in:payment_staff'
  const TRAIN_STAFF = 'Bearer dev-token-trainstaff:Train Staff:train@mavt.in:train_ticket_staff'
  const ROOM_STAFF = 'Bearer dev-token-roomstaff:Room Staff:room@mavt.in:room_staff'
  const UNAUTHENTICATED = ''

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()
  })

  // ── 1. Settings & Super Admin Operations ──────────────────────────────────
  describe('Super Admin Restricted Operations', () => {
    it('allows super_admin to access app settings', async () => {
      const res = await request(app).get('/api/admin/settings').set('Authorization', SUPER_ADMIN)
      expect([200, 304]).toContain(res.status)
    })

    it('denies booking_staff from accessing app settings with 403', async () => {
      const res = await request(app).get('/api/admin/settings').set('Authorization', BOOKING_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies payment_staff from accessing app settings with 403', async () => {
      const res = await request(app).get('/api/admin/settings').set('Authorization', PAYMENT_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies train_ticket_staff from accessing app settings with 403', async () => {
      const res = await request(app).get('/api/admin/settings').set('Authorization', TRAIN_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies room_staff from accessing app settings with 403', async () => {
      const res = await request(app).get('/api/admin/settings').set('Authorization', ROOM_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies unauthenticated requests to app settings with 401', async () => {
      const res = await request(app).get('/api/admin/settings')
      expect(res.status).toBe(401)
    })
  })

  // ── 2. Payment Recording ──────────────────────────────────────────────────
  describe('Payment Recording Endpoint Authorization', () => {
    const payload = {
      bookingId: 'some-id',
      amount: 1000,
      paymentMode: 'cash',
    }

    it('denies booking_staff from recording payments with 403', async () => {
      const res = await request(app).post('/api/payments/record-offline').set('Authorization', BOOKING_STAFF).send(payload)
      expect(res.status).toBe(403)
    })

    it('denies train_ticket_staff from recording payments with 403', async () => {
      const res = await request(app).post('/api/payments/record-offline').set('Authorization', TRAIN_STAFF).send(payload)
      expect(res.status).toBe(403)
    })

    it('denies room_staff from recording payments with 403', async () => {
      const res = await request(app).post('/api/payments/record-offline').set('Authorization', ROOM_STAFF).send(payload)
      expect(res.status).toBe(403)
    })

    it('denies unauthenticated calls from recording payments with 401', async () => {
      const res = await request(app).post('/api/payments/record-offline').send(payload)
      expect(res.status).toBe(401)
    })
  })

  // ── 3. Train Ticket Upload & Mapping ──────────────────────────────────────
  describe('Train Ticket Management Endpoint Authorization', () => {
    it('denies booking_staff from train ticket operations with 403', async () => {
      const res = await request(app).get('/api/train-tickets').set('Authorization', BOOKING_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies payment_staff from train ticket operations with 403', async () => {
      const res = await request(app).get('/api/train-tickets').set('Authorization', PAYMENT_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies room_staff from train ticket operations with 403', async () => {
      const res = await request(app).get('/api/train-tickets').set('Authorization', ROOM_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies unauthenticated calls from train ticket operations with 401', async () => {
      const res = await request(app).get('/api/train-tickets')
      expect(res.status).toBe(401)
    })
  })

  // ── 4. Room Allocation & Inventory ────────────────────────────────────────
  describe('Room Operations Endpoint Authorization', () => {
    it('denies booking_staff from room operations with 403', async () => {
      const res = await request(app).get('/api/rooms').set('Authorization', BOOKING_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies payment_staff from room operations with 403', async () => {
      const res = await request(app).get('/api/rooms').set('Authorization', PAYMENT_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies train_ticket_staff from room operations with 403', async () => {
      const res = await request(app).get('/api/rooms').set('Authorization', TRAIN_STAFF)
      expect(res.status).toBe(403)
    })

    it('denies unauthenticated calls from room operations with 401', async () => {
      const res = await request(app).get('/api/rooms')
      expect(res.status).toBe(401)
    })
  })
})
