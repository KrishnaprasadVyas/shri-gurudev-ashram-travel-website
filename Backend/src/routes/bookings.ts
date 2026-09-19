import { Router } from 'express'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { getNextBookingCode, getNextGroupCode, formatPassengerCode } from '../services/idGenerators.js'
import { calculateBookingPrice } from '../services/pricingEngine.js'
import { logAudit } from '../services/auditLogger.js'

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
    const authRequest = request as unknown as AuthenticatedRequest
    const {
      packageId,
      groupId,
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
      boardingStation,
      destinationStation,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
    } = request.body

    const serviceOption = (request.body.serviceOption || request.body.service_option || 'yatra_room_train').toLowerCase()
    const isOnlyRoom = serviceOption === 'only_room'

    const count = Number(request.body.travelerCount ?? (Array.isArray(passengers) && passengers.length > 0 ? passengers.length : 1))
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      throw new HttpError(400, 'travelerCount must be an integer between 1 and 20')
    }

    let travelPackage: any = null
    if (!isOnlyRoom) {
      if (!packageId || typeof packageId !== 'string') {
        throw new HttpError(400, 'packageId is required')
      }
      const { data: pkg, error: pkgError } = await supabaseAdmin
        .from('travel_packages')
        .select('*')
        .eq('id', packageId)
        .single()

      if (pkgError || !pkg) {
        throw new HttpError(404, 'Travel package not found')
      }
      if (!pkg.is_active) {
        throw new HttpError(400, 'Travel package is not active')
      }
      if (typeof pkg.remaining_seats === 'number' && pkg.remaining_seats < count) {
        throw new HttpError(400, 'Not enough seats available')
      }
      travelPackage = pkg
    } else if (packageId) {
      const { data: pkg } = await supabaseAdmin
        .from('travel_packages')
        .select('*')
        .eq('id', packageId)
        .single()
      travelPackage = pkg || null
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

    // Lead passenger info
    const leadPass = passengers[0] || {}
    const leadName = leadPass.fullName || leadPass.full_name || request.body.leadName || fullName || userProfile?.full_name || 'Lead Traveler'
    const leadPhone = leadPass.phone || leadPass.mobile || request.body.leadPhone || phone || userProfile?.phone || ''
    const leadAddress = leadPass.address || address || ''
    const leadDob = leadPass.dob || dob || null

    // Determine or auto-create Group (Req #2 & #5)
    let targetGroupId = groupId
    if (!targetGroupId) {
      const gCode = await getNextGroupCode()
      const { data: newGroup } = await supabaseAdmin
        .from('groups')
        .insert({
          group_code: gCode,
          name: `${leadName.split(' ')[0]} Family`,
          lead_mobile: leadPhone,
        })
        .select('id')
        .single()
      if (newGroup) targetGroupId = newGroup.id
    }

    // MAVT Pricing Engine (Req #7, #9, #11, Section 18)
    let pricing: { baseTotal: number; acTotal: number; nonAcTotal: number; sevaAmount: number; totalAmount: number }
    if (isOnlyRoom) {
      const roomTotal = Number(request.body.roomRent || request.body.room_rent || 1500 * count)
      pricing = {
        baseTotal: roomTotal,
        acTotal: 0,
        nonAcTotal: 0,
        sevaAmount: sevaFee,
        totalAmount: roomTotal + sevaFee,
      }
    } else {
      const passengerChoices = Array.isArray(passengers) && passengers.length > 0
        ? passengers.map((p: any) => ({ travel_class: p.travelClass || p.travel_class || (busType === 'AC Train' ? 'ac' : 'non_ac') }))
        : Array.from({ length: count }).map(() => ({ travel_class: busType === 'AC Train' ? 'ac' : 'non_ac' }))

      pricing = calculateBookingPrice(travelPackage, passengerChoices, sevaFee)
    }

    const gatewayFee = Math.round(pricing.totalAmount * 0.02)
    const payableAmount = pricing.totalAmount + gatewayFee

    // Generate Booking Code: MVT-YYMMDD-XXXX (Req #1)
    const bookingCode = await getNextBookingCode()
    const expiresAt = new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000).toISOString()

    const trainArrangement = request.body.trainArrangement || request.body.train_arrangement || (isOnlyRoom ? 'none' : serviceOption === 'yatra_room_train_self' ? 'customer_self_arranged' : 'tourism_arranged')
    const bookingChannel = request.body.bookingChannel || request.body.booking_channel || 'Customer-Web'

    // 1. Insert into bookings
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        group_id: targetGroupId,
        booking_code: bookingCode,
        booking_reference: bookingCode,
        user_id: authRequest.userId,
        package_id: packageId || null,
        booking_channel: bookingChannel,
        service_option: serviceOption,
        train_arrangement: trainArrangement,
        hotel_name: request.body.hotelName || request.body.hotel_name || null,
        check_in_date: request.body.checkInDate || request.body.check_in_date || null,
        check_out_date: request.body.checkOutDate || request.body.check_out_date || null,
        room_rent: request.body.roomRent ? Number(request.body.roomRent) : (isOnlyRoom ? pricing.baseTotal : 0),
        room_type_requested: request.body.roomTypeRequested || roomType || 'AC Room',
        booking_status: 'pending',
        payment_status: 'pending',
        status: 'payment_pending',
        traveler_count: count,
        special_notes: specialNotes?.trim() || null,
        lead_passenger_name: leadName,
        full_name: leadName,
        mobile: leadPhone,
        phone_number: leadPhone,
        whatsapp_number: whatsappNumber?.trim() || null,
        dob: leadDob,
        address: leadAddress,
        boarding_station: boardingStation || (isOnlyRoom ? null : 'NDLS'),
        destination_station: destinationStation || (isOnlyRoom ? null : 'SVDK'),
        transport_type: transportType || (isOnlyRoom ? 'None' : 'Train'),
        bus_type: busType || null,
        room_type: roomType || 'AC Room',
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        emergency_contact_relationship: emergencyContactRelationship || null,
        base_amount: pricing.baseTotal,
        transport_amount: pricing.acTotal + pricing.nonAcTotal,
        total_amount: pricing.totalAmount,
        total_paid: 0,
        pending_balance: pricing.totalAmount,
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

        const passCode = formatPassengerCode(i + 1)
        const travelClass = (p.travelClass || p.travel_class || (busType === 'AC Train' ? 'ac' : 'non_ac')).toLowerCase()

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
          const canonicalPassenger = {
            ...passRow,
            passenger_code: passCode,
            travel_class: travelClass,
            group_id: targetGroupId,
          }
          insertedPassengers.push(canonicalPassenger)

          // Insert into canonical passengers table
          await supabaseAdmin.from('passengers').upsert({
            id: passRow.id,
            booking_id: booking.id,
            group_id: targetGroupId,
            passenger_code: passCode,
            passenger_index: i,
            is_primary: isPrimary,
            full_name: passRow.full_name,
            age: Number(p.age || 30),
            gender: passRow.gender === 'male' ? 'M' : (passRow.gender === 'female' ? 'F' : 'other'),
            mobile: passRow.phone,
            phone: passRow.phone,
            travel_class: travelClass === 'ac' ? 'ac' : 'non_ac',
            aadhaar_number: passRow.aadhaar_number,
            verification_status: passRow.verification_status,
          })

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

    await logAudit({
      actorId: authRequest.userId,
      action: 'BOOKING_CREATE',
      entityType: 'booking',
      entityId: booking.id,
      newValues: booking,
      reason: `Created booking ${bookingCode} for group ${targetGroupId}`,
    })

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
        notes: `Attached to Yatra booking ${bookingCode}`,
      })
    }

    response.status(201).json({
      booking: {
        ...booking,
        passengers: insertedPassengers,
      },
      passengers: insertedPassengers,
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
      additionalSevaPackageId,
      additionalSevaType,
      additionalSevaDate,
    } = request.body
    const authRequest = request as AuthenticatedRequest

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !booking) throw new HttpError(404, 'Booking not found')
    if (booking.user_id !== authRequest.userId) throw new HttpError(403, 'Unauthorized')

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
        sevaFee = Number(sevaPkg.price || 0)
        sevaTypeResolved = sevaPkg.seva_type
      }
    } else if (additionalSevaType) {
      if (additionalSevaType === 'guruji_aarti') sevaFee = 2100
      else if (additionalSevaType === 'yajman' || additionalSevaType === 'yajman_pad') sevaFee = 5100
      else if (additionalSevaType === 'none') {
        sevaFee = 0
        sevaTypeResolved = null
        targetSevaPackageId = null
      } else sevaFee = 1000
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
        additional_seva_package_id: targetSevaPackageId,
        additional_seva_type: sevaTypeResolved,
        additional_seva_date: additionalSevaDate || null,
        additional_seva_amount: sevaFee,
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
      .not('status', 'in', '(draft,documents_pending)')
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
    if (booking.user_id !== authRequest.userId) {
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', authRequest.userId)
        .single()

      const staffRoles = ['super_admin', 'admin', 'booking_staff', 'payment_staff', 'train_ticket_staff', 'room_staff']
      if (!userRecord || !staffRoles.includes(userRecord.role)) {
        throw new HttpError(403, 'Booking does not belong to the authenticated user')
      }
    }

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

    // Fetch passengers to determine AC vs Non-AC distribution
    const { data: passList } = await supabaseAdmin
      .from('passengers')
      .select('travel_class')
      .eq('booking_id', id)

    const busType = booking.bus_type
    const passengerChoices = (passList && passList.length > 0)
      ? passList.map((p: any) => ({ travel_class: p.travel_class || (busType === 'AC Train' ? 'ac' : 'non_ac') }))
      : Array.from({ length: count }).map(() => ({ travel_class: busType === 'AC Train' ? 'ac' : 'non_ac' }))

    const sevaFee = Number(booking.additional_seva_amount || 0)
    const pricing = calculateBookingPrice(travelPackage, passengerChoices, sevaFee)

    const gatewayFee = Math.round(pricing.totalAmount * 0.02)
    const payableAmount = pricing.totalAmount + gatewayFee
    const expiresAt = new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000).toISOString()

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'payment_pending',
        base_amount: pricing.baseTotal,
        transport_amount: pricing.acTotal + pricing.nonAcTotal,
        room_amount: 0,
        subtotal_amount: pricing.baseTotal + pricing.acTotal + pricing.nonAcTotal,
        total_amount: pricing.totalAmount,
        pending_balance: pricing.totalAmount - Number(booking.total_paid || 0),
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

    // Upsert or sync linked Seva booking if attached
    const sevaTypeResolved = booking.additional_seva_type
    const targetSevaPackageId = booking.additional_seva_package_id
    if (sevaFee > 0 && sevaTypeResolved) {
      const { data: existingSeva } = await supabaseAdmin
        .from('seva_bookings')
        .select('*')
        .eq('travel_booking_id', id)
        .maybeSingle()

      const sevaRef = existingSeva?.booking_reference || generateSevaReference(sevaTypeResolved)
      const validSevaType = (['annadan', 'yajman', 'gau_seva', 'temple_seva', 'special_pooja', 'event'].includes(sevaTypeResolved)
        ? sevaTypeResolved
        : 'event') as 'annadan' | 'yajman' | 'gau_seva' | 'temple_seva' | 'special_pooja' | 'event'

      const leadName = booking.full_name || 'Traveler'
      const leadPhone = booking.phone_number || ''

      if (existingSeva) {
        await supabaseAdmin
          .from('seva_bookings')
          .update({
            seva_package_id: targetSevaPackageId,
            seva_type: validSevaType,
            seva_date: booking.additional_seva_date || new Date().toISOString().split('T')[0],
            total_amount: sevaFee,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSeva.id)
      } else {
        await supabaseAdmin.from('seva_bookings').insert({
          booking_reference: sevaRef,
          user_id: authRequest.userId,
          travel_booking_id: id,
          seva_package_id: targetSevaPackageId,
          seva_type: validSevaType,
          seva_date: booking.additional_seva_date || new Date().toISOString().split('T')[0],
          full_name: leadName,
          phone_number: leadPhone,
          total_amount: sevaFee,
          status: 'payment_pending',
          notes: `Attached to Yatra booking ${booking.booking_reference}`,
        })
      }
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

// POST /api/bookings/:id/train-details - Admin adds or updates train details later (Section 18 & Acceptance Test 26)
bookingsRouter.post('/:id/train-details', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { id } = req.params
    const {
      boardingStation,
      destinationStation,
      goingDate,
      returnDate,
      trainArrangement = 'tourism_arranged',
      transportType = 'Train',
      notes,
    } = req.body

    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !booking) {
      throw new HttpError(404, 'Booking not found')
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('bookings')
      .update({
        boarding_station: boardingStation ?? booking.boarding_station,
        destination_station: destinationStation ?? booking.destination_station,
        going_date: goingDate ?? booking.going_date,
        return_date: returnDate ?? booking.return_date,
        train_arrangement: trainArrangement,
        transport_type: transportType,
        notes: notes ? `${booking.notes || ''}\n${notes}`.trim() : booking.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updErr) {
      throw new HttpError(500, `Failed to update train details: ${updErr.message}`)
    }

    await logAudit({
      actorId: authReq.userId,
      actorName: 'Staff Member',
      actorRole: 'staff',
      action: 'BOOKING_TRAIN_DETAILS_ADDED',
      entityType: 'booking',
      entityId: String(id),
      oldValues: {
        trainArrangement: booking.train_arrangement,
        boardingStation: booking.boarding_station,
        destinationStation: booking.destination_station,
      },
      newValues: {
        trainArrangement,
        boardingStation: updated.boarding_station,
        destinationStation: updated.destination_station,
        goingDate: updated.going_date,
        returnDate: updated.return_date,
      },
      reason: 'Train details added/updated by staff',
    })

    res.json({ success: true, booking: updated })
  } catch (error) {
    next(error)
  }
})
