-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert health snapshots" ON public.cron_health_snapshots;

-- Create restrictive policy - service role bypasses RLS anyway
CREATE POLICY "Block public insert on cron_health_snapshots"
  ON public.cron_health_snapshots
  FOR INSERT
  WITH CHECK (false);