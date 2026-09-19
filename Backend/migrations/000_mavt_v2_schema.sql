-- ============================================================================
-- MAVT.IN / MAA VAISHNAVI TOURISM - V2 CONSOLIDATED CLEAN-SLATE SCHEMA
-- Migration: 000_mavt_v2_schema.sql
-- Specification: MAVT_Detailed_Developer_Requirement_V2.pdf
-- Centralized Flow: Group -> Booking -> Passenger -> Payment -> Train -> PDF -> Room -> Reports
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. USERS & STAFF ROLES ───────────────────────────────────────────────────
-- Roles: 'super_admin', 'booking_staff', 'payment_staff', 'train_ticket_staff', 'room_staff', 'user'
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name           TEXT NOT NULL,
  phone               TEXT UNIQUE NOT NULL,
  email               TEXT,
  role                TEXT NOT NULL DEFAULT 'user'
                      CHECK (role IN ('super_admin', 'booking_staff', 'payment_staff', 'train_ticket_staff', 'room_staff', 'admin', 'user')),
  verification_status TEXT NOT NULL DEFAULT 'not_submitted',
  aadhaar_number      TEXT,
  profile_image_url   TEXT,
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ── 2. GROUPS (GRP-0001) ─────────────────────────────────────────────────────
-- Represents travel / room-sharing party. Multiple bookings can link to a single group.
CREATE TABLE IF NOT EXISTS public.groups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code          TEXT UNIQUE NOT NULL, -- e.g. GRP-0001
  name                TEXT NOT NULL,        -- e.g. 'Sharma Family'
  lead_mobile         TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_code ON public.groups(group_code);

-- ── 3. TRAVEL PACKAGES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.travel_packages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  price               NUMERIC(10,2) NOT NULL DEFAULT 0,
  train_ac_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  train_non_ac_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  room_ac_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  room_non_ac_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  start_date          DATE,
  end_date            DATE,
  duration            TEXT,
  total_seats         INT NOT NULL DEFAULT 100,
  remaining_seats     INT NOT NULL DEFAULT 100,
  image_url           TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. BOOKINGS (MVT-YYMMDD-XXXX) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  booking_code        TEXT UNIQUE NOT NULL, -- e.g. MVT-270427-0001
  booking_reference   TEXT,                 -- legacy alias for booking_code
  user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  package_id          UUID NOT NULL REFERENCES public.travel_packages(id) ON DELETE RESTRICT,
  
  -- Statuses are completely independent (Req #6 & #8)
  booking_status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (booking_status IN ('enquiry', 'pending', 'confirmed', 'cancelled')),
  payment_status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'partially_paid', 'fully_paid', 'failed', 'refunded')),
  status              TEXT NOT NULL DEFAULT 'payment_pending', -- legacy compatibility
  
  -- Financials
  total_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_paid          NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_balance     NUMERIC(12,2) NOT NULL DEFAULT 0,
  traveler_count      INT NOT NULL DEFAULT 1,
  
  -- Customer details
  lead_passenger_name TEXT NOT NULL,
  full_name           TEXT, -- legacy alias
  mobile              TEXT NOT NULL,
  phone_number        TEXT, -- legacy alias
  whatsapp_number     TEXT, -- Record only
  email               TEXT,
  address             TEXT,
  city                TEXT,
  district            TEXT,
  state               TEXT,
  pin                 TEXT,
  
  -- Journey & Service details (Section 18 & 3)
  booking_channel     TEXT NOT NULL DEFAULT 'Customer-Web'
                      CHECK (booking_channel IN ('Customer-Web', 'Customer-App', 'Admin-Panel')),
  service_option      TEXT NOT NULL DEFAULT 'yatra_room_train'
                      CHECK (service_option IN ('yatra_room_train', 'yatra_room_train_self', 'only_room', 'other')),
  train_arrangement   TEXT NOT NULL DEFAULT 'tourism_arranged'
                      CHECK (train_arrangement IN ('tourism_arranged', 'customer_self_arranged', 'none')),
  hotel_name          TEXT,
  check_in_date       DATE,
  check_out_date      DATE,
  room_rent           NUMERIC(12,2) DEFAULT 0,
  room_type_requested TEXT,
  boarding_station    TEXT,
  destination_station TEXT,
  going_date          DATE,
  return_date         DATE,
  
  notes               TEXT,
  admin_notes         TEXT,
  special_notes       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_group_id ON public.bookings(group_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mobile ON public.bookings(mobile);
CREATE INDEX IF NOT EXISTS idx_bookings_statuses ON public.bookings(booking_status, payment_status);

-- ── 5. PASSENGERS (P-000001) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.passengers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  group_id            UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  passenger_code      TEXT UNIQUE NOT NULL, -- e.g. P-000001
  passenger_index     INT NOT NULL DEFAULT 0,
  is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
  
  full_name           TEXT NOT NULL,
  age                 INT NOT NULL,
  gender              TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other', 'M', 'F')),
  mobile              TEXT,
  
  -- Req #9 & #11: AC / Non-AC at passenger level
  travel_class        TEXT NOT NULL DEFAULT 'ac' CHECK (travel_class IN ('ac', 'non_ac', 'AC', 'Non-AC')),
  
  id_proof_type       TEXT,
  id_proof_number     TEXT,
  aadhaar_number      TEXT,
  is_existing_linked  BOOLEAN NOT NULL DEFAULT FALSE,
  duplicate_override_reason TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  admin_notes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (booking_id, passenger_index)
);

