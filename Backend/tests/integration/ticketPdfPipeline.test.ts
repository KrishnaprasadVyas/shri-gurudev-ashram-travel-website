import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { app } from '../../src/app.js'
import { resetDatabase } from '../../src/services/dbEngine.js'
import { supabaseAdmin } from '../../src/services/supabaseAdmin.js'
import { generateTicketDownloadToken } from '../../src/routes/trainJourneys.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Ticket PDF Pipeline & Storage Security Suite', () => {
  const TRAIN_STAFF_TOKEN = 'Bearer dev-token-trainstaff:Train Staff:train@mavt.in:train_ticket_staff'
  const ROOM_STAFF_TOKEN = 'Bearer dev-token-roomstaff:Room Staff:room@mavt.in:room_staff'
  const CUSTOMER_TOKEN = 'Bearer dev-token-customer1:Rajesh Sharma:rajesh@example.com:user'

  let groupId: string
  let bookingId1: string
  let bookingId2: string
  let passengerIds: string[] = []
  let ticketPdfId: string
  let tempPdfPath: string
  let tempTextPath: string

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.USE_LOCAL_DB = 'true'
    await resetDatabase()

    // Create Group
    const { data: group } = await supabaseAdmin
      .from('groups')
      .insert({ group_code: 'GRP-7701', name: 'Mumbai Darshan Sangh', lead_mobile: '9820123456' })
      .select('*')
      .single()
    groupId = group.id

    // Create Booking 1
    const b1Res = await request(app)
      .post('/api/bookings')
      .set('Authorization', CUSTOMER_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        groupId,
        travelerCount: 2,
        leadName: 'Ashok Kadam',
        leadPhone: '9820123456',
        passengers: [
          { full_name: 'Ashok Kadam', age: 48, gender: 'M', phone: '9820123456', travel_class: 'ac' },
          { full_name: 'Meena Kadam', age: 45, gender: 'F', phone: '9820123456', travel_class: 'ac' },
        ],
      })
    bookingId1 = b1Res.body.booking.id
    passengerIds.push(...b1Res.body.passengers.map((p: any) => p.id))

    // Create Booking 2 in SAME Group (Cross-booking test in single PDF)
    const b2Res = await request(app)
      .post('/api/bookings')
      .set('Authorization', CUSTOMER_TOKEN)
      .send({
        packageId: 'default-pkg-001',
        groupId,
        travelerCount: 1,
        leadName: 'Sanjay Shinde',
        leadPhone: '9820123457',
        passengers: [
          { full_name: 'Sanjay Shinde', age: 50, gender: 'M', phone: '9820123457', travel_class: 'ac' },
        ],
      })
    bookingId2 = b2Res.body.booking.id
    passengerIds.push(...b2Res.body.passengers.map((p: any) => p.id))

    // Create a dummy valid PDF file for upload
    const uploadsDir = path.resolve(__dirname, '../../uploads/temp_test')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
    tempPdfPath = path.join(uploadsDir, 'sample_ticket.pdf')
    fs.writeFileSync(
      tempPdfPath,
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000018 00000 n\n0000000067 00000 n\n0000000122 00000 n\ntrailer<</Root 1 0 R/Size 4>>\nstartxref\n200\n%%EOF\n',
    )

    // Create a non-PDF text file to test file-type rejection
    tempTextPath = path.join(uploadsDir, 'malicious.txt')
    fs.writeFileSync(tempTextPath, 'This is an invalid plain text file, not a PDF.')
  })

  it('rejects non-PDF file uploads with an error', async () => {
    const res = await request(app)
      .post('/api/train-tickets/upload')
      .set('Authorization', TRAIN_STAFF_TOKEN)
      .field('groupId', groupId)
      .field('journeyType', 'going')
      .attach('file', tempTextPath)

    expect(res.status).toBe(500) // Multer fileFilter rejection
  })

  it('uploads valid PDF ticket, validates private storage, and records upload history', async () => {
    const res = await request(app)
      .post('/api/train-tickets/upload')
      .set('Authorization', TRAIN_STAFF_TOKEN)
      .field('groupId', groupId)
      .field('journeyType', 'going')
      .field('pnr', '2418596321')
      .attach('file', tempPdfPath)

    expect(res.status).toBe(201)
    expect(res.body.ticketPdf).toBeDefined()
    expect(res.body.ticketPdf.pnr).toBe('2418596321')
    expect(res.body.ticketPdf.journey_type).toBe('going')
    ticketPdfId = res.body.ticketPdf.id

    // Verify storage is in private directory
    const storedPath = res.body.ticketPdf.file_path
    expect(storedPath).toContain('uploads')
    expect(fs.existsSync(storedPath)).toBe(true)

    // Verify upload history listing
    const listRes = await request(app)
      .get(`/api/train-tickets?groupId=${groupId}`)
      .set('Authorization', TRAIN_STAFF_TOKEN)

    expect(listRes.status).toBe(200)
    expect(listRes.body.tickets.length).toBeGreaterThanOrEqual(1)
    expect(listRes.body.tickets[0].id).toBe(ticketPdfId)
  })

  it('maps single PDF to passengers from multiple Booking IDs within the group', async () => {
    // 3 passengers across 2 Booking IDs mapped to the same Going ticket PDF
    const mappings = [
      { passengerId: passengerIds[0], bookingId: bookingId1, coach: 'B2', seatBerth: '21 LB' },
      { passengerId: passengerIds[1], bookingId: bookingId1, coach: 'B2', seatBerth: '24 MB' },
      { passengerId: passengerIds[2], bookingId: bookingId2, coach: 'B2', seatBerth: '22 MB' },
    ]

    const res = await request(app)
      .post('/api/train-tickets/map')
      .set('Authorization', TRAIN_STAFF_TOKEN)
      .send({
        ticketPdfId,
        pnr: '2418596321',
        journeyType: 'going',
        mappings,
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.mappings).toHaveLength(3)

    // Verify mappings query
    const mapRes = await request(app)
      .get(`/api/train-tickets/${ticketPdfId}/mappings`)
      .set('Authorization', TRAIN_STAFF_TOKEN)

    expect(mapRes.status).toBe(200)
    expect(mapRes.body.mappings).toHaveLength(3)
  })

  it('prevents unauthorized download / IDOR access to ticket PDF without signed HMAC token', async () => {
    // Attempt download with NO token
    const resNoToken = await request(app).get(`/api/train-tickets/${ticketPdfId}/download`)
    expect(resNoToken.status).toBe(403)
    expect(resNoToken.body.error).toContain('Forbidden')

    // Attempt download with tampered token
    const resBadToken = await request(app).get(
      `/api/train-tickets/${ticketPdfId}/download?token=9999999999.badhash123`,
    )
    expect(resBadToken.status).toBe(403)
  })

  it('authorizes ticket download with a valid HMAC signed token', async () => {
    const validToken = generateTicketDownloadToken(ticketPdfId, 3600)
    const res = await request(app).get(`/api/train-tickets/${ticketPdfId}/download?token=${validToken}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
  })

  it('allows Train Staff to deactivate/replace a ticket PDF and maintains audit trail', async () => {
    const res = await request(app)
      .delete(`/api/train-tickets/${ticketPdfId}`)
      .set('Authorization', TRAIN_STAFF_TOKEN)

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('deactivated')

    // Verify audit log exists
    const { data: audits } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('entity_id', ticketPdfId)
      .eq('action', 'TICKET_PDF_DEACTIVATE')

    expect(audits).toBeDefined()
    expect(audits!.length).toBeGreaterThanOrEqual(1)
  })
})
