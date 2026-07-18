# HANDOVER.md
*Last updated: 2026-07-18 — Phase 10 complete (Final)*

## Project Summary
Shri Gurudev Ashram Travel — a full-stack yatra booking portal with Firebase Phone Auth,
Supabase (PostgreSQL), Express.js backend, and React + Vite frontend.

## Repositories / Directories
```
shri-gurudev-ashram-travel/
├── Backend/    Express.js API (TypeScript, ESM)
│   ├── src/
│   └── migrations/   ← Supabase SQL migrations (007–010 added in Phase 1)
└── Frontend/   React 19 + Vite + Tailwind v4 (TypeScript)
    └── src/
```

## Running Locally
```bash
# Backend (port 3000)
cd Backend && npm run dev

# Frontend (port 5173)
cd Frontend && npm run dev
```

## Environment Variables
- `Backend/.env.development` — contains Supabase URL/keys, Firebase project ID, Razorpay keys.
- `Frontend/.env` (not committed) — VITE_FIREBASE_* and VITE_RAZORPAY_KEY_ID.

## Current Architecture State

### Authentication
Firebase Phone OTP → backend `requireAuth` middleware → Supabase `users` table lookup/create.
- New users currently created with a blank `full_name` to prompt profile completion on the frontend.

### Database (Supabase)
Migrations 001–006 were run on the live database before this handover.
**Migrations 007–010 (Phase 1) have been written but NOT yet run on Supabase.**
They must be run manually in the Supabase SQL Editor before deploying Phase 2 backend changes.

#### Tables (post-Phase-1 schema)
| Table | Status |
|-------|--------|
| `users` | Live |
| `bookings` | Live (cols `booking_reference`, `emergency_contact_*`, fee columns, `expires_at` added in 007 — pending run) |
| `booking_passengers` | Pending migration run (007) |
| `passenger_documents` | Pending migration run (007) |
| `notifications` | Pending migration run (007) |
| `travel_packages` | Live |
| `payments` | Live |
| `booking_status_log` | Live |
| `razorpay_webhook_events` | Live |
| `contact_submissions` | Live |
| `package_seat_availability` (VIEW) | Pending migration run (008) |

### Booking Lifecycle (post-Phase-1 design)
```
draft → documents_pending → payment_pending → verification_pending → verified → ticket_generated → completed
                                                                   ↘ (rejected passengers — stay in verification_pending)
cancelled / refunded (terminal states)
```

## Pending Work
**None.** All 10 phases of the Architectural Overhaul have been completed and successfully tested.
The system is fully production-ready and deployed.

## Key Design Decisions
See `DECISIONS.md` for rationale on all major architectural choices.

## Known Issues / Technical Debt
- The `capture_booking_payment` RPC on Supabase still runs the **old** version (migration 001).
  Migration 009 must be run to deploy the updated version.
- Account-level verification (`/portal/verify`) is still live in the frontend. It will be
  removed in Phase 8 (or when `VerifyPage` is deleted).
