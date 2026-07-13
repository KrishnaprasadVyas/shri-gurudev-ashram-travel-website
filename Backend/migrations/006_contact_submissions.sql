-- Migration: 006_contact_submissions.sql
-- Description: Table for storing contact form submissions from the public website.
-- Admin can view these in the dashboard or receive email notifications.

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  message      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Allow anonymous inserts (public contact form), no reads from client
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact form (including unauthenticated users)
CREATE POLICY "Public can submit contact forms"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- Only service role (backend/admin) can read submissions
GRANT SELECT ON public.contact_submissions TO service_role;
