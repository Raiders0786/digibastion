-- Drop the overly permissive public INSERT policy on subscriptions
-- All insertions must go through the submit-form edge function which uses service role
DROP POLICY IF EXISTS "Anyone can create subscriptions" ON public.subscriptions;

-- Create a more restrictive policy that only allows service role to insert
-- This is effectively a no-op for anon users since service role bypasses RLS anyway
-- but it documents the intent and closes the direct database access vector
CREATE POLICY "Only service role can create subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (false);

-- Add a comment to document the security model
COMMENT ON TABLE public.subscriptions IS 'Email subscriptions for threat alerts. INSERT operations must go through the submit-form edge function which validates input and applies rate limiting. Direct database inserts are blocked by RLS.';