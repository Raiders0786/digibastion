-- Fix api_keys: drop overly permissive public policy and recreate for service_role only
DROP POLICY IF EXISTS "Service role can manage api_keys" ON public.api_keys;
CREATE POLICY "Service role can manage api_keys"
  ON public.api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix api_usage_logs: same issue
DROP POLICY IF EXISTS "Service role can manage api_usage_logs" ON public.api_usage_logs;
CREATE POLICY "Service role can manage api_usage_logs"
  ON public.api_usage_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);