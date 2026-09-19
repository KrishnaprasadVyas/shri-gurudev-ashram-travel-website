# MAVT.IN / Maa Vaishnavi Tourism — Comprehensive Test Plan

## 1. Objective & Scope
This test plan validates the centralized pilgrimage booking and operational management platform for **MAVT.IN / Maa Vaishnavi Tourism** against the 41 sections of `MAVT_Detailed_Developer_Requirement_V2.pdf`.
The target system supports **700+ passengers** (scaling to 1,000 / 5,000 / 10,000+) across all operational milestones:
Group (`GRP-xxxx`) → Booking (`MVT-YYMMDD-XXXX`) → Passenger (`P-xxxxxx`) → Payment (`PAY-xxxxxx`) → Train Manifest Export (Akbar Portal) → PDF Ticket Upload & Mapping → Room Allocation (with cross-booking group sharing) → Customer My Trip Dossier → Operational Reporting → Immutable Audit Logging.

---

## 2. Test Architecture & Runner Setup

The testing strategy is architected across five complementary verification tiers:

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 5: Playwright Headless Browser E2E (Chromium)          │
│ Full UI workflows: My Trip, Collections, Exports, Rooms     │
├─────────────────────────────────────────────────────────────┤
│ Tier 4: Concurrency & 750+ Devotee Scale Test Suite         │
│ Race condition protection, parallel bookings, latency SLA   │
├─────────────────────────────────────────────────────────────┤
│ Tier 3: Real HTTP Supertest Integration Suite               │
│ Real Express routes against persistent WebAssembly SQLite   │
├─────────────────────────────────────────────────────────────┤
│ Tier 2: Domain Business Acceptance Scenarios (Vitest)       │
│ All 23 business scenarios from Section 39 of Specification  │
├─────────────────────────────────────────────────────────────┤
│ Tier 1: Unit & Algorithm Tests (Vitest)                     │
│ ID sequences, pricing formula, UTR normalization, Excel     │
└─────────────────────────────────────────────────────────────┘
```

### Runners & Configuration
1. **Backend Unit, Integration & Scale Runner**:
   - **Framework**: Vitest v5.0.0 (`Backend/vitest.config.ts`)
   - **Database Layer**: WebAssembly SQLite (`sql.js`) with persistent storage at `Backend/data/mavt.sqlite`
   - **Command**: `npm run test` (in `Backend/`)
2. **Frontend End-to-End Browser Runner**:
   - **Framework**: Playwright v1.63.0 (`Frontend/playwright.config.ts`)
   - **Browser**: Headless Desktop Chromium
   - **Multi-Server Orchestration**: Backend on port `3001` (`NODE_ENV=test USE_LOCAL_DB=true`), Frontend Vite on port `5173` (`VITE_API_BASE_URL=http://127.0.0.1:3001 VITE_DEMO_AUTH=true`)
   - **Command**: `npx playwright test` (in `Frontend/`)

---

## 3. Test Suites & Coverage Dimensions

### Suite 1: Unique Code & ID Generation (`tests/unit/idGenerators.test.ts`)
1. **Booking Reference (`MVT-YYMMDD-XXXX`)**:
   - Matches regex `^MVT-\d{6}-\d{4}$`.
   - Date portion strictly matches current date `YYMMDD`.
   - Guaranteed collision-free monotonic increment.
2. **Group Code (`GRP-XXXX`)**:
   - Matches regex `^GRP-\d{4}$`.
   - Zero-padded 4-digit sequence format.
3. **Passenger Code (`P-XXXXXX`)**:
   - Matches regex `^P-\d{6}$`.
   - Zero-padded 6-digit sequence format.
4. **Payment Code (`PAY-XXXXXX`)**:
   - Matches regex `^PAY-\d{6}$`.
   - Zero-padded 6-digit sequence format.

### Suite 2: Pricing Engine & UTR Integrity (`tests/unit/pricingAndUtr.test.ts`)
1. **AC vs Non-AC Mixed Passenger Pricing**:
   - Calculates base yatra price + AC surcharges + Non-AC surcharges + attached Seva fees.
   - Accurately splits totals when passengers within the same booking choose different travel classes.
2. **Multi-Installment Balance Reconciliation**:
   - Partial payment: balance drops, `payment_status: partially_paid`.
   - Full payment: balance reaches 0, `payment_status: paid`.
   - Excess protection: pending balance never negative.
3. **UTR Sanitization & Duplicate Detection**:
   - Removes leading/trailing whitespace and normalizes case.
   - Rejects duplicate UTRs across any booking with HTTP 409 Conflict.
   - Allows unique UTRs.

### Suite 3: Train Manifest Export Formatting (`tests/unit/excelExportFormatting.test.ts`)
1. **4-Sheet Generation**:
   - Generates exactly 4 sheets: `Going - AC`, `Going - Non-AC`, `Return - AC`, `Return - Non-AC`.
2. **Group Header & Blank Row Formatting**:
   - Inserts Group header banner (`Group: GRP-0001 - Sharma Family (Lead Mobile: 9876543210)`).
   - Inserts **exactly 1 blank row between groups** to facilitate bulk ticket booking on agent portals.
   - Formats headers with dark brown `#3E2B1F` and gold `#B8860B` styling.

