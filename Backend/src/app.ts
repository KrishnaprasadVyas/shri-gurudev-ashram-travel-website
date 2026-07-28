import { config as loadEnv } from 'dotenv'
loadEnv()

import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { HttpError } from './errors.js'
import { adminRouter } from './routes/admin.js'
import { bookingsRouter } from './routes/bookings.js'
import { paymentsRouter } from './routes/payments.js'
import { razorpayWebhookRouter } from './routes/razorpayWebhook.js'
import { passengersRouter } from './routes/passengers.js'
import { usersRouter } from './routes/users.js'
import { sevaRouter } from './routes/seva.js'
import { sevaPackagesPublicRouter } from './routes/sevaPackagesPublic.js'
import { sevaPackagesAdminRouter } from './routes/sevaPackagesAdmin.js'
import { supabaseAdmin } from './services/supabaseAdmin.js'

export const app = express()

// Security headers
app.use(helmet())

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests, please try again later' },
})

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : []

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }), razorpayWebhookRouter)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Apply rate limiters & mount routes
app.use('/api/users', authLimiter, usersRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/bookings/:bookingId/passengers', passengersRouter)
app.use('/api/payments', paymentLimiter, paymentsRouter)
app.use('/api/seva', sevaRouter)
app.use('/api/public/seva-packages', sevaPackagesPublicRouter)
app.use('/api/admin/seva-packages', sevaPackagesAdminRouter)
app.use('/api/admin', adminRouter)

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const status = error instanceof HttpError ? error.status : 500

  let message: string
  if (error instanceof HttpError) {
    message = error.message
  } else if (process.env.NODE_ENV === 'development') {
    message = error instanceof Error ? error.message : 'Internal server error'
  } else {
    console.error('[Unhandled Error]', error instanceof Error ? error.stack : error)
    message = 'Internal server error'
  }

  response.status(status).json({
    error: message,
  })
})

export function startServer() {
  const port = Number(process.env.PORT ?? 3001)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('Missing or invalid environment variable: PORT')
  }

  const server = app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`)
  })

  // Start cron job to expire stale bookings every 5 minutes
  const CRON_INTERVAL_MS = 5 * 60 * 1000
  const expireJob = setInterval(async () => {
    try {
      const { data, error } = await supabaseAdmin.rpc('expire_stale_bookings' as never)
      if (error) {
        console.error('[CRON] Error expiring stale bookings:', error.message)
      } else if (typeof data === 'number' && data > 0) {
        console.log(`[CRON] Expired ${data} stale booking(s)`)
      }
    } catch (err) {
      console.error('[CRON] Exception in expire_stale_bookings job:', err)
    }
  }, CRON_INTERVAL_MS)

  process.on('SIGINT', () => {
    clearInterval(expireJob)
    server.close()
  })

  return server
}
