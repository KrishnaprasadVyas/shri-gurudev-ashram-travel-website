# CHANGELOG.md

All notable changes to this project are documented here.
Phases follow the architectural plan agreed on 2026-07-18.

---

## [Phase 1] — 2026-07-18 — Database Migrations

### Added
- `Backend/migrations/007_passenger_system.sql`
  - Extends `bookings.status` check constraint to the full 10-state lifecycle:
    `draft`, `documents_pending`, `payment_pending`, `paid`, `verification_pending`,
    `verified`, `ticket_generated`, `completed`, `cancelled`, `refunded`.
  - Adds new `bookings` columns: `booking_reference`, `emergency_contact_name`,
    `emergency_contact_phone`, `emergency_contact_relationship`, `base_amount`,
    `gateway_fee`, `payable_amount`, `expires_at`.
  - Creates `booking_passengers` table with: `passenger_index`, `is_primary`, `full_name`,
    `gender`, `dob`, `phone`, `address`, `aadhaar_number`, `verification_status`, `admin_notes`.
  - Creates partial unique index `uidx_one_primary_per_booking` enforcing exactly one
    primary passenger per booking at the database level.
  - Creates `passenger_documents` table with document types:
    `aadhaar_front`, `aadhaar_back`, `selfie`. Unique on `(passenger_id, document_type)`.
  - Creates `notifications` table with types: `verification_approved`,
    `verification_rejected`, `payment_confirmed`, `booking_update`, `announcement`.
    Includes structured `metadata JSONB` field for deep-link navigation.

- `Backend/migrations/008_seat_reservation.sql`
  - Creates `package_seat_availability` VIEW for real-time soft seat reservation tracking.
  - Creates `expire_stale_bookings()` DB function (returns count of cancelled bookings).
  - Adds index `idx_bookings_expires_at` for efficient expiry queries.

- `Backend/migrations/009_capture_booking_payment_v2.sql`
  - Replaces `001_capture_booking_payment.sql` (CREATE OR REPLACE — safe upgrade).
  - New behaviour: validates `expires_at`, transitions to `verification_pending` (not `paid`),
    clears `expires_at` on capture, sets all passengers to `submitted` status atomically.

- `Backend/migrations/010_rls_new_tables.sql`
  - RLS policies for `booking_passengers` (users can read own), `passenger_documents`
    (no direct client access — signed URLs only), `notifications` (read + read-mark update).

### Fixed (pre-existing lint errors, cleared during Phase 1 verification)
- `AdminDashboardPage.tsx` — removed unused `Compass` import; replaced two `any` map types.
- `AdminBookingDetailPage.tsx` — removed unused `Calendar`, `Phone`, `Mail`, `CheckCircle` imports.
- `AdminBookingsPage.tsx` — removed unused `TrendingUp` import.
- `AdminEditPackagePage.tsx` — removed unused `Sparkles` import.
- `AdminPackagesPage.tsx` — removed unused `Calendar`, `Eye`, `CheckCircle` imports.
- `AdminUserDetailPage.tsx` — removed unused `Clock` import.
- `AdminUsersPage.tsx` — removed unused `Users` import; replaced `any` with `AdminUser` type.
- `usePhoneAuth.ts` — added `eslint-disable-next-line` for intentionally unused `_options` parameter.
- `LoginPage.tsx` — fixed `interval: any` → `ReturnType<typeof setInterval>`; moved
  `setTimerActive(false)` into the interval updater to resolve `setState in effect` warning.
- `SignupPage.tsx` — same timer fix as LoginPage.
- `AuthContext.tsx` — added `eslint-disable-next-line` for demo-mode one-shot init setState calls.

### Build Status After Phase 1
- Backend TypeScript: ✅ 0 errors
- Frontend TypeScript: ✅ 0 errors
- Frontend ESLint: ✅ 0 errors, 0 warnings

### ⚠️ Action Required Before Phase 2
The four migration files must be executed on the **live Supabase instance** in order:
```
007_passenger_system.sql
008_seat_reservation.sql
009_capture_booking_payment_v2.sql
010_rls_new_tables.sql
```
Run each in the Supabase Dashboard → SQL Editor. Verify each completes without errors before proceeding to Phase 2.

---

## [Phase 2] — 2026-07-18 — Backend Staged Booking API

### Changed
- `Backend/src/middleware/auth.ts`: Replaced the placeholder `User XXXX` default `full_name` with an empty string `''` to force profile completion on the frontend for new sign-ups.
- `Backend/src/middleware/upload.ts`: Updated `multer` config to support `uploads/bookings/:bookingId/:passengerId/` path dynamically while retaining backward compatibility for `uploads/verifications/:userId/`.
- `Backend/src/routes/bookings.ts`: Replaced the monolithic booking POST endpoint with a multi-step staged API:
  - `POST /draft` (creates draft booking, generates booking reference)
  - `PATCH /:id/travellers` (updates traveler count)
  - `PATCH /:id/preferences` (updates transport, room, special notes, and emergency contact)
  - `POST /:id/submit` (transitions to `payment_pending`, checks soft reservation, calculates base/gateway/payable fees)
  - `DELETE /:id` (allows cancellation of pre-payment bookings)
  - `GET /:id` updated to join passenger and document records.

### Added
- `Backend/src/routes/passengers.ts`: New router for passenger operations.
  - `POST /` bulk upserts `booking_passengers`.
  - `POST /:passengerId/documents/:type` handles per-passenger document uploads.