CREATE INDEX IF NOT EXISTS idx_passengers_code ON public.passengers(passenger_code);
CREATE INDEX IF NOT EXISTS idx_passengers_booking ON public.passengers(booking_id);
CREATE INDEX IF NOT EXISTS idx_passengers_group ON public.passengers(group_id);
CREATE INDEX IF NOT EXISTS idx_passengers_travel_class ON public.passengers(travel_class);

-- Legacy alias view for backwards compatibility
CREATE OR REPLACE VIEW public.booking_passengers AS
  SELECT *, passenger_code AS id_code FROM public.passengers;

-- ── 6. PAYMENTS (PAY-000001) ─────────────────────────────────────────────────
-- Req #7 & #8: Multiple installments, independent Payment IDs, Duplicate UTR Protection
CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_code        TEXT UNIQUE NOT NULL, -- e.g. PAY-000001
  amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_mode        TEXT NOT NULL CHECK (payment_mode IN ('razorpay', 'bank_transfer', 'upi', 'cash', 'cheque')),
  payment_method      TEXT, -- legacy alias
  
  -- Non-negotiable UTR duplicate protection
  utr_number          TEXT,
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature  TEXT,
  
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  status              TEXT NOT NULL DEFAULT 'captured', -- legacy alias ('created', 'captured', 'failed', 'refunded')
  verified_by         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at         TIMESTAMPTZ,
  gateway_fee         NUMERIC(10,2) DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STRICT UNIQUE INDEX on lowercased, trimmed UTR number (Req #8 & #10)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_payments_utr
  ON public.payments (LOWER(TRIM(utr_number)))
  WHERE utr_number IS NOT NULL AND TRIM(utr_number) != '';

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_code ON public.payments(payment_code);
CREATE INDEX IF NOT EXISTS idx_payments_verification ON public.payments(verification_status);

-- ── 7. TRAIN JOURNEYS (Going / Return) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.train_journeys (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  journey_type        TEXT NOT NULL CHECK (journey_type IN ('going', 'return')),
  train_number        TEXT NOT NULL,
  train_name          TEXT,
  journey_date        DATE NOT NULL,
  boarding_station    TEXT NOT NULL,
  destination_station TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, journey_type)
);

CREATE INDEX IF NOT EXISTS idx_train_journeys_group ON public.train_journeys(group_id);

