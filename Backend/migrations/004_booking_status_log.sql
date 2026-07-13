-- Migration: 004_booking_status_log.sql
-- Description: Audit trail table for booking status transitions.
-- Every status change, admin note update, or reconciliation action is logged.

CREATE TABLE IF NOT EXISTS public.booking_status_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  changed_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching history by booking
CREATE INDEX IF NOT EXISTS idx_booking_status_log_booking
  ON public.booking_status_log (booking_id, created_at);

-- RLS: only service role (backend) inserts/reads status logs
ALTER TABLE public.booking_status_log ENABLE ROW LEVEL SECURITY;

-- Grant to service role
GRANT ALL ON public.booking_status_log TO service_role;
