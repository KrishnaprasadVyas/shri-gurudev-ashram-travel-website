import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Router } from 'express'
import multer from 'multer'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { requireTrainStaff } from '../middleware/rbac.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { parseTicketPdf } from '../services/pdfParser.js'
import {
  generateTrainManifestWorkbook,
  generateSingleManifestWorkbook,
  TrainExportPassenger,
} from '../services/excelExporter.js'
import { logAudit } from '../services/auditLogger.js'
import { SIGNED_URL_SECRET } from '../config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TICKETS_DIR = path.resolve(__dirname, '../../uploads/tickets')

if (!fs.existsSync(TICKETS_DIR)) {
  fs.mkdirSync(TICKETS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TICKETS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf'
    const safeName = `ticket_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`
    cb(null, safeName)
  },
})

const uploadTicket = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF ticket documents are permitted'))
    }
  },
})

export const trainJourneysRouter = Router()

/**
 * Generates an HMAC signed token for private ticket PDF streaming
 */
export function generateTicketDownloadToken(ticketId: string, expiresInSec = 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec
  const hash = crypto
    .createHmac('sha256', SIGNED_URL_SECRET)
    .update(`${ticketId}:${expiresAt}`)
    .digest('hex')
  return `${expiresAt}.${hash}`
}

/**
 * Validates the HMAC token
 */
export function verifyTicketDownloadToken(ticketId: string, token: string): boolean {
  try {
    const [expiresStr, hash] = token.split('.')
    if (!expiresStr || !hash) return false
    const expiresAt = Number(expiresStr)
    if (Date.now() / 1000 > expiresAt) return false // Expired
    const expected = crypto
      .createHmac('sha256', SIGNED_URL_SECRET)
      .update(`${ticketId}:${expiresAt}`)
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))
  } catch {
    return false
  }
}

/**
 * GET /api/train-tickets/:id/download - Secure, authenticated ticket streaming proxy
 */
