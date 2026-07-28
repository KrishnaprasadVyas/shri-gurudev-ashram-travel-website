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

function generateSevaReference(sevaType: string) {
  const d = new Date()
  const yyyymmdd = d.toISOString().split('T')[0].replace(/-/g, '')
  const random4 = Math.floor(1000 + Math.random() * 9000)
  const prefix = sevaType.toLowerCase().includes('yajman') ? 'YAJ' : 'SEV'
  return `${prefix}-${yyyymmdd}-${random4}`
}

const PAYMENT_TTL_MINUTES = Number(process.env.PAYMENT_TTL_MINUTES) || 30
const DRAFT_TTL_MINUTES = Number(process.env.DRAFT_TTL_MINUTES) || 120

// POST /api/bookings - Atomic Multi-Passenger & Attached Seva Booking Creation
bookingsRouter.post('/', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest
    const {
      packageId,
      travelerCount = 1,
      transportType,
      busType,
      roomType,
      specialNotes,
      additionalSevaPackageId,
      additionalSevaType,
      additionalSevaDate,
      passengers = [],
      fullName,
      phone,
      whatsappNumber,
      dob,
      address,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
    } = request.body

    if (!packageId || typeof packageId !== 'string') {
      throw new HttpError(400, 'packageId is required')
    }

    const count = Number(travelerCount)
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      throw new HttpError(400, 'travelerCount must be an integer between 1 and 20')
    }

    // Load Travel Package
    const { data: travelPackage, error: pkgError } = await supabaseAdmin
      .from('travel_packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (pkgError || !travelPackage) {
      throw new HttpError(404, 'Travel package not found')
    }
    if (!travelPackage.is_active) {
      throw new HttpError(400, 'Travel package is not active')
    }
    if (travelPackage.remaining_seats < count) {
      throw new HttpError(400, 'Not enough seats available')
    }

    // Load user for lead passenger document inheritance
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authRequest.userId)
      .single()

    // Additional Seva Fee Calculation
    let sevaFee = 0
    let sevaTypeResolved = additionalSevaType || null
    let targetSevaPackageId = additionalSevaPackageId || null

    if (additionalSevaPackageId) {
      const { data: sevaPkg } = await supabaseAdmin
        .from('seva_packages')
        .select('*')
        .eq('id', additionalSevaPackageId)
        .single()

      if (sevaPkg) {
        sevaFee = Number(sevaPkg.price)
        sevaTypeResolved = sevaPkg.seva_type
      }
    } else if (additionalSevaType) {
      if (additionalSevaType === 'guruji_aarti') sevaFee = 2100
      else if (additionalSevaType === 'yajman' || additionalSevaType === 'yajman_pad') sevaFee = 5100
      else sevaFee = 1000
    }

    // Pricing breakdown calculation
    const basePrice = Number(travelPackage.price)
    const flightSurcharge = transportType === 'Flight' ? Number(travelPackage.flight_price || 0) : 0
    const trainAcSurcharge = transportType === 'Train' && busType === 'AC Train' ? Number(travelPackage.train_ac_price || 0) : 0
    const trainNonAcSurcharge = transportType === 'Train' && busType === 'Non-AC Train' ? Number(travelPackage.train_non_ac_price || 0) : 0
    const transportAmountPerPerson = flightSurcharge + trainAcSurcharge + trainNonAcSurcharge

    const acRoomSurcharge = roomType === 'AC Room' ? Number(travelPackage.room_ac_price || 0) : 0
    const nonAcRoomSurcharge = roomType === 'Non-AC Room' ? Number(travelPackage.room_non_ac_price || 0) : 0
    const roomAmountPerPerson = acRoomSurcharge + nonAcRoomSurcharge

    const baseAmountTotal = basePrice * count
    const transportAmountTotal = transportAmountPerPerson * count
    const roomAmountTotal = roomAmountPerPerson * count
    const subtotalAmount = baseAmountTotal + transportAmountTotal + roomAmountTotal
    const totalAmount = subtotalAmount + sevaFee

    const gatewayFee = Math.round(totalAmount * 0.02)
    const payableAmount = totalAmount + gatewayFee

    const bookingReference = generateBookingReference()
    const expiresAt = new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000).toISOString()

    // Primary lead passenger info
    const leadPass = passengers[0] || {}
    const leadName = leadPass.fullName || fullName || userProfile?.full_name || 'Lead Traveler'
    const leadPhone = leadPass.phone || phone || userProfile?.phone || ''
    const leadAddress = leadPass.address || address || ''
    const leadDob = leadPass.dob || dob || null

    // 1. Insert into bookings
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        user_id: authRequest.userId,
        package_id: packageId,
        status: 'payment_pending',
        traveler_count: count,
        special_notes: specialNotes?.trim() || null,
        full_name: leadName,
        phone_number: leadPhone,
        whatsapp_number: whatsappNumber?.trim() || null,
        dob: leadDob,
        address: leadAddress,
        transport_type: transportType || 'Train',
        bus_type: busType || null,
        room_type: roomType || 'AC Room',
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        emergency_contact_relationship: emergencyContactRelationship || null,
        base_amount: baseAmountTotal,
        transport_amount: transportAmountTotal,
        room_amount: roomAmountTotal,
        additional_seva_package_id: targetSevaPackageId,
        additional_seva_type: sevaTypeResolved,
        additional_seva_date: additionalSevaDate || null,
        additional_seva_amount: sevaFee,
        subtotal_amount: subtotalAmount,
        total_amount: totalAmount,
        gateway_fee: gatewayFee,
        payable_amount: payableAmount,
        expires_at: expiresAt,
      })
      .select('*')
      .single()

    if (bookingError || !booking) {
      throw new HttpError(500, bookingError?.message ?? 'Failed to create booking')
    }

    // 2. Insert passengers & documents if provided
    const insertedPassengers = []
    if (Array.isArray(passengers) && passengers.length > 0) {
      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i]
        const isPrimary = i === 0

        // Document inheritance for lead passenger if user profile verified/submitted
        let aadhaarNo = p.aadhaarNumber || p.aadhaar_number || ''
        let aadhaarPath = p.aadhaarImagePath || p.aadhaar_image_path || null
        let selfiePath = p.selfieImagePath || p.selfie_image_path || null

        if (isPrimary && (!aadhaarNo || !aadhaarPath) && userProfile) {
          if (['submitted', 'verified'].includes(userProfile.verification_status)) {
            aadhaarNo = userProfile.aadhaar_number || aadhaarNo
            aadhaarPath = userProfile.aadhaar_image_path || aadhaarPath
            selfiePath = userProfile.selfie_image_path || selfiePath
          }
        }

        const { data: passRow, error: passErr } = await supabaseAdmin
          .from('booking_passengers')
          .insert({
            booking_id: booking.id,
            passenger_index: i,
            is_primary: isPrimary,
            full_name: p.fullName || p.full_name || `Passenger ${i + 1}`,
            gender: p.gender || 'prefer_not_to_say',
            dob: p.dob || leadDob || '1990-01-01',
            phone: p.phone || leadPhone || '',
            address: p.address || leadAddress || '',
            aadhaar_number: aadhaarNo || '000000000000',
            verification_status: (isPrimary && userProfile?.verification_status === 'verified') ? 'verified' : 'submitted',
          })
          .select('*')
          .single()

        if (!passErr && passRow) {
          insertedPassengers.push(passRow)
          // Insert passenger documents if paths exist
          if (aadhaarPath) {
            await supabaseAdmin.from('passenger_documents').insert({
              passenger_id: passRow.id,
              document_type: 'aadhaar_front',
              file_path: aadhaarPath,
            })
          }
          if (selfiePath) {
            await supabaseAdmin.from('passenger_documents').insert({
              passenger_id: passRow.id,
              document_type: 'selfie',
              file_path: selfiePath,
            })
          }
        }
      }
    }

    // 3. Create linked Seva booking if attached
    if (sevaTypeResolved && sevaFee > 0) {
      const sevaRef = generateSevaReference(sevaTypeResolved)
      const validSevaType = (['annadan', 'yajman', 'gau_seva', 'temple_seva', 'special_pooja', 'event'].includes(sevaTypeResolved)
        ? sevaTypeResolved
        : 'event') as 'annadan' | 'yajman' | 'gau_seva' | 'temple_seva' | 'special_pooja' | 'event'

      await supabaseAdmin.from('seva_bookings').insert({
        booking_reference: sevaRef,
        user_id: authRequest.userId,
        travel_booking_id: booking.id,
        seva_package_id: targetSevaPackageId,
        seva_type: validSevaType,
        seva_date: additionalSevaDate || new Date().toISOString().split('T')[0],
        full_name: leadName,
        phone_number: leadPhone,
        total_amount: sevaFee,
        status: 'payment_pending',
        notes: `Attached to Yatra booking ${bookingReference}`,
      })
    }

    response.status(201).json({
      booking: {
        ...booking,
        passengers: insertedPassengers,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/bookings/draft - Create a draft booking
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
        traveler_count: 1,
        total_amount: travelPackage.price,
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

// GET /api/bookings - Get current user bookings
bookingsRouter.get('/', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*, travel_packages(title, image_url, start_date, duration), seva_bookings(*)')
      .eq('user_id', authRequest.userId)
      .order('created_at', { ascending: false })

    if (error) throw new HttpError(500, error.message)

    const enriched = (bookings ?? []).map((b: Record<string, unknown>) => {
      const tp = b.travel_packages as { title?: string; image_url?: string; start_date?: string; duration?: string } | null
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

// GET /api/bookings/:id - Single booking details
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
        ),
        seva_bookings(*)
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

// POST /api/bookings/:id/submit - Submit draft/pending booking and transition to payment_pending
bookingsRouter.post('/:id/submit', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest
    const { id } = request.params

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !booking) {
      throw new HttpError(404, 'Booking not found')
    }

    if (booking.user_id !== authRequest.userId) {
      throw new HttpError(403, 'Unauthorized')
    }

    if (!['draft', 'documents_pending', 'payment_pending'].includes(booking.status)) {
      throw new HttpError(400, `Booking cannot be submitted in state: ${booking.status}`)
    }

    // Load travel package
    const { data: travelPackage, error: pkgError } = await supabaseAdmin
      .from('travel_packages')
      .select('*')
      .eq('id', booking.package_id)
      .single()

    if (pkgError || !travelPackage) {
      throw new HttpError(404, 'Travel package not found')
    }

    if (!travelPackage.is_active) {
      throw new HttpError(400, 'Travel package is not active')
    }

    const count = Number(booking.traveler_count || 1)

    if (travelPackage.remaining_seats < count) {
      throw new HttpError(400, 'Not enough seats available')
    }

    // Price calculations
    const basePrice = Number(travelPackage.price || 0)
    const transportType = booking.transport_type
    const busType = booking.bus_type
    const roomType = booking.room_type

    const flightSurcharge = transportType === 'Flight' ? Number(travelPackage.flight_price || 0) : 0
    const trainAcSurcharge = transportType === 'Train' && busType === 'AC Train' ? Number(travelPackage.train_ac_price || 0) : 0
    const trainNonAcSurcharge = transportType === 'Train' && busType === 'Non-AC Train' ? Number(travelPackage.train_non_ac_price || 0) : 0
    const transportAmountPerPerson = flightSurcharge + trainAcSurcharge + trainNonAcSurcharge

    const acRoomSurcharge = roomType === 'AC Room' ? Number(travelPackage.room_ac_price || 0) : 0
    const nonAcRoomSurcharge = roomType === 'Non-AC Room' ? Number(travelPackage.room_non_ac_price || 0) : 0
    const roomAmountPerPerson = acRoomSurcharge + nonAcRoomSurcharge

    const baseAmountTotal = basePrice * count
    const transportAmountTotal = transportAmountPerPerson * count
    const roomAmountTotal = roomAmountPerPerson * count
    const sevaFee = Number(booking.additional_seva_amount || 0)

    const subtotalAmount = baseAmountTotal + transportAmountTotal + roomAmountTotal
    const totalAmount = subtotalAmount + sevaFee

    const gatewayFee = Math.round(totalAmount * 0.02)
    const payableAmount = totalAmount + gatewayFee

    const expiresAt = new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000).toISOString()

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'payment_pending',
        base_amount: baseAmountTotal,
        transport_amount: transportAmountTotal,
        room_amount: roomAmountTotal,
        subtotal_amount: subtotalAmount,
        total_amount: totalAmount,
        gateway_fee: gatewayFee,
        payable_amount: payableAmount,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError || !updatedBooking) {
      throw new HttpError(500, updateError?.message ?? 'Failed to submit booking')
    }

    response.json({ booking: updatedBooking })
  } catch (error) {
    next(error)
  }
})

