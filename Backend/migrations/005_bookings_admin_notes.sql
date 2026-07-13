-- Migration: 005_bookings_admin_notes.sql
-- Description: Adds admin_notes column to bookings table.
-- Allows admin to attach internal notes to any booking.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;
