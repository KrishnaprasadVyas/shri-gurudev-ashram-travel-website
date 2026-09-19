import { Router } from 'express'
import { HttpError } from '../errors.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

export const reportsRouter = Router()

// All reports require staff authorization
reportsRouter.use(
  requireAuth,
  requireRole('super_admin', 'booking_staff', 'payment_staff', 'train_ticket_staff', 'room_staff', 'admin'),
)

/**
 * GET /api/reports/:reportType - Generate data for any of the 14 reports
 */
reportsRouter.get('/:reportType', async (req, res, next) => {
  try {
    const { reportType } = req.params

    switch (reportType) {
      case 'all-bookings': {
        const { data } = await supabaseAdmin
          .from('bookings')
          .select('id, booking_code, lead_passenger_name, mobile, traveler_count, total_amount, total_paid, pending_balance, booking_status, payment_status, created_at, groups(group_code, name)')
          .order('created_at', { ascending: false })
        return res.json({ report: data || [] })
      }

      case 'all-passengers': {
        const { data } = await supabaseAdmin
          .from('passengers')
          .select('id, passenger_code, full_name, age, gender, mobile, travel_class, booking_id, bookings(booking_code), groups(group_code, name)')
          .order('passenger_code', { ascending: true })
        return res.json({ report: data || [] })
      }

      case 'group-wise-passenger': {
        const { data } = await supabaseAdmin
          .from('groups')
          .select('id, group_code, name, passengers(id, passenger_code, full_name, age, gender, travel_class, bookings(booking_code))')
          .order('group_code', { ascending: true })
        return res.json({ report: data || [] })
      }

      case 'ac-passenger': {
        const { data } = await supabaseAdmin
          .from('passengers')
          .select('id, passenger_code, full_name, age, gender, mobile, travel_class, bookings(booking_code), groups(group_code, name)')
          .ilike('travel_class', 'ac')
          .order('passenger_code', { ascending: true })
        return res.json({ report: data || [] })
      }

      case 'non-ac-passenger': {
        const { data } = await supabaseAdmin
          .from('passengers')
          .select('id, passenger_code, full_name, age, gender, mobile, travel_class, bookings(booking_code), groups(group_code, name)')
          .neq('travel_class', 'ac')
          .order('passenger_code', { ascending: true })
        return res.json({ report: data || [] })
      }

      case 'pending-collection': {
        const { data } = await supabaseAdmin
          .from('bookings')
          .select('id, booking_code, lead_passenger_name, mobile, traveler_count, total_amount, total_paid, pending_balance, payment_status, groups(group_code, name)')
          .gt('pending_balance', 0)
          .order('pending_balance', { ascending: false })
        return res.json({ report: data || [] })
      }

      case 'payment-utr': {
        const { data } = await supabaseAdmin
          .from('payments')
          .select('id, payment_code, amount, payment_mode, utr_number, verification_status, created_at, bookings(id, booking_code, lead_passenger_name, mobile)')
          .order('created_at', { ascending: false })
        return res.json({ report: data || [] })
      }

      case 'going-train': {
        const { data } = await supabaseAdmin
          .from('train_journeys')
          .select('*, groups(group_code, name)')
          .eq('journey_type', 'going')
        return res.json({ report: data || [] })
      }

      case 'return-train': {
        const { data } = await supabaseAdmin
          .from('train_journeys')
          .select('*, groups(group_code, name)')
          .eq('journey_type', 'return')
        return res.json({ report: data || [] })
      }

      case 'ticket-mapping': {
        const { data } = await supabaseAdmin
          .from('ticket_passenger_mappings')
          .select('*, passengers(passenger_code, full_name), bookings(booking_code), ticket_pdfs(file_name, pnr)')
        return res.json({ report: data || [] })
      }

      case 'room': {
        const { data } = await supabaseAdmin
          .from('rooms')
          .select('*, room_allocations(id, group_id, allocated_at, passengers(passenger_code, full_name), bookings(booking_code))')
          .order('room_number', { ascending: true })
        return res.json({ report: data || [] })
      }

      case 'yatra-summary': {
        const { data: bookings } = await supabaseAdmin
          .from('bookings')
          .select('traveler_count, total_amount, total_paid, pending_balance, booking_status')

        let totalDevotees = 0
        let totalAmount = 0
        let totalPaid = 0
        let pendingBalance = 0

        for (const b of bookings || []) {
          totalDevotees += Number(b.traveler_count || 0)
          totalAmount += Number(b.total_amount || 0)
          totalPaid += Number(b.total_paid || 0)
          pendingBalance += Number(b.pending_balance || 0)
        }

        return res.json({
          report: {
            totalBookings: (bookings || []).length,
            totalDevotees,
            totalAmount,
            totalPaid,
            pendingBalance,
          },
        })
      }

      case 'seva-package': {
        const { data } = await supabaseAdmin
          .from('seva_packages')
          .select('*')
        return res.json({ report: data || [] })
      }

      case 'group-breakdown': {
        const { data: groups } = await supabaseAdmin
          .from('groups')
          .select('id, group_code, name, lead_mobile, bookings(id, booking_code, traveler_count, total_amount, total_paid, pending_balance)')
          .order('group_code', { ascending: true })

        const breakdown = (groups || []).map((g: any) => {
          let gDevotees = 0
          let gTotal = 0
          let gPaid = 0
          let gPending = 0
          for (const b of g.bookings || []) {
            gDevotees += Number(b.traveler_count || 0)
            gTotal += Number(b.total_amount || 0)
            gPaid += Number(b.total_paid || 0)
            gPending += Number(b.pending_balance || 0)
          }
          return {
            groupId: g.id,
            groupCode: g.group_code,
            groupName: g.name,
            leadMobile: g.lead_mobile,
            bookingCount: (g.bookings || []).length,
            devoteeCount: gDevotees,
            totalAmount: gTotal,
            totalPaid: gPaid,
            pendingBalance: gPending,
          }
        })

        return res.json({ report: breakdown })
      }

      default:
        throw new HttpError(400, `Unknown report type: ${reportType}`)
    }
  } catch (error) {
    next(error)
  }
})
