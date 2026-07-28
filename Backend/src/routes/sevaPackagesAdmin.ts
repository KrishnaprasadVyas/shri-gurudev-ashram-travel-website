import { Router } from 'express'
import { HttpError } from '../errors.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

export const sevaPackagesAdminRouter = Router()

const protect = [requireAuth, requireAdmin]

// GET /api/admin/seva-packages
sevaPackagesAdminRouter.get('/', ...protect, async (req, res, next) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true'
    let query = supabaseAdmin.from('seva_packages').select('*')
    
    if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }

    const { data: packages, error } = await query.order('display_order', { ascending: true })

    if (error) throw new HttpError(500, error.message)

    res.json({ packages: packages ?? [] })
  } catch (error) {
    next(error)
  }
})

// POST /api/admin/seva-packages/seed - Populate default Seva packages or restore soft-deleted ones
sevaPackagesAdminRouter.post('/seed', ...protect, async (_req, res, next) => {
  try {
    const defaultPackages = [
      {
        seva_type: 'guruji_aarti',
        title: 'Guruji Aarti Seva',
        description: 'Perform special Aarti seva and receive divine blessings.',
        image_url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&q=80&w=800',
        price: 2100,
        is_active: true,
        booking_enabled: true,
        allow_date_selection: true,
        max_bookings_per_day: 50,
        display_order: 1,
        color: '#d97706',
        icon: 'Sparkles',
        category: 'Aarti',
      },
      {
        seva_type: 'yajman',
        title: 'Yajman Seva',
        description: 'Become a lead Yajman for sacred poojas and rituals.',
        image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800',
        price: 5100,
        is_active: true,
        booking_enabled: true,
        allow_date_selection: true,
        max_bookings_per_day: 20,
        display_order: 2,
        color: '#ea580c',
        icon: 'HeartHandshake',
        category: 'Pooja',
      },
      {
        seva_type: 'gau_seva',
        title: 'Gau Seva',
        description: 'Support Ashram Gaushala with fodder and care for sacred cows.',
        image_url: 'https://images.unsplash.com/photo-1570042707227-2c938c823d70?auto=format&fit=crop&q=80&w=800',
        price: 1100,
        is_active: true,
        booking_enabled: true,
        allow_date_selection: true,
        max_bookings_per_day: 100,
        display_order: 3,
        color: '#16a34a',
        icon: 'HeartHandshake',
        category: 'Gaushala',
      },
      {
        seva_type: 'temple_seva',
        title: 'Temple Seva & Flower Alankar',
        description: 'Offer fresh flower garlands and temple maintenance seva.',
        image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800',
        price: 501,
        is_active: true,
        booking_enabled: true,
        allow_date_selection: true,
        max_bookings_per_day: 100,
        display_order: 4,
        color: '#9333ea',
        icon: 'Sparkles',
        category: 'Temple',
      },
    ]

    // Check existing packages including deleted
    const { data: existing } = await supabaseAdmin.from('seva_packages').select('*')
    const existingMap = new Map((existing ?? []).map((p: { seva_type: string }) => [p.seva_type, p]))

    const results = []
    for (const pkg of defaultPackages) {
      const match = existingMap.get(pkg.seva_type) as { id: string } | undefined
      if (match) {
        // Restore/reactivate if soft deleted or inactive
        const { data: updated } = await supabaseAdmin
          .from('seva_packages')
          .update({
            ...pkg,
            deleted_at: null,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', match.id)
          .select('*')
          .single()
        if (updated) results.push(updated)
      } else {
        // Insert new
        const { data: inserted } = await supabaseAdmin
          .from('seva_packages')
          .insert(pkg)
          .select('*')
          .single()
        if (inserted) results.push(inserted)
      }
    }

    res.json({ message: 'Default Seva packages seeded successfully', packages: results })
  } catch (error) {
    next(error)
  }
})

// POST /api/admin/seva-packages/:id/restore (restore soft-deleted package)
sevaPackagesAdminRouter.post('/:id/restore', ...protect, async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: pkg, error } = await supabaseAdmin
      .from('seva_packages')
      .update({ deleted_at: null, is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !pkg) throw new HttpError(500, error?.message ?? 'Failed to restore Seva package')

    res.json({ package: pkg, message: 'Seva package restored' })
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
