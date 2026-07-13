# Shri Gurudev Ashram — Implementation Plan v2

Source: `implementation-audit.md` (68% overall completion).
This plan replaces phase-by-plan-order sequencing with risk-ordered sequencing.
Rationale: several "cosmetic" gaps (Phase 3/7) are cheap and safe to leave for later;
several "small-looking" gaps (backend build, payment RPC, upload ownership) are
load-bearing and block everything downstream, including deployment.

Legend: 🔴 blocker · 🟠 security/data integrity · 🟡 feature completeness · 🟢 polish

---

## Phase A — Unblock the build 🔴

Nothing after this phase can be verified in production until these pass.

1. **Fix backend TypeScript/ESM build failure**
   - Root cause per audit: `NodeNext` module resolution requires explicit `.js`
     extensions on relative imports.
   - Action: either (a) add `.js` to every relative import in backend `src/`,
     or (b) switch `moduleResolution` to `Bundler`/`node16` consistent with how
     the build actually runs. Pick (a) only if deploy target truly needs
     NodeNext ESM; otherwise (b) is less invasive.
   - Acceptance: `npm run build` succeeds in `backend/` with zero errors.

2. **Resolve 15 frontend lint errors**
   - Known cause: components declared inside render in `ContactQuote.tsx`,
     `SanskritQuote.tsx`, `QuoteSection.tsx` — move to module scope.
   - Acceptance: `npm run lint` returns 0 errors.

3. **Consolidate duplicate implementations** (do this now, not later —
   duplicates make every subsequent fix ambiguous about "which file is live")
   - Delete or clearly `_legacy/`-prefix: alternate `src/routes` tree, alternate
     Supabase client, alternate `EmptyState`, unused `PublicHeader`/`PublicFooter`,
     unused `PackageCard`/`YatraCard`, legacy dashboard/analytics/orders/users
     pages, legacy `RegisterPage`, unused `App.css`.
   - Acceptance: `grep` for each deleted file's import path returns nothing;
     app still builds and renders identically.

**Exit criteria for Phase A:** `npm run build` (frontend + backend) and
`npm run lint` both pass in CI or locally, with no dead-code ambiguity left
for the next phases to trip over.

---

## Phase B — Data integrity & security 🟠

These are the items the audit flagged as unverifiable or actively unsafe.
Fix before adding any more features on top of them.

1. **Version the `capture_booking_payment` database function**
   - Write the SQL definition as a proper migration file (not just present in
     the live DB). Include the seat-decrement + booking-status update in one
     atomic function.
   - Add a migrations folder if none exists; check in the current live
     function definition by pulling it from Supabase (`supabase db dump` or
     SQL editor → export function).
   - Acceptance: migration file exists in repo, running it against a fresh DB
     reproduces current behavior.

2. **Make webhook processing retry-safe**
   - Current bug: event ID is marked processed _before_ reconciliation
     completes, so a failed reconciliation + Razorpay retry gets silently
     skipped as a duplicate.
   - Fix: mark processed only after reconciliation succeeds, or use a
     `status` column (`received` → `processing` → `done`/`failed`) instead of
     a boolean, so failed events can be retried or alerted on.
   - Acceptance: simulate a reconciliation failure locally; confirm a retried
     webhook with the same event ID is reprocessed, not skipped.

3. **Verify upload ownership on verification submission**
   - Current bug: verification submission accepts arbitrary image-path
     strings without checking they belong to the authenticated user.
   - Fix: server-side, derive the expected path prefix from `req.user.id` and
     reject any submitted path that doesn't match.
   - Acceptance: attempt to submit another user's known file path → 403.

