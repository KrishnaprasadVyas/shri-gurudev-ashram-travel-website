import dotenv from 'dotenv'
dotenv.config()
dotenv.config({ path: '.env.development' })
import { createClient } from '@supabase/supabase-js'

function getRequiredEnv(name: string, fallback?: string) {
  const value = process.env[name] || fallback

  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      return `https://mock-${name.toLowerCase().replace(/_/g, '-')}.supabase.co`
    }
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? (process.env.NODE_ENV === 'test' ? 'https://mock.supabase.co' : undefined)
if (!supabaseUrl) {
  throw new Error('Missing required environment variable: SUPABASE_URL')
}
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY ?? (process.env.NODE_ENV === 'test' ? 'mock-service-role-key' : undefined)

if (!serviceRoleKey) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY')
}

export const rawSupabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

import { createLocalDbClient } from './dbEngine.js'

// Only initialize localDb if explicitly running in test mode or USE_LOCAL_DB is set
const isLocalDbMode = process.env.NODE_ENV === 'test' || process.env.USE_LOCAL_DB === 'true'
let localDb: any = null
if (isLocalDbMode) {
  localDb = createLocalDbClient()
}

export const supabaseAdmin: any = new Proxy(rawSupabaseAdmin, {
  get(target, prop, receiver) {
    if (prop === 'from') {
      return (tableName: string) => {
        if (process.env.NODE_ENV === 'test' || process.env.USE_LOCAL_DB === 'true') {
          if (!localDb) {
            localDb = createLocalDbClient()
          }
          return localDb.from(tableName)
        }
        // In production / development without USE_LOCAL_DB:
        // Directly query centralized PostgreSQL/Supabase.
        // Do NOT silently route missing Supabase tables to local SQLite.
        return (target as any).from(tableName)
      }
    }
    if (prop === 'rpc') {
      if (process.env.NODE_ENV === 'test' || process.env.USE_LOCAL_DB === 'true') {
        if (!localDb) {
          localDb = createLocalDbClient()
        }
        return localDb.rpc
      }
      return (target as any).rpc
    }
    return Reflect.get(target, prop, receiver)
  },
})

