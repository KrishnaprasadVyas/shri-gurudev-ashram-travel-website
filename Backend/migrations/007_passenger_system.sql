-- Migration: 007_passenger_system.sql
-- Description: Normalised passenger identity and notification infrastructure.
--   1. Extends the bookings.status check constraint to include the full lifecycle dynamically.
--   2. Adds new booking-level columns: emergency contact, fee columns, expires_at (skips booking_reference as it exists).
--   3. Creates booking_passengers table (one row per traveller per booking).
--   4. Creates passenger_documents table (aadhaar_front, aadhaar_back, selfie per passenger).
--   5. Alters existing notifications table to add metadata column and feed index.
--
-- Run this migration in the Supabase SQL Editor BEFORE deploying backend Phase 2 changes.
-- Safe to run on an existing database.

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Extend bookings table
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a. Dynamically drop the existing booking status check constraints, regardless of their names.
DO $$
DECLARE
  v_rec record;
BEGIN
  FOR v_rec IN 
    SELECT con.conname 
    FROM pg_constraint con
    JOIN pg_attribute attr ON attr.attrelid = con.conrelid AND attr.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'public.bookings'::regclass
      AND con.contype = 'c'
      AND attr.attname = 'status'
  LOOP
    EXECUTE 'ALTER TABLE public.bookings DROP CONSTRAINT ' || quote_ident(v_rec.conname);
  END LOOP;
END $$;

-- Add the new expanded lifecycle constraint.
-- Old values (payment_pending, paid, cancelled, completed) are preserved in the new set.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'draft',               -- Booking created; traveller count not yet confirmed
    'documents_pending',   -- Travellers entered; documents not yet fully uploaded
    'payment_pending',     -- All docs uploaded & submitted; awaiting payment
    'paid',                -- Razorpay payment captured (transitional)
    'verification_pending',-- Admin reviewing passenger documents
    'verified',            -- All passengers approved by admin
    'ticket_generated',    -- Tickets issued to travellers
    'completed',           -- Yatra completed
    'cancelled',           -- Cancelled (by user, admin, or expiry)
    'refunded'             -- Payment refunded by admin
  ));

-- 1b. Add booking-level columns (omitting booking_reference as it already exists).
--     All nullable so existing rows are not broken.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS emergency_contact_name         TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone        TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
  ADD COLUMN IF NOT EXISTS base_amount                    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gateway_fee                    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payable_amount                 NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS expires_at                     TIMESTAMPTZ;

-- Index on expires_at to make the expiry cleanup query efficient.
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at
  ON public.bookings (expires_at)
  WHERE status IN ('draft', 'documents_pending', 'payment_pending');

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: booking_passengers
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.booking_passengers (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  -- Ordering & identity within the booking
  passenger_index     SMALLINT    NOT NULL,          -- 0-based; primary traveller is typically 0
  is_primary          BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Personal information
  full_name           TEXT        NOT NULL,
  gender              TEXT        NOT NULL
                      CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  dob                 DATE        NOT NULL,
  phone               TEXT        NOT NULL,
  address             TEXT        NOT NULL,
  aadhaar_number      TEXT        NOT NULL,

  -- Admin verification state
  verification_status TEXT        NOT NULL DEFAULT 'pending'
                      CHECK (verification_status IN (
                        'pending',    -- Documents not yet submitted
                        'submitted',  -- Documents uploaded; awaiting admin review
                        'verified',   -- Admin approved
                        'rejected'    -- Admin rejected; re-submission required
                      )),
  -- Required when verification_status = 'rejected'; optional otherwise.
  admin_notes         TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce unique index and ordinal per booking
  UNIQUE (booking_id, passenger_index)
);

-- Enforce exactly one primary passenger per booking at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS uidx_one_primary_per_booking
  ON public.booking_passengers (booking_id)
  WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking_id
  ON public.booking_passengers (booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_passengers_verification_status
  ON public.booking_passengers (verification_status);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: passenger_documents
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.passenger_documents (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id   UUID        NOT NULL REFERENCES public.booking_passengers(id) ON DELETE CASCADE,

  -- Each passenger requires exactly three documents.
  document_type  TEXT        NOT NULL
                 CHECK (document_type IN (
                   'aadhaar_front',  -- Front face of the Aadhaar card
                   'aadhaar_back',   -- Rear face of the Aadhaar card
                   'selfie'          -- Live selfie photograph
                 )),

  -- Relative path on the server filesystem:
  -- uploads/bookings/<bookingId>/<passengerId>/<document_type>-<timestamp>.<ext>
  file_path      TEXT        NOT NULL,

  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one document of each type per passenger.
  UNIQUE (passenger_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_passenger_documents_passenger_id
  ON public.passenger_documents (passenger_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: notifications
-- ─────────────────────────────────────────────────────────────────────────────

-- The notifications table already exists. Alter it to add missing columns.
-- We keep is_read as is.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Optimised for the user notification feed query (unread first, then by time).
CREATE INDEX IF NOT EXISTS idx_notifications_user_feed
  ON public.notifications (user_id, is_read, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: Grants
-- ─────────────────────────────────────────────────────────────────────────────

-- The backend uses the service_role key which bypasses RLS.
-- These grants ensure the service role can operate on the tables
-- if RLS is later tightened or direct queries are used.
GRANT ALL ON public.booking_passengers   TO service_role;
GRANT ALL ON public.passenger_documents  TO service_role;
GRANT ALL ON public.notifications        TO service_role;
