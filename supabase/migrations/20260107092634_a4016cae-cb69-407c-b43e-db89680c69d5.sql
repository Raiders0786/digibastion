-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Fixes all identified security vulnerabilities
-- =====================================================

-- 1. QUIZ_SCORES TABLE - Secure against manipulation
-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view quiz scores" ON public.quiz_scores;
DROP POLICY IF EXISTS "Anyone can insert quiz scores" ON public.quiz_scores;
DROP POLICY IF EXISTS "Anyone can view scores" ON public.quiz_scores;
DROP POLICY IF EXISTS "Anyone can submit scores" ON public.quiz_scores;

-- Create new restrictive policies
-- Public can READ scores (for leaderboard display)
CREATE POLICY "Public can view quiz scores for leaderboard"
ON public.quiz_scores
FOR SELECT
TO anon, authenticated
USING (true);

-- Only service role can INSERT scores (through edge function with validation)
CREATE POLICY "Only service role can insert quiz scores"
ON public.quiz_scores
FOR INSERT
TO service_role
WITH CHECK (true);

-- No updates allowed
CREATE POLICY "No updates to quiz scores"
ON public.quiz_scores
FOR UPDATE
USING (false);

-- No deletes from public
CREATE POLICY "Only service role can delete quiz scores"
ON public.quiz_scores
FOR DELETE
TO service_role
USING (true);

-- 2. NOTIFICATION_LOG TABLE - Service role only
-- Drop existing policies
DROP POLICY IF EXISTS "Service can insert notification log" ON public.notification_log;
DROP POLICY IF EXISTS "Service role can view notification log" ON public.notification_log;

-- Recreate as PERMISSIVE with proper role targeting
CREATE POLICY "Service role can read notification log"
ON public.notification_log
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert notification log"
ON public.notification_log
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Block public select on notification log"
ON public.notification_log
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Block public insert on notification log"
ON public.notification_log
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 3. SUBSCRIPTIONS TABLE - Ensure service role only access
-- Drop existing policies to recreate properly
DROP POLICY IF EXISTS "Only service role can create subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can delete subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can view subscriptions" ON public.subscriptions;

-- Recreate as PERMISSIVE policies with proper role targeting
CREATE POLICY "Service role full access to subscriptions"
ON public.subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Block public access to subscriptions"
ON public.subscriptions
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 4. Add rate limiting support - create a table to track submissions
CREATE TABLE IF NOT EXISTS public.quiz_submission_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  username_hash TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on submission log
ALTER TABLE public.quiz_submission_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access submission log
CREATE POLICY "Service role only for quiz submission log"
ON public.quiz_submission_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Block public access to quiz submission log"
ON public.quiz_submission_log
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Create index for efficient rate limiting queries
CREATE INDEX IF NOT EXISTS idx_quiz_submission_log_ip_time 
ON public.quiz_submission_log(ip_hash, submitted_at);

CREATE INDEX IF NOT EXISTS idx_quiz_submission_log_username_time 
ON public.quiz_submission_log(username_hash, submitted_at);

-- Clean up old submission logs automatically (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_submission_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.quiz_submission_log 
  WHERE submitted_at < now() - INTERVAL '24 hours';
END;
$$;