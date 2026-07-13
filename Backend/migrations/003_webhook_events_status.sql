-- Migration: 003_webhook_events_status.sql
-- Description: Adds a 'status' column to razorpay_webhook_events to enable
-- retry-safe webhook processing. Events transition through:
--   processing → done (success) or failed (reconciliation error)

-- Add status column with default 'processing' for new inserts
ALTER TABLE public.razorpay_webhook_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processing'
  CHECK (status IN ('processing', 'done', 'failed'));

-- Index for finding failed events that need reprocessing
CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.razorpay_webhook_events (status)
  WHERE status = 'failed';
