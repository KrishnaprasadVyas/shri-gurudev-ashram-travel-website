import crypto from 'crypto'
import { Router } from 'express'
import { HttpError } from '../errors.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { SIGNED_URL_SECRET } from '../config.js'
import { generateTicketDownloadToken } from './trainJourneys.js'

export const myTripRouter = Router()

/**
 * Generates an HMAC session token scoped to a customer booking
 */
export function generateCustomerTripToken(bookingId: string, mobile: string, expiresInSec = 86400): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec
  const signature = crypto
    .createHmac('sha256', SIGNED_URL_SECRET)
    .update(`${bookingId}:${mobile}:${expiresAt}`)
    .digest('hex')
  return `${bookingId}.${mobile}.${expiresAt}.${signature}`
}

/**
 * Validates the customer trip token
 */
export function verifyCustomerTripToken(token: string): { bookingId: string; mobile: string } | null {
  try {
    const [bookingId, mobile, expiresStr, signature] = token.split('.')
    if (!bookingId || !mobile || !expiresStr || !signature) return null
    const expiresAt = Number(expiresStr)
    if (Date.now() / 1000 > expiresAt) return null

    const expected = crypto
      .createHmac('sha256', SIGNED_URL_SECRET)
      .update(`${bookingId}:${mobile}:${expiresAt}`)
      .digest('hex')

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null
    }

    return { bookingId, mobile }
  } catch {
    return null
  }
}

/**
 * Builds the complete customer travel dossier matching Section 36 mockup
 */
export async function buildTripDossier(bookingId: string) {
  const { data: booking, error: bErr } = await supabaseAdmin
    .from('bookings')
    .select('*, travel_packages(title, image_url, start_date, end_date), groups(group_code, name)')
    .eq('id', bookingId)
    .single()

  if (bErr || !booking) {
    throw new HttpError(404, 'Booking not found')
  }

  // Fetch passengers
  const { data: passengers } = await supabaseAdmin
    .from('passengers')
    .select('*')
    .eq('booking_id', bookingId)
    .order('passenger_index', { ascending: true })

  const passengerList = passengers || []
  const passengerIds = passengerList.map((p: any) => p.id)

  // Fetch payments
  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  // Fetch train mappings for these passengers
  let goingTrain: any = null
  let returnTrain: any = null

  if (passengerIds.length > 0) {
    const { data: mappings } = await supabaseAdmin
      .from('ticket_passenger_mappings')
      .select('*, ticket_pdfs(*)')
      .in('passenger_id', passengerIds)

    const mapList = mappings || []

    const goingMaps = mapList.filter((m: any) => m.journey_type === 'going')
    if (goingMaps.length > 0) {
      const first = goingMaps[0]
      const ticketId = first.ticket_pdf_id
      const downloadToken = generateTicketDownloadToken(ticketId)
      goingTrain = {
        pnr: first.pnr,
        coach: goingMaps.map((m: any) => m.coach).filter(Boolean).join(', ') || 'TBD',
        seats: goingMaps.map((m: any) => m.seat_berth).filter(Boolean).join(', ') || 'TBD',
        downloadUrl: `/api/train-tickets/${ticketId}/download?token=${downloadToken}`,
      }
    }

    const returnMaps = mapList.filter((m: any) => m.journey_type === 'return')
    if (returnMaps.length > 0) {
      const first = returnMaps[0]
      const ticketId = first.ticket_pdf_id
      const downloadToken = generateTicketDownloadToken(ticketId)
      returnTrain = {
        pnr: first.pnr,
        coach: returnMaps.map((m: any) => m.coach).filter(Boolean).join(', ') || 'TBD',
        seats: returnMaps.map((m: any) => m.seat_berth).filter(Boolean).join(', ') || 'TBD',
        downloadUrl: `/api/train-tickets/${ticketId}/download?token=${downloadToken}`,
      }
    }
  }

  // Fetch room allocations
  let allocatedRooms: any[] = []
  if (passengerIds.length > 0) {
    const { data: allocations } = await supabaseAdmin
      .from('room_allocations')
      .select('*, rooms(*)')
      .in('passenger_id', passengerIds)

    if (allocations && allocations.length > 0) {
      const uniqueRooms = new Map()
      allocations.forEach((a: any) => {
        if (a.rooms && !uniqueRooms.has(a.room_id)) {
          uniqueRooms.set(a.room_id, a.rooms)
        }
      })
      allocatedRooms = Array.from(uniqueRooms.values())
    }
  }

  const serviceOption = booking.service_option || 'yatra_room_train'
  const isOnlyRoom = serviceOption === 'only_room'

  let finalRooms = allocatedRooms.map((r) => ({
    hotelAshramName: r.hotel_ashram_name,
    building: r.building,
    floor: r.floor,
    roomNumber: r.room_number,
    roomType: r.room_type,
  }))

  if (finalRooms.length === 0 && booking.hotel_name) {
    finalRooms = [{
      hotelAshramName: booking.hotel_name,
      building: 'Ashram Main Block',
      floor: 'Ground',
      roomNumber: 'Assigned upon check-in',
      roomType: booking.room_type || 'AC Room',
    }]
  }

  return {
    bookingId: booking.id,
    bookingCode: booking.booking_code || booking.booking_reference,
    bookingStatus: booking.booking_status,
    paymentStatus: booking.payment_status,
    packageTitle: isOnlyRoom ? (booking.hotel_name || 'Ashram Room Accommodation') : ((booking.travel_packages as any)?.title || 'Holy Pilgrimage'),
    groupName: (booking.groups as any)?.name || 'Pilgrimage Group',
    travelerCount: booking.traveler_count,
    serviceOption,
    trainArrangement: booking.train_arrangement || (isOnlyRoom ? 'none' : 'tourism_arranged'),
    bookingChannel: booking.booking_channel || 'Customer-Web',
    hotelName: booking.hotel_name,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    roomRent: Number(booking.room_rent || 0),
    financials: {
      totalAmount: Number(booking.total_amount),
      totalPaid: Number(booking.total_paid || 0),
      pendingBalance: Number(booking.pending_balance || 0),
    },
    passengers: passengerList.map((p: any) => ({
      id: p.id,
      passengerCode: p.passenger_code,
      name: p.full_name,
      age: p.age,
      gender: p.gender,
      travelClass: p.travel_class,
    })),
    payments: payments || [],
    goingTrain: isOnlyRoom ? null : goingTrain,
    returnTrain: isOnlyRoom ? null : returnTrain,
    rooms: finalRooms,
    travelInstructions: isOnlyRoom
      ? 'Please present your Booking ID and Government ID at the ashram reception upon arrival for room key issuance.'
      : 'Please arrive at the station 45 minutes prior to scheduled departure with a valid Government ID.',
  }
}

