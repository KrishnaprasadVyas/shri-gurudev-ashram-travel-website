# Security Verification & Hardening Report

**Project**: MAVT.IN / Maa Vaishnavi Tourism  
**Specification**: `MAVT_Detailed_Developer_Requirement_V2.pdf`  
**Evaluation Date**: 2026-09-15  
**Verification Method**: Multi-Threaded Concurrency, HTTP Supertest Integration, Cryptographic Assertions

---

## 1. Granular Role-Based Access Control (RBAC) Matrix

Server-side authorization is enforced at the route level via Express middleware in [`Backend/src/middleware/rbac.ts`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/src/middleware/rbac.ts). Bypassing the UI by issuing direct API requests was verified in [`Backend/tests/integration/rbacMatrix.test.ts`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/tests/integration/rbacMatrix.test.ts).

### Server-Side Authorization Test Results

| Sensitive Area / Endpoint | `super_admin` | `booking_staff` | `payment_staff` | `train_ticket_staff` | `room_staff` | Unauthenticated |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Settings** (`/api/admin/settings`) | **200 OK** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **401 Unauthorized** |
| **Record Offline Payment** (`/api/payments/record-offline`)| **201 Created** | **403 Forbidden** | **201 Created** | **403 Forbidden** | **403 Forbidden** | **401 Unauthorized** |
| **Correct UTR** (`/api/payments/:id/utr`) | **200 OK** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **401 Unauthorized** |
| **Train Ticket Upload** (`/api/train-tickets/upload`) | **201 Created** | **403 Forbidden** | **403 Forbidden** | **201 Created** | **403 Forbidden** | **401 Unauthorized** |
| **Train Ticket Export** (`/api/train-journeys/export/excel`) | **200 OK** | **403 Forbidden** | **403 Forbidden** | **200 OK** | **403 Forbidden** | **401 Unauthorized** |
| **Room Inventory & Creation** (`/api/rooms`) | **201 Created** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **201 Created** | **401 Unauthorized** |
| **Room Allocation** (`/api/rooms/allocate`) | **201 Created** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **201 Created** | **401 Unauthorized** |
| **Admin Collection Cards** (`/api/admin/collections`) | **200 OK** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **401 Unauthorized** |
| **View Audit Logs** (`/api/admin/audit-logs`) | **200 OK** | **200 OK** | **200 OK** | **200 OK** | **200 OK** | **401 Unauthorized** |
| **Delete / Alter Audit Logs** (`/api/admin/audit-logs/*`) | **405 Blocked** | **405 Blocked** | **405 Blocked** | **405 Blocked** | **405 Blocked** | **401 Unauthorized** |

---

## 2. Payment Security & Financial Integrity

Verified in [`Backend/tests/integration/paymentSecurity.test.ts`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/tests/integration/paymentSecurity.test.ts):

### 2.1 Duplicate UTR Prevention (Exact & Normalized)
- **Exact Duplicate Rejection**: Submitting an existing UTR (`HDFC0012345678`) immediately returned `HTTP 409 Conflict`.
- **Whitespace & Case Normalization**: Submitting `   hdfc0012345678   ` (lowercase with leading/trailing whitespace) was normalized by `sanitizeUtr()` to `HDFC0012345678` and rejected with `HTTP 409 Conflict`.
- **Database Engine Enforcement**: SQLite and PostgreSQL enforce uniqueness on `LOWER(TRIM(utr_number))`.

### 2.2 Multi-Threaded Duplicate UTR Race Condition
- **Test Methodology**: 20 simultaneous, parallel HTTP requests were fired with identical UTR numbers.
- **Observed Result**: Exactly **1 request succeeded with 201 Created**; the remaining **19 requests were rejected with 409 Conflict**. Zero double-crediting occurred.

### 2.3 Super Admin UTR Correction Privilege
- **Access Control**: Only `super_admin` can execute `PATCH /api/payments/:id/utr`. Calls by `payment_staff` or `booking_staff` return `403 Forbidden`.
- **Audit Logging**: Every UTR correction writes an immutable record to `audit_logs` storing `actor_id`, `old_values: { utr_number: oldUtr }`, `new_values: { utr_number: newUtr }`, and the mandatory reason.