### Suite 4: Business Acceptance Scenarios (`tests/scenarios/acceptanceScenarios.test.ts`)
Implements and verifies all 23 core scenarios from Section 39 of the V2 specification:
- **Scenario 1**: Group creation with 20 bookings (70 passengers). Group total = sum of 20 bookings.
- **Scenario 2**: 5 passengers in same booking — 2 AC, 3 Non-AC. Correct prices calculated and shown separately.
- **Scenario 3 & 4**: 1 passenger added later + 1 late booking added to existing group. Passenger counts and totals updated.
- **Scenario 5**: Passenger transferred from GRP-0001 to GRP-0002. Both groups' passenger counts and totals updated.
- **Scenario 6 & 7**: Excel export generated with 700 passengers. 4 sheets verified, group headers verified, blank rows verified.
- **Scenario 8, 9, 10, 11**: Ticket PDF uploaded for GRP-0001 Going AC (12 passengers). PDF parsed, PNR extracted, passengers mapped.
- **Scenario 12 & 13**: Passenger views My Trip page: sees Going ticket, Return ticket, Room details, Passenger details; downloads PDF.
- **Scenario 14, 15, 16**: 2 passengers from Booking A + 1 from Booking B (same group) allocated to Room 101 (3-bed AC).
- **Scenario 17, 18, 19**: Multi-installment payments (₹10,000 + ₹15,000 = ₹25,000) and duplicate UTR rejection.
- **Scenario 20 & 21**: Independent operational statuses (`paid` vs `ticket pending`) and Staff RBAC permissions.
- **Scenario 22 & 23**: Audit trail logging and fast multi-entity search in under 2 seconds.

### Suite 5: Real HTTP Integration (`tests/integration/apiIntegration.test.ts`)
Real Supertest HTTP calls to Express app routes against the persistent SQLite database:
1. **RBAC Security Barriers**: Blocks unauthenticated (401), Room Staff from payments (403), Booking Staff from rooms (403), Train Staff from financial cards (403).
2. **Group Management**: Sequential `GRP-xxxx` generation, search, pagination, detailed group breakdown.
3. **Booking & Mixed Pricing**: `MVT-YYMMDD-XXXX` and `P-xxxxxx` IDs, 2 AC + 2 Non-AC pricing verification.
4. **Payments & Duplicate UTR**: Offline installment recording, balance reconciliation, HTTP 409 Conflict rejection, Super Admin UTR correction with mandatory audit reason.
5. **Train Manifest 4-Sheet Excel Export**: Real binary Excel buffer generation and ExcelJS structure parsing.
6. **Room Master & Cross-Booking Sharing**: Room creation, multiple passenger allocations across distinct bookings in the same group.
7. **Customer My Trip**: Booking code + mobile dossier lookup, security token generation, mismatched mobile rejection (403).
8. **Admin Dashboard & Outstanding Collections**: Section 10 Collection Cards and pending collection balance queue.

### Suite 6: Scalability (700+ Passengers) & Concurrency (`tests/performance/scaleAndConcurrency.test.ts`)
1. **UTR Race Condition Protection**: 20 concurrent requests with identical UTR fired simultaneously — exactly 1 succeeds (201), 19 rejected (409 Conflict).
2. **Parallel Booking Generation**: 25 concurrent booking requests — 25 distinct codes generated with 0 collisions.
3. **750+ Devotee Scalability Harness**: 25 groups, 150 bookings, 750 passengers seeded directly into persistent SQLite:
   - 4-sheet Akbar train manifest generated in **< 2.0s**.
   - Admin collection cards calculated across 750+ passengers in **< 1.5s**.
   - Outstanding balance queue retrieved in **< 1.0s**.
   - Global multi-entity search responded in **< 500ms**.

### Suite 7: Playwright End-to-End Browser Tests (`Frontend/e2e/mavtEndToEnd.spec.ts`)
1. **Public My Trip Dossier Lookup (`/my-trip`)**: Customer enters Booking ID + Mobile, retrieves pilgrimage dossier, passenger roster, and balance summary.
2. **Admin Dashboard & Section 10 Collection Cards (`/admin`)**: Verifies AC Travel, Non-AC Travel, and TOTAL collection cards and pending queue link.
3. **Pending Collections Queue (`/admin/pending-collection`)**: Verifies real-time table of outstanding balances.
4. **Train Passenger Manifest Export (`/admin/train-export`)**: Verifies Akbar 4-sheet 1-click download button and 4 individual sheet download cards.
5. **Room Allocation Matrix (`/admin/room-allocation`)**: Verifies room inventory and cross-booking sharing controls.

---

## 4. Acceptance Criteria & Pass Requirements
1. `npm run build` in `Backend`: 0 TypeScript compiler errors.
2. `npm run test` in `Backend`: 47/47 tests pass.
3. `npm run build` in `Frontend`: 0 TypeScript/Vite compilation errors.
4. `npx playwright test` in `Frontend`: 5/5 browser tests pass.
5. Entity Independence: Group (`GRP-`), Booking (`MVT-`), Passenger (`P-`), and Payment (`PAY-`).
6. Duplicate UTR Protection: Real SQLite database UNIQUE constraint + API HTTP 409 Conflict.
7. Akbar Train Manifest: 4 sheets, group headers, exactly 1 blank row between groups.