/**
 * POST /api/my-trip/lookup - Direct customer lookup via Booking ID + Mobile Number
 */
myTripRouter.post('/lookup', async (req, res, next) => {
  try {
    const { bookingCode, mobile } = req.body

    if (!bookingCode || !mobile) {
      throw new HttpError(400, 'Booking ID and Mobile Number are required')
    }

    const cleanCode = String(bookingCode).trim()
    const cleanMobile = String(mobile).trim().replace(/\D/g, '').slice(-10)

    // Lookup booking by booking_code OR booking_reference
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, mobile, phone_number')
      .or(`booking_code.eq.${cleanCode},booking_reference.eq.${cleanCode}`)
      .maybeSingle()

    if (error || !booking) {
      throw new HttpError(404, 'No booking found matching the provided Booking ID')
    }

    // Server-side authorization check: verify mobile number belongs to lead or any passenger in booking
    const bookingMobile = (booking.mobile || booking.phone_number || '').replace(/\D/g, '').slice(-10)
    let isAuthorized = Boolean(bookingMobile && bookingMobile === cleanMobile)

    if (!isAuthorized) {
      const { data: matchedPass } = await supabaseAdmin
        .from('passengers')
        .select('id')
        .eq('booking_id', booking.id)
        .maybeSingle()

      if (matchedPass) {
        // Also check if any passenger record in this booking has this phone
        const { data: passList } = await supabaseAdmin
          .from('passengers')
          .select('mobile')
          .eq('booking_id', booking.id)
        
        if (Array.isArray(passList) && passList.some((p: any) => (p.mobile || '').replace(/\D/g, '').slice(-10) === cleanMobile)) {
          isAuthorized = true
        }
      }
    }

    if (!isAuthorized) {
      throw new HttpError(403, 'The provided mobile number does not match this booking')
    }

    const token = generateCustomerTripToken(booking.id, cleanMobile)
    const tripDossier = await buildTripDossier(booking.id)

    res.json({
      token,
      trip: tripDossier,
      tripToken: token,
      dossier: tripDossier,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/my-trip/dossier - Fetch trip dossier using authenticated token
 */
myTripRouter.get('/dossier', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    const token = authHeader || String(req.query.token || '')

    if (!token) throw new HttpError(401, 'Session token required')

    const verified = verifyCustomerTripToken(token)
    if (!verified) throw new HttpError(403, 'Invalid or expired session token')

    const trip = await buildTripDossier(verified.bookingId)
    res.json({ trip })
  } catch (error) {
    next(error)
  }
})
