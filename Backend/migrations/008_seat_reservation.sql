-- Migration: 008_seat_reservation.sql
-- Description: Soft seat reservation strategy and draft booking auto-expiry.
--   1. Creates a VIEW that computes truly_available_seats by subtracting
--      soft-reserved seats (bookings in payment_pending that have not expired).
--   2. Creates the expire_stale_bookings() function, called by the backend
--      cron job every 5 minutes to cancel expired draft/pending bookings.
--
-- Seat reservation strategy:
--   Phase 1 (soft reserve): When a booking transitions to payment_pending via
--     POST /api/bookings/:id/submit, the package_seat_availability view
--     automatically deducts those seats from the displayed available count.
--     This prevents new bookings from seeing seats that are mid-checkout.
--   Phase 2 (hard decrement): Inside capture_booking_payment() (migration 009),
--     the row is locked with FOR UPDATE and remaining_seats is atomically
--     decremented. This is the only place remaining_seats actually changes.
--
-- Expiry TTL:
--   draft            → expires_at = NOW() + 2  hours  (DRAFT_TTL_MINUTES=120)
--   documents_pending → expires_at = NOW() + 24 hours  (DOCS_TTL_MINUTES=1440)
--   payment_pending  → expires_at = NOW() + 30 minutes (PAYMENT_TTL_MINUTES=30)
--   TTLs are set server-side in backend route handlers, not in SQL.
--   This function just reads expires_at and cancels rows past that timestamp.

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Seat availability view
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.package_seat_availability AS
SELECT
  tp.id                                                           AS package_id,
  tp.remaining_seats,
  COALESCE(
    SUM(b.traveler_count) FILTER (
      WHERE b.status    = 'payment_pending'
        AND (b.expires_at IS NULL OR b.expires_at > NOW())
    ),
    0
  )                                                               AS soft_reserved_seats,
  tp.remaining_seats
    - COALESCE(
        SUM(b.traveler_count) FILTER (
          WHERE b.status    = 'payment_pending'
            AND (b.expires_at IS NULL OR b.expires_at > NOW())
        ),
        0
      )                                                           AS truly_available_seats
FROM public.travel_packages tp
LEFT JOIN public.bookings b ON b.package_id = tp.id
GROUP BY tp.id, tp.remaining_seats;

COMMENT ON VIEW public.package_seat_availability IS
  'Real-time available seats after deducting soft-reserved (payment_pending) bookings. '
  'Use truly_available_seats for new booking validation. '
  'remaining_seats is only decremented by capture_booking_payment().';

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Expiry cleanup function
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.expire_stale_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  -- Cancel all draft, documents_pending, and payment_pending bookings
  -- that have passed their expires_at timestamp.
  -- NOTE: does NOT decrement remaining_seats because:
  --   • draft and documents_pending bookings never hold a seat reservation.
  --   • payment_pending bookings are soft-reserved via the view (no hard decrement),
  --     so cancelling them automatically releases the soft reservation.
  UPDATE public.bookings
     SET status     = 'cancelled',
         updated_at = NOW()
   WHERE status IN ('draft', 'documents_pending', 'payment_pending')
     AND expires_at IS NOT NULL
     AND expires_at < NOW();

  GET DIAGNOSTICS v_cancelled_count = ROW_COUNT;

  -- Optional: log how many were expired (useful for monitoring)
  -- RAISE NOTICE 'expire_stale_bookings: cancelled % bookings', v_cancelled_count;

  RETURN v_cancelled_count;
END;
$$;

COMMENT ON FUNCTION public.expire_stale_bookings() IS
  'Cancels all draft, documents_pending, and payment_pending bookings past their expires_at. '
  'Called by the backend node-cron job every 5 minutes. '
  'Returns the number of bookings cancelled.';

GRANT EXECUTE ON FUNCTION public.expire_stale_bookings() TO service_role;