4. **Secure viewing of Aadhaar/selfie uploads**
   - Currently not exposed via any URL mechanism at all (admin/user can't view
     them; separately, path validation is missing per #3).
   - Fix: signed URLs (short expiry) generated server-side, scoped to the
     owning user or an admin role check — not public/static serving.
   - Acceptance: admin review page and user's own verification page render
     actual thumbnails; a signed URL copied out of the browser and reused
     after expiry fails.

5. **Allowlist fields on admin package update**
   - Current bug: `PUT /api/admin/packages/:id` passes arbitrary request body
     properties straight to Supabase.
   - Fix: explicit allowlist of package-editable fields; reject/ignore the
     rest.
   - Acceptance: sending an extra unexpected field in the request body has no
     effect on the row.

6. **Fix admin search SQL injection risk**
   - Current bug: raw text interpolated into a PostgREST `.or()` expression.
   - Fix: sanitize/escape special characters (`,`, `.`, `(`, `)`, `%`) before
     interpolating, or switch to parameterized filter builder calls.
   - Acceptance: search input containing PostgREST operator characters
     doesn't alter query semantics or error out.

7. **Complete backend package validation**
   - Enforce description length, `remaining_seats >= 0`, and
     `remaining_seats <= total_seats` server-side (not just client-side).
   - Acceptance: API-level test (or manual curl) confirms invalid payloads
     are rejected with 400, not silently written.

8. **Don't leak raw DB error messages to clients**
   - Wrap Supabase/Postgres errors in a generic message + server-side log;
     return specifics only in dev mode.
   - Acceptance: forcing a DB error (e.g. duplicate key) returns a generic
     4xx/5xx body in production mode.

9. **Add rate limiting + basic security headers**
   - `express-rate-limit` on auth/payment-sensitive routes at minimum,
     `helmet` for headers.
   - Acceptance: rapid repeated requests to a rate-limited route get 429
     after threshold.

10. **RLS policy audit**
    - No migrations/policy SQL currently exist to verify. Export current RLS
      policies from Supabase into a checked-in SQL file, and confirm each
      table a user can hit directly (not through the Express API) has a
      correct policy — especially `users`, `bookings`, verification-related
      tables.
    - Acceptance: RLS SQL is in repo; manually confirm (via Supabase SQL
      editor as an anon/authenticated test user) that cross-user reads/writes
      are denied.

**Exit criteria for Phase B:** no item in the audit's "Concerns" list remains
unaddressed or unverified.

---

## Phase C — Payment/booking correctness 🟠

Directly affects money and seat counts — grouped separately from Phase B
because it depends on B.1/B.2 being done first.

1. Confirm the atomic seat-decrement path (`capture_booking_payment`) is the
   _only_ path that mutates `remaining_seats` — audit for any other write.
2. Add an admin manual payment-reconciliation endpoint (mentioned as
   required but absent) so a failed/ambiguous webhook can be resolved
   without direct DB access.
3. Add `PUT`/`PATCH /api/admin/bookings/:id` for `admin_notes` — currently
   entirely absent (endpoint + UI).
4. Add admin booking status history/timeline (audit trail of status
   transitions), at minimum a simple `booking_status_log` table + read
   endpoint.

**Exit criteria:** an admin can trace any booking from creation → payment →
status changes without touching the database directly.

---

## Phase D — Feature completeness (user-facing gaps) 🟡

1. **Replace hard-coded Home/Yatras listings** with real Supabase package
   queries (including loading/empty/error states) — currently the single
   biggest "looks done but isn't real" gap.
2. **Fix package listing → detail link integrity.** Hard-coded IDs like
   `kedarnath-badrinath` are passed into a real detail query; once packages
   are dynamic (item 1), confirm IDs always resolve.
3. **Include package titles in booking API responses** so booking cards stop
   showing the fallback "Yatra Booking."
4. **Fix post-login booking redirect.** Redirect-store key mismatch
   (`redirectTo` written, `state.from` read) — pick one convention and use it
   in both the store and read sites.
5. **Portal Home booking redirect** — users with existing bookings should
   land on `/portal/bookings` per plan; currently doesn't happen.
6. **Reset Password: verify recovery session on mount** before showing the
   form, and decide deliberately whether it stays outside `GuestRoute` (audit
   flagged this as a deviation — confirm it's intentional or fix it).
7. **Signup flow:** don't navigate straight into the portal if Supabase email
   confirmation would leave the user without a session — check session
   existence post-signup before redirecting.
8. **Fix active public navbar:**
   - Mobile menu button currently does nothing — wire it up.
   - Make it auth-aware (show "My Portal" when logged in).
9. **Contact form:** currently simulated with a fake delay. Wire to a real
   destination — either an Edge Function emailing the ashram, or a Supabase
   table + admin view, whichever matches the plan's original intent.
10. **Client-side seat validation:** re-validate traveler count against
    remaining seats after manual input changes, not just on initial load.

**Exit criteria:** no public or portal page shows fabricated data; all
listed navigation and redirect behaviors work end-to-end manually.

---

## Phase E — Admin UX gaps 🟡

1. Display Aadhaar/selfie image previews in admin user detail and
   verification queue (depends on Phase B.4 signed URLs).
2. Add Role column + numbered pagination to admin users table.
3. Debounce admin user search input (currently fires per keystroke).
4. Replace `window.confirm()` package deactivation with a shadcn
   `AlertDialog`; fix the incorrect "cannot be undone" copy since packages
   are reactivatable.
5. Resolve duplicate deactivate/trash controls down to one.
6. Convert package view from card grid to the specified table (or
   consciously update the plan if card grid is preferred — but pick one and
   note the decision).
7. Add error states to admin queries (currently mostly silent on failure).

---

## Phase F — Cross-cutting polish 🟢

1. Add a shared `useToast`/`useAppToast` hook; replace ad hoc toast calls.
2. Make Home/Yatras use the shared `usePageTitle` hook instead of manual
   `document.title` sets.
3. Add error states to remaining data-driven pages not covered in D/E.
4. Merge the two `EmptyState` implementations into one (should already be
   done in Phase A cleanup — confirm no regressions).
5. De-duplicate profile fetch: `AuthContext` and `/api/users/me` on the
   Profile page currently both fetch — decide on a single source of truth
   (likely: `AuthContext` owns it, Profile reads from context).
6. Fix package-detail query key collision between public (Supabase) and
   admin (backend) sources — namespace the query keys separately so
   TanStack Query cache doesn't cross-contaminate.
7. Add automated tests — at minimum: auth flow, booking creation, payment
   verification, admin verification approval. Even a thin Vitest/Jest +
   Supertest suite on the backend's critical endpoints is worth more here
   than frontend snapshot tests.

---

## Phase G — Deployment (Phase 8 in original plan) 🔴 (blocked until A–C done)

Do not attempt this until Phase A build fixes and Phase B/C integrity fixes
are complete — deploying a backend that doesn't build or a payment path with
an unversioned RPC just moves the problem into production.

1. Add SPA rewrite config for the actual hosting target (`public/_redirects`
   for Netlify, `vercel.json` for Vercel — pick one, the audit found neither).
2. Set explicit `base: '/'` in Vite config.
3. Complete `.env.example` for frontend: add `VITE_API_BASE_URL` and
   `VITE_RAZORPAY_KEY_ID` (both currently missing).
4. Confirm backend `start` script works against a production build (depends
   on Phase A.1).
5. Configure Razorpay webhook URL for the production domain; confirm
   production CORS origin list includes the deployed frontend URL only
   (no wildcard).
6. Deploy, then manually verify: signup → verification → booking → payment
   → webhook → admin dashboard reflects it, end to end, in production.

---

## Suggested order of execution

A → B → C → D → E → F → G

Each phase's exit criteria should be independently checkable before starting
the next — this plan is intentionally more sequential than the original
plan.md's phase numbering, because several "later" phases (7, 8) actually sit
on top of unresolved risk from "earlier" ones (0, 2).
