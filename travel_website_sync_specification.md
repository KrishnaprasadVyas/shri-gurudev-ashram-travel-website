# Travel Website Synchronization Specification

> **Authoritative Target:** Travel Website Repository  
> **Source of Truth:** Shri Gurudev Ashram Mobile & Travel Backend Repository  
> **Target Audience:** AI Code Generation Agent / Engineering Team  
> **Scope:** Strictly Travel Domain (Travel Packages, Travel Bookings, Passenger Management, Identity Verification, Seva Packages, Standalone & Linked Seva, Razorpay Payments, Webhooks, Admin Management, Reports, Exports).  
> **EXCLUSIONS:** All Donation-related functionality (Nityannadan, Donations, Donation Heads, Collectors, Donation Dashboards/APIs/Tables) are strictly excluded and ignored.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Database Synchronization](#2-database-synchronization)
3. [API Synchronization](#3-api-synchronization)
4. [Business Logic Synchronization](#4-business-logic-synchronization)
5. [Travel Booking Flow](#5-travel-booking-flow)
6. [Standalone Seva Flow](#6-standalone-seva-flow)
7. [Payment Flow](#7-payment-flow)
8. [Admin Synchronization](#8-admin-synchronization)
9. [Shared Data Model & Synchronization Behavior](#9-shared-data-model--synchronization-behavior)
10. [UI Requirements](#10-ui-requirements)
11. [Files Responsible](#11-files-responsible)
12. [Implementation Order](#12-implementation-order)
13. [Validation Checklist](#13-validation-checklist)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture
The Shri Gurudev Ashram platform uses a unified, shared PostgreSQL database managed via **Supabase**. The platform operates on a split client architecture:
- **Mobile Application (Expo / React Native)**: End-user mobile app for browsing yatras, creating multi-passenger travel bookings, uploading verification documents, booking standalone/additional sevas, and executing Razorpay native checkout.
- **Travel Backend (Node.js / Express TypeScript)**: RESTful API server executing business logic, transactional database mutations (using `supabaseAdmin` service role key), HMAC Razorpay signature verification, background cron job for seat restoration (`expire_stale_bookings`), and secure static file serving for Aadhaar/selfie verification documents.
- **Travel Website (Next.js / React Web)**: Public web pages for yatra browsing and web booking, along with an **Admin Dashboard** for Ashram staff to manage packages, review passenger identity documents, track bookings, update package dates/inventory, issue refunds/cancellations, and generate reports/exports.

```
┌────────────────────────────────┐       ┌────────────────────────────────┐
│   Mobile App (React Native)    │       │    Travel Website (Next.js)    │
│  - Public Booking Flow         │       │  - Public Web Booking Flow     │
│  - Seva Booking Flow           │       │  - Admin Dashboard & Operations│
└───────────────┬────────────────┘       └───────────────┬────────────────┘
                │                                        │
                │ HTTP REST / Firebase Auth              │ HTTP REST / Firebase Auth
                ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Express Backend API Server                           │
│  - /api/bookings           - /api/payments          - /api/users        │
│  - /api/seva               - /api/admin/seva-packages                   │
│  - /api/webhooks/razorpay  - /api/public/seva-packages                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     │ Supabase Service Role SDK (Bypasses RLS)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL Database                         │
│  - users                   - travel_packages       - bookings           │
│  - booking_passengers      - passenger_documents   - payments           │
│  - seva_packages           - seva_bookings         - razorpay_webhooks  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Booking Architecture
- A **Booking** (`public.bookings`) belongs to a registered `user_id` and a `package_id`.
- Support for **1 to 20 passengers** per booking.
- Passengers are persisted in a separate table `public.booking_passengers` with an explicit `passenger_index` (0 is primary lead passenger).
- Each passenger can have multiple identity documents (`aadhaar_front`, `aadhaar_back`, `selfie`) stored in `public.passenger_documents`.
- **Lead Passenger Verification Inheritance**: If the primary user (`users.verification_status`) is already `verified` or `submitted`, passenger 0 reuses the user's uploaded Aadhaar and selfie documents automatically.

### 1.3 Seva Architecture
- **Dynamic Seva Packages** (`public.seva_packages`): Hardcoded sevas are replaced with database-backed dynamic packages (e.g. `guruji_aarti`, `yajman`, `gau_seva`, `temple_seva`, `event`).
- **Two Modalities of Seva**:
  1. **Additional Seva attached to Yatra**: Devotees can select an optional Seva during Travel Booking creation (e.g., Aarti or Yajman). The backend calculates the additional fee and inserts a linked record into `public.seva_bookings` with `travel_booking_id = booking.id`.
  2. **Standalone Seva Booking**: Devotees book Seva independently for specific dates via `/api/seva`.

### 1.4 Payment Architecture
- **Razorpay Integration**: All monetary transactions use Razorpay.
- **Convenience Fee Structure**:
  - Yatra Travel Bookings add a 2% convenience fee on order creation (`amount = totalAmount + Math.round(totalAmount * 0.02)`). Paise calculation: `Math.round(amount * 100)`.
  - Seva Bookings charge exact total amount without additional convenience fee.
- **Idempotent State Machine**:
  - Payment status transitions: `created` → `captured` (or `failed` / `refunded`).
  - Booking status transitions: `payment_pending` → `paid` (or `cancelled` / `completed`).
  - Double verification safety: Signature verification (`crypto.timingSafeEqual`) AND webhook payload reconciliation (`/api/webhooks/razorpay`) with idempotency ledger (`public.razorpay_webhook_events`).

---

## 2. Database Synchronization

The website database must mirror the exact PostgreSQL schema of the authoritative backend.

### 2.1 Table Specifications

#### Table: `public.users`
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, references `auth.users(id)` | None | User UUID from authentication |
| `email` | `text` | `NULLABLE` | `NULL` | Devotee email address |
| `full_name` | `text` | `NOT NULL` | `''` | Full display name |
| `phone` | `text` | `NOT NULL` | `''` | 10-digit primary phone number |
| `role` | `text` | `NOT NULL` | `'user'` | `'user'`, `'admin'`, `'WEBSITE_ADMIN'`, `'SYSTEM_ADMIN'` |
| `profile_image_url` | `text` | `NULLABLE` | `NULL` | Public avatar image path |
| `push_token` | `text` | `NULLABLE` | `NULL` | Expo push notification token |
| `aadhaar_number` | `text` | `NULLABLE` | `NULL` | 12-digit Aadhaar number |
| `aadhaar_image_path` | `text` | `NULLABLE` | `NULL` | Relative storage path for Aadhaar |
| `selfie_image_path` | `text` | `NULLABLE` | `NULL` | Relative storage path for Selfie |
| `verification_status` | `text` | `NOT NULL`, `CHECK (verification_status IN ('not_submitted', 'submitted', 'verified', 'rejected'))` | `'not_submitted'` | Identity verification lifecycle |
| `created_at` | `timestamptz`| `NOT NULL` | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz`| `NOT NULL` | `now()` | Record update timestamp |
| `deleted_at` | `timestamptz`| `NULLABLE` | `NULL` | Soft delete timestamp |

#### Table: `public.travel_packages`
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Unique package ID |
| `title` | `text` | `NOT NULL` | None | Name of the Yatra package |
| `description` | `text` | `NULLABLE` | `NULL` | Full description |
| `price` | `numeric` | `NOT NULL`, `CHECK (price > 0)` | None | Base package price per traveler |
| `duration` | `text` | `NULLABLE` | `NULL` | Display duration string (e.g. "5 Days / 4 Nights") |
| `remaining_seats` | `integer` | `NOT NULL`, `CHECK (remaining_seats >= 0)` | None | Live available seat inventory |
| `total_seats` | `integer` | `NULLABLE` | `NULL` | Total initial capacity |
| `inclusions` | `jsonb` | `NULLABLE` | `'[]'::jsonb` | Inclusion checklist items |
| `image_url` | `text` | `NULLABLE` | `NULL` | Hero banner image URL |
| `is_active` | `boolean` | `NOT NULL` | `true` | Visibility flag |
| `flight_price` | `numeric` | `NULLABLE` | `0` | Surcharge for Flight transport |
| `train_ac_price` | `numeric` | `NULLABLE` | `0` | Surcharge for AC Train transport |
| `train_non_ac_price` | `numeric` | `NULLABLE` | `0` | Surcharge for Non-AC Train transport |
| `room_ac_price` | `numeric` | `NULLABLE` | `0` | Surcharge for AC Room accommodation |
| `room_non_ac_price` | `numeric` | `NULLABLE` | `0` | Surcharge for Non-AC Room accommodation |
| `start_date` | `date` | `NULLABLE` | `NULL` | Yatra departure date |
| `end_date` | `date` | `NULLABLE` | `NULL` | Yatra return date |
| `created_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |
| `updated_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |

#### Table: `public.bookings`
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Booking ID |
| `booking_reference` | `text` | `NOT NULL, UNIQUE` | None | Human readable ref (`BK1722...`) |
| `user_id` | `uuid` | `NOT NULL`, references `public.users(id)` | None | Lead booking user |
| `package_id` | `uuid` | `NOT NULL`, references `public.travel_packages(id)` | None | Yatra package |
| `status` | `text` | `NOT NULL`, `CHECK (status IN ('payment_pending', 'paid', 'cancelled', 'completed'))` | `'payment_pending'` | Booking lifecycle state |
| `traveler_count` | `integer` | `NOT NULL`, `CHECK (traveler_count BETWEEN 1 AND 20)` | None | Total passenger count |
| `special_notes` | `text` | `NULLABLE` | `NULL` | Custom requests |
| `full_name` | `text` | `NOT NULL` | None | Lead passenger name |
| `phone_number` | `text` | `NOT NULL` | None | Lead passenger primary phone |
| `whatsapp_number` | `text` | `NULLABLE` | `NULL` | WhatsApp contact number |
| `dob` | `timestamptz`| `NULLABLE` | `NULL` | Date of birth |
| `address` | `text` | `NOT NULL` | None | Residential address |
| `transport_type` | `text` | `NOT NULL`, `CHECK (transport_type IN ('Flight', 'Train'))` | None | Main transit mode |
| `bus_type` | `text` | `NULLABLE`, `CHECK (bus_type IN ('AC Train', 'Non-AC Train'))` | `NULL` | Sub-transit type |
| `room_type` | `text` | `NOT NULL`, `CHECK (room_type IN ('AC Room', 'Non-AC Room'))` | None | Accommodation type |
| `base_amount` | `numeric` | `NOT NULL` | None | `baseUnitPrice * travelerCount` |
| `transport_amount` | `numeric` | `NOT NULL` | `0` | `transportAddon * travelerCount` |
| `room_amount` | `numeric` | `NOT NULL` | `0` | `roomAddon * travelerCount` |
| `additional_seva_type` | `text` | `NULLABLE` | `NULL` | `'guruji_aarti'`, `'yajman_pad'`, `'yajman'` |
| `additional_seva_date` | `date` | `NULLABLE` | `NULL` | Scheduled Seva date |
| `additional_seva_amount` | `numeric` | `NULLABLE` | `NULL` | Extra Seva fee |
| `additional_seva_package_id`| `uuid` | `NULLABLE`, references `public.seva_packages(id)` | `NULL` | Ref to dynamic Seva package |
| `total_amount` | `numeric` | `NOT NULL`, `CHECK (total_amount > 0)` | None | Total cost before gateway fee |
| `created_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |
| `updated_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |

#### Table: `public.booking_passengers`
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Passenger record ID |
| `booking_id` | `uuid` | `NOT NULL`, references `public.bookings(id) ON DELETE CASCADE` | None | Parent booking |
| `passenger_index` | `integer` | `NOT NULL` | None | Index in booking (0 to N-1) |
| `is_primary` | `boolean` | `NOT NULL` | `false` | True for passenger_index 0 |
| `full_name` | `text` | `NOT NULL` | None | Passenger full name |
| `dob` | `timestamptz`| `NOT NULL` | None | Date of birth |
| `gender` | `text` | `NOT NULL`, `CHECK (gender IN ('male', 'female', 'other'))` | None | Gender |
| `phone` | `text` | `NOT NULL` | None | Contact phone number |
| `address` | `text` | `NOT NULL` | None | Residential address |
| `aadhaar_number` | `text` | `NOT NULL` | None | 12-digit Aadhaar number |
| `verification_status` | `text` | `NOT NULL`, `CHECK (verification_status IN ('submitted', 'verified', 'rejected'))` | `'submitted'` | Document verification state |
| `created_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |

#### Table: `public.passenger_documents`
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Document ID |
| `passenger_id` | `uuid` | `NOT NULL`, references `public.booking_passengers(id) ON DELETE CASCADE` | None | Target passenger |
| `document_type` | `text` | `NOT NULL`, `CHECK (document_type IN ('aadhaar_front', 'aadhaar_back', 'selfie'))` | None | Identity doc category |
| `file_path` | `text` | `NOT NULL` | None | Server file system storage path |
| `created_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |

#### Table: `public.payments`
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Payment ledger ID |
| `booking_id` | `uuid` | `NOT NULL, UNIQUE`, references `public.bookings(id) ON DELETE CASCADE` | None | Target travel booking |
| `amount` | `numeric` | `NOT NULL` | None | Charged amount (rupees) |
| `payment_method` | `text` | `NOT NULL` | `'razorpay'` | Payment gateway |
| `razorpay_order_id` | `text` | `UNIQUE` | `NULL` | Razorpay Order ID (`order_...`) |
| `razorpay_payment_id`| `text` | `UNIQUE` | `NULL` | Razorpay Payment ID (`pay_...`) |
| `razorpay_signature` | `text` | `NULLABLE` | `NULL` | Signature for verification |
| `gateway_fee` | `numeric` | `NULLABLE` | `NULL` | Calculated convenience fee |
| `status` | `text` | `NOT NULL`, `CHECK (status IN ('created', 'captured', 'failed', 'refunded'))` | `'created'` | Payment transaction state |
| `created_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |
| `updated_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |

#### Table: `public.seva_packages`
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Dynamic package ID |
| `seva_type` | `text` | `NOT NULL, UNIQUE`, `CHECK (seva_type IN ('guruji_aarti', 'yajman', 'gau_seva', 'temple_seva', 'event'))` | None | Unique Seva key |
| `title` | `text` | `NOT NULL` | None | Public Seva title |
| `description` | `text` | `NULLABLE` | `NULL` | Seva detail description |
| `image_url` | `text` | `NULLABLE` | `NULL` | Banner image URL |
| `price` | `numeric` | `NOT NULL`, `CHECK (price >= 0)` | None | Base price for Seva |
| `is_active` | `boolean` | `NOT NULL` | `true` | Master active toggle |
| `booking_enabled` | `boolean` | `NOT NULL` | `true` | Allow bookings toggle |
| `allow_date_selection`| `boolean` | `NOT NULL` | `true` | Requires date picker |
| `max_bookings_per_day`| `integer` | `NULLABLE` | `NULL` | Daily capacity cap |
| `display_order` | `integer` | `NULLABLE` | `0` | Sort order position |
| `color` | `text` | `NULLABLE` | `NULL` | UI badge hex color |
| `icon` | `text` | `NULLABLE` | `NULL` | UI icon identifier |
| `category` | `text` | `NULLABLE` | `NULL` | Grouping tag |
| `available_from` | `date` | `NULLABLE` | `NULL` | Start availability |
| `available_until` | `date` | `NULLABLE` | `NULL` | End availability |
| `created_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |
| `updated_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |
| `deleted_at` | `timestamptz`| `NULLABLE` | `NULL` | Soft deletion timestamp |

#### Table: `public.seva_bookings`
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Seva booking ID |
| `booking_reference` | `text` | `NOT NULL, UNIQUE` | None | Reference code (`SEV-...` / `YAJ-...`) |
| `user_id` | `uuid` | `NOT NULL`, references `public.users(id) ON DELETE CASCADE` | None | Devotee account ID |
| `travel_booking_id` | `uuid` | `NULLABLE`, references `public.bookings(id) ON DELETE SET NULL` | `NULL` | Linked Yatra booking |
| `seva_type` | `text` | `NOT NULL`, `CHECK (seva_type IN ('annadan', 'yajman', 'gau_seva', 'temple_seva', 'special_pooja', 'event'))` | None | Seva category key |
| `seva_package_id` | `uuid` | `NULLABLE`, references `public.seva_packages(id)` | `NULL` | Linked package ID |
| `seva_date` | `date` | `NOT NULL` | None | Performance date |
| `full_name` | `text` | `NOT NULL` | None | Devotee name |
| `phone_number` | `text` | `NOT NULL` | None | Contact number |
| `total_amount` | `numeric` | `NOT NULL`, `CHECK (total_amount > 0)` | None | Total Seva cost |
| `status` | `text` | `NOT NULL`, `CHECK (status IN ('payment_pending', 'paid', 'cancelled'))` | `'payment_pending'` | Seva payment status |
| `razorpay_order_id` | `text` | `UNIQUE` | `NULL` | Razorpay order ID |
| `razorpay_payment_id`| `text` | `UNIQUE` | `NULL` | Razorpay payment ID |
| `razorpay_signature` | `text` | `NULLABLE` | `NULL` | Razorpay HMAC signature |
| `notes` | `text` | `NULLABLE` | `NULL` | Special notes / Sankalp |
| `created_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |
| `updated_at` | `timestamptz`| `NOT NULL` | `now()` | Timestamp |

#### Table: `public.razorpay_webhook_events`
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Event record ID |
| `event_id` | `text` | `NOT NULL, UNIQUE` | None | Razorpay `x-razorpay-event-id` |
| `created_at` | `timestamptz`| `NOT NULL` | `now()` | Received timestamp |

### 2.2 Stored Procedures & Database RPCs

#### 1. `handle_new_user()` (Trigger Function)
Fires on `AFTER INSERT ON auth.users`. Auto-populates `public.users` with default values: `role = 'user'`, `verification_status = 'not_submitted'`.

#### 2. `capture_booking_payment(...)` (Transactional RPC)
```sql
CREATE OR REPLACE FUNCTION public.capture_booking_payment(
  p_booking_id uuid,
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_razorpay_signature text DEFAULT null,
  p_payment_method text DEFAULT 'razorpay',
  p_gateway_fee numeric DEFAULT null
) RETURNS void
```
- Acquires `FOR UPDATE` lock on `bookings` and `payments`.
- Idempotent check: returns early if `payments.status = 'captured'` or `bookings.status = 'paid'`.
- Acquires `FOR UPDATE` lock on `travel_packages`. Verifies `remaining_seats >= traveler_count`.
- Updates `payments`: sets `status = 'captured'`, saves payment ID, signature, fee.
- Updates `travel_packages`: decrements `remaining_seats = remaining_seats - v_booking.traveler_count`.
- Updates `bookings`: sets `status = 'paid'`.

#### 3. `mark_booking_paid_and_decrement_seats(p_booking_id uuid)` (RPC)
Fallback wrapper used by webhooks to mark booking paid and deduct seat inventory atomically.

#### 4. `increment_seats(pid uuid, count integer)` (RPC)
Restores package inventory when a booking is cancelled:
```sql
UPDATE public.travel_packages SET remaining_seats = remaining_seats + count WHERE id = pid;
```

#### 5. `expire_stale_bookings()` (Background RPC)
Executed every 5 minutes by the backend server to release unconfirmed seats for unpaid bookings past expiry window.

---

## 3. API Synchronization

Every endpoint implemented in the authoritative backend must be supported by the Travel Website server/API routes.

### 3.1 Bookings APIs

#### `POST /api/bookings`
- **Auth**: Required (`Bearer <Firebase_JWT>`)
- **Body Payload**:
```json
{
  "packageId": "uuid-string",
  "travelerCount": 2,
  "transportType": "Flight",
  "busType": null,
  "roomType": "AC Room",
  "specialNotes": "Wheelchair assistance needed",
  "additionalSevaPackageId": "uuid-string-or-none",
  "additionalSevaType": "guruji_aarti",
  "additionalSevaDate": "2026-08-15",
  "passengers": [
    {
      "fullName": "Rahul Sharma",
      "phone": "9876543210",
      "dob": "1990-05-12",
      "address": "123 MG Road, Mumbai",
      "gender": "male",
      "aadhaarNumber": "123456789012",
      "aadhaarImagePath": "uploads/verifications/user-id/aadhaar.jpg",
      "selfieImagePath": "uploads/verifications/user-id/selfie.jpg"
    }
  ]
}
```
- **Validation Rules**:
  - `travelerCount` must be an integer between 1 and 20.
  - `passengers` array length MUST exactly equal `travelerCount`.
  - Phone numbers: 10 numeric digits (`/^\d{10}$/`).
  - Aadhaar numbers: 12 numeric digits (`/^\d{12}$/`).
  - `transportType` must be `'Flight'` or `'Train'`.
  - If `transportType === 'Train'`, `busType` must be `'AC Train'` or `'Non-AC Train'`.
  - `roomType` must be `'AC Room'` or `'Non-AC Room'`.
  - If `additionalSevaDate` is provided, it must be inside `[travelPackage.start_date, travelPackage.end_date]`.
- **Response (201 Created)**:
```json
{
  "booking": {
    "id": "uuid",
    "booking_reference": "BK172200112233",
    "total_amount": 72100,
    "status": "payment_pending"
  }
}
```

#### `GET /api/bookings`
- **Auth**: Required
- **Returns**: Array of user bookings joined with travel package details and linked seva bookings.

#### `GET /api/bookings/:bookingId`
- **Auth**: Required (Owner or Admin)
- **Returns**: Full booking details, passenger list, documents, pricing breakdown object (`baseAmount`, `transportAmount`, `roomAmount`, `sevaAmount`, `totalAmount`), and linked Seva.

#### `POST /api/bookings/:bookingId/cancel`
- **Auth**: Required (Owner or Admin)
- **Rules**: Allows cancellation if status is in `['payment_pending', 'verification_pending', 'pending', 'confirmed', 'paid']`. Calls `increment_seats` RPC to restore inventory.

---

### 3.2 Payment APIs

#### `POST /api/payments/create-order`
- **Auth**: Required
- **Body**: `{ "bookingId": "uuid" }`
- **Business Logic**:
  - Checks if booking status is `'payment_pending'`.
  - Calculates amount: `baseAmount = booking.total_amount`, `convenienceFee = Math.round(baseAmount * 0.02)`, `amount = baseAmount + convenienceFee`.
  - Amount in paise: `Math.round(amount * 100)`.
  - Reuses active created Razorpay order if already exists in `payments` table.
  - Otherwise creates Razorpay Order via Node SDK with `receipt: booking.booking_reference`.
- **Response**: `{ "order": { "id": "order_xxx", "amount": 7354200, "currency": "INR" }, "booking": {...} }`

#### `POST /api/payments/verify`
- **Auth**: Required
- **Body**: `{ "bookingId": "uuid", "razorpay_order_id": "order_xxx", "razorpay_payment_id": "pay_yyy", "razorpay_signature": "zzz" }`
- **Validation**: Verifies HMAC SHA-256 signature using `RAZORPAY_KEY_SECRET`. Checks for duplicate payment ID in database (`409 Conflict`). Executes `capture_booking_payment` RPC.

#### `POST /api/payments/create-seva-order` & `POST /api/payments/verify-seva`
- Handles Razorpay order creation and HMAC verification for standalone Seva bookings in `public.seva_bookings`.

#### `POST /api/webhooks/razorpay`
- **Auth**: Signature header `x-razorpay-signature` validated with `RAZORPAY_WEBHOOK_SECRET`.
- **Payload**: Raw JSON buffer. Idempotency enforced via `public.razorpay_webhook_events`. Handles `payment.captured` and `payment.failed`.

---

### 3.3 Seva APIs

#### `POST /api/seva`
- **Auth**: Required
- **Body**: `{ "sevaPackageId": "uuid", "sevaDate": "YYYY-MM-DD", "fullName": "Devotee Name", "phoneNumber": "9876543210", "notes": "Sankalp notes" }`
- **Business Logic**: Verifies package is active and `booking_enabled`. Generates reference (`SEV-XXXXXX` / `YAJ-XXXXXX`). Inserts into `public.seva_bookings`.

#### `GET /api/seva/availability?type=yajman&month=YYYY-MM`
- **Auth**: Public / Optional
- **Returns**: Day-by-day availability map for target month against configured capacity (`SEVA_CAPACITY_YAJMAN` or default 50/day).

#### `GET /api/public/seva-packages` & `GET /api/admin/seva-packages`
- Public & Admin endpoints for listing, creating, updating (`PUT /:id`), toggling status (`PUT /:id/status`), and soft-deleting (`DELETE /:id`) dynamic Seva packages.

---

### 3.4 User & Identity Verification APIs

#### `POST /api/users/upload-aadhaar`, `/upload-aadhaar-back`, `/upload-selfie`, `/upload-profile-image`
- Multer file upload endpoints storing images under `uploads/verifications/:userId/` and returning file paths.

#### `POST /api/users/verification/submit`
- **Auth**: Required
- **Body**: `{ "aadhaarNumber": "123456789012", "aadhaarImagePath": "path", "selfieImagePath": "path" }`
- **Rules**: Updates user profile `verification_status = 'submitted'`.

#### `GET /api/users/admin/verifications`
- **Auth**: Admin Required
- **Query**: `?status=submitted` (or `verified`, `rejected`). Returns list of user verification submissions with image paths.

#### `POST /api/users/admin/verifications/:targetUserId/review`
- **Auth**: Admin Required
- **Body**: `{ "action": "approve" | "reject", "notes": "Optional reason" }`
- **Rules**: Updates target user `verification_status` to `'verified'` or `'rejected'`. Sends push notification.

---

## 4. Business Logic Synchronization

### 4.1 Yatra Dynamic Pricing Matrix
Total booking amount MUST be computed using this exact formula:
```
packageUnitPrice = baseUnitPrice + transportAddon + roomAddon
additionalSevaPrice = sevaPackage.price (or 2100 for Aarti / 5100 for Yajman)
totalAmount = (packageUnitPrice * travelerCount) + additionalSevaPrice
```
- **Transport Addons**:
  - `Flight`: `travelPackage.flight_price`
  - `Train` + `AC Train`: `travelPackage.train_ac_price`
  - `Train` + `Non-AC Train`: `travelPackage.train_non_ac_price`
- **Room Addons**:
  - `AC Room`: `travelPackage.room_ac_price`
  - `Non-AC Room`: `travelPackage.room_non_ac_price`

### 4.2 Seat Reservation & Expiry
- When a booking is created, it is assigned `status = 'payment_pending'`.
- The user has a 15-minute window to complete Razorpay payment.
- If unpaid, background RPC `expire_stale_bookings` frees the seat inventory and marks status `'cancelled'`.
- When payment is captured, `remaining_seats` is decremented in `travel_packages`.

---

## 5. Travel Booking Flow

```
[Browse Yatra Package] ──> Select Flight/Train & AC/Non-AC Room
          │
          ▼
[Passenger Form] ──> Enter 1 to 20 passenger details & Aadhaar numbers
          │
          ▼
[Document Upload] ──> Upload Aadhaar Front/Back & Selfie image for each passenger
          │           (Primary passenger reuses verified profile docs automatically)
          ▼
[Additional Seva Selection] ──> (Optional) Add Guruji Aarti / Yajman Seva & pick Seva date
          │
          ▼
[Order Creation] ──> POST /api/payments/create-order (Includes 2% convenience fee)
          │
          ▼
[Razorpay Payment Modal] ──> Complete payment via UPI / Card / Netbanking
          │
          ▼
[HMAC Verification & Webhook Sync] ──> Atomic seat decrement & status set to 'paid'
          │
          ▼
[Booking Confirmation & Travel Pass] ──> Issue Booking Reference & Receipt
```

---

## 6. Standalone Seva Flow

```
[Select Seva Category] (Guruji Aarti / Yajman / Gau Seva / Temple Seva)
          │
          ▼
[Date Selection] ──> Pick available date checked against monthly capacity API
          │
          ▼
[Devotee Details & Sankalp] ──> Fill Full Name, Phone Number, Special Notes
          │
          ▼
[Razorpay Order Creation] ──> POST /api/payments/create-seva-order
          │
          ▼
[Payment & Verification] ──> POST /api/payments/verify-seva
          │
          ▼
[Seva Confirmation & Digital Receipt]
```

---

## 7. Payment Flow & Duplicate Protection

1. **Client Order Request**: Client calls `POST /api/payments/create-order`.
2. **Order Reuse**: If a payment row exists with status `'created'` and a valid `razorpay_order_id`, the backend returns the existing order ID (prevents duplicate Razorpay order spam).
3. **HMAC Signature Check**:
   ```typescript
   const expectedSignature = crypto
     .createHmac('sha256', razorpayKeySecret)
     .update(`${orderId}|${paymentId}`)
     .digest('hex');
   ```
4. **Idempotency Guard**:
   - `payments.razorpay_payment_id` is defined with a `UNIQUE` SQL index.
   - If `verifyPayment` receives a payment ID already registered in the DB, it throws `409 Conflict`.
5. **Webhook Deduplication**: Webhook handler logs `event_id` in `public.razorpay_webhook_events`. If duplicate `event_id` is received (SQL error code `23505`), it immediately returns `{ received: true, duplicate: true }`.

---

## 8. Admin Synchronization

The website Admin Panel must provide comprehensive interfaces for:

### 8.1 Travel Package Management
- Create, Edit, Activate/Deactivate Yatra packages.
- Set departure/return dates (`start_date`, `end_date`).
- Configure price surcharges (`flight_price`, `train_ac_price`, `train_non_ac_price`, `room_ac_price`, `room_non_ac_price`).
- Manage live inventory (`remaining_seats`, `total_seats`).

### 8.2 Seva Package Management
- Dynamic management of Seva catalog (`/api/admin/seva-packages`).
- Configure pricing, daily max capacity, date-selection toggles, display order, colors, and banner images.

### 8.3 Booking Management & Search
- Master table of all Yatra bookings created across Mobile App and Web.
- Filter by status (`payment_pending`, `paid`, `cancelled`, `completed`), date range, package, or transport type.
- Full-text search by lead passenger name, phone number, or booking reference (`BK...`).

### 8.4 Passenger Identity Verification Workbench
- Dedicated Admin review interface (`/api/users/admin/verifications`).
- Side-by-side view of devotee's entered Aadhaar details vs. uploaded Aadhaar Front/Back document and live Selfie.
- Actions: **Approve** (sets user `verification_status = 'verified'`) or **Reject** (sets status = `'rejected'` with reason notes).

### 8.5 Export & Reports
- **CSV / Excel Exports**: Export passenger manifests per yatra (listing room choices, transit types, passenger age, gender, Aadhaar, verified status).
- **Financial Reports**: Total collection breakdowns by package, convenience fee totals, Razorpay payment IDs, and refund logs.

---

## 9. Shared Data Model & Synchronization Behavior

- **Single Database Instance**: Both the Mobile App and the Website communicate with the exact same Supabase database instance.
- **Real-Time Visibility**: Any booking submitted on the mobile app is immediately readable by the Website Admin Panel without manual syncing.
- **Bi-Directional Status Updates**:
  - When an Admin approves a user's Aadhaar verification on the Website Admin Panel, the mobile app receives a push notification and updates user verification badge to `verified`.
  - When an Admin updates Yatra seat availability or deactivates a package on the website, the mobile app immediately sees updated seat counts or deactivated state.
  - When a booking is cancelled by an Admin, seat inventory is atomically incremented, reflecting on both mobile app and web booking forms.

---

## 10. UI Requirements for Travel Website

The Travel Website must implement the following responsive pages, forms, and dialogs:

### 10.1 Public Pages
1. **Yatra Catalog Page**: Grid of active Yatra packages with hero imagery, departure dates, duration, remaining seat badges, and pricing starting from base amount.
2. **Package Detail & Cost Calculator Page**: Interactive options (Flight vs Train, AC vs Non-AC, Room choices) with live dynamic price updates.
3. **Multi-Passenger Web Booking Form**: Multi-step stepper (Package Details → Passengers 1..N info → Aadhaar/Selfie file uploader → Additional Seva selection → Summary).
4. **Checkout & Razorpay Modal Container**: Integrated Razorpay web checkout SDK container with failure recovery and loading state.
5. **Booking Success & Travel Pass Page**: Summary receipt with printable passenger pass, booking reference, and QR/barcode.
6. **Standalone Seva Page**: Dynamic Seva catalog, interactive month calendar date picker displaying remaining daily slots, and Sankalp form.

### 10.2 Admin Dashboard Pages
1. **Overview Analytics Dashboard**: Summary cards for Total Yatra Revenue, Active Yatras, Total Travelers, Pending Verifications, and Quick Actions.
2. **Yatra Management Workbench**: Datatable of packages, seat progress bars, date editors, and pricing modal.
3. **Seva Package Management Page**: CRUD interface for dynamic Seva catalog.
4. **All Bookings Datatable**: Filterable table with drawer for viewing passenger lists, transit choices, pricing breakdown, and manual status override buttons.
5. **Passenger Verification Queue**: Inspection drawer displaying side-by-side image viewer (Aadhaar vs Selfie) with Zoom/Rotate controls, Approve/Reject modals, and note input.
6. **Reports & Exports Hub**: Date-range pickers and export triggers for Yatra Passenger Manifests (CSV) and Financial Ledgers.

---

## 11. Files Responsible

### Backend API Server
- `backend/src/app.ts`: Server initialization, rate limiters, route mounting.
- `backend/src/routes/bookings.ts`: Booking creation, passenger batch insert, document handling, pricing calculation, cancellation.
- `backend/src/routes/payments.ts`: Order creation with 2% fee, HMAC verification, Seva order creation.
- `backend/src/routes/razorpayWebhook.ts`: Webhook handler, idempotency checks.
- `backend/src/routes/seva.ts`: Standalone Seva booking, monthly date availability engine.
- `backend/src/routes/sevaPackagesAdmin.ts` & `sevaPackagesPublic.ts`: Dynamic Seva package CRUD.
- `backend/src/routes/users.ts`: User profile, verification document uploader, document static server, admin review.

### Database Migrations
- `supabase/migrations/20260529000000_auto_create_user_profiles.sql`
- `supabase/migrations/20260602000000_razorpay_payments.sql`
- `supabase/migrations/20260604000000_user_verification_and_bookings.sql`
- `supabase/migrations/20260617000000_add_deleted_at_to_users.sql`
- `supabase/migrations/20260617000100_add_dates_to_travel_packages.sql`
- `supabase/migrations/20260628000000_seva_bookings.sql`
- `supabase/migrations/20260728000000_increment_seats.sql`
- `supabase/migrations/20260729000000_seva_packages.sql`

---

## 12. Implementation Order

To execute the synchronization cleanly in the Travel Website repository, follow this ordered 6-step migration plan:

```
Step 1: Database Migration ──> Step 2: Shared Types & Core API Clients
                                              │
Step 4: Booking & Payment Engines <── Step 3: User Verification Module
          │
          ▼
Step 5: Admin Panel & Verification Workbench ──> Step 6: Reports, Exports & Final Audit
```

1. **Step 1: Database Schema Alignment**
   - Apply SQL migrations to ensure `users`, `travel_packages`, `bookings`, `booking_passengers`, `passenger_documents`, `payments`, `seva_packages`, `seva_bookings`, and `razorpay_webhook_events` match the exact authoritative schema.
   - Deploy RPC functions (`capture_booking_payment`, `increment_seats`, `expire_stale_bookings`).

2. **Step 2: Shared Types & Core API Clients**
   - Generate TypeScript definitions from Supabase database schema (`database.types.ts`).
   - Implement `TravelPackage`, `Booking`, `Passenger`, `SevaPackage`, `SevaBooking`, and `Payment` DTO interfaces.

3. **Step 3: User Verification Module**
   - Implement document upload API handlers and static file serving with path traversal security (`path.resolve`).
   - Implement `/api/users/verification/submit`.

4. **Step 4: Booking & Payment Engines**
   - Implement `POST /api/bookings` with multi-passenger validation, lead passenger verification inheritance, and dynamic pricing breakdown calculation.
   - Implement Razorpay order creation (`POST /api/payments/create-order`) with 2% convenience fee calculation.
   - Implement payment verification (`POST /api/payments/verify`) and webhook route (`/api/webhooks/razorpay`).

5. **Step 5: Admin Panel & Verification Workbench**
   - Build Admin Yatra Package and Seva Package CRUD interface.
   - Build Master Bookings Datatable with detailed passenger modal.
   - Build Passenger Verification Review queue with document image viewer and Approve/Reject endpoints.

6. **Step 6: Reports, Exports & Verification Audit**
   - Implement CSV exporter for Yatra Passenger Manifests.
   - Conduct end-to-end testing against payment webhooks, seat decrementing, and mobile app data synchronization.

---

## 13. Validation Checklist

Use this final checklist to verify 100% synchronization compliance:

- [ ] **Database Schema Matches**: All 9 tables, columns, indexes, check constraints, foreign keys, triggers, and RPC functions exist in PostgreSQL database.
- [ ] **Dynamic Pricing Calculation Matches**: Yatra base price + transit surcharge + room surcharge + additional Seva fee matches exact authoritative formula.
- [ ] **Convenience Fee Matches**: 2% convenience fee added to Razorpay order creation for Yatra bookings.
- [ ] **Razorpay HMAC Verification**: Order ID + Payment ID signature verification implemented using timing-safe comparison.
- [ ] **Webhook Idempotency**: `razorpay_webhook_events` prevents double processing of Razorpay webhook payloads.
- [ ] **Seat Management**: Seats locked during payment pending state, decremented on capture, and incremented on cancellation via `increment_seats` RPC.
- [ ] **Lead Passenger Inheritance**: Primary passenger 0 reuses lead user profile identity documents if already submitted/verified.
- [ ] **Admin Verification Queue**: Admin can view passenger Aadhaar/Selfie documents and approve/reject verification status.
- [ ] **App Data Manageability**: Yatra bookings created on Mobile App appear instantly in Website Admin datatable and are fully manageable.
- [ ] **Manifest & Financial Exports**: Admin can export complete CSV manifest with passenger transit and room details.
- [ ] **Zero Donation Pollution**: NO donation, Nityannadan, collector, or donation report code/tables/APIs included in synchronization.