trainJourneysRouter.get('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const token = String(req.query.token || '')

    // Check signed token or authorization header
    let isAuthorized = false
    if (token && verifyTicketDownloadToken(id, token)) {
      isAuthorized = true
    }

    if (!isAuthorized) {
      throw new HttpError(403, 'Forbidden: Invalid or expired ticket download signature')
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('ticket_pdfs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !ticket || !ticket.is_active) {
      throw new HttpError(404, 'Ticket PDF not found')
    }

    if (!fs.existsSync(ticket.file_path)) {
      throw new HttpError(404, 'Ticket file missing on server storage')
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${ticket.file_name || 'train-ticket.pdf'}"`)
    const fileStream = fs.createReadStream(ticket.file_path)
    fileStream.pipe(res)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/train-tickets/:id/signed-url - Helper to get signed download link
 */
trainJourneysRouter.get('/:id/signed-url', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const token = generateTicketDownloadToken(id)
    const downloadUrl = `/api/train-tickets/${id}/download?token=${token}`
    res.json({ downloadUrl, token })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/train-tickets/upload - Upload Akbar/IRCTC Ticket PDF and parse suggestions
 */
trainJourneysRouter.post(
  '/upload',
  requireAuth,
  requireTrainStaff,
  uploadTicket.single('file'),
  async (req, res, next) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest
      const file = req.file
      if (!file) throw new HttpError(400, 'Ticket PDF file is required')

      const { groupId, journeyType, pnr } = req.body
      if (!groupId) throw new HttpError(400, 'groupId is required')
      if (!['going', 'return'].includes(journeyType)) {
        throw new HttpError(400, 'journeyType must be either "going" or "return"')
      }

      // Read file buffer for automated PDF parsing
      const fileBuffer = fs.readFileSync(file.path)
      const parsedData = await parseTicketPdf(fileBuffer)

      const finalPnr = pnr?.trim() || parsedData.pnr || null

      // Insert record in ticket_pdfs
      const { data: ticketPdf, error } = await supabaseAdmin
        .from('ticket_pdfs')
        .insert({
          group_id: groupId,
          journey_type: journeyType,
          pnr: finalPnr,
          file_name: file.originalname,
          file_path: file.path,
          file_size: file.size,
          uploaded_by: authReq.userId,
        })
        .select('*')
        .single()

      if (error) throw new HttpError(500, error.message)

      await logAudit({
        actorId: authReq.userId,
        action: 'TICKET_PDF_UPLOAD',
        entityType: 'ticket',
        entityId: ticketPdf.id,
        newValues: ticketPdf,
        reason: `Uploaded ${journeyType} ticket PDF: ${file.originalname}`,
      })

      res.status(201).json({
        ticketPdf,
        detectedPnr: parsedData.pnr,
        suggestedPassengers: parsedData.suggestedPassengers,
      })
    } catch (error) {
      next(error)
    }
  },
)

/**
 * POST /api/train-tickets/map - Confirm ticket-to-passenger mapping
 */
trainJourneysRouter.post('/map', requireAuth, requireTrainStaff, async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { ticketPdfId, pnr, journeyType, mappings } = req.body

    if (!ticketPdfId || !pnr || !journeyType || !Array.isArray(mappings) || mappings.length === 0) {
      throw new HttpError(400, 'Missing required mapping parameters')
    }

    const insertRows = mappings.map((m: any) => ({
      ticket_pdf_id: ticketPdfId,
      passenger_id: m.passengerId,
      booking_id: m.bookingId,
      journey_type: journeyType,
      pnr: pnr.trim(),
      coach: m.coach?.trim() || null,
      seat_berth: m.seatBerth?.trim() || null,
    }))

    const { data: saved, error } = await supabaseAdmin
      .from('ticket_passenger_mappings')
      .upsert(insertRows, { onConflict: 'passenger_id, journey_type' })
      .select('*')

    if (error) throw new HttpError(500, error.message)

    await logAudit({
      actorId: authReq.userId,
      action: 'TICKET_PASSENGER_MAPPING',
      entityType: 'ticket',
      entityId: ticketPdfId,
      newValues: { pnr, count: mappings.length },
      reason: `Mapped ${mappings.length} passengers to ticket ${ticketPdfId}`,
    })

    res.json({ success: true, mappings: saved })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/train-tickets/export/excel - Akbar-compliant 4-Sheet Excel Export
 */
trainJourneysRouter.get('/export/excel', requireAuth, requireTrainStaff, async (req, res, next) => {
  try {
    const groupId = req.query.groupId as string | undefined
    const sheetType = req.query.sheet as string | undefined // 'all', 'going-ac', etc.

    let query = supabaseAdmin
      .from('passengers')
      .select(`
        id,
        passenger_code,
        full_name,
        age,
        gender,
        mobile,
        travel_class,
        booking_id,
        group_id,
        id_proof_type,
        id_proof_number,
        bookings(id, booking_code, boarding_station, destination_station, going_date, return_date),
        groups(id, group_code, name)
      `)

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    const { data: passengers, error } = await query

    if (error) throw new HttpError(500, error.message)

    // Build flat list with both Going and Return journey rows per passenger
    const exportPassengers: TrainExportPassenger[] = []

    for (const p of passengers || []) {
      const b = p.bookings as any
      const g = p.groups as any

      // Going row
      exportPassengers.push({
        groupId: p.group_id,
        groupCode: g?.group_code || 'GRP-UNASSIGNED',
        groupName: g?.name || 'Unassigned Group',
        bookingId: p.booking_id,
        bookingCode: b?.booking_code || 'N/A',
        passengerId: p.id,
        passengerCode: p.passenger_code,
        passengerName: p.full_name,
        age: p.age,
        gender: p.gender,
        mobile: p.mobile || '',
        travelClass: p.travel_class,
        journeyType: 'going',
        journeyDate: b?.going_date || 'TBD',
        boardingStation: b?.boarding_station || 'NDLS',
        destinationStation: b?.destination_station || 'SVDK',
        idProofType: p.id_proof_type,
        idProofNumber: p.id_proof_number,
      })

      // Return row
      exportPassengers.push({
        groupId: p.group_id,
        groupCode: g?.group_code || 'GRP-UNASSIGNED',
        groupName: g?.name || 'Unassigned Group',
        bookingId: p.booking_id,
        bookingCode: b?.booking_code || 'N/A',
        passengerId: p.id,
        passengerCode: p.passenger_code,
        passengerName: p.full_name,
        age: p.age,
        gender: p.gender,
        mobile: p.mobile || '',
        travelClass: p.travel_class,
        journeyType: 'return',
        journeyDate: b?.return_date || 'TBD',
        boardingStation: b?.destination_station || 'SVDK',
        destinationStation: b?.boarding_station || 'NDLS',
        idProofType: p.id_proof_type,
        idProofNumber: p.id_proof_number,
      })
    }

    let workbook
    let filename = `MAVT_TRAIN_MANIFEST_${new Date().toISOString().split('T')[0]}.xlsx`

    if (sheetType && sheetType !== 'all') {
      const titleMap: Record<string, string> = {
        'going-ac': 'Going - AC',
        'going-non-ac': 'Going - Non-AC',
        'return-ac': 'Return - AC',
        'return-non-ac': 'Return - Non-AC',
      }
      const title = titleMap[sheetType.toLowerCase()] || 'Manifest'
      const [jType, tClass] = sheetType.split('-')
      const filtered = exportPassengers.filter(
        (p) => p.journeyType.toLowerCase() === jType && p.travelClass.toLowerCase() === (tClass === 'ac' ? 'ac' : 'non_ac'),
      )
      workbook = await generateSingleManifestWorkbook(title, filtered)
      filename = `MAVT_TRAIN_${sheetType.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
    } else {
      workbook = await generateTrainManifestWorkbook(exportPassengers)
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/train-tickets - List tickets with optional group filter
 */
trainJourneysRouter.get('/', requireAuth, requireTrainStaff, async (req, res, next) => {
  try {
    const groupId = req.query.groupId as string | undefined
    let query = supabaseAdmin.from('ticket_pdfs').select('*').order('created_at', { ascending: false })
    if (groupId) query = query.eq('group_id', groupId)
    const { data: tickets, error } = await query
    if (error) throw new HttpError(500, error.message)
    res.json({ tickets: tickets || [] })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/train-tickets/:id/mappings - Get passenger mappings for a ticket
 */
trainJourneysRouter.get('/:id/mappings', requireAuth, requireTrainStaff, async (req, res, next) => {
  try {
    const { id } = req.params as { id: string }
    const { data: mappings, error } = await supabaseAdmin
      .from('ticket_passenger_mappings')
      .select('*, passengers(passenger_code, full_name, mobile)')
      .eq('ticket_pdf_id', id)
    if (error) throw new HttpError(500, error.message)
    res.json({ mappings: mappings || [] })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/train-tickets/:id - Deactivate ticket PDF with audit trail
 */
trainJourneysRouter.delete('/:id', requireAuth, requireTrainStaff, async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { id } = req.params as { id: string }
    const { data: ticket, error: fetchErr } = await supabaseAdmin
      .from('ticket_pdfs')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchErr || !ticket) throw new HttpError(404, 'Ticket PDF not found')

    await supabaseAdmin.from('ticket_pdfs').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)

    await logAudit({
      actorId: authReq.userId,
      action: 'TICKET_PDF_DEACTIVATE',
      entityType: 'ticket',
      entityId: id,
      oldValues: ticket,
      reason: 'Deactivated ticket PDF',
    })
    res.json({ success: true, message: 'Ticket PDF deactivated' })
  } catch (error) {
    next(error)
  }
})
