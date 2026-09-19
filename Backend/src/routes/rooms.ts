import { Router } from 'express'
import multer from 'multer'
import ExcelJS from 'exceljs'
import { HttpError } from '../errors.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { requireRoomStaff } from '../middleware/rbac.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'
import { logAudit } from '../services/auditLogger.js'

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

export const roomsRouter = Router()

roomsRouter.use(requireAuth, requireRoomStaff)

/**
 * GET /api/rooms - List all rooms in master
 */
roomsRouter.get('/', async (req, res, next) => {
  try {
    const { status, hotel, roomType } = req.query

    let query = supabaseAdmin.from('rooms').select('*').order('room_number', { ascending: true })

    if (status) query = query.eq('status', status)
    if (hotel) query = query.ilike('hotel_ashram_name', `%${hotel}%`)
    if (roomType) query = query.eq('room_type', roomType)

    const { data: rooms, error } = await query

    if (error) throw new HttpError(500, error.message)

    res.json({ rooms: rooms || [] })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/rooms - Create new Room
 */
roomsRouter.post('/', async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest
    const { hotelAshramName, building, floor, roomNumber, roomType, capacity, status } = req.body

    if (!hotelAshramName || !roomNumber || !roomType) {
      throw new HttpError(400, 'hotelAshramName, roomNumber, and roomType are required')
    }

    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .insert({
        hotel_ashram_name: hotelAshramName.trim(),
        building: building?.trim() || null,
        floor: floor?.trim() || null,
        room_number: roomNumber.trim(),
        room_type: roomType.toLowerCase() === 'ac' ? 'ac' : 'non_ac',
        capacity: Number(capacity || 4),
        status: status || 'available',
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new HttpError(409, `Room ${roomNumber} in ${hotelAshramName} already exists`)
      }
      throw new HttpError(500, error.message)
    }

    await logAudit({
      actorId: authReq.userId,
      action: 'ROOM_CREATE',
      entityType: 'room',
      entityId: room.id,
      newValues: room,
      reason: `Created room ${room.room_number}`,
    })

    res.status(201).json({ room })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/rooms/allocate - Allocate room to passengers (Supports sharing room across different Booking IDs in same group!)
 */
roomsRouter.post('/allocate', async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest
    const { roomId, groupId, passengerAllocations, notes } = req.body
    let allocList = passengerAllocations
    if (!allocList && req.body.passengerId && req.body.bookingId) {
      allocList = [{ bookingId: req.body.bookingId, passengerId: req.body.passengerId }]
    }

    if (!roomId || !groupId || !Array.isArray(allocList) || allocList.length === 0) {
      throw new HttpError(400, 'roomId, groupId, and passengerAllocations array are required')
    }

    const { data: room, error: rErr } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (rErr || !room) throw new HttpError(404, 'Room not found')

    if (room.status === 'maintenance') {
      throw new HttpError(400, `Room ${room.room_number} is under maintenance and cannot be allocated`)
    }

    // Check existing occupancy and capacity
    const { data: existingAllocs } = await supabaseAdmin
      .from('room_allocations')
      .select('passenger_id')
      .eq('room_id', roomId)

    const currentOccupancy = existingAllocs ? existingAllocs.length : 0
    const existingPIds = new Set(existingAllocs?.map((a: any) => a.passenger_id) || [])
    const newPassengers = allocList.filter((a: any) => !existingPIds.has(a.passengerId))

    if (currentOccupancy + newPassengers.length > (room.capacity || 4)) {
      throw new HttpError(
        409,
        `Room capacity exceeded: Room ${room.room_number} capacity is ${room.capacity}, currently occupied by ${currentOccupancy}, cannot add ${newPassengers.length} more devotees.`,
      )
    }

    // Check for duplicate allocation across other rooms
    for (const a of allocList) {
      const { data: dupAlloc } = await supabaseAdmin
        .from('room_allocations')
        .select('id, room_id, rooms(room_number)')
        .eq('passenger_id', a.passengerId)
        .neq('room_id', roomId)
        .maybeSingle()

      if (dupAlloc) {
        const existingRoomNo = (dupAlloc.rooms as any)?.room_number || dupAlloc.room_id
        throw new HttpError(
          409,
          `Duplicate allocation: Passenger is already allocated to Room ${existingRoomNo}. Deallocate or change room first.`,
        )
      }
    }

    // Prepare allocations
    const rows = allocList.map((a: { bookingId: string; passengerId: string }) => ({
      room_id: roomId,
      group_id: groupId,
      booking_id: a.bookingId,
      passenger_id: a.passengerId,
      notes: notes?.trim() || null,
    }))

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('room_allocations')
      .upsert(rows, { onConflict: 'room_id, passenger_id' })
      .select('*')

    if (insErr) throw new HttpError(500, insErr.message)

    // Update room status to occupied
    await supabaseAdmin.from('rooms').update({ status: 'occupied' }).eq('id', roomId)

    await logAudit({
      actorId: authReq.userId,
      action: 'ROOM_ALLOCATE',
      entityType: 'room',
      entityId: roomId,
      newValues: { count: rows.length, allocations: rows },
      reason: `Allocated ${rows.length} devotee(s) to room ${room.room_number}`,
    })

    res.status(201).json({
      success: true,
      allocations: inserted,
      allocation: Array.isArray(inserted) ? inserted[0] : inserted,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/rooms/change - Reallocate passenger to a new room with audit trail
 */
roomsRouter.post('/change', async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { allocationId, newRoomId, reason } = req.body

    if (!allocationId || !newRoomId) {
      throw new HttpError(400, 'allocationId and newRoomId are required')
    }

    const { data: alloc, error: aErr } = await supabaseAdmin
      .from('room_allocations')
      .select('*, rooms(room_number)')
      .eq('id', allocationId)
      .single()

    if (aErr || !alloc) throw new HttpError(404, 'Allocation not found')

    const { data: newRoom, error: nrErr } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('id', newRoomId)
      .single()

    if (nrErr || !newRoom) throw new HttpError(404, 'New room not found')

    if (newRoom.status === 'maintenance') {
      throw new HttpError(400, `Target room ${newRoom.room_number} is under maintenance`)
    }

    // Check new room capacity
    const { count } = await supabaseAdmin
      .from('room_allocations')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', newRoomId)

    if ((count || 0) >= (newRoom.capacity || 4)) {
      throw new HttpError(409, `Target room ${newRoom.room_number} is at full capacity (${newRoom.capacity})`)
    }

    const oldRoomId = alloc.room_id
    const oldRoomNo = (alloc.rooms as any)?.room_number

    // Update allocation
    const { data: updated, error: uErr } = await supabaseAdmin
      .from('room_allocations')
      .update({ room_id: newRoomId, updated_at: new Date().toISOString() })
      .eq('id', allocationId)
      .select('*')
      .single()

    if (uErr) throw new HttpError(500, uErr.message)

    // Update room statuses
    await supabaseAdmin.from('rooms').update({ status: 'occupied' }).eq('id', newRoomId)
    const { count: oldOccupancy } = await supabaseAdmin
      .from('room_allocations')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', oldRoomId)

    if ((oldOccupancy || 0) === 0) {
      await supabaseAdmin.from('rooms').update({ status: 'available' }).eq('id', oldRoomId)
    }

    await logAudit({
      actorId: authReq.userId,
      action: 'ROOM_CHANGE',
      entityType: 'room',
      entityId: newRoomId,
      oldValues: { room_id: oldRoomId, room_number: oldRoomNo },
      newValues: { room_id: newRoomId, room_number: newRoom.room_number },
      reason: reason?.trim() || 'Passenger room change',
    })

    res.json({ success: true, allocation: updated, oldRoomId, newRoomId })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/rooms/:id/status - Update room status (available, reserved, occupied, maintenance)
 */
roomsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { id } = req.params as { id: string }
    const { status, reason } = req.body

    const allowed = ['available', 'reserved', 'occupied', 'maintenance']
    if (!status || !allowed.includes(status)) {
      throw new HttpError(400, `Invalid status. Allowed: ${allowed.join(', ')}`)
    }

    const { data: room, error: rErr } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single()

    if (rErr || !room) throw new HttpError(404, 'Room not found')

    const oldStatus = room.status
    const { data: updated, error: uErr } = await supabaseAdmin
      .from('rooms')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (uErr) throw new HttpError(500, uErr.message)

    await logAudit({
      actorId: authReq.userId,
      action: 'ROOM_STATUS_CHANGE',
      entityType: 'room',
      entityId: id,
      oldValues: { status: oldStatus },
      newValues: { status },
      reason: reason?.trim() || `Status changed from ${oldStatus} to ${status}`,
    })

    res.json({ success: true, room: updated })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/rooms/allocations/:id - Remove passenger from room allocation
 */
roomsRouter.delete('/allocations/:id', async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    const { id } = req.params as { id: string }

    const { data: alloc, error: fetchErr } = await supabaseAdmin
      .from('room_allocations')
      .select('*, rooms(room_number)')
      .eq('id', id)
      .single()

    if (fetchErr || !alloc) throw new HttpError(404, 'Allocation not found')

    await supabaseAdmin.from('room_allocations').delete().eq('id', id)

    // Check if room is now empty
    const { count } = await supabaseAdmin
      .from('room_allocations')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', alloc.room_id)

    if (count === 0) {
      await supabaseAdmin.from('rooms').update({ status: 'available' }).eq('id', alloc.room_id)
    }

    await logAudit({
      actorId: authReq.userId,
      action: 'ROOM_DEALLOCATE',
      entityType: 'room',
      entityId: alloc.room_id,
      oldValues: alloc,
      reason: 'Deallocated passenger from room',
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/rooms/import-excel - Bulk Excel Room Allocation Import (Req #21 & #27)
 */
roomsRouter.post('/import-excel', uploadExcel.single('file'), async (req, res, next) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest
    if (!req.file) throw new HttpError(400, 'Excel file is required')

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(req.file.buffer as any)
    const sheet = workbook.worksheets[0]

    if (!sheet) throw new HttpError(400, 'Excel workbook has no sheets')

    const successRows: any[] = []
    const errorRows: Array<{ rowNumber: number; reason: string; data: any }> = []

    // Read rows starting from row 2 (headers on row 1)
    const rowCount = sheet.rowCount
    for (let r = 2; r <= rowCount; r++) {
      const row = sheet.getRow(r)
      const bookingCode = String(row.getCell(1).value || '').trim()
      const passengerCode = String(row.getCell(2).value || '').trim()
      const roomNumber = String(row.getCell(3).value || '').trim()

      if (!bookingCode && !passengerCode && !roomNumber) continue // Skip empty lines

      if (!bookingCode || !passengerCode || !roomNumber) {
        errorRows.push({
          rowNumber: r,
          reason: 'Missing required columns (Booking ID, Passenger ID, or Room Number)',
          data: { bookingCode, passengerCode, roomNumber },
        })
        continue
      }

      // Verify room exists
      const { data: room } = await supabaseAdmin
        .from('rooms')
        .select('id, hotel_ashram_name')
        .eq('room_number', roomNumber)
        .maybeSingle()

      if (!room) {
        errorRows.push({
          rowNumber: r,
          reason: `Unknown Room Number: ${roomNumber}`,
          data: { bookingCode, passengerCode, roomNumber },
        })
        continue
      }

      // Verify passenger exists
      const { data: passenger } = await supabaseAdmin
        .from('passengers')
        .select('id, group_id, booking_id, bookings(booking_code)')
        .eq('passenger_code', passengerCode)
        .maybeSingle()

      if (!passenger) {
        errorRows.push({
          rowNumber: r,
          reason: `Unknown Passenger ID: ${passengerCode}`,
          data: { bookingCode, passengerCode, roomNumber },
        })
        continue
      }

      // Verify booking matches passenger
      const origBCode = (passenger.bookings as any)?.booking_code
      if (origBCode && origBCode !== bookingCode) {
        errorRows.push({
          rowNumber: r,
          reason: `Booking ID mismatch: Passenger belongs to ${origBCode}, not ${bookingCode}`,
          data: { bookingCode, passengerCode, roomNumber },
        })
        continue
      }

      // Perform allocation
      const { error: allocErr } = await supabaseAdmin.from('room_allocations').upsert({
        room_id: room.id,
        group_id: passenger.group_id,
        booking_id: passenger.booking_id,
        passenger_id: passenger.id,
      })

      if (allocErr) {
        errorRows.push({
          rowNumber: r,
          reason: `DB Error: ${allocErr.message}`,
          data: { bookingCode, passengerCode, roomNumber },
        })
      } else {
        successRows.push({ bookingCode, passengerCode, roomNumber })
      }
    }

    await logAudit({
      actorId: authReq.userId,
      action: 'ROOM_EXCEL_IMPORT',
      entityType: 'room',
      entityId: 'bulk',
      newValues: { successCount: successRows.length, failureCount: errorRows.length },
      reason: `Excel Room Import: ${successRows.length} succeeded, ${errorRows.length} failed`,
    })

    res.json({
      success: true,
      summary: {
        totalRowsEvaluated: successRows.length + errorRows.length,
        successCount: successRows.length,
        failureCount: errorRows.length,
      },
      errorRows,
    })
  } catch (error) {
    next(error)
  }
})
