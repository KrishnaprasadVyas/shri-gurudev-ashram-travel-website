import { Router } from 'express'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { upload } from '../middleware/upload.js'

export const passengersRouter = Router({ mergeParams: true })

type PassengerPayload = {
  id?: string
  passenger_index: number
  is_primary: boolean
  full_name: string
  gender: string
  dob: string
  phone: string
  address: string
  aadhaar_number: string
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
      .select('user_id, status, traveler_count')
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
