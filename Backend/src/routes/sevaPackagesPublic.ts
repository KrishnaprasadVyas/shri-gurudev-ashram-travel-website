import { Router } from 'express'
import { HttpError } from '../errors.js'
import { supabaseAdmin } from '../services/supabaseAdmin.js'

export const sevaPackagesPublicRouter = Router()

// GET /api/public/seva-packages - Public catalog of dynamic Seva packages
sevaPackagesPublicRouter.get('/', async (_request, response, next) => {
  try {
    const { data: packages, error } = await supabaseAdmin
      .from('seva_packages')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      throw new HttpError(500, error.message)
    }

    response.json({ packages: packages ?? [] })
  } catch (error) {
    next(error)
  }
})

// GET /api/public/seva-packages/:id - Single package detail
sevaPackagesPublicRouter.get('/:id', async (request, response, next) => {
  try {
    const { id } = request.params
    const { data: pkg, error } = await supabaseAdmin
      .from('seva_packages')
      .select('*')
      .is('deleted_at', null)
      .eq('id', id)
      .single()

    if (error || !pkg) {
      throw new HttpError(404, 'Seva package not found')
    }

    response.json({ package: pkg })
  } catch (error) {
    next(error)
  }
})