-- ── 8. TICKET PDFS ───────────────────────────────────────────────────────────
-- Preserves original Akbar/IRCTC ticket PDF files (Req #14 & #17)
CREATE TABLE IF NOT EXISTS public.ticket_pdfs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  journey_type        TEXT NOT NULL CHECK (journey_type IN ('going', 'return')),
  pnr                 TEXT,
  file_name           TEXT NOT NULL,
  file_path           TEXT NOT NULL,
  file_size           INT,
  mime_type           TEXT DEFAULT 'application/pdf',
  uploaded_by         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_pdfs_group ON public.ticket_pdfs(group_id);
CREATE INDEX IF NOT EXISTS idx_ticket_pdfs_pnr ON public.ticket_pdfs(pnr);

-- ── 9. TICKET PASSENGER MAPPINGS ─────────────────────────────────────────────
-- Maps individual passengers to uploaded ticket PDFs, PNR, Coach, and Seat (Req #18)
CREATE TABLE IF NOT EXISTS public.ticket_passenger_mappings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_pdf_id       UUID NOT NULL REFERENCES public.ticket_pdfs(id) ON DELETE CASCADE,
  passenger_id        UUID NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
  booking_id          UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  journey_type        TEXT NOT NULL CHECK (journey_type IN ('going', 'return')),
  pnr                 TEXT NOT NULL,
  coach               TEXT,
  seat_berth          TEXT,
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (passenger_id, journey_type)
);

CREATE INDEX IF NOT EXISTS idx_ticket_mappings_passenger ON public.ticket_passenger_mappings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ticket_mappings_ticket_pdf ON public.ticket_passenger_mappings(ticket_pdf_id);

-- ── 10. ROOMS (Master) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rooms (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_ashram_name   TEXT NOT NULL,
  building            TEXT,
  floor               TEXT,
  room_number         TEXT NOT NULL,
  room_type           TEXT NOT NULL CHECK (room_type IN ('ac', 'non_ac', 'AC', 'Non-AC')),
  capacity            INT NOT NULL DEFAULT 4,
  status              TEXT NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available', 'reserved', 'occupied', 'maintenance')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hotel_ashram_name, room_number)
);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_room ON public.rooms(hotel_ashram_name, room_number);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- ── 11. ROOM ALLOCATIONS ─────────────────────────────────────────────────────
-- Supports sharing a room across multiple Booking IDs in the same Group (Req #19 & #20)
CREATE TABLE IF NOT EXISTS public.room_allocations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  group_id            UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  booking_id          UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id        UUID NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
  notes               TEXT,
  allocated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, passenger_id)
);

CREATE INDEX IF NOT EXISTS idx_room_allocations_room ON public.room_allocations(room_id);
CREATE INDEX IF NOT EXISTS idx_room_allocations_passenger ON public.room_allocations(passenger_id);
CREATE INDEX IF NOT EXISTS idx_room_allocations_group ON public.room_allocations(group_id);

-- ── 12. IMMUTABLE AUDIT LOGS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id            UUID REFERENCES public.users(id) ON DELETE SET NULL,
  actor_name          TEXT,
  actor_role          TEXT,
  action              TEXT NOT NULL,  -- e.g. 'BOOKING_CREATE', 'GROUP_LINK', 'PAYMENT_VERIFIED', 'UTR_CORRECTION', etc.
  entity_type         TEXT NOT NULL,  -- 'group', 'booking', 'passenger', 'payment', 'ticket', 'room'
  entity_id           TEXT NOT NULL,  -- can be UUID or readable code
  old_values          JSONB,
  new_values          JSONB,
  reason              TEXT,
  ip_address          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ── 13. BALANCE UPDATE TRIGGER / RECONCILIATION FUNCTION ────────────────────
-- Automatically computes total_paid and pending_balance whenever payments change
CREATE OR REPLACE FUNCTION public.recalculate_booking_payment_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_total_amount NUMERIC(12,2);
  v_total_paid NUMERIC(12,2);
  v_new_payment_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_booking_id := OLD.booking_id;
  ELSE
    v_booking_id := NEW.booking_id;
  END IF;

  SELECT total_amount INTO v_total_amount FROM public.bookings WHERE id = v_booking_id;
  
  SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
    FROM public.payments
   WHERE booking_id = v_booking_id
     AND verification_status = 'verified';

  IF v_total_paid <= 0 THEN
    v_new_payment_status := 'pending';
  ELSIF v_total_paid >= v_total_amount THEN
    v_new_payment_status := 'fully_paid';
  ELSE
    v_new_payment_status := 'partially_paid';
  END IF;

  UPDATE public.bookings
     SET total_paid = v_total_paid,
         pending_balance = GREATEST(0, v_total_amount - v_total_paid),
         payment_status = v_new_payment_status,
         updated_at = NOW()
   WHERE id = v_booking_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_booking_payments ON public.payments;
CREATE TRIGGER trg_recalculate_booking_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_booking_payment_balance();

-- ── 14. WHATSAPP AUTOMATION & NOTIFICATION LOGS (Section 20-24) ────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  group_id            UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  passenger_id        UUID REFERENCES public.passengers(id) ON DELETE SET NULL,
  recipient_phone     TEXT NOT NULL,
  recipient_name      TEXT,
  template_name       TEXT NOT NULL DEFAULT 'yatra_trip_details',
  message_body        TEXT NOT NULL,
  media_url           TEXT,
  status              TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  idempotency_key     TEXT UNIQUE,
  error_code          TEXT,
  error_message       TEXT,
  sent_by             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_booking ON public.whatsapp_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_recipient ON public.whatsapp_messages(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_status ON public.whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_idempotency ON public.whatsapp_messages(idempotency_key);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