// POST /api/bookings/:id/cancel - Cancel booking
bookingsRouter.post('/:id/cancel', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest
    const { id } = request.params

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('user_id, status, package_id, traveler_count')
      .eq('id', id)
      .single()

    if (fetchError || !booking) throw new HttpError(404, 'Booking not found')
    if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Unauthorized')

    if (['cancelled', 'completed', 'refunded'].includes(booking.status)) {
      throw new HttpError(400, 'Booking is already cancelled or completed')
    }

    const { error: cancelError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (cancelError) throw new HttpError(500, 'Failed to cancel booking')

    // Increment seats RPC
    await supabaseAdmin.rpc('increment_seats' as never, {
      pid: booking.package_id,
      count: booking.traveler_count,
    } as never)

    response.json({ success: true, message: 'Booking cancelled successfully' })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/bookings/:id - Cancel/delete booking
bookingsRouter.delete('/:id', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest
    const { id } = request.params

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('user_id, status, package_id, traveler_count')
      .eq('id', id)
      .single()

    if (fetchError || !booking) throw new HttpError(404, 'Booking not found')
    if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Unauthorized')

    if (['cancelled', 'completed', 'refunded'].includes(booking.status)) {
      throw new HttpError(400, 'Booking is already cancelled or completed')
    }

    const { error: cancelError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (cancelError) throw new HttpError(500, 'Failed to cancel booking')

    // Increment seats RPC
    await supabaseAdmin.rpc('increment_seats' as never, {
      pid: booking.package_id,
      count: booking.traveler_count,
    } as never)

    response.json({ success: true, message: 'Booking cancelled successfully' })
  } catch (error) {
    next(error)
  }
})

