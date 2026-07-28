import { Router } from 'express'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

export const sevaRouter = Router()

function generateSevaReference(sevaType: string) {
  const d = new Date()
  const yyyymmdd = d.toISOString().split('T')[0].replace(/-/g, '')
  const random4 = Math.floor(1000 + Math.random() * 9000)
  const prefix = sevaType.toLowerCase().includes('yajman') ? 'YAJ' : 'SEV'
  return `${prefix}-${yyyymmdd}-${random4}`
}

// POST /api/seva - Create a standalone Seva booking
sevaRouter.post('/', requireAuth, async (request, response, next) => {
  try {
    const authReq = request as AuthenticatedRequest
    const { sevaPackageId, sevaType, sevaDate, fullName, phoneNumber, notes } = request.body

    if (!sevaDate || typeof sevaDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(sevaDate)) {
      throw new HttpError(400, 'valid sevaDate (YYYY-MM-DD) is required')
    }
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      throw new HttpError(400, 'fullName is required')
    }
    if (!phoneNumber || typeof phoneNumber !== 'string' || !/^\d{10}$/.test(phoneNumber.trim())) {
      throw new HttpError(400, 'valid 10-digit phoneNumber is required')
    }

    let pkgQuery = supabaseAdmin.from('seva_packages').select('*').is('deleted_at', null)
    if (sevaPackageId) {
      pkgQuery = pkgQuery.eq('id', sevaPackageId)
    } else if (sevaType) {
      pkgQuery = pkgQuery.eq('seva_type', sevaType)
    } else {
      throw new HttpError(400, 'sevaPackageId or sevaType is required')
    }

    const { data: sevaPackage, error: pkgError } = await pkgQuery.single()

    if (pkgError || !sevaPackage) {
      throw new HttpError(404, 'Seva package not found')
    }
    if (!sevaPackage.is_active || !sevaPackage.booking_enabled) {
      throw new HttpError(400, 'This Seva is currently not available for booking')
    }

    // Check availability cap for that date if set
    const maxDaily = sevaPackage.max_bookings_per_day ?? 50
    if (maxDaily > 0) {
      const { count, error: countError } = await supabaseAdmin
        .from('seva_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('seva_package_id', sevaPackage.id)
        .eq('seva_date', sevaDate)
        .neq('status', 'cancelled')

      if (!countError && count !== null && count >= maxDaily) {
        throw new HttpError(400, `Fully booked for ${sevaDate}. Max daily limit reached.`)
      }
    }

    const ref = generateSevaReference(sevaPackage.seva_type)

    const { data: booking, error: insertError } = await supabaseAdmin
      .from('seva_bookings')
      .insert({
        booking_reference: ref,
        user_id: authReq.userId,
        seva_package_id: sevaPackage.id,
        seva_type: sevaPackage.seva_type,
        seva_date: sevaDate,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        total_amount: sevaPackage.price,
        status: 'payment_pending',
        notes: notes?.trim() || null,
      })
      .select('*')
      .single()

    if (insertError || !booking) {
      throw new HttpError(500, insertError?.message ?? 'Failed to create Seva booking')
    }

    response.status(201).json({ booking })
  } catch (error) {
    next(error)
  }
})

// GET /api/seva/availability - Monthly availability check
sevaRouter.get('/availability', async (request, response, next) => {
  try {
    const { type, sevaPackageId, month } = request.query
    if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      throw new HttpError(400, 'month parameter (YYYY-MM) is required')
    }

    let pkgQuery = supabaseAdmin.from('seva_packages').select('*').is('deleted_at', null)
    if (sevaPackageId && typeof sevaPackageId === 'string') {
      pkgQuery = pkgQuery.eq('id', sevaPackageId)
    } else if (type && typeof type === 'string') {
      pkgQuery = pkgQuery.eq('seva_type', type)
    }

    const { data: sevaPackages } = await pkgQuery
    const targetPkg = sevaPackages?.[0]
    const maxDaily = targetPkg?.max_bookings_per_day ?? 50

    // Range for month
    const startDate = `${month}-01`
    const endDate = `${month}-31`

    let bookingsQuery = supabaseAdmin
      .from('seva_bookings')
      .select('seva_date')
      .gte('seva_date', startDate)
      .lte('seva_date', endDate)
      .neq('status', 'cancelled')

    if (targetPkg) {
      bookingsQuery = bookingsQuery.eq('seva_package_id', targetPkg.id)
    }

    const { data: existingBookings, error } = await bookingsQuery
    if (error) throw new HttpError(500, error.message)

    const countsByDate: Record<string, number> = {}
    ;(existingBookings ?? []).forEach((b: { seva_date: string }) => {
      countsByDate[b.seva_date] = (countsByDate[b.seva_date] ?? 0) + 1
    })

    const availabilityMap: Record<string, { booked: number; max: number; available: boolean }> = {}
    const year = parseInt(month.split('-')[0], 10)
    const monthIdx = parseInt(month.split('-')[1], 10) - 1
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`
      const dateKey = `${month}-${dayStr}`
      const booked = countsByDate[dateKey] ?? 0
      availabilityMap[dateKey] = {
        booked,
        max: maxDaily,
        available: booked < maxDaily,
      }
    }

    response.json({ month, availability: availabilityMap, maxDaily })
  } catch (error) {
    next(error)
  }
})
