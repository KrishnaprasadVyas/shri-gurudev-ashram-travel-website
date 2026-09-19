import { Router } from 'express'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { requireBookingStaff } from '../middleware/rbac.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { getNextGroupCode } from '../services/idGenerators.js'
import { logAudit } from '../services/auditLogger.js'

export const groupsRouter = Router()

// All group management routes require auth and booking staff / admin access
groupsRouter.use(requireAuth, requireBookingStaff)

/**
 * GET /api/groups - List all groups with search and filters
 */
groupsRouter.get('/', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)))
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('groups')
      .select('*, bookings(id, booking_code, total_amount, total_paid, pending_balance, traveler_count, booking_status, payment_status)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(`group_code.ilike.%${search}%,name.ilike.%${search}%,lead_mobile.ilike.%${search}%`)
    }

    const { data: groups, count, error } = await query

    if (error) throw new HttpError(500, error.message)

    res.json({
      groups: groups || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/groups - Create a new Group
 */
groupsRouter.post('/', async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest
    const { name, leadMobile, notes } = req.body

    if (!name || !name.trim()) {
      throw new HttpError(400, 'Group name is required')
    }

    const groupCode = await getNextGroupCode()

    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .insert({
        group_code: groupCode,
        name: name.trim(),
        lead_mobile: leadMobile?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select('*')
      .single()

    if (error) throw new HttpError(500, error.message)

    await logAudit({
      actorId: authReq.userId,
      action: 'GROUP_CREATE',
      entityType: 'group',
      entityId: group.id,
      newValues: group,
      reason: 'Created new pilgrimage group',
    })

    res.status(201).json({ group })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/groups/:id - Comprehensive Consolidated Group Dossier
 */
groupsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', id)
      .single()

    if (groupError || !group) {
      throw new HttpError(404, 'Group not found')
    }

    // Fetch linked bookings
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: true })

    const bookingList = bookings || []
    const bookingIds = bookingList.map((b: any) => b.id)

    // Fetch all passengers across all linked bookings
    let allPassengers: any[] = []
    if (bookingIds.length > 0) {
      const { data: passData } = await supabaseAdmin
        .from('passengers')
        .select('*')
        .in('booking_id', bookingIds)
        .order('passenger_code', { ascending: true })

      allPassengers = passData || []
    }

    // AC and Non-AC counts
    const acCount = allPassengers.filter((p: any) => (p.travel_class || '').toLowerCase() === 'ac').length
    const nonAcCount = allPassengers.filter((p: any) => (p.travel_class || '').toLowerCase() !== 'ac').length

    // Collections
    const totalAmount = bookingList.reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0)
    const totalPaid = bookingList.reduce((sum: number, b: any) => sum + Number(b.total_paid || 0), 0)
    const pendingBalance = Math.max(0, totalAmount - totalPaid)

    // Train journeys
    const { data: trainJourneys } = await supabaseAdmin
      .from('train_journeys')
      .select('*')
      .eq('group_id', id)

    // Ticket PDFs
    const { data: ticketPdfs } = await supabaseAdmin
      .from('ticket_pdfs')
      .select('*')
      .eq('group_id', id)
      .eq('is_active', true)

    // Room allocations
    const { data: roomAllocations } = await supabaseAdmin
      .from('room_allocations')
      .select('*, rooms(*), passengers(id, passenger_code, full_name)')
      .eq('group_id', id)

    res.json({
      group,
      bookings: bookingList,
      passengers: allPassengers,
      summary: {
        totalBookings: bookingList.length,
        totalPassengers: allPassengers.length,
        acCount,
        nonAcCount,
        totalAmount,
        totalPaid,
        pendingBalance,
      },
      trainJourneys: trainJourneys || [],
      ticketPdfs: ticketPdfs || [],
      roomAllocations: roomAllocations || [],
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/groups/:id/link-booking - Link an existing booking to this group
 * Req #3 & #5: Add late-joining member to existing group!
 */
groupsRouter.post('/:id/link-booking', async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { id: groupId } = req.params as { id: string }
    const { bookingId, bookingCode } = req.body

    if (!bookingId && !bookingCode) {
      throw new HttpError(400, 'bookingId or bookingCode is required')
    }

    // Verify group exists
    const { data: group, error: gError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (gError || !group) throw new HttpError(404, 'Target group not found')

    // Find target booking
    let bQuery = supabaseAdmin.from('bookings').select('*')
    if (bookingId) bQuery = bQuery.eq('id', bookingId)
    else if (bookingCode) bQuery = bQuery.eq('booking_code', bookingCode)

    const { data: booking, error: bError } = await bQuery.single()
    if (bError || !booking) throw new HttpError(404, 'Booking not found')

    const oldGroupId = booking.group_id

    // Update booking group_id
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ group_id: groupId, updated_at: new Date().toISOString() })
      .eq('id', booking.id)

    if (updateError) throw new HttpError(500, updateError.message)

    // Update passengers of this booking with the new group_id
    await supabaseAdmin
      .from('passengers')
      .update({ group_id: groupId, updated_at: new Date().toISOString() })
      .eq('booking_id', booking.id)

    // Immutable audit log
    await logAudit({
      actorId: authReq.userId,
      action: 'GROUP_LINK_BOOKING',
      entityType: 'booking',
      entityId: booking.id,
      oldValues: { group_id: oldGroupId },
      newValues: { group_id: groupId, group_code: group.group_code },
      reason: `Linked booking ${booking.booking_code} to group ${group.group_code}`,
    })

    res.json({ success: true, message: `Linked booking ${booking.booking_code} to group ${group.group_code}` })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/groups/:id/transfer-passenger - Move a passenger to another group
 */
groupsRouter.post('/:id/transfer-passenger', async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { id: targetGroupId } = req.params as { id: string }
    const { passengerId, reason } = req.body

    if (!passengerId) throw new HttpError(400, 'passengerId is required')

    const { data: passenger, error: pError } = await supabaseAdmin
      .from('passengers')
      .select('*')
      .eq('id', passengerId)
      .single()

    if (pError || !passenger) throw new HttpError(404, 'Passenger not found')

    const oldGroupId = passenger.group_id

    await supabaseAdmin
      .from('passengers')
      .update({ group_id: targetGroupId, updated_at: new Date().toISOString() })
      .eq('id', passengerId)

    await logAudit({
      actorId: authReq.userId,
      action: 'PASSENGER_TRANSFER_GROUP',
      entityType: 'passenger',
      entityId: passengerId,
      oldValues: { group_id: oldGroupId },
      newValues: { group_id: targetGroupId },
      reason: reason || 'Transferred passenger to new group',
    })

    res.json({ success: true, message: 'Passenger group transfer completed' })
  } catch (error) {
    next(error)
  }
})