### 2.4 Razorpay HMAC-SHA256 Webhook Verification & Idempotency
- **Signature Verification**: Valid signatures succeed (`200 OK`); invalid signatures return `400 Bad Request` (`Invalid Razorpay webhook signature`).
- **Webhook Idempotency**: Delivering the identical webhook payload with the same `x-razorpay-event-id` twice returned `{ received: true, duplicate: true }` on the second attempt, preventing duplicate financial reconciliation.

---

## 3. Customer My Trip IDOR & Direct URL Hardening

Verified in [`Backend/tests/integration/customerMyTripSecurity.test.ts`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/tests/integration/customerMyTripSecurity.test.ts):

### 3.1 Dual Mobile Number Authentication
- Devotees can look up dossiers using `Booking Code + Lead Mobile` OR `Booking Code + Accompanying Passenger Mobile`.
- Supplying an invalid mobile or a mobile belonging to another customer returns `403 Forbidden` (`The provided mobile number does not match this booking`).
- Supplying a non-existent Booking ID returns `404 Not Found`.

### 3.2 Insecure Direct Object Reference (IDOR) Hardening
- Direct dossier access requires an HMAC-SHA256 signed session token (`${bookingId}.${mobile}.${expiresAt}.${signature}`).
- **Token Tampering Rejection**: Altering any portion of the token string returns `403 Invalid or expired session token`.
- **Cross-Customer Isolation**: Token issued to Customer A (`Sharma Mandal`) cannot be used to retrieve data belonging to Customer B (`Verma Parivar`).

### 3.3 Sensitive Identification Data Masking
- The public dossier endpoint (`GET /api/my-trip/dossier`) completely omits sensitive government ID numbers (`aadhaar_number`, `id_proof_number`).
- Only authorized staff viewing admin passenger manifests can access full document records.

---

## 4. Ticket PDF Pipeline & Private Storage

Verified in [`Backend/tests/integration/ticketPdfPipeline.test.ts`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/tests/integration/ticketPdfPipeline.test.ts):

### 4.1 Private Storage Enforcement
- Uploaded ticket PDFs are stored in `Backend/uploads/tickets/`, strictly outside the public web root.
- Unauthenticated requests to `/api/train-tickets/:id/download` return `403 Forbidden`.

### 4.2 Timed HMAC Streaming Tokens
- Downloading a ticket PDF requires an HMAC-signed token generated via `generateTicketDownloadToken(ticketId, expiresInSec)`.
- Tokens expire automatically after the configured duration (default: 3600 seconds).

### 4.3 Multipart Validation
- Non-PDF uploads (e.g. `.txt`, `.exe`, `.png`) are rejected by the Multer `fileFilter` middleware.
- Maximum file size is strictly capped at 15MB.

---

## 5. Room Capacity & Allocation Integrity

Verified in [`Backend/tests/integration/roomManagement.test.ts`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/tests/integration/roomManagement.test.ts):

### 5.1 Hard Capacity Limit
- Attempting to allocate more devotees than a room's configured `capacity` immediately returns `409 Conflict` (`Room capacity exceeded`).
- In a concurrent race condition with two simultaneous requests claiming the final bed in a room with capacity 1, exactly 1 succeeds (201) and 1 fails (409).

### 5.2 Maintenance Blocking & Duplicate Protection
- Rooms marked with status `maintenance` cannot be allocated (`400 Bad Request`).
- A devotee already allocated to an active room cannot be assigned to a second room simultaneously without explicit deallocation or room transfer (`409 Duplicate allocation`).

### 5.3 Old Room / New Room Audit Logging
- Room transfers (`POST /api/rooms/change`) log both old and new room numbers in `audit_logs`.

---

## 6. Audit Trail Immutability

Verified in [`Backend/tests/integration/auditLogIntegrity.test.ts`](file:///c:/Project/shri-gurudev-ashram-travel/Backend/tests/integration/auditLogIntegrity.test.ts):

- All core lifecycle actions (`BOOKING_CREATE`, `GROUP_CREATE`, `PAYMENT_RECORD_OFFLINE`, `UTR_CORRECTION`, `TICKET_PDF_UPLOAD`, `ROOM_ALLOCATE`, `ROOM_CHANGE`) write immutable audit entries.
- Attempts by any user (including super admins) to call `DELETE`, `PUT`, or `PATCH` on `/api/admin/audit-logs/*` are intercepted by middleware and return `405 Method Not Allowed: Audit logs are immutable records and cannot be modified or deleted`.
