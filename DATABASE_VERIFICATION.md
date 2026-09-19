# Database Verification & Production Readiness Assessment

**Project**: MAVT.IN / Maa Vaishnavi Tourism  
**Specification**: `MAVT_Detailed_Developer_Requirement_V2.pdf`  
**Evaluation Date**: 2026-09-15  
**Architectural Standard**: Real Centralized PostgreSQL Database (Supabase)

---

## 1. Production Database Gate (10-Point Readiness Audit)

| Gate | Verification Question | Current State | Truthful Audit Status | Action Required for Production Promotion |
| :--- | :--- | :---: | :---: | :--- |
| **A** | Is the V2 PostgreSQL/Supabase schema actually deployed? | **NO** | **BLOCKED** | Execute `Backend/migrations/000_mavt_v2_schema.sql` via Supabase SQL Editor or direct postgres CLI connection. |
| **B** | Are all required constraints/indexes/triggers present in Postgres? | **NO** | **BLOCKED** | Awaiting cloud DDL migration to verify PostgreSQL unique index `uidx_payments_utr` and foreign key cascades. |
| **C** | Is production data persisted centrally? | **NO** | **BLOCKED** | Production target is currently blocked; all testing is segregated in local test SQLite harness. |
| **D** | Are automated backups configured? | **DOCUMENTED** | **LOCAL SOP VERIFIED** | Standard Operating Procedure documented below; automated daily backups need configuration in Supabase Dashboard. |
| **E** | Has database restore been tested and verified? | **YES** | **LOCAL TEST PASS** | Verified via `tests/integration/backupRestore.test.ts` (export $\rightarrow$ wipe $\rightarrow$ restore $\rightarrow$ 100% relational integrity verified). |
| **F** | Are RLS and server-side authorization controls enforced? | **YES (API)** | **LOCAL TEST PASS** | Server-side RBAC middleware verified across all 5 staff roles. PostgreSQL RLS policies authored in `000_mavt_v2_schema.sql`. |
| **G** | Are uploaded PDFs stored privately? | **YES** | **LOCAL TEST PASS** | Private filesystem directory (`Backend/uploads/tickets`), HMAC streaming tokens, unauthorized IDOR download blocked (403). |
| **H** | Are production APIs connected to the real database? | **NO** | **BLOCKED** | Code has been decoupled from silent fallbacks; awaiting cloud PostgreSQL migration. |
| **I** | Are payment webhooks connected and verified? | **YES (SIM)** | **LOCAL TEST PASS** | Razorpay HMAC-SHA256 signature verification and idempotency verified. Live webhook requires public domain deployment. |
| **J** | Are real browser E2E tests running against the actual deployed stack? | **LOCAL ONLY** | **LOCAL TEST PASS** | Playwright Chromium E2E suite executed and passed (5/5) against local test stack. |

> [!CAUTION]
> **PRODUCTION READINESS VERDICT: NOT READY FOR PRODUCTION DEPLOYMENT**  
> Because Gates A, B, C, and H are currently **BLOCKED**, the system is classified as **LOCALLY VERIFIED & PRODUCTION-BLOCKED (PENDING CLOUD POSTGRESQL DDL PROVISIONING)**. The local SQLite database engine (`Backend/data/mavt.sqlite`) is quarantined to `NODE_ENV === 'test'` and must never be treated as the production source of truth.

---

## 2. PostgreSQL V2 Schema Architecture (`000_mavt_v2_schema.sql`)

The clean-slate production schema is defined in [`Backend/migrations/000_mavt_v2_schema.sql`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/migrations/000_mavt_v2_schema.sql) and contains 15 core tables:

```
+-----------------------------------------------------------------------------------------------+
|                                      MAVT V2 RELATIONAL MAP                                   |
+-----------------------------------------------------------------------------------------------+
|  groups (GRP-xxxx)                                                                            |
|    |                                                                                          |
|    +---> bookings (MVT-YYMMDD-XXXX)                                                           |
|    |       |                                                                                  |
|    |       +---> passengers (P-xxxxxx) <------------------+                                   |
|    |       |       |                                      |                                   |
|    |       |       +---> passenger_documents              |                                   |
|    |       |                                              |                                   |
|    |       +---> payments (PAY-xxxxxx)                    |                                   |
|    |                                                      |                                   |
|    +---> train_journeys (Going / Return)                  |                                   |
|    |       |                                              |                                   |
|    |       +---> ticket_pdfs                              |                                   |
|    |               |                                      |                                   |
|    |               +---> ticket_passenger_mappings -------+                                   |
|    |                                                      |                                   |
|    +---> rooms (Available / Reserved / Occupied / Maint.) |                                   |
|            |                                              |                                   |
|            +---> room_allocations ------------------------+                                   |
|                                                                                               |
|  audit_logs (Immutable audit trail)                                                           |
|  app_settings (Dynamic system configurations)                                                 |
|  travel_packages & seva_packages (Package masters)                                            |
|  users (Staff & Devotee authentication)                                                       |
+-----------------------------------------------------------------------------------------------+
```

