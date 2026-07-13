-- Migration: 001_capture_booking_payment.sql
-- Description: Atomic function to capture a booking payment.
--   1. Updates the payment row with Razorpay details and sets status to 'captured'.
--   2. Sets the booking status to 'paid'.
--   3. Decrements remaining_seats on the travel package.
-- All three mutations happen in a single transaction so either all succeed or none do.

CREATE OR REPLACE FUNCTION public.capture_booking_payment(
  p_booking_id       UUID,
  p_razorpay_order_id   TEXT,
  p_razorpay_payment_id TEXT,
  p_razorpay_signature  TEXT DEFAULT NULL,
  p_payment_method      TEXT DEFAULT 'razorpay',
  p_gateway_fee         NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_package_id UUID;
  v_traveler_count INTEGER;
  v_current_seats INTEGER;
BEGIN
  -- 1. Lock and fetch the booking to get package_id and traveler_count
  SELECT package_id, traveler_count
    INTO v_package_id, v_traveler_count
    FROM public.bookings
   WHERE id = p_booking_id
     AND status = 'payment_pending'
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking % not found or not in payment_pending status', p_booking_id;
  END IF;

  -- 2. Lock the travel package row and verify seats
  SELECT remaining_seats
    INTO v_current_seats
    FROM public.travel_packages
   WHERE id = v_package_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Travel package % not found', v_package_id;
  END IF;

  IF v_current_seats < v_traveler_count THEN
    RAISE EXCEPTION 'Not enough seats: % available, % requested', v_current_seats, v_traveler_count;
  END IF;

  -- 3. Update the payment record
  UPDATE public.payments
     SET razorpay_payment_id = p_razorpay_payment_id,
         razorpay_signature  = p_razorpay_signature,
         payment_method      = p_payment_method,
         gateway_fee         = p_gateway_fee,
         status              = 'captured',
         updated_at          = NOW()
   WHERE razorpay_order_id = p_razorpay_order_id
     AND booking_id        = p_booking_id;

  -- 4. Set booking status to 'paid'
  UPDATE public.bookings
     SET status     = 'paid',
         updated_at = NOW()
   WHERE id = p_booking_id;

  -- 5. Decrement remaining seats
  UPDATE public.travel_packages
     SET remaining_seats = remaining_seats - v_traveler_count,
         updated_at      = NOW()
   WHERE id = v_package_id;
END;
$$;

-- Grant execute to the service role used by the backend
GRANT EXECUTE ON FUNCTION public.capture_booking_payment TO service_role;
