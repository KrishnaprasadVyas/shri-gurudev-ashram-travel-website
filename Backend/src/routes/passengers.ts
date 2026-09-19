import { Router } from 'express'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { upload } from '../middleware/upload.js'
import { formatPassengerCode } from '../services/idGenerators.js'
import { logAudit } from '../services/auditLogger.js'

export const passengersRouter = Router({ mergeParams: true })

type PassengerPayload = {
  id?: string
  passenger_index: number
  is_primary: boolean
  full_name: string
  gender: string
  dob: string
  phone: string
  whatsapp_number?: string
  whatsappNumber?: string
  address: string
  aadhaar_number: string
  travel_class?: 'ac' | 'non_ac'
  travelClass?: 'ac' | 'non_ac'
  boarding_station?: string
  destination_station?: string
}

// POST /api/bookings/:bookingId/passengers
// Bulk upserts passengers for a booking
passengersRouter.post('/', requireAuth, async (request, response, next) => {
  try {
    const { bookingId } = request.params
    const authRequest = request as AuthenticatedRequest
    const { passengers } = request.body as { passengers: PassengerPayload[] }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      throw new HttpError(400, 'Passengers array is required')
    }

    // Verify booking belongs to user and is in a valid state
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('user_id, status, traveler_count, group_id, boarding_station, destination_station')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) throw new HttpError(404, 'Booking not found')
    if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Unauthorized')
    if (!['draft', 'documents_pending'].includes(booking.status)) {
      throw new HttpError(400, 'Cannot edit passengers for this booking state')
    }
    if (passengers.length !== booking.traveler_count) {
      throw new HttpError(400, `Expected ${booking.traveler_count} passengers, got ${passengers.length}`)
    }

    // Upsert all passengers
    const upsertData = passengers.map(p => {
      // Basic validation
      if (!p.full_name?.trim() || !p.gender || !p.dob || !p.phone?.trim() || !p.address?.trim() || !p.aadhaar_number?.trim()) {
        throw new HttpError(400, 'Missing required passenger fields')
      }
      return {
        ...(p.id ? { id: p.id } : {}),
        booking_id: bookingId,
        passenger_index: p.passenger_index,
        is_primary: p.is_primary,
        full_name: p.full_name.trim(),
        gender: p.gender,
        dob: p.dob,
        phone: p.phone.trim(),
        address: p.address.trim(),
        aadhaar_number: p.aadhaar_number.trim(),
      }
    })

    const { data: upserted, error: upsertError } = await supabaseAdmin
      .from('booking_passengers')
      .upsert(upsertData, { onConflict: 'booking_id, passenger_index' })
      .select('*')

    if (upsertError) throw new HttpError(500, `Failed to save passengers: ${upsertError.message}`)

    // Sync to canonical passengers table (Req #3, #16)
    if (upserted && upserted.length > 0) {
      for (let i = 0; i < upserted.length; i++) {
        const up = upserted[i]
        const orig = passengers[i] || ({} as PassengerPayload)
        const passCode = formatPassengerCode(i + 1)
        const tClass = (orig.travel_class || orig.travelClass || 'non_ac').toLowerCase()
        const wa = orig.whatsapp_number || orig.whatsappNumber || up.phone
        const bStation = orig.boarding_station || booking.boarding_station || 'NDLS'
        const dStation = orig.destination_station || booking.destination_station || 'SVDK'

        await supabaseAdmin.from('passengers').upsert({
          id: up.id,
          booking_id: bookingId,
          group_id: booking.group_id || null,
          passenger_code: passCode,
          passenger_index: up.passenger_index,
          full_name: up.full_name,
          gender: up.gender,
          dob: up.dob,
          phone: up.phone,
          whatsapp_number: wa,
          address: up.address,
          aadhaar_number: up.aadhaar_number,
          travel_class: tClass,
          boarding_station: bStation,
          destination_station: dStation,
          verification_status: up.verification_status || 'submitted',
        }, { onConflict: 'id' })
      }
    }

    // Update booking status if it was draft
    if (booking.status === 'draft') {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'documents_pending', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
    }

    response.json({ passengers: upserted })
  } catch (error) {
    next(error)
  }
})

