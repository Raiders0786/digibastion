-- Fix security vulnerabilities: restrict public access to subscriptions and notification_log

-- Drop existing overly permissive policies on subscriptions
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.subscriptions;

-- Create policy: subscriptions should only be readable by service role (backend operations)
-- Users cannot see other users' subscription data
CREATE POLICY "Service role can view subscriptions"
ON public.subscriptions
FOR SELECT
USING (false);

-- Keep INSERT open for anonymous subscriptions
-- The existing "Anyone can create subscriptions" policy is fine

-- Drop existing overly permissive policies on notification_log
DROP POLICY IF EXISTS "Anyone can view notification log" ON public.notification_log;

-- Create restrictive policy: notification logs are backend-only data
CREATE POLICY "Service role can view notification log"
ON public.notification_log
FOR SELECT
USING (false);