import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'
import { supabaseAdmin } from '../../src/services/supabaseAdmin.js'
import { logAudit } from '../../src/services/auditLogger.js'

describe('Audit Log Persistence & Immutability Suite', () => {
  const SUPER_ADMIN = 'Bearer dev-token-superadmin:Super Admin:admin@mavt.in:super_admin'
  const BOOKING_STAFF = 'Bearer dev-token-bookingstaff:Booking Staff:booking@mavt.in:booking_staff'

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()
  })

  it('persists audit records for all major lifecycle actions into public.audit_logs', async () => {
    const actions = [
      { action: 'BOOKING_CREATE', entityType: 'booking', entityId: 'b-001', reason: 'Created new booking' },
      { action: 'GROUP_CREATE', entityType: 'group', entityId: 'g-001', reason: 'Created group' },
      { action: 'PAYMENT_RECORD_OFFLINE', entityType: 'payment', entityId: 'pay-001', reason: 'Recorded cash payment' },
      { action: 'UTR_CORRECTION', entityType: 'payment', entityId: 'pay-001', reason: 'Corrected UTR typo' },
      { action: 'TICKET_PDF_UPLOAD', entityType: 'ticket', entityId: 'tkt-001', reason: 'Uploaded train ticket PDF' },
      { action: 'ROOM_ALLOCATE', entityType: 'room', entityId: 'rm-101', reason: 'Allocated devotees to room 101' },
      { action: 'ROOM_CHANGE', entityType: 'room', entityId: 'rm-102', reason: 'Transferred devotees to room 102' },
    ]

    for (const item of actions) {
      await logAudit({
        actorId: 'test-admin-id',
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        reason: item.reason,
      })
    }

    // Verify all 7 records were persisted in database
    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    expect(error).toBeNull()
    expect(logs).toBeDefined()
    expect(logs!.length).toBeGreaterThanOrEqual(7)

    const recordedActions = logs!.map((l: any) => l.action)
    for (const item of actions) {
      expect(recordedActions).toContain(item.action)
    }
  })

  it('allows staff to view audit logs with filtering', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs?entityType=room')
      .set('Authorization', SUPER_ADMIN)

    expect(res.status).toBe(200)
    expect(res.body.logs).toBeDefined()
    for (const log of res.body.logs) {
      expect(log.entity_type).toBe('room')
    }
  })

  it('strictly blocks DELETE requests on audit logs with 405 Method Not Allowed', async () => {
    const res = await request(app)
      .delete('/api/admin/audit-logs/any-log-id')
      .set('Authorization', SUPER_ADMIN)

    expect(res.status).toBe(405)
    expect(res.body.error).toContain('immutable')
  })

  it('strictly blocks PUT / PATCH requests on audit logs with 405 Method Not Allowed', async () => {
    const resPut = await request(app)
      .put('/api/admin/audit-logs/any-log-id')
      .set('Authorization', SUPER_ADMIN)
      .send({ reason: 'Tampered reason' })

    expect(resPut.status).toBe(405)

    const resPatch = await request(app)
      .patch('/api/admin/audit-logs/any-log-id')
      .set('Authorization', SUPER_ADMIN)
      .send({ reason: 'Tampered reason' })

    expect(resPatch.status).toBe(405)
  })
})
