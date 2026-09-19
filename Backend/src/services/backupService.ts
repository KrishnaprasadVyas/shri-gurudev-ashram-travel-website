import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabaseAdmin } from './supabaseAdmin.js'
import { resetDatabase } from './dbEngine.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BACKUP_DIR = path.resolve(__dirname, '../../backups')

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

export const BACKUP_TABLES = [
  'users',
  'groups',
  'travel_packages',
  'seva_packages',
  'bookings',
  'passengers',
  'booking_passengers',
  'payments',
  'train_journeys',
  'ticket_pdfs',
  'ticket_passenger_mappings',
  'rooms',
  'room_allocations',
  'audit_logs',
  'app_settings',
  'whatsapp_messages',
]

export interface DatabaseSnapshot {
  version: string
  timestamp: string
  schema: string
  tables: Record<string, any[]>
  recordCounts: Record<string, number>
}

/**
 * Creates a JSON snapshot of all system tables
 */
export async function createDatabaseBackup(customFilename?: string): Promise<{ backupPath: string; snapshot: DatabaseSnapshot }> {
  const snapshot: DatabaseSnapshot = {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    schema: 'mavt_v2',
    tables: {},
    recordCounts: {},
  }

  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabaseAdmin.from(table).select('*')
    if (error) {
      snapshot.tables[table] = []
      snapshot.recordCounts[table] = 0
    } else {
      snapshot.tables[table] = data || []
      snapshot.recordCounts[table] = (data || []).length
    }
  }

  const filename = customFilename || `mavt_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const backupPath = path.join(BACKUP_DIR, filename)

  fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2), 'utf-8')
  return { backupPath, snapshot }
}

/**
 * Restores a database snapshot from a backup file
 */
export async function restoreDatabaseBackup(backupPath: string): Promise<{ success: boolean; restoredCounts: Record<string, number> }> {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found at: ${backupPath}`)
  }

  const raw = fs.readFileSync(backupPath, 'utf-8')
  const snapshot: DatabaseSnapshot = JSON.parse(raw)

  // Reset database schema cleanly first
  await resetDatabase()

  const restoredCounts: Record<string, number> = {}

  // Restore tables in dependency order
  const orderedTables = [
    'app_settings',
    'users',
    'groups',
    'travel_packages',
    'seva_packages',
    'bookings',
    'passengers',
    'booking_passengers',
    'payments',
    'train_journeys',
    'ticket_pdfs',
    'ticket_passenger_mappings',
    'rooms',
    'room_allocations',
    'audit_logs',
  ]

  for (const table of orderedTables) {
    const rows = snapshot.tables[table] || []
    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from(table).insert(rows)
      if (error) {
        console.warn(`[RESTORE WARNING] Table ${table}: ${error.message}`)
      }
    }
    restoredCounts[table] = rows.length
  }

  return { success: true, restoredCounts }
}