### Table Definitions & Integrity Constraints

1. `users`: UUID primary key, unique phone constraint, check constraint on staff roles (`super_admin`, `booking_staff`, `payment_staff`, `train_ticket_staff`, `room_staff`, `admin`, `user`).
2. `groups`: Unique `group_code` (`GRP-xxxx`), `lead_mobile`, and indexing.
3. `travel_packages`: Master pricing, seats inventory, mixed AC/Non-AC surcharge rates.
4. `bookings`: Relational foreign keys to `groups` and `travel_packages`, unique `booking_code` (`MVT-YYMMDD-XXXX`), status lifecycle constraints.
5. `passengers`: Unique `passenger_code` (`P-xxxxxx`), age, gender, travel class (`ac` vs `non_ac`), berth and food preferences.
6. `booking_passengers`: Join table linking bookings and passengers.
7. `passenger_documents`: Aadhaar/ID storage metadata with private URI references.
8. `payments`: Unique `payment_code` (`PAY-xxxxxx`), payment modes, unique normalized constraint on UTR:
   ```sql
   CREATE UNIQUE INDEX uidx_payments_utr ON public.payments (LOWER(TRIM(utr_number)))
     WHERE utr_number IS NOT NULL AND TRIM(utr_number) != '';
   ```
9. `train_journeys`: Going and Return train schedules, train numbers, origin/destination.
10. `ticket_pdfs`: Private PDF file paths, PNR, uploaded staff ID, active status flag.
11. `ticket_passenger_mappings`: Maps ticket PDFs to individual passengers, PNR, coach, berth.
12. `rooms`: Hotel/Ashram name, room number, type, capacity constraint, lifecycle status (`available`, `reserved`, `occupied`, `maintenance`).
13. `room_allocations`: Relational foreign keys linking room, passenger, booking, and group.
14. `audit_logs`: Immutable audit log table recording `actor_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `reason`, `created_at`.
15. `app_settings`: Key-value configuration master for dynamic system properties.

---

## 3. Environment Segregation & Silent Fallback Elimination

### Code Implementation (`Backend/src/services/supabaseAdmin.ts`)
The transparent fallback proxy that previously redirected missing Supabase tables to local SQLite has been completely removed from production mode:

```typescript
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
          if (!localDb) localDb = createLocalDbClient()
          return localDb.from(tableName)
        }
        // In production/staging: directly query centralized PostgreSQL/Supabase.
        // Fails fast if tables are missing in cloud Postgres rather than masking them.
        return (target as any).from(tableName)
      }
    }
    // ...
  }
})
```

---

## 4. Disaster Recovery & Backup / Restore Procedures

### Automated Backup Verification (`backupRestore.test.ts`)
Automated test in `Backend/tests/integration/backupRestore.test.ts` verified that:
1. `createDatabaseBackup()` exports all 15 tables into a structured JSON snapshot.
2. `resetDatabase()` wipes the test database to simulate total catastrophic loss.
3. `restoreDatabaseBackup()` re-populates all tables in topological foreign-key dependency order.
4. Record integrity, counts, and relational foreign keys were restored with 100% fidelity.

### Production PostgreSQL Disaster Recovery SOP

#### Automated Daily Backup via Supabase
1. Navigate to **Supabase Dashboard** $\rightarrow$ **Database** $\rightarrow$ **Backups**.
2. Enable Daily Scheduled Backups and Point-in-Time Recovery (PITR) with minimum 7-day retention.

#### Manual Production Snapshot via `pg_dump`
```bash
# Export full centralized PostgreSQL database
pg_dump "postgresql://postgres:[DB_PASSWORD]@db.jpvowbxojdvrpgtpxvmo.supabase.co:5432/postgres" \
  -F c -b -v -f "mavt_prod_backup_$(date +%Y%m%d_%H%M%S).dump"
```

#### Production Restore via `pg_restore`
```bash
# Restore into staging / disaster-recovery database
pg_restore -h db.jpvowbxojdvrpgtpxvmo.supabase.co -U postgres -d postgres \
  -v --clean --if-exists "mavt_prod_backup_[TIMESTAMP].dump"
```

---

## 5. Required Credentials & Promotion Steps

To promote this system from **LOCAL TEST PASS** to **REAL PASS** in production:
1. **PostgreSQL Database Password**: Obtain the Supabase database password for project `jpvowbxojdvrpgtpxvmo`.
2. **Execute Schema Migration**:
   - Open Supabase Dashboard $\rightarrow$ **SQL Editor**.
   - Paste and run the entire contents of [`Backend/migrations/000_mavt_v2_schema.sql`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/migrations/000_mavt_v2_schema.sql).
3. **Verify Tables**:
   - Confirm all 15 tables are visible under **Table Editor**.
4. **Set Production Environment**:
   - In production `.env`, set `USE_LOCAL_DB=false` and `NODE_ENV=production`.
5. **Run Sanity Smoke Test**:
   - Issue `GET /api/groups` and `POST /api/bookings` directly against the live Supabase instance.
