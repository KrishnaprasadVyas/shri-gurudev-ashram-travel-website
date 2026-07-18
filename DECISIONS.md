# DECISIONS.md
*Architectural decisions for Shri Gurudev Ashram Travel Portal*

---

## D-001 — Normalised Passenger Tables (not JSONB)
**Decision:** Use separate `booking_passengers` and `passenger_documents` tables with FK constraints.  
**Rejected alternative:** Single `passengers` JSONB column on `bookings`.  
**Rationale:** JSONB blobs are not queryable via SQL filters, cannot carry FK constraints, and cannot be row-locked. Normalised tables allow per-passenger admin actions, per-passenger verification status, index-backed queries, and RLS policies — all required by the booking lifecycle.

---

## D-002 — Three Documents per Passenger
**Decision:** `passenger_documents.document_type` allows `aadhaar_front`, `aadhaar_back`, `selfie`.  
**Rejected alternative:** Single `aadhaar_image` field.  
**Rationale:** Government ID verification requires both faces of the Aadhaar card. A single image cannot satisfy this. Three distinct document types with a UNIQUE constraint on `(passenger_id, document_type)` ensures exactly one upload per type per passenger, enforced at the database level.

---

## D-003 — Two-Phase Seat Reservation
**Decision:** Soft-reserve via VIEW at submit; hard-decrement inside the atomic `capture_booking_payment` RPC.  
**Rejected alternatives:**  
  - Decrement seats at draft creation (too many phantom reservations from abandoned wizards).  
  - No reservation until payment (race window: two users could both reach Razorpay for the last seat).  
**Rationale:** The `package_seat_availability` VIEW subtracts active `payment_pending` seats from `remaining_seats` in real-time. The RPC uses `FOR UPDATE` row-level locks for the definitive hard check. This provides both user-visible feedback ("X seats left") and atomicity at capture.

---

## D-004 — Booking Reference at Draft Creation
**Decision:** Generate `booking_reference` (format: `YAT-YYYYMMDD-XXXX`) immediately in `POST /api/bookings/draft`.  
**Rejected alternative:** Generate at payment confirmation.  
**Rationale:** Users need a reference number to quote in support queries before payment. Generating it early also makes all intermediate API responses identifiable, and means the wizard can display it at every step.

---

## D-005 — Mandatory Admin Notes on Rejection
**Decision:** `notes` is required (HTTP 400) when `status='rejected'` at `PUT /api/admin/passengers/:pid/verification`. The DB column remains nullable (to not break `verified` decisions), enforced only in the application layer.  
**Rationale:** Rejection without explanation forces users to resubmit blindly. Mandatory notes provide actionable feedback, reduce repeated rejections, and create an audit trail.

---

## D-006 — Draft Expiry Strategy
**Decision:** Three configurable TTLs via environment variables:
- `draft` → 2 hours (`DRAFT_TTL_MINUTES=120`)
- `documents_pending` → 24 hours (`DOCS_TTL_MINUTES=1440`)
- `payment_pending` → 30 minutes (`PAYMENT_TTL_MINUTES=30`)

A `node-cron` job calls `expire_stale_bookings()` every 5 minutes.  
**Rationale:** Different stages have different abandonment risk profiles. Draft and documents-pending allow generous time for users to collect information. Payment-pending must be short to release soft-reserved seats quickly. Server-side cron is preferred over Supabase pg_cron (which requires additional setup) to keep the cleanup logic in the backend codebase where it can be monitored and logged.

---

## D-007 — Notifications are Database-Backed
**Decision:** `notifications` table in Supabase; users fetch via `GET /api/users/notifications`.  
**Rejected alternatives:**  
  - localStorage (lost on sign-out, not cross-device).  
  - Firebase Cloud Messaging (requires additional service setup, out of scope for this iteration).  
**Rationale:** Database-backed notifications survive page refreshes and sign-outs, are queryable, support read/unread state, and can be extended to push notifications later without schema changes.

---

## D-008 — `is_primary` Flag with DB-Level Uniqueness
**Decision:** `is_primary BOOLEAN` on `booking_passengers`, enforced by a partial unique index (`WHERE is_primary = TRUE`).  
**Rejected alternative:** Rely solely on `passenger_index = 0`.  
**Rationale:** `passenger_index` is an ordering hint. `is_primary` is a semantic designation (this passenger's contact info may match the account holder, they receive communications, etc.). A partial unique index makes it impossible to accidentally have two primary passengers on one booking.

---

## D-009 — Account-Level Verification Removed
**Decision:** Remove `VerifyPage.tsx`, the "Verify Identity" sidebar item, and the booking gate that checks `verification_status` on the `users` table.  
**Rationale:** Account-level KYC (one Aadhaar per user) cannot represent multiple passengers on a single booking. The existing `aadhaar_image_path`, `selfie_image_path`, and `verification_status` columns on `users` are left nullable in the DB for backward compatibility with existing rows but are no longer written or read by new code.

---

## D-010 — Razorpay Fee Calculation on Backend
**Decision:** Backend calculates `base_amount`, `gateway_fee` (2% + 18% GST = 2.36%), and `payable_amount`. All three are stored on `bookings` before creating the Razorpay order. The order uses `payable_amount`.  
**Rejected alternative:** Frontend-calculated fee passed to backend.  
**Rationale:** Fee must be calculated on the backend to prevent tampering. Storing all three amounts allows accurate accounting, audit, and refund calculation.

---

## D-011 — Booking Status Skips Transient `paid`
**Decision:** `capture_booking_payment()` transitions directly to `verification_pending` (not `draft → documents_pending → payment_pending → paid → verification_pending`).  
**Rationale:** The `paid` state has no meaningful action associated with it — it would exist for milliseconds before admin review begins. Removing it simplifies state machine guards, reduces the number of status transitions to test, and ensures bookings appear in the admin verification queue immediately after payment.
