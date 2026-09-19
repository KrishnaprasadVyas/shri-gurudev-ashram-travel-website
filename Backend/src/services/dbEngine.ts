import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
// @ts-ignore
import initSqlJs from 'sql.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_FILE_PATH = path.resolve(__dirname, '../../data/mavt.sqlite')

export interface QueryResult<T = any> {
  data: T | null
  count?: number | null
  error: { message: string; code?: string } | null
}

let SQL: any = null
let dbInstance: any = null
let initPromise: Promise<any> | null = null

export async function getDb() {
  if (dbInstance) return dbInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    SQL = await initSqlJs()
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const fileBuffer = fs.readFileSync(DB_FILE_PATH)
        dbInstance = new SQL.Database(fileBuffer)
      } catch (err) {
        console.warn('[DB Engine] Failed to load existing SQLite file, creating fresh DB:', err)
        dbInstance = new SQL.Database()
      }
    } else {
      dbInstance = new SQL.Database()
    }

    dbInstance.run('PRAGMA foreign_keys = ON;')
    initSchema(dbInstance)
    persistDb()
    return dbInstance
  })()

  return initPromise
}

export function persistDb() {
  if (!dbInstance) return
  try {
    const data = dbInstance.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_FILE_PATH, buffer)
  } catch (err) {
    console.error('[DB Engine] Persistence error:', err)
  }
}

export async function resetDatabase() {
  await getDb()
  dbInstance = new SQL.Database()
  dbInstance.run('PRAGMA foreign_keys = ON;')
  initSchema(dbInstance)
  persistDb()
  return dbInstance
}

