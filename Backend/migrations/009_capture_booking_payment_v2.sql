-- Migration: 009_capture_booking_payment_v2.sql
-- Description: Replaces 001_capture_booking_payment.sql with an updated version that:
--   1. Validates expires_at — rejects expired bookings even if status is payment_pending.
--   2. Transitions the booking to verification_pending (not just paid) atomically.
--   3. Clears expires_at once payment is captured (paid bookings do not expire).
--   4. Sets all booking_passengers to verification_status = 'submitted' so they
--      immediately appear in the admin verification queue.
--   5. Accepts p_gateway_fee for accurate fee recording (previously optional/unused).
--   6. Validates exactly one payment record was updated.
--
-- This function replaces the one created in 001_capture_booking_payment.sql.
-- CREATE OR REPLACE ensures a safe, idempotent upgrade.

CREATE OR REPLACE FUNCTION public.capture_booking_payment(
  p_booking_id          UUID,
  p_razorpay_order_id   TEXT,
  p_razorpay_payment_id TEXT,
  p_razorpay_signature  TEXT    DEFAULT NULL,
  p_payment_method      TEXT    DEFAULT 'razorpay',
  p_gateway_fee         NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_package_id     UUID;
  v_traveler_count INTEGER;
  v_current_seats  INTEGER;
  v_row_count      INTEGER;
BEGIN
  -- ── Step 1: Lock the booking row ──────────────────────────────────────────
  -- Must be in payment_pending status and must not have expired.
  SELECT package_id, traveler_count
    INTO v_package_id, v_traveler_count
    FROM public.bookings
   WHERE id         = p_booking_id
     AND status     = 'payment_pending'
     AND (expires_at IS NULL OR expires_at > NOW())
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Booking % is not in payment_pending status or has expired. '
      'Capture rejected to prevent double payment or expired checkout.',
      p_booking_id;
  END IF;

  -- ── Step 2: Lock the travel package and hard-check seats ──────────────────
  -- This is the definitive seat availability check.
  -- The soft-reservation view is advisory only; this FOR UPDATE lock is authoritative.
  SELECT remaining_seats
    INTO v_current_seats
    FROM public.travel_packages
   WHERE id = v_package_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Travel package % not found during capture.', v_package_id;
  END IF;

  IF v_current_seats < v_traveler_count THEN
    RAISE EXCEPTION
      'Seat overbook prevented: package has % seat(s) remaining, booking requests %.',
      v_current_seats, v_traveler_count;
  END IF;

  -- ── Step 3: Record the payment ────────────────────────────────────────────
  UPDATE public.payments
     SET razorpay_payment_id = p_razorpay_payment_id,
         razorpay_signature  = p_razorpay_signature,
         payment_method      = p_payment_method,
         gateway_fee         = COALESCE(p_gateway_fee, 0),
         status              = 'captured',
         updated_at          = NOW()
   WHERE razorpay_order_id   = p_razorpay_order_id
     AND booking_id          = p_booking_id;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count != 1 THEN
    RAISE EXCEPTION
      'Payment update failed: expected exactly 1 payment record to be updated, but found %.',
      v_row_count;
  END IF;

  -- ── Step 4: Advance booking lifecycle ────────────────────────────────────
  -- Skip the transient 'paid' status; go directly to 'verification_pending'
  -- so the booking appears in the admin review queue immediately.
  UPDATE public.bookings
     SET status     = 'verification_pending',
         updated_at = NOW(),
         expires_at = NULL     -- Paid bookings do not expire
   WHERE id = p_booking_id;

  -- ── Step 5: Hard-decrement remaining seats ────────────────────────────────
  UPDATE public.travel_packages
     SET remaining_seats = remaining_seats - v_traveler_count,
         updated_at      = NOW()
   WHERE id = v_package_id;

  -- ── Step 6: Advance all passengers to 'submitted' ────────────────────────
  -- This makes them appear in the admin verification queue immediately
  -- without requiring an additional admin action.
  UPDATE public.booking_passengers
     SET verification_status = 'submitted',
         updated_at          = NOW()
   WHERE booking_id          = p_booking_id
     AND verification_status = 'pending';

END;
$$;

COMMENT ON FUNCTION public.capture_booking_payment(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC) IS
  'Atomically captures a Razorpay payment for a booking. '
  'Validates expiry, hard-checks seat availability with a row-level lock, '
  'records the payment, decrements remaining_seats, and advances the '
  'booking to verification_pending and all passengers to submitted.';

-- Grant remains the same as in migration 001.
GRANT EXECUTE ON FUNCTION public.capture_booking_payment TO service_role;