- `Backend/src/app.ts`: Mounted `passengersRouter`.

---

## [Phase 3] — 2026-07-18 — Backend Payment Wiring

### Changed
- `Backend/src/routes/payments.ts`:
  - `POST /create-order`: No longer recalculates the booking fee. Now reliably reads `payable_amount` directly from the `bookings` table.
  - `POST /verify`: Now extracts the stored `gateway_fee` from the booking record and injects it into the updated `capture_booking_payment` RPC.
  - Removed duplicate `calculateAmount` logic from the payments router.

---

## [Phase 4] — 2026-07-18 — Notifications & Admin Passenger Verification Queue

### Added
- `Backend/src/routes/users.ts`: Added `GET /notifications` and `PATCH /notifications/:id/read` endpoints to allow users to fetch and manage their notification state.
- `Backend/src/routes/admin.ts`:
  - `GET /verifications`: Fetches passengers from `booking_passengers` (with attached bookings and documents) as a new admin queue.
  - `PUT /passengers/:id/verification`: Implements passenger-level approval/rejection logic. 
    - Auto-transitions parent `booking` status when all passengers are verified.
    - Mandates admin notes upon rejection.
    - Auto-generates user notifications upon decision.
  - `GET /passengers/:passengerId/document-url`: Provides signed URLs to securely view passenger-specific uploaded documents.

### Changed
- `Backend/src/routes/admin.ts`: Rewrote `/stats` to count verification queue numbers from the new `booking_passengers` table rather than the generic `users` table.

---

## [Phase 5] — 2026-07-18 — Background Cron Daemon

### Added
- `Backend/src/app.ts`:
  - Added a recurrent `setInterval` block inside `startServer` that invokes the `expire_stale_bookings` DB RPC every 5 minutes.
  - Implemented graceful node shutdown logic (`SIGINT`) to clear the cron job securely before closing the server.

---

## [Phase 6] — 2026-07-18 — Frontend Auth Unification

### Changed
- `Frontend/src/pages/auth/LoginPage.tsx`: Rewritten to encompass the entire authentication lifecycle in a unified 3-step inline flow (Phone Capture -> OTP -> Mandatory Profile Name Completion).
- `Frontend/src/App.tsx`:  - Purged `SignupPage` imports and routes.
  - Added a `<Navigate to="/login" replace />` catch for any stray `/signup` links.

### Removed
- `Frontend/src/pages/auth/SignupPage.tsx`: Deleted.

---

## [Phase 7] — 2026-07-18 — Frontend BookPage Wizard

### Changed
- `Frontend/src/pages/portal/BookPage.tsx`: Completely rebuilt from a single-page form into a localized state-machine powering a 5-step wizard. Follows the backend staged workflow: (1) `POST /draft` & `PATCH /travellers`, (2) `POST /passengers`, (3) `POST /documents/:type` loops per passenger, (4) `PATCH /preferences`, and (5) `POST /submit`.
- `Frontend/src/pages/portal/BookingDetailPage.tsx`: Updated UI payment components to properly reference `booking.payable_amount` which includes the new 2% payment gateway fee, ensuring Razorpay receives the accurate amount.
---

## [Phase 8] — 2026-07-18 — Admin Dashboard Overhaul

### Changed
- `Backend/src/routes/admin.ts`: Included `booking_passengers` in `GET /api/admin/bookings/:id`.
- `Frontend/src/pages/admin/AdminVerificationsPage.tsx`: Completely rebuilt to handle passenger-level verifications queue with Aadhaar Front/Back and Selfie document inspection. Added UI state for Admin Rejection Notes.
- `Frontend/src/pages/admin/AdminBookingDetailPage.tsx`: Transitioned from legacy flat schema data to an array mapping over `passengers` to accurately display all travelers tied to a booking. Implemented correct display of `payable_amount`.

---

## [Phase 9] — 2026-07-18 — Final Polish & Cleanup

### Changed
- `Frontend/src/types/database.types.ts`: Synced `BookingRow` with backend Phase 1 migrations to include missing financial fields (`payable_amount`, `gateway_fee`, etc.) and expanded `BookingStatus` literal types, resolving IDE typecheck errors.
- `Frontend/tsconfig.app.json`: Purged the invalid `ignoreDeprecations: 6.0` flag, restoring robust TypeScript compiler verification.
- `Frontend/src/pages/portal/BookingDetailPage.tsx`: Transitioned from legacy flat schema data to an array mapping over `booking_passengers` to accurately display all travelers tied to a booking on the Devotee Portal side.

---

## [Phase 10] — 2026-07-18 — Full Production Smoke Testing & Deployment

### Changed
- `Frontend/src/components/layout/PortalSidebar.tsx` & `AdminSidebar.tsx`: Updated logo clicking to route to `/` instead of sub-routes, and removed the unused `Verify Identity` link.
- `Frontend/src/App.tsx`: Removed the deprecated `VerifyPage.tsx` route, as identity verification is now built into the main booking flow.
- `Frontend/src/*`: Fixed over 15 strict compiler warnings caught by `tsc -b` during the production build, ensuring types perfectly matched the final backend implementation.

### Removed
- `Frontend/src/pages/portal/VerifyPage.tsx`: Deleted legacy component.

**Milestone: ALL 10 PHASES COMPLETED AND COMPILED SUCCESSFULLY!**
