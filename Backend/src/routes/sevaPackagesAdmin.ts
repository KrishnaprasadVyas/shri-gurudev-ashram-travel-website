import { Router } from 'express'
import { HttpError } from '../errors.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

export const sevaPackagesAdminRouter = Router()

const protect = [requireAuth, requireAdmin]

// GET /api/admin/seva-packages
sevaPackagesAdminRouter.get('/', ...protect, async (_req, res, next) => {
  try {
    const { data: packages, error } = await supabaseAdmin
      .from('seva_packages')
      .select('*')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) throw new HttpError(500, error.message)

    res.json({ packages: packages ?? [] })
  } catch (error) {
    next(error)
  }
})

// POST /api/admin/seva-packages
sevaPackagesAdminRouter.post('/', ...protect, async (req, res, next) => {
  try {
    const {
      seva_type,
      title,
      description,
      image_url,
      price,
      is_active,
      booking_enabled,
      allow_date_selection,
      max_bookings_per_day,
      display_order,
      color,
      icon,
      category,
      available_from,
      available_until,
    } = req.body

    if (!seva_type || !title || price === undefined || price < 0) {
      throw new HttpError(400, 'seva_type, title, and valid non-negative price are required')
    }

    const { data: pkg, error } = await supabaseAdmin
      .from('seva_packages')
      .insert({
        seva_type,
        title: title.trim(),
        description: description?.trim() || null,
        image_url: image_url || null,
        price: Number(price),
        is_active: is_active ?? true,
        booking_enabled: booking_enabled ?? true,
        allow_date_selection: allow_date_selection ?? true,
        max_bookings_per_day: max_bookings_per_day ? Number(max_bookings_per_day) : null,
        display_order: display_order ? Number(display_order) : 0,
        color: color || null,
        icon: icon || null,
        category: category || null,
        available_from: available_from || null,
        available_until: available_until || null,
      })
      .select('*')
      .single()

    if (error || !pkg) throw new HttpError(500, error?.message ?? 'Failed to create Seva package')

    res.status(201).json({ package: pkg })
  } catch (error) {
    next(error)
  }
})

// PUT /api/admin/seva-packages/:id
sevaPackagesAdminRouter.put('/:id', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params
    const body = req.body

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    const fields = [
      'seva_type',
      'title',
      'description',
      'image_url',
      'price',
      'is_active',
      'booking_enabled',
      'allow_date_selection',
      'max_bookings_per_day',
      'display_order',
      'color',
      'icon',
      'category',
      'available_from',
      'available_until',
    ]

    for (const f of fields) {
      if (body[f] !== undefined) {
        if (f === 'price' || f === 'max_bookings_per_day' || f === 'display_order') {
          updates[f] = body[f] !== null ? Number(body[f]) : null
        } else {
          updates[f] = body[f]
        }
      }
    }

    const { data: pkg, error } = await supabaseAdmin
      .from('seva_packages')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !pkg) throw new HttpError(500, error?.message ?? 'Failed to update Seva package')

    res.json({ package: pkg })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/admin/seva-packages/:id (soft delete)
sevaPackagesAdminRouter.delete('/:id', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: pkg, error } = await supabaseAdmin
      .from('seva_packages')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !pkg) throw new HttpError(500, error?.message ?? 'Failed to delete Seva package')

    res.json({ package: pkg, message: 'Seva package deleted' })
  } catch (error) {
    next(error)
  }
})