// POST /api/bookings/:bookingId/passengers/:passengerId/documents/:type
// Uploads a document for a specific passenger
passengersRouter.post(
  '/:passengerId/documents/:type',
  requireAuth,
  (req, res, next) => {
    const { type } = req.params as Record<string, string>
    const allowedTypes = ['aadhaar_front', 'aadhaar_back', 'selfie']
    if (!allowedTypes.includes(type)) {
      return next(new HttpError(400, 'Invalid document type'))
    }
    next()
  },
  upload.single('file'),
  async (request, response, next) => {
    try {
      const authRequest = request as AuthenticatedRequest
      const { bookingId, passengerId, type } = request.params

      if (!authRequest.file) {
        throw new HttpError(400, 'No file uploaded')
      }

      // Verify booking belongs to user
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('user_id, status')
        .eq('id', bookingId)
        .single()

      if (fetchError || !booking) throw new HttpError(404, 'Booking not found')
      if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Unauthorized')
      if (!['draft', 'documents_pending', 'verification_pending'].includes(booking.status)) {
        throw new HttpError(400, 'Cannot upload documents in this booking state')
      }

      // Verify passenger exists
      const { data: passenger, error: passError } = await supabaseAdmin
        .from('booking_passengers')
        .select('id')
        .eq('id', passengerId)
        .eq('booking_id', bookingId)
        .single()

      if (passError || !passenger) throw new HttpError(404, 'Passenger not found')

      // Upsert document record
      const relativePath = `uploads/bookings/${bookingId}/${passengerId}/${authRequest.file.filename}`

      const { data: doc, error: docError } = await supabaseAdmin
        .from('passenger_documents')
        .upsert({
          passenger_id: passengerId,
          document_type: type,
          file_path: relativePath,
          uploaded_at: new Date().toISOString(),
        }, { onConflict: 'passenger_id, document_type' })
        .select('*')
        .single()

      if (docError) throw new HttpError(500, `Failed to save document record: ${docError.message}`)

      response.json({ document: doc })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/passengers/check-duplicate-id
 * Checks whether an ID proof number exists and returns duplicate warning + details (Section 6)
 */
passengersRouter.post('/check-duplicate-id', requireAuth, async (req, res, next) => {
  try {
    const { idProofNumber, aadhaarNumber } = req.body
    const searchId = (idProofNumber || aadhaarNumber || '').trim()

    if (!searchId) {
      return res.json({ isDuplicate: false })
    }

    const { data: matches } = await supabaseAdmin
      .from('passengers')
      .select('id, passenger_code, full_name, age, gender, id_proof_type, id_proof_number, aadhaar_number, booking_id, group_id, bookings(booking_code, lead_passenger_name, going_date, booking_status), groups(group_code, name)')
      .or(`id_proof_number.eq.${searchId},aadhaar_number.eq.${searchId}`)

    if (matches && matches.length > 0) {
      const match = matches[0]
      return res.json({
        isDuplicate: true,
        warning: `Devotee with ID ${searchId} is already registered as ${match.full_name} (${match.passenger_code}).`,
        existingPassenger: {
          id: match.id,
          passengerCode: match.passenger_code,
          fullName: match.full_name,
          age: match.age,
          gender: match.gender,
          bookingId: match.booking_id,
          bookingCode: (match.bookings as any)?.booking_code,
          groupId: match.group_id,
          groupCode: (match.groups as any)?.group_code,
        },
      })
    }

    res.json({ isDuplicate: false })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/passengers/override-duplicate-id
 * Records decision to link or override duplicate ID record in immutable audit log (Section 6)
 */
passengersRouter.post('/override-duplicate-id', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { passengerId, idProofNumber, overrideReason, linkExistingPassengerId } = req.body

    if (!passengerId) throw new HttpError(400, 'passengerId is required')
    if (!overrideReason && !linkExistingPassengerId) {
      throw new HttpError(400, 'overrideReason or linkExistingPassengerId is required')
    }

    const { data: passenger, error } = await supabaseAdmin
      .from('passengers')
      .select('*')
      .eq('id', passengerId)
      .single()

    if (error || !passenger) throw new HttpError(404, 'Passenger not found')

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (linkExistingPassengerId) {
      updateData.is_existing_linked = true
      updateData.duplicate_override_reason = `Linked to existing passenger ${linkExistingPassengerId}`
    } else {
      updateData.duplicate_override_reason = overrideReason
    }

    await supabaseAdmin
      .from('passengers')
      .update(updateData)
      .eq('id', passengerId)

    await logAudit({
      actorId: authReq.userId,
      actorName: 'Staff Member',
      actorRole: 'staff',
      action: 'PASSENGER_ID_DUPLICATE_OVERRIDE',
      entityType: 'passenger',
      entityId: passengerId,
      oldValues: { isLinked: passenger.is_existing_linked },
      newValues: {
        isLinked: updateData.is_existing_linked || false,
        overrideReason: updateData.duplicate_override_reason,
        idProofNumber: idProofNumber || passenger.id_proof_number,
      },
      reason: `ID duplicate override decision: ${updateData.duplicate_override_reason}`,
    })

    res.json({ success: true, message: 'ID duplicate override decision recorded' })
  } catch (err) {
    next(err)
  }
})
