import { Router } from 'express'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

export const bookingsRouter = Router()

type CreateBookingBody = {
  packageId?: string
  travelerCount?: number
  specialNotes?: string
  fullName?: string
  phoneNumber?: string
  whatsappNumber?: string
  dob?: string
  address?: string
  transportType?: string
  busType?: string
  roomType?: string
}

bookingsRouter.post('/', requireAuth, async (request, response, next) => {
  try {
    const {
      packageId,
      travelerCount,
      specialNotes,
      fullName,
      phoneNumber,
      whatsappNumber,
      dob,
      address,
      transportType,
      busType,
      roomType,
    } = request.body as CreateBookingBody

    // 1. Required fields and empty value checks
    if (!packageId || typeof packageId !== 'string' || !packageId.trim()) {
      throw new HttpError(400, 'packageId is required and cannot be empty')
    }

    if (travelerCount === undefined || typeof travelerCount !== 'number' || !Number.isInteger(travelerCount) || travelerCount < 1) {
      throw new HttpError(400, 'travelerCount must be a positive integer')
    }

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      throw new HttpError(400, 'fullName is required and cannot be empty')
    }

    if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
      throw new HttpError(400, 'phoneNumber is required and cannot be empty')
    }

    if (!whatsappNumber || typeof whatsappNumber !== 'string' || !whatsappNumber.trim()) {
      throw new HttpError(400, 'whatsappNumber is required and cannot be empty')
    }

    if (!dob || typeof dob !== 'string' || !dob.trim()) {
      throw new HttpError(400, 'dob (date of birth) is required and cannot be empty')
    }

    if (!address || typeof address !== 'string' || !address.trim()) {
      throw new HttpError(400, 'address is required and cannot be empty')
    }

    if (!transportType || typeof transportType !== 'string' || !transportType.trim()) {
      throw new HttpError(400, 'transportType is required and cannot be empty')
    }

    if (!roomType || typeof roomType !== 'string' || !roomType.trim()) {
      throw new HttpError(400, 'roomType is required and cannot be empty')
    }

    // 2. Validate format of contact numbers (10-digit numeric)
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(phoneNumber)) {
      throw new HttpError(400, 'phoneNumber must be a valid 10-digit number')
    }
    if (!phoneRegex.test(whatsappNumber)) {
      throw new HttpError(400, 'whatsappNumber must be a valid 10-digit number')
    }

    // 3. Validate age calculation from DOB
    const birthDate = new Date(dob)
    if (Number.isNaN(birthDate.getTime())) {
      throw new HttpError(400, 'dob must be a valid date')
    }

    const today = new Date()
    let calculatedAge = today.getFullYear() - birthDate.getFullYear()
    const monthDelta = today.getMonth() - birthDate.getMonth()
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge -= 1
    }

    if (calculatedAge < 0 || calculatedAge > 120) {
      throw new HttpError(400, 'dob corresponds to an invalid age (must be between 0 and 120)')
    }

    // 4. Validate transport options and constraints
    if (transportType !== 'Flight' && transportType !== 'Train') {
      throw new HttpError(400, "transportType must be either 'Flight' or 'Train'")
    }

    if (transportType === 'Train') {
      if (!busType || (busType !== 'AC Train' && busType !== 'Non-AC Train')) {
        throw new HttpError(400, "busType is required when transportType is 'Train', and must be 'AC Train' or 'Non-AC Train'")
      }
    }

    if (roomType !== 'AC Room' && roomType !== 'Non-AC Room') {
      throw new HttpError(400, "roomType must be either 'AC Room' or 'Non-AC Room'")
    }

    // 5. Package information validation
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

    if (travelPackage.remaining_seats < travelerCount) {
      throw new HttpError(400, 'Not enough seats available')
    }

    const totalAmount = Number(travelPackage.price) * travelerCount

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new HttpError(400, 'Travel package has an invalid price')
    }

    const bookingReference = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`
    const authRequest = request as AuthenticatedRequest

    // Check user verification status before allowing bookings
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('verification_status')
      .eq('id', authRequest.userId)
      .maybeSingle()

    if (profileError) {
      throw new HttpError(500, 'Failed to load user profile')
    }

    if (!userProfile || userProfile.verification_status === 'not_submitted') {
      throw new HttpError(403, 'Identity verification must be completed before booking.')
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: authRequest.userId,
        package_id: packageId,
        status: 'payment_pending',
        total_amount: totalAmount,
        traveler_count: travelerCount,
        special_notes: specialNotes?.trim() || null,
        booking_reference: bookingReference,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        whatsapp_number: whatsappNumber.trim(),
        dob: birthDate,
        address: address.trim(),
        transport_type: transportType,
        bus_type: transportType === 'Train' ? busType : null,
        room_type: roomType,
      })
      .select('*')
      .single()

    if (bookingError || !booking) {
      throw new HttpError(500, bookingError?.message ?? 'Failed to create booking')
    }

    response.status(201).json({ booking })
  } catch (error) {
    next(error)
  }
})

bookingsRouter.get('/', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*, travel_packages(title)')
      .eq('user_id', authRequest.userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new HttpError(500, error.message)
    }

    // Include package title in each booking for display
    const enriched = (bookings ?? []).map((b: Record<string, unknown>) => ({
      ...b,
      packageTitle: (b.travel_packages as { title?: string } | null)?.title ?? 'Yatra Booking',
      travel_packages: undefined,
    }))

    response.json({ bookings: enriched })
  } catch (error) {
    next(error)
  }
})

bookingsRouter.get('/:bookingId', requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest
    const { bookingId } = request.params

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      throw new HttpError(404, 'Booking not found')
    }

    if (booking.user_id !== authRequest.userId) {
      throw new HttpError(403, 'Booking does not belong to the authenticated user')
    }

    response.json({ booking })
  } catch (error) {
    next(error)
  }
})
