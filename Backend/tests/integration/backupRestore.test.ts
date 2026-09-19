import { describe, it, expect, beforeAll } from 'vitest'
import path from 'path'
import fs from 'fs'
import { resetDatabase } from '../../src/services/dbEngine.js'
import { supabaseAdmin } from '../../src/services/supabaseAdmin.js'
import { createDatabaseBackup, restoreDatabaseBackup } from '../../src/services/backupService.js'

describe('Disaster Recovery: Backup & Restore Verification Suite', () => {
  let createdBackupPath: string

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()

    // 1. Seed distinctive test state
    const { data: grp } = await supabaseAdmin
      .from('groups')
      .insert({
        group_code: 'GRP-BKUP-01',
        name: 'Kashi Darshan Parishad',
        lead_mobile: '9988776655',
      })
      .select('*')
      .single()

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .insert({
        group_id: grp.id,
        booking_code: 'MVT-BKUP-0001',
        lead_passenger_name: 'Anand Kumar',
        mobile: '9988776655',
        traveler_count: 2,
        total_amount: 29000,
        total_paid: 29000,
        pending_balance: 0,
        booking_status: 'confirmed',
        payment_status: 'fully_paid',
      })
      .select('*')
      .single()

    await supabaseAdmin.from('passengers').insert([
      {
        booking_id: booking.id,
        group_id: grp.id,
        passenger_code: 'P-BKUP-01',
        full_name: 'Anand Kumar',
        age: 55,
        gender: 'M',
        travel_class: 'ac',
      },
      {
        booking_id: booking.id,
        group_id: grp.id,
        passenger_code: 'P-BKUP-02',
        full_name: 'Sarita Kumar',
        age: 52,
        gender: 'F',
        travel_class: 'ac',
      },
    ])

    await supabaseAdmin.from('payments').insert({
      booking_id: booking.id,
      payment_code: 'PAY-BKUP-01',
      amount: 29000,
      payment_mode: 'upi',
      utr_number: 'UPIBKUP9988771122',
      verification_status: 'verified',
    })
  })

  it('exports a complete snapshot backup file with all tables and records', async () => {
    const { backupPath, snapshot } = await createDatabaseBackup('test_disaster_recovery_backup.json')
    createdBackupPath = backupPath

    expect(fs.existsSync(backupPath)).toBe(true)
    expect(snapshot.schema).toBe('mavt_v2')
    expect(snapshot.tables['groups'].length).toBeGreaterThanOrEqual(1)
    expect(snapshot.tables['bookings'].length).toBeGreaterThanOrEqual(1)
    expect(snapshot.tables['passengers'].length).toBeGreaterThanOrEqual(2)
    expect(snapshot.tables['payments'].length).toBeGreaterThanOrEqual(1)
  })

  it('wipes the database to simulate total data loss and verifies empty state', async () => {
    await resetDatabase()

    const { data: groups } = await supabaseAdmin.from('groups').select('*')
    const { data: bookings } = await supabaseAdmin.from('bookings').select('*')

    expect(groups?.length).toBe(0)
    expect(bookings?.length).toBe(0)
  })

  it('restores state from backup and proves 100% data integrity and relational recovery', async () => {
    const { success, restoredCounts } = await restoreDatabaseBackup(createdBackupPath)

    expect(success).toBe(true)
    expect(restoredCounts['groups']).toBeGreaterThanOrEqual(1)
    expect(restoredCounts['bookings']).toBeGreaterThanOrEqual(1)
    expect(restoredCounts['passengers']).toBeGreaterThanOrEqual(2)
    expect(restoredCounts['payments']).toBeGreaterThanOrEqual(1)

    // Verify restored records in database
    const { data: restoredGroup } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('group_code', 'GRP-BKUP-01')
      .single()

    expect(restoredGroup).toBeDefined()
    expect(restoredGroup.name).toBe('Kashi Darshan Parishad')

    const { data: restoredBooking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('booking_code', 'MVT-BKUP-0001')
      .single()

    expect(restoredBooking).toBeDefined()
    expect(restoredBooking.total_amount).toBe(29000)
    expect(restoredBooking.payment_status).toBe('fully_paid')

    const { data: restoredPassengers } = await supabaseAdmin
      .from('passengers')
      .select('*')
      .eq('booking_id', restoredBooking.id)

    expect(restoredPassengers).toHaveLength(2)

    const { data: restoredPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('utr_number', 'UPIBKUP9988771122')
      .single()

    expect(restoredPayment).toBeDefined()
    expect(restoredPayment.amount).toBe(29000)
  })
})
