import { Router } from 'express'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

export const bookingsRouter = Router()

function generateBookingReference() {
  const d = new Date()
  const yyyymmdd = d.toISOString().split('T')[0].replace(/-/g, '')
  const random4 = Math.floor(1000 + Math.random() * 9000)
  return `YAT-${yyyymmdd}-${random4}`
}

const DRAFT_TTL_MINUTES = Number(process.env.DRAFT_TTL_MINUTES) || 120
const PAYMENT_TTL_MINUTES = Number(process.env.PAYMENT_TTL_MINUTES) || 30

// POST /api/bookings/draft
bookingsRouter.post('/draft', requireAuth, async (request, response, next) => {
  try {
    const { packageId } = request.body
    if (!packageId || typeof packageId !== 'string') {
      throw new HttpError(400, 'packageId is required')
    }

    const { data: travelPackage, error: packageError } = await supabaseAdmin
      .from('travel_packages')
      .select('id, price, is_active, remaining_seats')
      .eq('id', packageId)
      .single()

    if (packageError || !travelPackage) {
      throw new HttpError(404, 'Travel package not found')
    }
    if (!travelPackage.is_active) {
      throw new HttpError(400, 'Travel package is not active')
    }

    const bookingReference = generateBookingReference()
    const expiresAt = new Date(Date.now() + DRAFT_TTL_MINUTES * 60 * 1000).toISOString()
    const authRequest = request as AuthenticatedRequest

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: authRequest.userId,
        package_id: packageId,
        status: 'draft',
        traveler_count: 1, // Default, updated later
        total_amount: travelPackage.price, // Will be recalculated at submit
        booking_reference: bookingReference,
        expires_at: expiresAt,
      })
      .select('*')
      .single()

    if (bookingError || !booking) {
      throw new HttpError(500, bookingError?.message ?? 'Failed to create draft booking')
    }

    response.status(201).json({ booking })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/bookings/:id/travellers
bookingsRouter.patch('/:id/travellers', requireAuth, async (request, response, next) => {
  try {
    const { id } = request.params
    const { travelerCount } = request.body
    const authRequest = request as AuthenticatedRequest

    if (travelerCount === undefined || typeof travelerCount !== 'number' || !Number.isInteger(travelerCount) || travelerCount < 1) {
      throw new HttpError(400, 'travelerCount must be a positive integer')
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !booking) throw new HttpError(404, 'Booking not found')
    if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Unauthorized')
    if (!['draft', 'documents_pending'].includes(booking.status)) {
      throw new HttpError(400, 'Cannot change traveller count for a booking in this state')
    }

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ traveler_count: travelerCount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError || !updatedBooking) {
      throw new HttpError(500, 'Failed to update traveler count')
    }

    response.json({ booking: updatedBooking })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/bookings/:id/preferences
bookingsRouter.patch('/:id/preferences', requireAuth, async (request, response, next) => {
  try {
    const { id } = request.params
    const {
      specialNotes,
      transportType,
      busType,
      roomType,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
    } = request.body
    const authRequest = request as AuthenticatedRequest

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !booking) throw new HttpError(404, 'Booking not found')
    if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Unauthorized')
    if (!['draft', 'documents_pending'].includes(booking.status)) {
      throw new HttpError(400, 'Cannot update preferences in this state')
    }

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        special_notes: specialNotes?.trim() || null,
        transport_type: transportType?.trim() || null,
        bus_type: busType?.trim() || null,
        room_type: roomType?.trim() || null,
        emergency_contact_name: emergencyContactName?.trim() || null,
        emergency_contact_phone: emergencyContactPhone?.trim() || null,
        emergency_contact_relationship: emergencyContactRelationship?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError || !updatedBooking) {
      throw new HttpError(500, 'Failed to update preferences')
    }

    response.json({ booking: updatedBooking })
  } catch (error) {
    next(error)
  }
})

// POST /api/bookings/:id/submit
bookingsRouter.post('/:id/submit', requireAuth, async (request, response, next) => {
  try {
    const { id } = request.params
    const authRequest = request as AuthenticatedRequest

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, travel_packages(price, remaining_seats, flight_price, train_ac_price, train_non_ac_price, room_ac_price, room_non_ac_price)')
      .eq('id', id)
      .single()

    if (fetchError || !booking) throw new HttpError(404, 'Booking not found')
    if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Unauthorized')
    if (!['draft', 'documents_pending'].includes(booking.status)) {
      throw new HttpError(400, 'Booking is already submitted or in an invalid state')
    }

    // Check passengers
    const { data: passengers, error: passengersError } = await supabaseAdmin
      .from('booking_passengers')
      .select('id, passenger_index, verification_status')
      .eq('booking_id', id)

    if (passengersError) throw new HttpError(500, 'Failed to fetch passengers')

    if (passengers.length !== booking.traveler_count) {
      throw new HttpError(400, `Expected ${booking.traveler_count} passengers, but found ${passengers.length}`)
    }

    // Check seats against soft reservation view? 
    // We can do this implicitly or just rely on the RPC for hard check.
    // For good UX, let's check soft availability first
    const { data: availability, error: availError } = await supabaseAdmin
      .from('package_seat_availability')
      .select('truly_available_seats')
      .eq('package_id', booking.package_id)
      .single()

    if (availError || !availability) throw new HttpError(500, 'Failed to check seat availability')
    if (availability.truly_available_seats < booking.traveler_count) {
      throw new HttpError(400, 'Not enough seats available at this time')
    }

    type PackagePrices = { price: number; flight_price?: number; train_ac_price?: number; train_non_ac_price?: number; room_ac_price?: number; room_non_ac_price?: number }
    const pkg = booking.travel_packages as PackagePrices
    const price = Number(pkg.price)
    
    // Add surcharges based on preferences
    const flightSurcharge = booking.transport_type === 'Flight' ? Number(pkg.flight_price || 0) : 0
    const trainAcSurcharge = (booking.transport_type === 'Train' && booking.bus_type === 'AC Train') ? Number(pkg.train_ac_price || 0) : 0
    const trainNonAcSurcharge = (booking.transport_type === 'Train' && booking.bus_type === 'Non-AC Train') ? Number(pkg.train_non_ac_price || 0) : 0
    const transportSurcharge = flightSurcharge + trainAcSurcharge + trainNonAcSurcharge

    const acRoomSurcharge = booking.room_type === 'AC Room' ? Number(pkg.room_ac_price || 0) : 0
    const nonAcRoomSurcharge = booking.room_type === 'Non-AC Room' ? Number(pkg.room_non_ac_price || 0) : 0
    const roomSurcharge = acRoomSurcharge + nonAcRoomSurcharge
    
    const pricePerPerson = price + transportSurcharge + roomSurcharge
    const baseAmount = pricePerPerson * booking.traveler_count
    const gatewayFee = baseAmount * 0.0236
    const payableAmount = baseAmount + gatewayFee
    const expiresAt = new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000).toISOString()

    const { data: submittedBooking, error: submitError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'payment_pending',
        base_amount: baseAmount,
        gateway_fee: gatewayFee,
        payable_amount: payableAmount,
        total_amount: payableAmount, // Fallback for old clients
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (submitError || !submittedBooking) throw new HttpError(500, 'Failed to submit booking')

    response.json({ booking: submittedBooking })
  } catch (error) {
    next(error)
  }
})

bookingsRouter.get('/', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*, travel_packages(title, image_url, start_date, duration)')
      .eq('user_id', authRequest.userId)
      .order('created_at', { ascending: false })

    if (error) throw new HttpError(500, error.message)

    const enriched = (bookings ?? []).map((b: Record<string, unknown>) => {
      const tp = b.travel_packages as { title?: string, image_url?: string, start_date?: string, duration?: string } | null
      return {
        ...b,
        packageTitle: tp?.title ?? 'Yatra Booking',
        packageImageUrl: tp?.image_url,
        packageStartDate: tp?.start_date,
        packageDuration: tp?.duration,
        travel_packages: undefined,
      }
    })

    response.json({ bookings: enriched })
  } catch (error) {
    next(error)
  }
})

bookingsRouter.get('/:id', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest
    const { id } = request.params

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        travel_packages(title, image_url, price, duration, start_date),
        booking_passengers(
          *,
          passenger_documents(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !booking) throw new HttpError(404, 'Booking not found')
    if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Booking does not belong to the authenticated user')

    response.json({ booking })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/bookings/:id
bookingsRouter.delete('/:id', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest
    const { id } = request.params

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !booking) throw new HttpError(404, 'Booking not found')
    if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Unauthorized')
    if (!['draft', 'documents_pending', 'payment_pending'].includes(booking.status)) {
      throw new HttpError(400, 'Cannot cancel a booking in this state')
    }

    const { error: cancelError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (cancelError) throw new HttpError(500, 'Failed to cancel booking')

    response.json({ success: true, message: 'Booking cancelled' })
  } catch (error) {
    next(error)
  }
})