function initSchema(db: any) {
  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      group_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      lead_mobile TEXT NOT NULL,
      notes TEXT,
      is_late_addition INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS travel_packages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      ac_train_price REAL DEFAULT 14500,
      non_ac_train_price REAL DEFAULT 9500,
      start_date TEXT,
      end_date TEXT,
      image_url TEXT,
      total_seats INTEGER DEFAULT 1000,
      remaining_seats INTEGER DEFAULT 1000,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      phone TEXT,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      verification_status TEXT DEFAULT 'not_submitted',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_code TEXT UNIQUE NOT NULL,
      booking_reference TEXT,
      group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
      user_id TEXT,
      package_id TEXT REFERENCES travel_packages(id) ON DELETE SET NULL,
      traveler_count INTEGER NOT NULL,
      booking_status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'payment_pending',
      notes TEXT,
      admin_notes TEXT,
      special_notes TEXT,
      lead_passenger_name TEXT,
      full_name TEXT,
      mobile TEXT,
      phone_number TEXT,
      whatsapp_number TEXT,
      dob TEXT,
      address TEXT,
      boarding_station TEXT,
      destination_station TEXT,
      transport_type TEXT DEFAULT 'Train',
      bus_type TEXT,
      booking_channel TEXT DEFAULT 'Customer-Web',
      service_option TEXT DEFAULT 'yatra_room_train',
      train_arrangement TEXT DEFAULT 'tourism_arranged',
      hotel_name TEXT,
      check_in_date TEXT,
      check_out_date TEXT,
      room_rent REAL DEFAULT 0,
      room_type TEXT DEFAULT 'AC Room',
      room_type_requested TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      emergency_contact_relationship TEXT,
      base_amount REAL DEFAULT 0,
      transport_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      total_paid REAL DEFAULT 0,
      pending_balance REAL DEFAULT 0,
      gateway_fee REAL DEFAULT 0,
      payable_amount REAL DEFAULT 0,
      ac_count INTEGER DEFAULT 0,
      non_ac_count INTEGER DEFAULT 0,
      going_date TEXT,
      return_date TEXT,
      expires_at TEXT,
      is_late_addition INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS passengers (
      id TEXT PRIMARY KEY,
      booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
      passenger_code TEXT UNIQUE NOT NULL,
      passenger_index INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      mobile TEXT,
      phone TEXT,
      travel_class TEXT NOT NULL,
      aadhaar_number TEXT,
      id_proof_type TEXT,
      id_proof_number TEXT,
      whatsapp_number TEXT,
      is_existing_linked INTEGER DEFAULT 0,
      duplicate_override_reason TEXT,
      verification_status TEXT DEFAULT 'verified',
      seat_preference TEXT,
      special_requirements TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS booking_passengers (
      id TEXT PRIMARY KEY,
      booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
      passenger_id TEXT,
      passenger_index INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0,
      full_name TEXT NOT NULL,
      age INTEGER DEFAULT 30,
      gender TEXT DEFAULT 'other',
      dob TEXT,
      phone TEXT,
      address TEXT,
      aadhaar_number TEXT,
      verification_status TEXT DEFAULT 'verified',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS passenger_documents (
      id TEXT PRIMARY KEY,
      passenger_id TEXT,
      booking_id TEXT,
      doc_type TEXT,
      file_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
      payment_code TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT NOT NULL,
      utr_number TEXT UNIQUE,
      verification_status TEXT DEFAULT 'verified',
      status TEXT DEFAULT 'captured',
      verified_by TEXT,
      verified_at TEXT,
      notes TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS train_journeys (
      id TEXT PRIMARY KEY,
      journey_type TEXT NOT NULL,
      train_number TEXT NOT NULL,
      train_name TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time TEXT,
      arrival_time TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_pdfs (
      id TEXT PRIMARY KEY,
      group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT DEFAULT 'application/pdf',
      pnr TEXT,
      train_number TEXT,
      journey_date TEXT,
      journey_type TEXT,
      uploaded_by TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_passenger_mappings (
      id TEXT PRIMARY KEY,
      ticket_pdf_id TEXT REFERENCES ticket_pdfs(id) ON DELETE CASCADE,
      passenger_id TEXT REFERENCES passengers(id) ON DELETE CASCADE,
      booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
      journey_type TEXT,
      pnr TEXT,
      coach TEXT,
      seat_berth TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(passenger_id, journey_type)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      hotel_ashram_name TEXT NOT NULL,
      building TEXT,
      floor TEXT,
      room_number TEXT NOT NULL,
      room_type TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      occupied_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(hotel_ashram_name, room_number)
    );

    CREATE TABLE IF NOT EXISTS room_allocations (
      id TEXT PRIMARY KEY,
      room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
      passenger_id TEXT REFERENCES passengers(id) ON DELETE CASCADE,
      booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
      allocated_by TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(room_id, passenger_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_name TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      reason TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'processing',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS seva_packages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      ac_train_price REAL DEFAULT 14500,
      non_ac_train_price REAL DEFAULT 9500,
      start_date TEXT,
      end_date TEXT,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 1,
      deleted_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id TEXT PRIMARY KEY,
      booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
      passenger_id TEXT REFERENCES passengers(id) ON DELETE SET NULL,
      recipient_phone TEXT NOT NULL,
      recipient_name TEXT,
      template_name TEXT DEFAULT 'yatra_trip_details',
      message_body TEXT NOT NULL,
      media_url TEXT,
      status TEXT DEFAULT 'sent',
      idempotency_key TEXT UNIQUE,
      error_code TEXT,
      error_message TEXT,
      sent_by TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Safe migration of new columns for existing disk databases
  const safeAddColumn = (table: string, columnDef: string) => {
    try {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`)
    } catch {
      // Column already exists
    }
  }
  safeAddColumn('bookings', 'booking_channel TEXT DEFAULT "Customer-Web"')
  safeAddColumn('bookings', 'service_option TEXT DEFAULT "yatra_room_train"')
  safeAddColumn('bookings', 'train_arrangement TEXT DEFAULT "tourism_arranged"')
  safeAddColumn('bookings', 'hotel_name TEXT')
  safeAddColumn('bookings', 'check_in_date TEXT')
  safeAddColumn('bookings', 'check_out_date TEXT')
  safeAddColumn('bookings', 'room_rent REAL DEFAULT 0')
  safeAddColumn('bookings', 'room_type TEXT DEFAULT "AC Room"')
  safeAddColumn('bookings', 'room_type_requested TEXT')
  safeAddColumn('bookings', 'notes TEXT')
  safeAddColumn('bookings', 'admin_notes TEXT')
  safeAddColumn('passengers', 'whatsapp_number TEXT')
  safeAddColumn('passengers', 'is_existing_linked INTEGER DEFAULT 0')
  safeAddColumn('passengers', 'duplicate_override_reason TEXT')

  // Ensure default travel package exists for booking creations
  const pkgCheck = db.exec("SELECT id FROM travel_packages WHERE id = 'default-pkg-001'")
  if (!pkgCheck || pkgCheck.length === 0 || pkgCheck[0].values.length === 0) {
    db.run(`
      INSERT OR IGNORE INTO travel_packages (
        id, title, description, price, ac_train_price, non_ac_train_price, start_date, end_date
      ) VALUES (
        'default-pkg-001',
        'Maa Vaishnavi Tourism Yatra 2026',
        'Pilgrimage from New Delhi to Shri Mata Vaishno Devi Katra',
        9500,
        5000,
        0,
        '2026-10-01',
        '2026-10-07'
      );
    `)
  }

  const sevaCheck = db.exec("SELECT id FROM seva_packages WHERE id = 'default-pkg-001'")
  if (!sevaCheck || sevaCheck.length === 0 || sevaCheck[0].values.length === 0) {
    db.run(`
      INSERT OR IGNORE INTO seva_packages (
        id, title, description, price, ac_train_price, non_ac_train_price, start_date, end_date, is_active, display_order
      ) VALUES (
        'default-pkg-001',
        'Maa Vaishnavi Tourism Yatra 2026',
        'Pilgrimage from New Delhi to Shri Mata Vaishno Devi Katra',
        9500,
        5000,
        0,
        '2026-10-01',
        '2026-10-07',
        1,
        1
      );
    `)
  }
}

// Convert sql.js result format [{ columns: [...], values: [[...]] }] to array of objects
function rowsToObjects(res: any[]): any[] {
  if (!res || res.length === 0) return []
  const { columns, values } = res[0]
  return values.map((row: any[]) => {
    const obj: any = {}
    columns.forEach((col: string, idx: number) => {
      obj[col] = row[idx]
    })
    return obj
  })
}

export class SqlQueryBuilder {
  private tableName: string
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private selectedColumns: string = '*'
  private selectOptions?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }
  private whereClauses: string[] = []
  private params: any[] = []
  private orderClause: string = ''
  private limitCount?: number
  private offsetCount?: number
  private insertData?: any
  private updateData?: any
  private upsertOptions?: any
  private isSingle = false
  private isMaybeSingle = false

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (this.action === 'select') {
      this.selectedColumns = columns
      this.selectOptions = options
    }
    return this
  }

  insert(data: any) {
    this.action = 'insert'
    this.insertData = data
    return this
  }

  upsert(data: any, options?: any) {
    this.action = 'upsert'
    this.insertData = data
    this.upsertOptions = options
    return this
  }

  update(data: any) {
    this.action = 'update'
    this.updateData = data
    return this
  }

  delete() {
    this.action = 'delete'
    return this
  }

  eq(column: string, value: any) {
    if (value === null || value === undefined) {
      this.whereClauses.push(`"${column}" IS NULL`)
    } else {
      this.whereClauses.push(`"${column}" = ?`)
      this.params.push(value)
    }
    return this
  }

  neq(column: string, value: any) {
    if (value === null || value === undefined) {
      this.whereClauses.push(`"${column}" IS NOT NULL`)
    } else {
      this.whereClauses.push(`"${column}" != ?`)
      this.params.push(value)
    }
    return this
  }

  is(column: string, value: any) {
    if (value === null) {
      this.whereClauses.push(`"${column}" IS NULL`)
    } else {
      this.whereClauses.push(`"${column}" = ?`)
      this.params.push(value)
    }
    return this
  }

  in(column: string, values: any[]) {
    if (!values || values.length === 0) {
      this.whereClauses.push('1 = 0')
      return this
    }
    const placeholders = values.map(() => '?').join(', ')
    this.whereClauses.push(`"${column}" IN (${placeholders})`)
    this.params.push(...values)
    return this
  }

  ilike(column: string, pattern: string) {
    // Replace % with SQLite LIKE wildcard %
    this.whereClauses.push(`LOWER("${column}") LIKE LOWER(?)`)
    this.params.push(pattern)
    return this
  }

  gt(column: string, value: any) {
    this.whereClauses.push(`"${column}" > ?`)
    this.params.push(value)
    return this
  }

  gte(column: string, value: any) {
    this.whereClauses.push(`"${column}" >= ?`)
    this.params.push(value)
    return this
  }

  lt(column: string, value: any) {
    this.whereClauses.push(`"${column}" < ?`)
    this.params.push(value)
    return this
  }

  lte(column: string, value: any) {
    this.whereClauses.push(`"${column}" <= ?`)
    this.params.push(value)
    return this
  }

  or(filterString: string) {
    // Parse expressions like "group_code.ilike.%test%,name.ilike.%test%"
    const parts = filterString.split(',')
    const subConds: string[] = []
    for (const p of parts) {
      const segs = p.split('.')
      if (segs.length >= 3) {
        const col = segs[0].trim()
        const op = segs[1].trim()
        const val = segs.slice(2).join('.').trim()
        if (op === 'ilike' || op === 'like') {
          subConds.push(`LOWER("${col}") LIKE LOWER(?)`)
          this.params.push(val)
        } else if (op === 'eq') {
          subConds.push(`"${col}" = ?`)
          this.params.push(val)
        }
      }
    }
    if (subConds.length > 0) {
      this.whereClauses.push(`(${subConds.join(' OR ')})`)
    }
    return this
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'in') {
      let items: any[] = []
      if (typeof value === 'string' && value.startsWith('(') && value.endsWith(')')) {
        items = value.slice(1, -1).split(',').map((s) => s.trim())
      } else if (Array.isArray(value)) {
        items = value
      }
      if (items.length > 0) {
        const placeholders = items.map(() => '?').join(', ')
        this.whereClauses.push(`"${column}" NOT IN (${placeholders})`)
        this.params.push(...items)
      }
    }
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending !== false
    this.orderClause = `ORDER BY "${column}" ${asc ? 'ASC' : 'DESC'}`
    return this
  }

  range(from: number, to: number) {
    this.offsetCount = from
    this.limitCount = Math.max(0, to - from + 1)
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  single() {
    this.isSingle = true
    this.limitCount = 1
    return this
  }

  maybeSingle() {
    this.isMaybeSingle = true
    this.limitCount = 1
    return this
  }

  async execute(): Promise<QueryResult> {
    try {
      const db = await getDb()

      if (this.action === 'insert' || this.action === 'upsert') {
        const rows = Array.isArray(this.insertData) ? this.insertData : [this.insertData]
        if (rows.length === 0) return { data: [], error: null }

        const insertedRecords: any[] = []
        for (const raw of rows) {
          const row = { ...raw }
          if (!row.id) {
            row.id = crypto.randomUUID()
          }
          if (!row.created_at) {
            row.created_at = new Date().toISOString()
          }
          if (!row.updated_at && (this.tableName === 'bookings' || this.tableName === 'groups' || this.tableName === 'passengers' || this.tableName === 'payments' || this.tableName === 'rooms')) {
            row.updated_at = row.created_at
          }

          const cols = Object.keys(row)
          const vals = Object.values(row).map((v) =>
            v !== null && typeof v === 'object' && !(v instanceof Date) && !(v instanceof Buffer)
              ? JSON.stringify(v)
              : v,
          )
          const placeholders = cols.map(() => '?').join(', ')
          const colList = cols.map((c) => `"${c}"`).join(', ')

          let sql = ''
          if (this.action === 'upsert') {
            sql = `INSERT OR REPLACE INTO "${this.tableName}" (${colList}) VALUES (${placeholders})`
          } else {
            sql = `INSERT INTO "${this.tableName}" (${colList}) VALUES (${placeholders})`
          }

          try {
            db.run(sql, vals)
          } catch (e: any) {
            return { data: null, error: { message: e.message, code: e.message?.includes('UNIQUE') ? '23505' : 'SQLITE_ERROR' } }
          }

          const queryRes = db.exec(`SELECT * FROM "${this.tableName}" WHERE id = ?`, [row.id])
          const obj = rowsToObjects(queryRes)[0]
          insertedRecords.push(obj)
        }

        persistDb()
        const resData = Array.isArray(this.insertData) ? insertedRecords : insertedRecords[0]
        return { data: resData, error: null }
      }

      if (this.action === 'update') {
        const row = { ...this.updateData }
        if (!row.updated_at && (this.tableName === 'bookings' || this.tableName === 'groups' || this.tableName === 'passengers' || this.tableName === 'payments' || this.tableName === 'rooms')) {
          row.updated_at = new Date().toISOString()
        }

        const cols = Object.keys(row)
        const vals = Object.values(row).map((v) =>
          v !== null && typeof v === 'object' && !(v instanceof Date) && !(v instanceof Buffer)
            ? JSON.stringify(v)
            : v,
        )
        const setClauses = cols.map((c) => `"${c}" = ?`).join(', ')
        const whereSql = this.whereClauses.length > 0 ? `WHERE ${this.whereClauses.join(' AND ')}` : ''

        // First find matching IDs to return updated rows
        const idsRes = db.exec(`SELECT id FROM "${this.tableName}" ${whereSql}`, this.params)
        const matchingIds = rowsToObjects(idsRes).map((r) => r.id)

        const updateSql = `UPDATE "${this.tableName}" SET ${setClauses} ${whereSql}`
        const allParams = [...vals, ...this.params]

        try {
          db.run(updateSql, allParams)
        } catch (e: any) {
          return { data: null, error: { message: e.message, code: e.message?.includes('UNIQUE') ? '23505' : 'SQLITE_ERROR' } }
        }

        persistDb()

        if (matchingIds.length > 0) {
          const ph = matchingIds.map(() => '?').join(', ')
          const updatedRes = db.exec(`SELECT * FROM "${this.tableName}" WHERE id IN (${ph})`, matchingIds)
          const updatedRows = rowsToObjects(updatedRes)
          const finalData = this.isSingle || this.isMaybeSingle ? updatedRows[0] || null : updatedRows
          return { data: finalData, error: null }
        }

        return { data: this.isSingle ? null : [], error: null }
      }

      if (this.action === 'delete') {
        const whereSql = this.whereClauses.length > 0 ? `WHERE ${this.whereClauses.join(' AND ')}` : ''
        const deleteSql = `DELETE FROM "${this.tableName}" ${whereSql}`
        try {
          db.run(deleteSql, this.params)
        } catch (e: any) {
          return { data: null, error: { message: e.message, code: 'SQLITE_ERROR' } }
        }
        persistDb()
        return { data: null, error: null }
      }

      // Action is 'select'
      const whereSql = this.whereClauses.length > 0 ? `WHERE ${this.whereClauses.join(' AND ')}` : ''
      let count: number | null = null

      if (this.selectOptions?.count === 'exact') {
        const countRes = db.exec(`SELECT COUNT(*) as cnt FROM "${this.tableName}" ${whereSql}`, this.params)
        count = countRes[0]?.values[0]?.[0] ?? 0
      }

      if (this.selectOptions?.head) {
        return { data: null, count, error: null }
      }

      let limitSql = ''
      if (this.limitCount !== undefined) {
        limitSql = `LIMIT ${this.limitCount}`
        if (this.offsetCount !== undefined) {
          limitSql += ` OFFSET ${this.offsetCount}`
        }
      }

      // Parse relations from selectedColumns, e.g. "*, bookings(id, booking_code), groups(group_code)"
      const { directColumns, relations } = parseRelations(this.selectedColumns)

      const selectSql = `SELECT ${directColumns} FROM "${this.tableName}" ${whereSql} ${this.orderClause} ${limitSql}`
      const queryRes = db.exec(selectSql, this.params)
      let records = rowsToObjects(queryRes)

      // Resolve relations for each row
      if (relations.length > 0 && records.length > 0) {
        records = await resolveRelations(db, this.tableName, records, relations)
      }

      if (this.isSingle) {
        if (records.length === 0) {
          return { data: null, error: { message: 'Row not found', code: 'PGRST116' } }
        }
        return { data: records[0], count, error: null }
      }

      if (this.isMaybeSingle) {
        return { data: records[0] || null, count, error: null }
      }

      return { data: records, count, error: null }
    } catch (err: any) {
      return { data: null, error: { message: err.message, code: 'DB_ERROR' } }
    }
  }

  // Make query builder thenable so `await supabaseAdmin.from(...)` works seamlessly
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

function parseRelations(columnStr: string): { directColumns: string; relations: Array<{ relationName: string; subColumns: string }> } {
  const relations: Array<{ relationName: string; subColumns: string }> = []
  if (!columnStr || columnStr.trim() === '*') {
    return { directColumns: '*', relations }
  }

  let cleanStr = columnStr
  const relRegex = /([a-zA-Z0-9_]+)\(([^)]*)\)/g
  let match: RegExpExecArray | null

  while ((match = relRegex.exec(columnStr)) !== null) {
    relations.push({
      relationName: match[1],
      subColumns: match[2].trim() || '*',
    })
  }

  const cols = cleanStr
    .replace(relRegex, '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  const directColumns = cols.length > 0 ? cols.map((c) => (c === '*' ? '*' : `"${c}"`)).join(', ') : '*'

  return { directColumns, relations }
}

async function resolveRelations(db: any, parentTable: string, parentRows: any[], relations: Array<{ relationName: string; subColumns: string }>): Promise<any[]> {
  for (const rel of relations) {
    const relName = rel.relationName
    for (const row of parentRows) {
      if (relName === 'groups') {
        const gId = row.group_id
        if (gId) {
          const res = db.exec(`SELECT * FROM groups WHERE id = ?`, [gId])
          row.groups = rowsToObjects(res)[0] || null
        } else {
          row.groups = null
        }
      } else if (relName === 'bookings') {
        if (parentTable === 'groups') {
          const res = db.exec(`SELECT * FROM bookings WHERE group_id = ?`, [row.id])
          row.bookings = rowsToObjects(res)
        } else {
          const bId = row.booking_id
          if (bId) {
            const res = db.exec(`SELECT * FROM bookings WHERE id = ?`, [bId])
            row.bookings = rowsToObjects(res)[0] || null
          } else {
            row.bookings = null
          }
        }
      } else if (relName === 'passengers') {
        if (parentTable === 'groups') {
          const res = db.exec(`SELECT * FROM passengers WHERE group_id = ?`, [row.id])
          row.passengers = rowsToObjects(res)
        } else if (parentTable === 'bookings') {
          const res = db.exec(`SELECT * FROM passengers WHERE booking_id = ? ORDER BY passenger_index ASC`, [row.id])
          row.passengers = rowsToObjects(res)
        } else {
          const pId = row.passenger_id
          if (pId) {
            const res = db.exec(`SELECT * FROM passengers WHERE id = ?`, [pId])
            row.passengers = rowsToObjects(res)[0] || null
          } else {
            row.passengers = null
          }
        }
      } else if (relName === 'travel_packages') {
        const pkgId = row.package_id
        if (pkgId) {
          const res = db.exec(`SELECT * FROM travel_packages WHERE id = ?`, [pkgId])
          row.travel_packages = rowsToObjects(res)[0] || null
        } else {
          row.travel_packages = null
        }
      } else if (relName === 'rooms') {
        const rId = row.room_id
        if (rId) {
          const res = db.exec(`SELECT * FROM rooms WHERE id = ?`, [rId])
          row.rooms = rowsToObjects(res)[0] || null
        } else {
          row.rooms = null
        }
      } else if (relName === 'room_allocations') {
        if (parentTable === 'rooms') {
          const res = db.exec(`SELECT * FROM room_allocations WHERE room_id = ?`, [row.id])
          const allocs = rowsToObjects(res)
          for (const a of allocs) {
            if (a.passenger_id) {
              const pRes = db.exec(`SELECT * FROM passengers WHERE id = ?`, [a.passenger_id])
              a.passengers = rowsToObjects(pRes)[0] || null
              if (a.passengers && a.passengers.booking_id) {
                const bRes = db.exec(`SELECT booking_code FROM bookings WHERE id = ?`, [a.passengers.booking_id])
                a.passengers.bookings = rowsToObjects(bRes)[0] || null
              }
              if (a.passengers && a.passengers.group_id) {
                const gRes = db.exec(`SELECT group_code, name FROM groups WHERE id = ?`, [a.passengers.group_id])
                a.passengers.groups = rowsToObjects(gRes)[0] || null
              }
            }
          }
          row.room_allocations = allocs
        } else if (parentTable === 'passengers') {
          const res = db.exec(`SELECT * FROM room_allocations WHERE passenger_id = ?`, [row.id])
          const allocs = rowsToObjects(res)
          for (const a of allocs) {
            if (a.room_id) {
              const rRes = db.exec(`SELECT * FROM rooms WHERE id = ?`, [a.room_id])
              a.rooms = rowsToObjects(rRes)[0] || null
            }
          }
          row.room_allocations = allocs
        }
      } else if (relName === 'ticket_passenger_mappings') {
        if (parentTable === 'passengers') {
          const res = db.exec(`SELECT * FROM ticket_passenger_mappings WHERE passenger_id = ?`, [row.id])
          row.ticket_passenger_mappings = rowsToObjects(res)
        }
      } else if (relName === 'ticket_pdfs') {
        const tId = row.ticket_pdf_id
        if (tId) {
          const res = db.exec(`SELECT * FROM ticket_pdfs WHERE id = ?`, [tId])
          row.ticket_pdfs = rowsToObjects(res)[0] || null
        } else {
          row.ticket_pdfs = null
        }
      }
    }
  }
  return parentRows
}

export function createLocalDbClient() {
  return {
    from(tableName: string) {
      return new SqlQueryBuilder(tableName)
    },
    rpc(procedureName: string, _params?: any) {
      return Promise.resolve({ data: 0, error: null })
    },
    auth: {
      async getUser(_token: string) {
        return { data: { user: null }, error: { message: 'Use dev-token in local/test mode' } }
      },
    },
  }
}
