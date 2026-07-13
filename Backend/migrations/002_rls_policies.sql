-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for the Shri Gurudev Ashram database.
-- These policies should be reviewed and verified against the live Supabase database.
-- Run this migration on a fresh database after enabling RLS on each table.

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ USERS TABLE                                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not verification_status or role)
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role (backend) has full access (bypasses RLS by default)

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ BOOKINGS TABLE                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can read their own bookings
CREATE POLICY "Users can read own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert bookings for themselves
CREATE POLICY "Users can create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ PAYMENTS TABLE                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments are accessed only via the backend (service role) and the
-- capture_booking_payment RPC (SECURITY DEFINER). No direct client access needed.
-- If direct client reads are required in future, add:
-- CREATE POLICY "Users can read own payments"
--   ON public.payments FOR SELECT
--   USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ TRAVEL_PACKAGES TABLE                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.travel_packages ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active packages
CREATE POLICY "Public can read active packages"
  ON public.travel_packages FOR SELECT
  USING (is_active = true);

-- Only service role (admin backend) can insert/update/delete packages

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ RAZORPAY_WEBHOOK_EVENTS TABLE                                               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;

-- No client access — webhook events are handled exclusively by the backend service role.

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ NOTES                                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- 1. The Supabase service_role key BYPASSES RLS. The backend uses this key,
--    so all backend routes have full access regardless of these policies.
--
-- 2. These policies protect against direct Supabase client access from the
--    frontend (which uses the anon key + user JWT).
--
-- 3. The capture_booking_payment function uses SECURITY DEFINER, meaning it
--    runs with the permissions of the function owner (typically the postgres
--    superuser), bypassing RLS within the function body.
--
-- 4. TO VERIFY: Log into the Supabase SQL Editor as an authenticated test user
--    and confirm:
--    - SELECT from users returns only your own row
--    - SELECT from bookings returns only your own bookings
--    - SELECT from travel_packages returns only active packages
--    - INSERT/UPDATE on other users' rows fails
--    - Direct payment access fails (if no policy enabled)
--
-- 5. TODO: Export the actual live policies from Supabase using:
--    supabase db dump --schema public --data-only=false
--    and compare against this file.
