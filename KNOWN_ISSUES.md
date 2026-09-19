# Known Issues, Operational Boundaries & Promotion Requirements

**Project**: MAVT.IN / Maa Vaishnavi Tourism  
**Specification**: `MAVT_Detailed_Developer_Requirement_V2.pdf`  
**Evaluation Date**: 2026-09-15  

---

## 1. Production Database Deployment Blockers

### Blocker 1: Centralized Cloud PostgreSQL Schema Migration
- **Current State**: The V2 clean-slate schema file [`Backend/migrations/000_mavt_v2_schema.sql`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/migrations/000_mavt_v2_schema.sql) is fully authored with all 15 tables, indexes, and constraints.
- **Why It Is Blocked**: The Supabase service role key provided in `.env.development` provides access to the PostgREST HTTPS data API, but does not provide administrative DDL execution privileges to create or alter tables.
- **Exact Credentials / Access Required**:
  - Direct PostgreSQL connection URI: `postgresql://postgres:[PASSWORD]@db.jpvowbxojdvrpgtpxvmo.supabase.co:5432/postgres`, OR
  - Administrative login to the Supabase Dashboard (`https://app.supabase.com/project/jpvowbxojdvrpgtpxvmo`) to run the migration script in the SQL Editor.
- **Architectural Status**: `BLOCKED (DATABASE DDL ACCESS REQUIRED)`.
- **Mitigation Taken**: Silent fallback in `supabaseAdmin.ts` was eliminated so production mode will fail fast rather than silently corrupting local disk storage.

---

## 2. External Third-Party Integration Boundaries

### Boundary 1: Live Payment Gateway & Public Webhook Endpoint
- **Current State**: Razorpay order creation, client signature verification (HMAC-SHA256), and webhook idempotency are implemented and verified via automated HTTP tests (`tests/integration/paymentSecurity.test.ts`).
- **Live Deployment Requirement**: Razorpay webhooks require a publicly reachable HTTPS domain (e.g. `https://api.mavt.in/api/webhooks/razorpay`) configured in the Razorpay Merchant Dashboard under **Settings $\rightarrow$ Webhooks**.
- **Status**: `MOCK PASS (LOCAL HMAC VERIFIED; LIVE PUBLIC HTTPS REQUIRED)`.

### Boundary 2: Phase 1 WhatsApp & SMS DLT Gateways
- **Current State**: Notification dispatch records are captured in database audit logs and booking records.
- **Phase 1 Boundary**: Live automated WhatsApp delivery requires Meta Cloud API or an approved Business Solution Provider (BSP, e.g. Gupshup, Wati). Indian telecom regulations require registered DLT principal entity IDs and approved 1407/DLT templates for SMS.
- **Status**: `MOCK PASS (PHASE 1 SPECIFICATION CLARIFICATION)`.

### Boundary 3: Akbar Vendor Template Comparison
- **Current State**: The 4-sheet train manifest generator (`Going - AC`, `Going - Non-AC`, `Return - AC`, `Return - Non-AC`) strictly satisfies all formatting rules from the V2 specification:
  - Zero mixing of AC and Non-AC
  - Group-centric ordering
  - Group header banner
  - Exactly one blank row between groups
  - Mandatory Booking ID, Passenger ID, berth preferences, and food choices on every devotee row.
- **Boundary**: A physical sample `.xlsx` file from the specific Akbar travel vendor desk has not been provided. The generator includes dynamic column mappings so any specific header naming required by Akbar can be configured without code refactoring.
- **Status**: `LOCAL TEST PASS (CONFIGURABLE GENERATOR VERIFIED; VENDOR SAMPLE COMPARISON PENDING)`.
